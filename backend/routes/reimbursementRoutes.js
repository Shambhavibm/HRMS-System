const express = require('express');
const router = express.Router();
const reimbursementController = require('../controllers/reimbursementController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Apply authentication middleware to all routes in this file
router.use(authenticateToken);

// Route for an employee/manager to submit a claim
router.post(
    '/submit', 
    authorizeRoles('admin', 'manager', 'member'), 
    upload.single('receipt'), // 'receipt' should match the FormData key
    reimbursementController.submitClaim
);

// Route for a user to see their own claims
router.get(
    '/my-claims', 
    authorizeRoles('admin', 'manager', 'member'), 
    reimbursementController.getMyClaims
);

// Route for a manager to see pending approvals from their team
router.get(
    '/pending-approvals',
    authorizeRoles('admin', 'manager'),
    reimbursementController.getPendingApprovals
);

// Route for a manager to approve a claim
router.post(
    '/approve/:id',
    authorizeRoles('admin' , 'manager'),
    reimbursementController.approveClaim
);

// Route for a manager to reject a claim
router.post(
    '/reject/:id',
    authorizeRoles('admin' , 'manager'),
    reimbursementController.rejectClaim
);

// Route for an admin to view all approved claims for payroll
router.get(
    '/approved-for-admin',
    authorizeRoles('admin'),
    reimbursementController.getApprovedClaimsForAdmin
);

// ✅ NEW: Route for a manager/admin to see their own approval history
router.get(
    '/my-approval-history',
    authorizeRoles('admin', 'manager'),
    reimbursementController.getApprovalHistory
);


module.exports = router;