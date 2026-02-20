const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); // <-- Corrected import
const issueTypeController = require('../controllers/issueTypeController');
const statusMasterController = require('../controllers/statusMasterController');

router.use(authenticateToken);

// Issue Type Routes (Admin Only for CUD, All for R)
router.get('/issue-types', authorizeRoles(['admin', 'manager', 'member']), issueTypeController.getAllIssueTypes); // <-- Changed to authorizeRoles
router.post('/issue-types', authorizeRoles(['admin']), issueTypeController.createIssueType); // <-- Changed to authorizeRoles
router.put('/issue-types/:id', authorizeRoles(['admin']), issueTypeController.updateIssueType); // <-- Changed to authorizeRoles
router.delete('/issue-types/:id', authorizeRoles(['admin']), issueTypeController.deleteIssueType); // <-- Changed to authorizeRoles

// Status Master Routes (Admin Only for CUD, All for R)
router.get('/statuses', authorizeRoles(['admin', 'manager', 'member']), statusMasterController.getAllStatuses); // <-- Changed to authorizeRoles
router.post('/statuses', authorizeRoles(['admin']), statusMasterController.createStatus); // <-- Changed to authorizeRoles
router.put('/statuses/:id', authorizeRoles(['admin']), statusMasterController.updateStatus); // <-- Changed to authorizeRoles
router.delete('/statuses/:id', authorizeRoles(['admin']), statusMasterController.deleteStatus); // <-- Changed to authorizeRoles

module.exports = router;