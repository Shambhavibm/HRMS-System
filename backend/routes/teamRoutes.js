const express = require('express');
const router = express.Router();
const controller = require('../controllers/teamController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRoles('admin'), controller.createTeam);
router.post('/:teamId/members', authenticateToken, authorizeRoles('admin'), controller.assignMembers);

router.get('/teams', authenticateToken, authorizeRoles('admin'), controller.getAllTeams);
// to get manager team to calendar event
router.get('/my-teams', authenticateToken, authorizeRoles('manager'), controller.getTeamsManagedByMe);
router.get('/', authenticateToken, authorizeRoles('admin','manager'), controller.getAllTeams);
router.patch('/:id', authenticateToken, authorizeRoles('admin'), controller.updateTeam);
// Add this line near your other routes, **BEFORE** routes with dynamic params to avoid conflicts
router.get('/:id', authenticateToken, authorizeRoles('admin', 'manager'), controller.getTeamById);

module.exports = router;
