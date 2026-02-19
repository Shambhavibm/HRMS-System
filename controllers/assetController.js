// backend/controllers/assetController.js
const { Op } = require('sequelize');
const {
    AssetCategory,
    Asset,
    AssetRequest,
    AssetAssignment,
    OfficeLocation,
    AssetStock,
    User,
    sequelize
} = require('../models');

// This controller relies on the notification helper for sending notifications.
// Make sure 'backend/utils/notificationHelper.js' exists and is correctly set up.
const { createNotification, notifyAllByRole } = require('../utils/notificationHelper');

// --- Helper Functions ---

// Helper function to get manager IDs for a user
async function getUserManagers(userId, organization_id) {
    const user = await User.findOne({
        where: { user_id: userId, organization_id: organization_id },
        attributes: ['user_id', 'manager_id_primary', 'manager_id_secondary']
    });
    if (!user) return { primaryManagerId: null, secondaryManagerId: null };
    return { primaryManagerId: user.manager_id_primary, secondaryManagerId: user.manager_id_secondary };
}

// Helper to determine next approval status based on user's managers
async function getNextApprovalStatus(requesterId, organizationId) {
    const { primaryManagerId } = await getUserManagers(requesterId, organizationId);
    // If a primary manager exists, it starts with them.
    if (primaryManagerId) {
        return 'Pending Manager Approval';
    }
    // Otherwise, it skips straight to Admin.
    return 'Pending Admin Approval';
}

const userIncludeAttributes = ['user_id', 'first_name', 'last_name', 'official_email_id', 'role'];


// --- Controller Functions ---

exports.getAssetCategories = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const categories = await AssetCategory.findAll({
            where: { organization_id: organization_id },
            order: [['name', 'ASC']]
        });
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching asset categories:", error);
        res.status(500).json({ message: "Failed to fetch asset categories", error: error.message });
    }
};

exports.addAssetCategory = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { organization_id, userId } = req.user;
        // FIX: Destructure tracking_type instead of is_physical
        const { name, description, tracking_type } = req.body;

        if (!name || !tracking_type) {
            await t.rollback();
            return res.status(400).json({ message: "Category name and tracking type are required." });
        }

        const newCategory = await AssetCategory.create({
            organization_id,
            name,
            description,
            tracking_type, // FIX: Save the new tracking_type field
            created_by: userId,
            updated_by: userId,
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: "Asset category added successfully!", category: newCategory });
    } catch (error) {
        await t.rollback();
        console.error("Error adding asset category:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: "An asset category with this name already exists for your organization." });
        }
        res.status(500).json({ message: "Failed to add asset category", error: error.message });
    }
};

exports.updateAssetCategory = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: categoryId } = req.params;
        const { organization_id, userId } = req.user;
        // FIX: Destructure tracking_type instead of is_physical
        const { name, description, tracking_type } = req.body;

        if (!name || !tracking_type) {
            await t.rollback();
            return res.status(400).json({ message: "Category name and tracking type are required." });
        }

        const category = await AssetCategory.findOne({
            where: { category_id: categoryId, organization_id: organization_id }
        });

        if (!category) {
            await t.rollback();
            return res.status(404).json({ message: "Asset category not found." });
        }

        await category.update({
            name,
            description,
            tracking_type, // FIX: Update the new tracking_type field
            updated_by: userId
        }, { transaction: t });

        await t.commit();
        res.status(200).json({ message: "Asset category updated successfully!", category });
    } catch (error) {
        await t.rollback();
        console.error("Error updating asset category:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: "An asset category with this name already exists for your organization." });
        }
        res.status(500).json({ message: "Failed to update asset category", error: error.message });
    }
};

exports.submitAssetRequest = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { organization_id, userId, first_name, last_name } = req.user;
        const {
            request_type, category_id, preferred_model, location_id,
            justification, urgency, shipping_address
        } = req.body;

        if (!request_type || !category_id || !justification || !urgency || !location_id) {
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
            location_id,
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

        const requesterName = `${first_name} ${last_name}`;
        if (initialStatus === 'Pending Manager Approval' && primaryManagerId) {
            await createNotification({
                organization_id,
                user_id: primaryManagerId,
                title: 'New Asset Request',
                message: `A new asset request from ${requesterName} is awaiting your approval.`,
                link: `/assets/approvals`,
                transaction: t
            });
        } else if (initialStatus === 'Pending Admin Approval') {
            await notifyAllByRole({
                organization_id,
                role: 'admin',
                title: 'New Asset Request',
                message: `A new asset request from ${requesterName} requires admin approval.`,
                link: `/assets/approvals`,
                transaction: t,
                excludeUserIds: [userId]
            });
        }

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

exports.getPendingApprovals = async (req, res) => {
    try {
        const { organization_id, userId, role } = req.user;

        if (role !== 'manager' && role !== 'admin') {
            return res.status(200).json([]);
        }

        let whereClause = {
            organization_id: organization_id,
        };

        // This is the main logic change.
        // We now create an array of conditions for the [Op.or] clause.
        const conditions = [];

        // Manager role condition (unchanged)
        if (role === 'manager') {
            conditions.push(
                { current_status: 'Pending Manager Approval', primary_approver_id: userId },
                { current_status: 'Pending Secondary Approval', secondary_approver_id: userId }
            );
        }
        
        // Admin role can see both their own managerial approvals AND global admin approvals.
        if (role === 'admin') {
            conditions.push(
                // Global admin view
                { current_status: 'Pending Admin Approval' },
                // Admin's specific managerial duties
                { current_status: 'Pending Manager Approval', primary_approver_id: userId },
                { current_status: 'Pending Secondary Approval', secondary_approver_id: userId }
            );
        }

        if (conditions.length === 0) {
            return res.status(200).json([]);
        }

        whereClause[Op.or] = conditions;

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


exports.approveAssetRequest = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: requestId } = req.params;
        const { userId, role, organization_id } = req.user;

        const request = await AssetRequest.findOne({
            where: { request_id: requestId, organization_id },
            include: [{ model: User, as: 'requester', attributes: ['first_name', 'last_name'] }]
        });

        if (!request) {
            await t.rollback();
            return res.status(404).json({ message: "Asset request not found." });
        }

        let nextStatus = request.current_status;
        const requesterName = `${request.requester.first_name} ${request.requester.last_name}`;

        if (role === 'manager' || role === 'admin') {
            const isPrimaryApprover = request.primary_approver_id === userId;
            const isSecondaryApprover = request.secondary_approver_id === userId;
            const statusIsPendingPrimary = request.current_status === 'Pending Manager Approval';
            const statusIsPendingSecondary = request.current_status === 'Pending Secondary Approval';
            const statusIsPendingAdmin = request.current_status === 'Pending Admin Approval';

            // Check if the user is authorized to perform an action at the current stage
            const canPerformManagerialApproval = (isPrimaryApprover && statusIsPendingPrimary) || (isSecondaryApprover && statusIsPendingSecondary);
            const canPerformAdminApproval = role === 'admin' && statusIsPendingAdmin;

            if (!canPerformManagerialApproval && !canPerformAdminApproval) {
                await t.rollback();
                return res.status(403).json({ message: "Request is not awaiting your approval at this stage." });
            }

            // ✅ NEW LOGIC: If the approver has the 'admin' role, their approval is FINAL, regardless of the stage.
            if (role === 'admin') {
                nextStatus = 'Approved';
                request.final_approver_id = userId;
                request.approved_at = new Date();
                request.assigned_to_resource_id = userId;
            } else {
                // This block now only runs if the approver is a REGULAR 'manager'
                if (statusIsPendingPrimary) {
                    if (request.secondary_approver_id && request.secondary_approver_id !== request.primary_approver_id) {
                        nextStatus = 'Pending Secondary Approval';
                    } else {
                        nextStatus = 'Pending Admin Approval';
                    }
                } else if (statusIsPendingSecondary) {
                    nextStatus = 'Pending Admin Approval';
                }
            }
        } else {
            await t.rollback();
            return res.status(403).json({ message: "Unauthorized to approve." });
        }
        
        // Use the request object to ensure all fields are passed correctly
        await request.update({
            current_status: nextStatus,
            final_approver_id: request.final_approver_id,
            approved_at: request.approved_at,
            assigned_to_resource_id: request.assigned_to_resource_id,
            updated_by: userId
        }, { transaction: t });

        // --- Notification Logic --- (This logic is correct and remains unchanged)
        // It will correctly send the "Approved" and "Ready for Fulfillment" notifications now.
        if (nextStatus === 'Pending Secondary Approval') {
            await createNotification({
                organization_id, user_id: request.secondary_approver_id,
                title: 'Asset Request Awaiting Your Approval',
                message: `Request #${request.request_id} from ${requesterName} is awaiting your secondary approval.`,
                link: `/assets/approvals`, transaction: t
            });
        } else if (nextStatus === 'Pending Admin Approval') {
            await notifyAllByRole({
                organization_id, role: 'admin',
                title: 'Asset Request Awaiting Final Approval',
                message: `Request #${request.request_id} for ${requesterName} has been fully manager-approved.`,
                link: `/assets/approvals`, transaction: t
            });
        } else if (nextStatus === 'Approved') {
            await createNotification({ organization_id, user_id: request.secondary_approver_id,
                title: 'Asset Request Awaiting Your Approval',
                message: `Request #${request.request_id} from ${requesterName} is awaiting your secondary approval.`,
                link: `/assets/approvals`, transaction: t });
            await notifyAllByRole({ organization_id, role: 'admin',
                title: 'Asset Request Awaiting Final Approval',
                message: `Request #${request.request_id} for ${requesterName} has been fully manager-approved.`,
                link: `/assets/approvals`, transaction: t });
        }
        
        await t.commit();
        res.status(200).json({ message: `Asset request ${requestId} has been successfully processed and approved.` });

    } catch (error) {
        await t.rollback();
        console.error("Error approving asset request:", error);
        res.status(500).json({ message: "Failed to approve asset request", error: error.message });
    }
};

exports.rejectAssetRequest = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: requestId } = req.params;
        const { reason } = req.body;
        const { userId, role, organization_id } = req.user;

        if (!reason) {
            await t.rollback();
            return res.status(400).json({ message: "Rejection reason is required." });
        }

        const request = await AssetRequest.findByPk(requestId);

        if (!request || request.organization_id !== organization_id) {
            await t.rollback();
            return res.status(404).json({ message: "Asset request not found." });
        }

        const isAuthorizedToReject =
            (request.current_status === 'Pending Manager Approval' && (request.primary_approver_id === userId || request.secondary_approver_id === userId)) ||
            (request.current_status === 'Pending Admin Approval' && role === 'admin');

        if (!isAuthorizedToReject) {
            await t.rollback();
            return res.status(403).json({ message: "You are not authorized to reject this request." });
        }

        await request.update({
            current_status: 'Rejected',
            rejection_reason: reason,
            final_approver_id: userId,
            updated_by: userId
        }, { transaction: t });

        await createNotification({
            organization_id,
            user_id: request.user_id,
            title: 'Your Asset Request Was Rejected',
            message: `Unfortunately, your request #${request.request_id} was rejected. Reason: "${reason}"`,
            link: `/assets/my-requests`,
            transaction: t
        });

        await t.commit();
        res.status(200).json({ message: `Asset request ${requestId} rejected.` });
    } catch (error) {
        await t.rollback();
        console.error("Error rejecting asset request:", error);
        res.status(500).json({ message: "Failed to reject asset request", error: error.message });
    }
};

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
                { model: User, as: 'resourceAssignee', attributes: userIncludeAttributes },
                { 
                    model: AssetAssignment, 
                    as: 'fulfillmentAssignment',
                    attributes: ['return_date'] 
                }
            ],
            order: [['created_at', 'DESC']]
        });
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching all asset requests:", error);
        res.status(500).json({ message: "Failed to fetch all asset requests", error: error.message });
    }
};

exports.getAllAssets = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const assets = await Asset.findAll({
            where: { organization_id: organization_id },
            include: [
                {
                    model: AssetCategory,
                    as: 'category',
                    // The 'is_physical' attribute has been removed from the query
                    attributes: ['name', 'tracking_type']
                },
                {
                    model: OfficeLocation,
                    as: 'location',
                    attributes: ['name']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        res.status(200).json(assets);
    } catch (error) {
        console.error("Error fetching all assets:", error);
        res.status(500).json({ message: "Failed to fetch all assets", error: error.message });
    }
};

exports.addAsset = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { organization_id, userId } = req.user;
        const assetData = req.body;

        // --- Data Sanitization Step ---
        // Convert empty strings for optional fields to null, as the database expects.
        if (!assetData.warranty_expiry_date) assetData.warranty_expiry_date = null;
        if (!assetData.manufacturing_year) assetData.manufacturing_year = null;
        if (!assetData.asset_tag) assetData.asset_tag = null;
        if (!assetData.location) assetData.location = null;
        if (!assetData.notes) assetData.notes = null;

        // --- Validation Step ---
        if (!assetData.category_id || !assetData.serial_number || !assetData.manufacturer || !assetData.model || !assetData.purchase_date || !assetData.purchase_cost) {
            await t.rollback();
            return res.status(400).json({ message: "Missing required asset fields." });
        }

        const newAsset = await Asset.create({
            ...assetData,
            organization_id,
            created_by: userId,
            updated_by: userId,
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: "Asset added successfully!", asset: newAsset });
    } catch (error) {
        await t.rollback();
        console.error("Error adding asset:", error); // Check your backend logs for this error!
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: "Asset with this serial number or asset tag already exists." });
        }
        res.status(500).json({ message: "Failed to add asset.", error: error.message });
    }
};

exports.updateAsset = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: assetId } = req.params;
        const { userId, organization_id } = req.user;
        const updatedFields = req.body;

        const asset = await Asset.findOne({ where: { asset_id: assetId, organization_id } });

        if (!asset) {
            await t.rollback();
            return res.status(404).json({ message: "Asset not found." });
        }
        
        // --- Data Sanitization Step ---
        if (updatedFields.warranty_expiry_date === '') updatedFields.warranty_expiry_date = null;
        if (updatedFields.manufacturing_year === '') updatedFields.manufacturing_year = null;

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

exports.getMyAssignedAssets = async (req, res) => {
    try {
        const { organization_id, userId } = req.user;
        const assignments = await AssetAssignment.findAll({
            where: { user_id: userId, organization_id, is_active: true },
            include: [{
                model: Asset,
                as: 'asset',
                include: [{ model: AssetCategory, as: 'category', attributes: ['name'] }]
            }],
            order: [['assignment_date', 'DESC']]
        });
        res.status(200).json(assignments);
    } catch (error) {
        console.error("Error fetching my assigned assets:", error);
        res.status(500).json({ message: "Failed to fetch your assigned assets", error: error.message });
    }
};

exports.getAssignedFulfillmentRequests = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const requests = await AssetRequest.findAll({
            where: {
                organization_id,
                current_status: { [Op.in]: ['Approved', 'Awaiting Procurement'] }
            },
            include: [
                { model: User, as: 'requester', attributes: userIncludeAttributes },
                // FIX: Include tracking_type from the category
                { model: AssetCategory, as: 'category', attributes: ['name', 'tracking_type'] },
                { model: User, as: 'finalApprover', attributes: userIncludeAttributes },
                { model: User, as: 'resourceAssignee', attributes: userIncludeAttributes },
                // FIX: Include the location details for the request
                { model: OfficeLocation, as: 'location' }
            ],
            order: [['created_at', 'ASC']]
        });
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching fulfillment requests:", error);
        res.status(500).json({ message: "Failed to fetch fulfillment requests", error: error.message });
    }
};

exports.fulfillAssetRequest = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: requestId } = req.params;
        const { asset_id, stock_id, assignment_date, notes, accessory_details } = req.body;
        const { userId, organization_id } = req.user;

        if ((!asset_id && !stock_id) || !assignment_date) {
            await t.rollback();
            return res.status(400).json({ message: "An asset or stock item, and an assignment date are required." });
        }
        
        const request = await AssetRequest.findByPk(requestId, { include: [{ model: AssetCategory, as: 'category' }] });
        if (!request || request.organization_id !== organization_id) { /* ... error handling ... */ }
        if (!['Approved', 'Awaiting Procurement'].includes(request.current_status)) { /* ... error handling ... */ }

        let fulfillmentMessage = '';
        let notificationMessage = '';

        if (request.category.tracking_type === 'Serialized') {
            if (!asset_id) { /* ... error handling ... */ }
            const asset = await Asset.findByPk(asset_id);
            if (!asset || asset.current_status !== 'Available') { /* ... error handling ... */ }

            await AssetAssignment.create({
                organization_id: request.organization_id,
                asset_id: asset.asset_id,
                user_id: request.user_id,
                request_id: request.request_id,
                assignment_date,
                notes,
                // ✅ FIX: Remove JSON.parse. The data is already a valid object.
                accessory_details: accessory_details ? accessory_details : null, 
                is_active: true,
                created_by: userId,
                updated_by: userId
            }, { transaction: t });

            await asset.update({ current_status: 'Issued', updated_by: userId }, { transaction: t });
            fulfillmentMessage = `Serialized asset (${asset.manufacturer} ${asset.model}) has been assigned.`;
            notificationMessage = `Your requested asset (${asset.manufacturer} ${asset.model}) has been dispatched.`;

        } else if (request.category.tracking_type === 'Bulk') {
            if (!stock_id) { /* ... error handling ... */ }
            const stockItem = await AssetStock.findByPk(stock_id);
            if (!stockItem || stockItem.available_quantity < 1) { /* ... error handling ... */ }
            
            await AssetAssignment.create({
                organization_id: request.organization_id, stock_id: stockItem.stock_id, user_id: request.user_id,
                request_id: request.request_id, assignment_date, notes, is_active: true,
                created_by: userId, updated_by: userId
            }, { transaction: t });

            stockItem.available_quantity -= 1;
            await stockItem.save({ transaction: t });
            
            fulfillmentMessage = `Bulk item (${stockItem.name}) has been assigned from stock.`;
            notificationMessage = `Your requested item (${stockItem.name}) has been dispatched.`;
        }

        await request.update({ current_status: 'Fulfilled', fulfilled_at: new Date(), updated_by: userId }, { transaction: t });
        
        await createNotification({
            organization_id,
            user_id: request.user_id,
            title: 'Your Asset Request Has Been Fulfilled',
            message: notificationMessage,
            link: '/assets/my-assets',
            transaction: t
        });

        await t.commit();
        res.status(200).json({ message: `Asset request fulfilled successfully! ${fulfillmentMessage}` });

    } catch (error) {
        await t.rollback();
        console.error("Error fulfilling asset request:", error);
        res.status(500).json({ message: "Failed to fulfill asset request", error: error.message });
    }
};

exports.markAwaitingProcurement = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: requestId } = req.params;
        const { userId, organization_id } = req.user;

        const request = await AssetRequest.findOne({
            where: { request_id: requestId, organization_id },
            include: [{ model: User, as: 'requester', attributes: ['first_name', 'last_name'] }]
        });

        if (!request) {
            await t.rollback();
            return res.status(404).json({ message: "Asset request not found." });
        }

        if (request.current_status !== 'Approved') {
            await t.rollback();
            return res.status(400).json({ message: "Only approved requests can be marked for procurement." });
        }

        await request.update({ current_status: 'Awaiting Procurement', updated_by: userId }, { transaction: t });

        await notifyAllByRole({
            organization_id,
            role: 'admin',
            title: 'Item Requires Procurement',
            message: `Request #${request.request_id} for ${request.requester.first_name} ${request.requester.last_name} is 'Awaiting Procurement'.`,
            link: '/assets/fulfillment',
            transaction: t
        });

        await t.commit();
        res.status(200).json({ message: `Request ${requestId} marked as 'Awaiting Procurement'.` });
    } catch (error) {
        await t.rollback();
        console.error("Error marking for procurement:", error);
        res.status(500).json({ message: "Failed to mark request for procurement", error: error.message });
    }
};

exports.getPendingClearanceRequests = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const assignments = await AssetAssignment.findAll({
            where: { organization_id, is_active: true },
            include: [
                {
                    model: Asset,
                    as: 'asset',
                    include: [{ model: AssetCategory, as: 'category', attributes: ['name'] }]
                },
                { model: User, as: 'assignee', attributes: userIncludeAttributes }
            ],
            order: [['assignment_date', 'ASC']]
        });
        res.status(200).json(assignments);
    } catch (error) {
        console.error("Error fetching clearance requests:", error);
        res.status(500).json({ message: "Failed to fetch pending clearance requests", error: error.message });
    }
};

exports.processAssetReturn = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: assignmentId } = req.params;
        const {
            return_date,
            returned_condition,
            notes,
            new_asset_status,
            damage_notes,
            sign_off_status
        } = req.body;
        const { userId, organization_id } = req.user;

        if (!return_date || !returned_condition || !new_asset_status || !sign_off_status) {
            await t.rollback();
            return res.status(400).json({ message: "Return date, condition, new asset status, and sign-off status are required." });
        }

        // ✅ FIX: Added `include` to the query to fetch the associated Asset details.
        // This makes the `assignment.asset` object available.
        const assignment = await AssetAssignment.findOne({
            where: {
                assignment_id: assignmentId,
                organization_id: organization_id,
                is_active: true
            },
            include: [{ model: Asset, as: 'asset' }] // Eagerly load the asset
        });
        
        if (!assignment) {
            await t.rollback();
            return res.status(404).json({ message: "Active asset assignment not found or not authorized." });
        }
        
        // This check is now crucial. If the include fails, we catch it.
        if (!assignment.asset) {
            await t.rollback();
            return res.status(404).json({ message: "Associated asset could not be found for this assignment." });
        }

        // Update the assignment record
        await assignment.update({
            return_date,
            returned_condition,
            received_by_id: userId,
            is_active: false,
            sign_off_status,
            damage_notes,
            notes: notes || assignment.notes,
            updated_by: userId
        }, { transaction: t });

        // Update the asset's status in the inventory using the already-fetched asset object
        await assignment.asset.update({
            current_status: new_asset_status,
            condition: returned_condition,
            updated_by: userId
        }, { transaction: t });

        // Now this notification can safely access assignment.asset
        await createNotification({
            organization_id,
            user_id: assignment.user_id,
            title: 'Asset Return Cleared',
            message: `The return of your assigned asset (${assignment.asset.manufacturer} ${assignment.asset.model}) has been processed and cleared.`,
            link: '/assets/my-assets',
            transaction: t
        });

        await t.commit();
        res.status(200).json({ message: "Asset return processed successfully!", assignment });

    } catch (error) {
        await t.rollback();
        console.error("Error processing asset return:", error);
        res.status(500).json({ message: "Failed to process asset return", error: error.message });
    }
};
// exports.getAssetApprovalHistory = async (req, res) => {
//     try {
//         const { organization_id, userId } = req.user;

//         const history = await AssetRequest.findAll({
//             where: {
//                 organization_id: organization_id,
//                 // Condition 1: The request must be in a completed state.
//                 current_status: { [Op.in]: ['Approved', 'Rejected'] },
//                 // Condition 2: The logged-in user must have been involved in one of the approval roles.
//                 [Op.or]: [
//                     { primary_approver_id: userId },
//                     { secondary_approver_id: userId },
//                     { final_approver_id: userId }
//                 ]
//             },
//             include: [
//                 { model: User, as: 'requester', attributes: userIncludeAttributes },
//                 { model: AssetCategory, as: 'category', attributes: ['name'] },
//                 { model: User, as: 'finalApprover', attributes: userIncludeAttributes }
//             ],
//             order: [['updated_at', 'DESC']]
//         });

//         res.status(200).json(history);
//     } catch (error) {
//         console.error("Error fetching asset approval history:", error);
//         res.status(500).json({ message: "Failed to fetch asset approval history", error: error.message });
//     }
// };

exports.getAssetApprovalHistory = async (req, res) => {
    try {
        const { organization_id, userId } = req.user;

        const history = await AssetRequest.findAll({
            where: {
                organization_id: organization_id,
                // ✅ FIX: Include all post-approval statuses in the definition of "history".
                current_status: { [Op.in]: [
                    'Approved', 
                    'Rejected', 
                    'Awaiting Procurement', 
                    'Fulfilled'
                ]},
                // Condition 2: The logged-in user must have been involved in one of the approval roles.
                [Op.or]: [
                    { primary_approver_id: userId },
                    { secondary_approver_id: userId },
                    { final_approver_id: userId }
                ]
            },
            include: [
                { model: User, as: 'requester', attributes: userIncludeAttributes },
                { model: AssetCategory, as: 'category', attributes: ['name'] },
                { model: User, as: 'finalApprover', attributes: userIncludeAttributes }
            ],
            order: [['updated_at', 'DESC']]
        });

        res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching asset approval history:", error);
        res.status(500).json({ message: "Failed to fetch asset approval history", error: error.message });
    }
};


/**
 * Allows a user to acknowledge receipt of an assigned asset.
 * Accessible by: Member, Manager, Admin
 */
exports.acknowledgeAssetReceipt = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id: assignmentId } = req.params;
        const { userId, organization_id } = req.user;

        // Find the specific assignment record
        const assignment = await AssetAssignment.findOne({
            where: {
                assignment_id: assignmentId,
                user_id: userId, // Ensure users can only acknowledge their own assignments
                organization_id: organization_id,
            },
            include: [{ model: Asset, as: 'asset' }] // Include the asset to update it
        });

        if (!assignment) {
            await t.rollback();
            return res.status(404).json({ message: "Asset assignment not found or you are not authorized." });
        }

        if (!assignment.asset) {
            await t.rollback();
            return res.status(404).json({ message: "Associated asset could not be found." });
        }

        // Only allow acknowledgment if the asset is currently 'Issued'
        if (assignment.asset.current_status !== 'Issued') {
            await t.rollback();
            return res.status(400).json({ message: `Asset is not awaiting acknowledgment. Current status: ${assignment.asset.current_status}` });
        }

        // Update the asset's status to 'In Use'
        await assignment.asset.update({
            current_status: 'In Use',
            updated_by: userId
        }, { transaction: t });

        // Optionally, you could add an 'acknowledged_at' date to the AssetAssignment model
        // await assignment.update({ acknowledged_at: new Date() }, { transaction: t });

        await t.commit();
        res.status(200).json({ message: "Asset receipt acknowledged successfully." });

    } catch (error) {
        await t.rollback();
        console.error("Error acknowledging asset receipt:", error);
        res.status(500).json({ message: "Failed to acknowledge asset receipt.", error: error.message });
    }
};

exports.getAssetStock = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const stock = await AssetStock.findAll({
            where: { organization_id: organization_id },
            include: [
                { model: AssetCategory, as: 'category', attributes: ['name'] },
                { model: OfficeLocation, as: 'location', attributes: ['name'] }
            ],
            order: [['name', 'ASC']]
        });
        res.status(200).json(stock);
    } catch (error) {
        console.error("Error fetching asset stock:", error);
        res.status(500).json({ message: "Failed to fetch asset stock", error: error.message });
    }
};

// Add new bulk stock
exports.addAssetStock = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { organization_id, userId } = req.user;
        const { category_id, location_id, name, quantity } = req.body;

        if (!category_id || !location_id || !name || !quantity || quantity <= 0) {
            await t.rollback();
            return res.status(400).json({ message: "Category, location, name, and a valid quantity are required." });
        }

        // Check if stock for this item and location already exists
        let stockItem = await AssetStock.findOne({
            where: { category_id, location_id, name, organization_id }
        });

        if (stockItem) {
            // If it exists, just update the quantity
            stockItem.total_quantity += parseInt(quantity, 10);
            stockItem.available_quantity += parseInt(quantity, 10);
            stockItem.updated_by = userId;
            await stockItem.save({ transaction: t });
        } else {
            // If it doesn't exist, create a new entry
            stockItem = await AssetStock.create({
                organization_id,
                category_id,
                location_id,
                name,
                total_quantity: quantity,
                available_quantity: quantity,
                created_by: userId,
                updated_by: userId,
            }, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ message: "Stock updated successfully!", stock: stockItem });
    } catch (error) {
        await t.rollback();
        console.error("Error adding asset stock:", error);
        res.status(500).json({ message: "Failed to add asset stock", error: error.message });
    }
};

exports.getOfficeLocations = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const locations = await OfficeLocation.findAll({
            where: { organization_id: organization_id, is_active: true },
            order: [['name', 'ASC']]
        });
        res.status(200).json(locations);
    } catch (error) {
        console.error("Error fetching office locations:", error);
        res.status(500).json({ message: "Failed to fetch office locations", error: error.message });
    }
};
