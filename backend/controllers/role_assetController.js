// backend/controllers/assetController.js
// This controller will contain methods for handling all asset-related operations for different user roles.
const { Op } = require('sequelize');
const {
    AssetCategory,
    Asset,
    AssetRequest,
    AssetAssignment,
    User,
    sequelize
} = require('../models'); // Import all necessary models, including User

// Helper function to get manager IDs for a user
async function getUserManagers(userId, organization_id) {
    const user = await User.findOne({
        where: { user_id: userId, organization_id: organization_id },
        attributes: ['user_id', 'manager_id_primary', 'manager_id_secondary']
    });

    if (!user) {
        return { primaryManagerId: null, secondaryManagerId: null };
    }
    return {
        primaryManagerId: user.manager_id_primary,
        secondaryManagerId: user.manager_id_secondary
    };
}

// Helper to determine next approval status based on current status and user's managers
async function getNextApprovalStatus(requesterId, organizationId) {
    const { primaryManagerId, secondaryManagerId } = await getUserManagers(requesterId, organizationId);

    // If no managers are assigned, it goes directly to Admin approval
    if (!primaryManagerId && !secondaryManagerId) {
        return 'Pending Admin Approval';
    }
    // Otherwise, it starts with 'Pending Manager Approval'
    return 'Pending Manager Approval';
}

/**
 * Common includes for fetching user details for requests/assignments
 */
const userIncludeAttributes = ['user_id', 'first_name', 'last_name', 'email', 'role'];

/**
 * Get all asset categories for a given organization
 * Accessible by: Admin, Manager, Member
 */
exports.getAssetCategories = async (req, res) => {
    try {
        const { organization_id } = req.user; // From authenticated token
        const categories = await AssetCategory.findAll({
            where: { organization_id: organization_id, is_physical: true }, // Only physical for now
            order: [['name', 'ASC']]
        });
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching asset categories:", error);
        res.status(500).json({ message: "Failed to fetch asset categories", error: error.message });
    }
};

/**
 * Submit a new asset request
 * Accessible by: Member, Manager
 */
exports.submitAssetRequest = async (req, res) => {
    const t = await sequelize.transaction(); // Start a transaction
    try {
        const { organization_id, userId } = req.user;
        const {
            request_type, category_id, preferred_model,
            justification, urgency, shipping_address
        } = req.body;

        if (!request_type || !category_id || !justification || !urgency) {
            await t.rollback();
            return res.status(400).json({ message: "Missing required fields." });
        }

        const document_path = req.file ? req.file.path : null;

        const { primaryManagerId, secondaryManagerId } = await getUserManagers(userId, organization_id);

        const initialStatus = await getNextApprovalStatus(userId, organization_id);

        const newRequest = await AssetRequest.create({
            organization_id,
            user_id: userId,
            request_type,
            category_id,
            preferred_model,
            justification,
            urgency,
            shipping_address,
            document_path,
            current_status: initialStatus,
            primary_approver_id: primaryManagerId,
            secondary_approver_id: secondaryManagerId,
            created_by: userId,
            updated_by: userId
        }, { transaction: t });

        // TODO: Implement notification logic here
        // Notify the relevant manager or admin based on initialStatus

        await t.commit();
        res.status(201).json({
            message: "Asset request submitted successfully!",
            request: newRequest
        });
    } catch (error) {
        await t.rollback();
        console.error("Error submitting asset request:", error);
        res.status(500).json({ message: "Failed to submit asset request", error: error.message });
    }
};

/**
 * Get an employee's own asset requests
 * Accessible by: Member, Manager
 */
exports.getMyAssetRequests = async (req, res) => {
    try {
        const { organization_id, userId } = req.user;
        const requests = await AssetRequest.findAll({
            where: { user_id: userId, organization_id: organization_id },
            include: [
                { model: AssetCategory, as: 'category', attributes: ['name'] },
                { model: User, as: 'primaryApprover', attributes: userIncludeAttributes },
                { model: User, as: 'secondaryApprover', attributes: userIncludeAttributes },
                { model: User, as: 'finalApprover', attributes: userIncludeAttributes },
                { model: User, as: 'resourceAssignee', attributes: userIncludeAttributes }
            ],
            order: [['created_at', 'DESC']]
        });
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching my asset requests:", error);
        res.status(500).json({ message: "Failed to fetch your asset requests", error: error.message });
    }
};

/**
 * Get pending asset requests for a manager to approve
 * Accessible by: Manager, Admin (Admin can also see all pending)
 */
exports.getPendingApprovals = async (req, res) => {
    try {
        const { organization_id, userId, role } = req.user;

        let whereClause = {
            organization_id: organization_id,
            current_status: {
                [Op.in]: ['Pending Manager Approval', 'Pending Admin Approval']
            }
        };

        if (role === 'manager') {
            // Manager sees requests where they are primary or secondary approver, AND the status is 'Pending Manager Approval'
            whereClause[Op.or] = [
                { primary_approver_id: userId, current_status: 'Pending Manager Approval' },
                { secondary_approver_id: userId, current_status: 'Pending Manager Approval' }
            ];
        } else if (role === 'admin') {
            // Admin sees all requests with status 'Pending Admin Approval'
            whereClause.current_status = 'Pending Admin Approval';
        }

        const requests = await AssetRequest.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'requester', attributes: userIncludeAttributes },
                { model: AssetCategory, as: 'category', attributes: ['name'] }
            ],
            order: [['urgency', 'DESC'], ['created_at', 'ASC']]
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching pending asset approvals:", error);
        res.status(500).json({ message: "Failed to fetch pending asset approvals", error: error.message });
    }
};

/**
 * Approve an asset request
 * Accessible by: Manager, Admin
 * Logic: Manager approves -> check secondary manager -> if no secondary/secondary approves -> Admin
 * If no managers for user -> Admin directly
 */
exports.approveAssetRequest = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: requestId } = req.params;
        const { userId, role } = req.user;

        const request = await AssetRequest.findByPk(requestId);

        if (!request || request.organization_id !== req.user.organization_id) {
            await t.rollback();
            return res.status(404).json({ message: "Asset request not found or not authorized." });
        }

        let nextStatus = request.current_status;

        // Ensure the current user is authorized to approve this request at this stage
        if (role === 'manager') {
            const { primaryManagerId, secondaryManagerId } = await getUserManagers(request.user_id, request.organization_id);

            // Check if this manager is the primary or secondary manager for this request
            const isAuthorizedManager = (
                (request.current_status === 'Pending Manager Approval') &&
                (request.primary_approver_id === userId || request.secondary_approver_id === userId)
            );

            if (!isAuthorizedManager) {
                await t.rollback();
                return res.status(403).json({ message: "You are not authorized to approve this request at this stage." });
            }

            // Determine next step after manager approval
            if (request.current_status === 'Pending Manager Approval') {
                if (request.secondary_approver_id && request.primary_approver_id === userId) {
                    // Primary manager approved, now route to secondary if secondary exists
                    nextStatus = 'Pending Manager Approval'; // Remains for secondary manager
                } else if (request.secondary_approver_id && request.secondary_approver_id === userId) {
                     // Secondary manager approved, now route to admin
                    nextStatus = 'Pending Admin Approval';
                } else {
                    // Only one manager or primary manager is also the last manager, route to admin
                    nextStatus = 'Pending Admin Approval';
                }
            } else {
                 // Should not happen if logic is followed, but for safety
                await t.rollback();
                return res.status(400).json({ message: "Request not in a state for your approval." });
            }

        } else if (role === 'admin') {
            if (request.current_status !== 'Pending Admin Approval') {
                await t.rollback();
                return res.status(400).json({ message: "Request not in 'Pending Admin Approval' state." });
            }
            nextStatus = 'Approved'; // Final approval from Admin
            request.final_approver_id = userId; // Record final approver
            request.approved_at = new Date();
        } else {
            await t.rollback();
            return res.status(403).json({ message: "Unauthorized to approve." });
        }

        await request.update({ current_status: nextStatus, updated_by: userId }, { transaction: t });

        // If the request is fully 'Approved', assign it to the default Resource Department user (Akil Anand's ID)
        if (nextStatus === 'Approved') {
            // TODO: Replace with dynamic fetching of Resource Department user ID
            // For now, hardcoding Akil Anand's user_id or a system-defined resource user ID
            // Ideally, you'd have a config table or a specific 'role' for 'resource_department' members
            const akilAnandUser = await User.findOne({ where: { email: 'resource@vipraSoftware.com', organization_id: req.user.organization_id } });
            if (akilAnandUser) {
                await request.update({ assigned_to_resource_id: akilAnandUser.user_id }, { transaction: t });
                // TODO: Send notification to Akil Anand/Resource Dept.
            } else {
                console.warn("Resource Department user (Akil Anand) not found for assignment.");
                // Potentially set status to 'Approved - No Resource Assigned' or log an error
            }
        }

        // TODO: Implement notification logic here
        // Notify requester, next approver, or resource department based on nextStatus

        await t.commit();
        res.status(200).json({ message: `Asset request ${requestId} ${nextStatus === 'Approved' ? 'approved and assigned for fulfillment' : 'moved to next approval stage'}.` });

    } catch (error) {
        await t.rollback();
        console.error("Error approving asset request:", error);
        res.status(500).json({ message: "Failed to approve asset request", error: error.message });
    }
};

/**
 * Reject an asset request
 * Accessible by: Manager, Admin
 */
exports.rejectAssetRequest = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: requestId } = req.params;
        const { reason } = req.body;
        const { userId, role } = req.user;

        if (!reason) {
            await t.rollback();
            return res.status(400).json({ message: "Rejection reason is required." });
        }

        const request = await AssetRequest.findByPk(requestId);

        if (!request || request.organization_id !== req.user.organization_id) {
            await t.rollback();
            return res.status(404).json({ message: "Asset request not found or not authorized." });
        }

        // Only allow rejection if status is pending and user is the current approver or admin
        const isAuthorizedToReject = (
            (request.current_status === 'Pending Manager Approval' &&
             (request.primary_approver_id === userId || request.secondary_approver_id === userId)) ||
            (request.current_status === 'Pending Admin Approval' && role === 'admin')
        );

        if (!isAuthorizedToReject) {
            await t.rollback();
            return res.status(403).json({ message: "You are not authorized to reject this request." });
        }

        await request.update({
            current_status: 'Rejected',
            rejection_reason: reason,
            final_approver_id: userId, // Record who rejected
            updated_by: userId
        }, { transaction: t });

        // TODO: Notify requester and other involved parties about rejection

        await t.commit();
        res.status(200).json({ message: `Asset request ${requestId} rejected.` });
    } catch (error) {
        await t.rollback();
        console.error("Error rejecting asset request:", error);
        res.status(500).json({ message: "Failed to reject asset request", error: error.message });
    }
};

/**
 * Get all asset requests (for Admin)
 * Accessible by: Admin
 */
exports.getAllAssetRequests = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const requests = await AssetRequest.findAll({
            where: { organization_id: organization_id },
            include: [
                { model: User, as: 'requester', attributes: userIncludeAttributes },
                { model: AssetCategory, as: 'category', attributes: ['name'] },
                { model: User, as: 'primaryApprover', attributes: userIncludeAttributes },
                { model: User, as: 'secondaryApprover', attributes: userIncludeAttributes },
                { model: User, as: 'finalApprover', attributes: userIncludeAttributes },
                { model: User, as: 'resourceAssignee', attributes: userIncludeAttributes }
            ],
            order: [['created_at', 'DESC']]
        });
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching all asset requests:", error);
        res.status(500).json({ message: "Failed to fetch all asset requests", error: error.message });
    }
};


/**
 * Get all assets in inventory (for Admin and Resource Dept.)
 * Accessible by: Admin, Resource Department
 */
exports.getAllAssets = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const assets = await Asset.findAll({
            where: { organization_id: organization_id },
            include: [
                { model: AssetCategory, as: 'category', attributes: ['name', 'is_physical'] }
            ],
            order: [['created_at', 'DESC']]
        });
        res.status(200).json(assets);
    } catch (error) {
        console.error("Error fetching all assets:", error);
        res.status(500).json({ message: "Failed to fetch all assets", error: error.message });
    }
};

/**
 * Add a new asset to inventory (for Resource Dept., possibly Admin)
 * Accessible by: Resource Department, Admin
 */
exports.addAsset = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { organization_id, userId } = req.user;
        const {
            category_id, asset_tag, serial_number, manufacturer, model,
            manufacturing_year, purchase_date, purchase_cost, warranty_expiry_date,
            current_status, condition, location, notes
        } = req.body;

        if (!category_id || !serial_number || !manufacturer || !model || !purchase_date || !purchase_cost) {
            await t.rollback();
            return res.status(400).json({ message: "Missing required asset fields." });
        }

        const newAsset = await Asset.create({
            organization_id,
            category_id,
            asset_tag,
            serial_number,
            manufacturer,
            model,
            manufacturing_year,
            purchase_date,
            purchase_cost,
            warranty_expiry_date,
            current_status: current_status || 'Available',
            condition: condition || 'New',
            location,
            notes,
            created_by: userId,
            updated_by: userId
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: "Asset added successfully!", asset: newAsset });
    } catch (error) {
        await t.rollback();
        console.error("Error adding asset:", error);
        // Handle unique constraint violation for serial_number/asset_tag
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: "Asset with this serial number or asset tag already exists." });
        }
        res.status(500).json({ message: "Failed to add asset", error: error.message });
    }
};

/**
 * Update an existing asset in inventory (for Resource Dept., possibly Admin)
 * Accessible by: Resource Department, Admin
 */
exports.updateAsset = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: assetId } = req.params;
        const { userId } = req.user;
        const updatedFields = req.body;

        const asset = await Asset.findByPk(assetId);

        if (!asset || asset.organization_id !== req.user.organization_id) {
            await t.rollback();
            return res.status(404).json({ message: "Asset not found or not authorized." });
        }

        await asset.update({ ...updatedFields, updated_by: userId }, { transaction: t });

        await t.commit();
        res.status(200).json({ message: "Asset updated successfully!", asset });
    } catch (error) {
        await t.rollback();
        console.error("Error updating asset:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: "Another asset with this serial number or asset tag already exists." });
        }
        res.status(500).json({ message: "Failed to update asset", error: error.message });
    }
};

/**
 * Get assets assigned to the current user (My Assets)
 * Accessible by: Member, Manager
 */
exports.getMyAssignedAssets = async (req, res) => {
    try {
        const { organization_id, userId } = req.user;
        const assignments = await AssetAssignment.findAll({
            where: {
                user_id: userId,
                organization_id: organization_id,
                is_active: true // Only currently assigned assets
            },
            include: [
                {
                    model: Asset,
                    as: 'asset',
                    attributes: ['asset_id', 'asset_tag', 'serial_number', 'manufacturer', 'model', 'purchase_date', 'current_status', 'condition'],
                    include: [{ model: AssetCategory, as: 'category', attributes: ['name'] }]
                }
            ],
            order: [['assignment_date', 'DESC']]
        });
        res.status(200).json(assignments);
    } catch (error) {
        console.error("Error fetching my assigned assets:", error);
        res.status(500).json({ message: "Failed to fetch your assigned assets", error: error.message });
    }
};

/**
 * Get requests assigned for fulfillment to Resource Department
 * Accessible by: Resource Department
 */
exports.getAssignedFulfillmentRequests = async (req, res) => {
    try {
        const { organization_id, userId } = req.user; // userId should be the Resource Dept. member's ID

        const requests = await AssetRequest.findAll({
            where: {
                organization_id: organization_id,
                current_status: {
                    [Op.in]: ['Approved', 'Assigned for Fulfillment', 'Awaiting Procurement']
                },
                assigned_to_resource_id: userId // Only requests assigned to THIS resource user
            },
            include: [
                { model: User, as: 'requester', attributes: userIncludeAttributes },
                { model: AssetCategory, as: 'category', attributes: ['name'] },
                { model: User, as: 'finalApprover', attributes: userIncludeAttributes }
            ],
            order: [['created_at', 'ASC']] // Oldest requests first
        });
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching assigned fulfillment requests:", error);
        res.status(500).json({ message: "Failed to fetch assigned fulfillment requests", error: error.message });
    }
};

/**
 * Fulfill an asset request (by Resource Department)
 * This involves linking an asset from inventory to the request and creating an assignment.
 * Accessible by: Resource Department
 */
exports.fulfillAssetRequest = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: requestId } = req.params;
        const { asset_id, assignment_date, notes } = req.body;
        const { userId } = req.user;

        if (!asset_id || !assignment_date) {
            await t.rollback();
            return res.status(400).json({ message: "Asset ID and assignment date are required for fulfillment." });
        }

        const request = await AssetRequest.findByPk(requestId);
        if (!request || request.organization_id !== req.user.organization_id || request.assigned_to_resource_id !== userId) {
            await t.rollback();
            return res.status(404).json({ message: "Asset request not found, not authorized, or not assigned to you." });
        }

        if (!['Approved', 'Assigned for Fulfillment', 'Awaiting Procurement'].includes(request.current_status)) {
            await t.rollback();
            return res.status(400).json({ message: "Request cannot be fulfilled in its current state." });
        }

        const asset = await Asset.findByPk(asset_id);
        if (!asset || asset.organization_id !== req.user.organization_id) {
            await t.rollback();
            return res.status(404).json({ message: "Asset not found or not authorized." });
        }

        if (asset.current_status !== 'Available') {
            await t.rollback();
            return res.status(400).json({ message: "Selected asset is not available for assignment." });
        }

        // 1. Create Asset Assignment
        const newAssignment = await AssetAssignment.create({
            organization_id: request.organization_id,
            asset_id: asset.asset_id,
            user_id: request.user_id, // Assign to the requester
            request_id: request.request_id,
            assignment_date,
            notes,
            is_active: true,
            created_by: userId,
            updated_by: userId
        }, { transaction: t });

        // 2. Update Asset status to 'Issued'
        await asset.update({ current_status: 'Issued', updated_by: userId }, { transaction: t });

        // 3. Update AssetRequest status to 'Fulfilled' and record fulfillment date
        await request.update({ current_status: 'Fulfilled', fulfilled_at: new Date(), updated_by: userId }, { transaction: t });

        // TODO: Notify requester that asset has been issued/dispatched
        // TODO: Request confirmation of receipt from employee (via frontend)

        await t.commit();
        res.status(200).json({ message: "Asset request fulfilled and asset assigned!", assignment: newAssignment });

    } catch (error) {
        await t.rollback();
        console.error("Error fulfilling asset request:", error);
        res.status(500).json({ message: "Failed to fulfill asset request", error: error.message });
    }
};

/**
 * Mark a request as 'Awaiting Procurement' (by Resource Department)
 * Accessible by: Resource Department
 */
exports.markAwaitingProcurement = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: requestId } = req.params;
        const { userId } = req.user;

        const request = await AssetRequest.findByPk(requestId);
        if (!request || request.organization_id !== req.user.organization_id || request.assigned_to_resource_id !== userId) {
            await t.rollback();
            return res.status(404).json({ message: "Asset request not found, not authorized, or not assigned to you." });
        }

        if (!['Approved', 'Assigned for Fulfillment'].includes(request.current_status)) {
            await t.rollback();
            return res.status(400).json({ message: "Request cannot be marked for procurement in its current state." });
        }

        await request.update({
            current_status: 'Awaiting Procurement',
            updated_by: userId
        }, { transaction: t });

        // TODO: Notify procurement team (if separate) or Admin
        await t.commit();
        res.status(200).json({ message: `Asset request ${requestId} marked as 'Awaiting Procurement'.` });
    } catch (error) {
        await t.rollback();
        console.error("Error marking request as awaiting procurement:", error);
        res.status(500).json({ message: "Failed to mark request as awaiting procurement", error: error.message });
    }
};

/**
 * Get pending asset clearance requests (for Resource Department)
 * Accessible by: Resource Department
 */
exports.getPendingClearanceRequests = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const assignments = await AssetAssignment.findAll({
            where: {
                organization_id: organization_id,
                is_active: true, // Still active assignment
                return_date: null, // Not yet returned
                // We'll assume the trigger for this comes from HRMS or manual initiation,
                // and we're looking for assets linked to users who are 'terminating' or in 'exit' status
                // For now, let's just fetch all active assignments for potential clearance
            },
            include: [
                {
                    model: Asset,
                    as: 'asset',
                    attributes: ['asset_id', 'asset_tag', 'serial_number', 'manufacturer', 'model'],
                    include: [{ model: AssetCategory, as: 'category', attributes: ['name'] }]
                },
                { model: User, as: 'assignee', attributes: userIncludeAttributes }
            ],
            order: [['assignment_date', 'ASC']]
        });
        // In a real scenario, this would be filtered by users with 'exit_pending' status or similar from HRMS
        // For this implementation, Resource Dept. will get ALL active assignments and can filter for exiting employees.
        res.status(200).json(assignments);
    } catch (error) {
        console.error("Error fetching pending clearance requests:", error);
        res.status(500).json({ message: "Failed to fetch pending clearance requests", error: error.message });
    }
};

/**
 * Process asset return (during exit flow)
 * This updates asset status and assignment records.
 * Accessible by: Resource Department
 */
exports.processAssetReturn = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: assignmentId } = req.params;
        const { return_date, returned_condition, notes, new_asset_status } = req.body;
        const { userId } = req.user;

        if (!return_date || !returned_condition || !new_asset_status) {
            await t.rollback();
            return res.status(400).json({ message: "Return date, condition, and new asset status are required." });
        }

        const assignment = await AssetAssignment.findByPk(assignmentId);
        if (!assignment || assignment.organization_id !== req.user.organization_id || !assignment.is_active) {
            await t.rollback();
            return res.status(404).json({ message: "Active asset assignment not found or not authorized." });
        }

        const asset = await Asset.findByPk(assignment.asset_id);
        if (!asset) {
            await t.rollback();
            return res.status(404).json({ message: "Associated asset not found." });
        }

        // Update the assignment record
        await assignment.update({
            return_date,
            returned_condition,
            received_by_id: userId, // The Resource Dept. member
            is_active: false, // Mark as inactive assignment
            sign_off_status: 'Cleared', // Assume 'Cleared' if all details are provided
            notes: notes || assignment.notes,
            updated_by: userId
        }, { transaction: t });

        // Update the asset's status based on return condition
        await asset.update({
            current_status: new_asset_status, // e.g., 'Available', 'Under Repair', 'Awaiting Disposal'
            condition: returned_condition,
            updated_by: userId
        }, { transaction: t });

        // TODO: Notify HR (if they initiated the clearance) and the exiting employee
        await t.commit();
        res.status(200).json({ message: "Asset return processed successfully!", assignment });

    } catch (error) {
        await t.rollback();
        console.error("Error processing asset return:", error);
        res.status(500).json({ message: "Failed to process asset return", error: error.message });
    }
};

/**
 * Get approval history for a manager/admin
 * This is for *their own* actions on asset requests
 */
exports.getAssetApprovalHistory = async (req, res) => {
    try {
        const { organization_id, userId, role } = req.user;

        let whereClause = {
            organization_id: organization_id,
            [Op.or]: [
                { primary_approver_id: userId, current_status: { [Op.in]: ['Approved', 'Rejected'] } },
                { secondary_approver_id: userId, current_status: { [Op.in]: ['Approved', 'Rejected'] } }
            ]
        };

        if (role === 'admin') {
            whereClause[Op.or].push({ final_approver_id: userId, current_status: { [Op.in]: ['Approved', 'Rejected'] } });
        }

        const history = await AssetRequest.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'requester', attributes: userIncludeAttributes },
                { model: AssetCategory, as: 'category', attributes: ['name'] },
                { model: User, as: 'finalApprover', attributes: userIncludeAttributes } // Who made the final decision
            ],
            order: [['updated_at', 'DESC']]
        });

        res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching asset approval history:", error);
        res.status(500).json({ message: "Failed to fetch asset approval history", error: error.message });
    }
};