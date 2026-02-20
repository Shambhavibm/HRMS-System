// backend/routes/assetRoutes.js
const express = require('express');
const router = express.Router();
const assetController = require('../controllers/role_assetController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Assuming you have this middleware for file uploads

// Apply authentication middleware to all routes in this file
router.use(authenticateToken);

// --- Public (All Roles) Access ---
// Get all asset categories (for dropdowns in forms)
router.get('/categories', authorizeRoles('admin', 'manager', 'member', 'resource_department'), assetController.getAssetCategories);

// --- Member & Manager Routes ---
// Submit a new asset request (can include an optional file upload)
router.post(
    '/requests/submit',
    authorizeRoles('member', 'manager'),
    upload.single('document'), // 'document' should match the FormData key for supporting docs (e.g., damaged item photo)
    assetController.submitAssetRequest
);
// Get an employee's own asset requests history
router.get('/requests/my-requests', authorizeRoles('member', 'manager'), assetController.getMyAssetRequests);
// Get assets currently assigned to the logged-in user
router.get('/my-assigned-assets', authorizeRoles('member', 'manager'), assetController.getMyAssignedAssets);


// --- Manager & Admin Routes (Approvals) ---
// Get pending asset requests for approval (manager sees their team, admin sees all pending admin)
router.get('/requests/pending-approvals', authorizeRoles('admin', 'manager'), assetController.getPendingApprovals);
// Approve an asset request
router.post('/requests/approve/:id', authorizeRoles('admin', 'manager'), assetController.approveAssetRequest);
// Reject an asset request
router.post('/requests/reject/:id', authorizeRoles('admin', 'manager'), assetController.rejectAssetRequest);
// Get approval history for asset requests made by the current manager/admin
router.get('/requests/my-approval-history', authorizeRoles('admin', 'manager'), assetController.getAssetApprovalHistory);


// --- Admin Routes (Overview & Management) ---
// Get all asset requests (for admin to see everything)
router.get('/requests/all', authorizeRoles('admin'), assetController.getAllAssetRequests);
// Get all assets in the inventory
router.get('/inventory/all', authorizeRoles('admin', 'resource_department'), assetController.getAllAssets);


// --- Resource Department Routes (Fulfillment & Inventory Management) ---
// Add a new asset to the inventory
router.post('/inventory/add', authorizeRoles('admin', 'resource_department'), assetController.addAsset);
// Update an existing asset in the inventory
router.put('/inventory/update/:id', authorizeRoles('admin', 'resource_department'), assetController.updateAsset);
// Get asset requests assigned to this resource department member for fulfillment
router.get('/requests/assigned-for-fulfillment', authorizeRoles('resource_department'), assetController.getAssignedFulfillmentRequests);
// Fulfill an asset request (assigns an asset from inventory)
router.post('/requests/fulfill/:id', authorizeRoles('resource_department'), assetController.fulfillAssetRequest);
// Mark an asset request as awaiting procurement
router.post('/requests/mark-awaiting-procurement/:id', authorizeRoles('resource_department'), assetController.markAwaitingProcurement);
// Get requests for asset clearance (exit flow)
router.get('/clearance/pending', authorizeRoles('resource_department'), assetController.getPendingClearanceRequests);
// Process asset return during exit (updates asset and assignment records)
router.post('/clearance/process-return/:id', authorizeRoles('resource_department'), assetController.processAssetReturn);

module.exports = router;