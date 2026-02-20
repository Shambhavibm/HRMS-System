// backend/routes/assetRoutes.js
const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authenticateToken);

// --- General & Cross-Role Routes ---
router.get('/categories', authorizeRoles('admin', 'manager', 'member'), assetController.getAssetCategories);
// ✅ NEW: Route for fetching office locations, accessible by all roles for forms.
router.get('/locations', authorizeRoles('admin', 'manager', 'member'), assetController.getOfficeLocations);


// --- Admin: Category Management ---
router.post('/categories', authorizeRoles('admin'), assetController.addAssetCategory);
router.put('/categories/:id', authorizeRoles('admin'), assetController.updateAssetCategory);


// --- Member & Manager: Asset Requests & Assignments ---
router.post('/requests/submit', authorizeRoles('member', 'manager'), upload.single('document'), assetController.submitAssetRequest);
router.get('/requests/my-requests', authorizeRoles('member', 'manager'), assetController.getMyAssetRequests);
router.get('/my-assigned-assets', authorizeRoles('member', 'manager'), assetController.getMyAssignedAssets);
router.post('/assignments/acknowledge/:id', authorizeRoles('member', 'manager', 'admin'), assetController.acknowledgeAssetReceipt);


// --- Manager & Admin: Approvals ---
router.get('/requests/pending-approvals', authorizeRoles('admin', 'manager'), assetController.getPendingApprovals);
router.post('/requests/approve/:id', authorizeRoles('admin', 'manager'), assetController.approveAssetRequest);
router.post('/requests/reject/:id', authorizeRoles('admin', 'manager'), assetController.rejectAssetRequest);
router.get('/requests/my-approval-history', authorizeRoles('admin', 'manager'), assetController.getAssetApprovalHistory);


// --- Admin: Inventory & Fulfillment ---
router.get('/requests/all', authorizeRoles('admin'), assetController.getAllAssetRequests);
router.get('/inventory/all', authorizeRoles('admin'), assetController.getAllAssets);
router.post('/inventory/add', authorizeRoles('admin'), assetController.addAsset);
router.put('/inventory/update/:id', authorizeRoles('admin'), assetController.updateAsset);
router.get('/inventory/stock', authorizeRoles('admin'), assetController.getAssetStock);
router.post('/inventory/stock/add', authorizeRoles('admin'), assetController.addAssetStock);
router.get('/requests/assigned-for-fulfillment', authorizeRoles('admin'), assetController.getAssignedFulfillmentRequests);
router.post('/requests/fulfill/:id', authorizeRoles('admin'), assetController.fulfillAssetRequest);
router.post('/requests/mark-awaiting-procurement/:id', authorizeRoles('admin'), assetController.markAwaitingProcurement);
router.get('/clearance/pending', authorizeRoles('admin'), assetController.getPendingClearanceRequests);
router.post('/clearance/process-return/:id', authorizeRoles('admin'), assetController.processAssetReturn);

module.exports = router;