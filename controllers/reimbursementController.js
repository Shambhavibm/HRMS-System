const { Reimbursement, User } = require('../models');
const { Op } = require('sequelize');

// 1. Submit a new reimbursement claim
exports.submitClaim = async (req, res) => {
    const { category, amount, expense_date, description } = req.body;
    const { userId, organization_id, manager_id } = req.user;

    if (!req.file) {
        return res.status(400).json({ message: 'Receipt document is required.' });
    }
    // Basic validation
    if (!category || !amount || !expense_date) {
        return res.status(400).json({ message: 'Category, amount, and expense date are required.' });
    }

    try {
        await Reimbursement.create({
            user_id: userId,
            organization_id,
            category,
            amount,
            expense_date,
            description,
            document_path: req.file.path,
            status: 'Pending',
        });
        res.status(201).json({ message: 'Reimbursement claim submitted successfully.' });
    } catch (error) {
        console.error('Error submitting claim:', error);
        res.status(500).json({ message: 'Server error while submitting claim.' });
    }
};

// 2. Get claims for the currently logged-in user
exports.getMyClaims = async (req, res) => {
    try {
        const claims = await Reimbursement.findAll({
            where: { user_id: req.user.userId },
            order: [['created_at', 'DESC']],
            include: [{ model: User, as: 'approver', attributes: ['first_name', 'last_name'] }]
        });
        res.json(claims);
    } catch (error) {
        console.error('Error fetching claims:', error);
        res.status(500).json({ message: 'Server error while fetching claims.' });
    }
};

// 3. For Pending Approvals
exports.getPendingApprovals = async (req, res) => {
    try {
        const { userId, role, organization_id } = req.user;

        // This array will hold the different conditions for fetching claims.
        const approvalConditions = [];

        // --- Condition 1: Claims from the user's direct reports (for Managers AND Admins) ---
        const directReportIds = (await User.findAll({
            where: {
                organization_id,
                [Op.or]: [
                    { manager_id_primary: userId },
                    { manager_id_secondary: userId }
                ]
            },
            attributes: ['user_id'],
        })).map(u => u.user_id);

        if (directReportIds.length > 0) {
            approvalConditions.push({ user_id: { [Op.in]: directReportIds } });
        }

        // --- Condition 2: Claims from unassigned users (for Admins ONLY) ---
        if (role === 'admin') {
            const unassignedUserIds = (await User.findAll({
                where: {
                    organization_id,
                    manager_id_primary: null,
                    manager_id_secondary: null,
                    role: { [Op.ne]: 'admin' } // Exclude other admins
                },
                attributes: ['user_id']
            })).map(u => u.user_id);

            if (unassignedUserIds.length > 0) {
                approvalConditions.push({ user_id: { [Op.in]: unassignedUserIds } });
            }
        }
        
        // If there are no conditions, there are no claims to fetch.
        if (approvalConditions.length === 0) {
            return res.json([]);
        }

        // --- Final Query ---
        // Fetch all pending claims that match ANY of the conditions.
        const pendingClaims = await Reimbursement.findAll({
            where: {
                [Op.or]: approvalConditions, // Use the array of conditions here
                status: 'Pending',
                organization_id
            },
            include: [{ model: User, as: 'employee', attributes: ['first_name', 'last_name', 'official_email_id'] }],
            order: [['created_at', 'ASC']],
        });
        
        res.json(pendingClaims);
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json({ message: 'Server error while fetching pending approvals.' });
    }
};

// 4. Approve a claim
exports.approveClaim = async (req, res) => {
    try {
        const claim = await Reimbursement.findByPk(req.params.id);
        if (!claim) {
            return res.status(404).json({ message: 'Claim not found.' });
        }

        // CRITICAL CHECK: Ensure another manager hasn't already acted.
        if (claim.status !== 'Pending') {
            return res.status(409).json({ message: `This claim has already been ${claim.status.toLowerCase()} and cannot be changed.` });
        }
        
        claim.status = 'Approved';
        claim.approved_by = req.user.userId; // Log which manager approved it
        claim.approved_at = new Date();
        claim.rejection_reason = null;

        const approvalDate = new Date();
        const monthName = approvalDate.toLocaleString('default', { month: 'long' });
        claim.payroll_month = `${monthName} ${approvalDate.getFullYear()}`;

        await claim.save();
        res.json({ message: 'Claim approved successfully.' });
    } catch (error) {
        console.error('Error approving claim:', error);
        res.status(500).json({ message: 'Server error while approving claim.' });
    }
};

// 5. Reject a claim
exports.rejectClaim = async (req, res) => {
    const { reason } = req.body;
    if (!reason) {
        return res.status(400).json({ message: 'Rejection reason is required.' });
    }

    try {
        const claim = await Reimbursement.findByPk(req.params.id);
        if (!claim) {
            return res.status(404).json({ message: 'Claim not found.' });
        }

        // CRITICAL CHECK: Ensure another manager hasn't already acted.
        if (claim.status !== 'Pending') {
            return res.status(409).json({ message: `This claim has already been ${claim.status.toLowerCase()} and cannot be changed.` });
        }
        
        claim.status = 'Rejected';
        claim.approved_by = req.user.userId; // Log which manager rejected it
        claim.rejection_reason = reason;
        await claim.save();

        res.json({ message: 'Claim rejected successfully.' });
    } catch (error) {
        console.error('Error rejecting claim:', error);
        res.status(500).json({ message: 'Server error while rejecting claim.' });
    }
};

// 6. Get all approved claims for the Admin dashboard
exports.getApprovedClaimsForAdmin = async (req, res) => {
    try {
        const claims = await Reimbursement.findAll({
            where: { 
                organization_id: req.user.organization_id,
                status: 'Approved' 
            },
            include: [
                { model: User, as: 'employee', attributes: ['user_id', 'first_name', 'last_name'] },
                { model: User, as: 'approver', attributes: ['user_id', 'first_name', 'last_name'] }
            ],
            order: [['approved_at', 'DESC']]
        });
        res.json(claims);
    } catch (error) {
        console.error('Error fetching approved claims:', error);
        res.status(500).json({ message: 'Server error while fetching claims.' });
    }
};


exports.getApprovalHistory = async (req, res) => {
    try {
        const claims = await Reimbursement.findAll({
            where: {
                approved_by: req.user.userId, // Find claims acted upon by ME
                status: { [Op.in]: ['Approved', 'Rejected'] } // That are either Approved or Rejected
            },
            include: [{ model: User, as: 'employee', attributes: ['user_id', 'first_name', 'last_name'] }],
            order: [['updated_at', 'DESC']]
        });
        res.json(claims);
    } catch (error) {
        console.error('Error fetching approval history:', error);
        res.status(500).json({ message: 'Server error while fetching history.' });
    }
};