const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const costController = require('../controllers/projectCostController'); 

router.get('/cost-history', authenticateToken, costController.getCostHistory);                 
router.get("/summary/grouped", authenticateToken, costController.getCostSummary);
router.get("/dashboard/cost-summary", authenticateToken, costController.getCostSummary);
router.post('/projects/:id/costs', authenticateToken, costController.addCostEntry);
router.put("/projects/:cost_id/cost-entry", authenticateToken, costController.updateCostEntry);

module.exports = router;
