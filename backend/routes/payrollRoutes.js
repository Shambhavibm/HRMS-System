const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const payrollComponentController = require('../controllers/payrollComponentController'); // ✨ NEW


// Mount authentication middleware for all payroll routes.
// This is a clean way to ensure every route in this file is authenticated.
router.use(authenticateToken);

// --- Admin Routes ---

// GET /api/payroll/search-employees
// ✅ FIXED: Removed 'payroll/' prefix and added a leading slash for clarity.
router.get('/search-employees', authorizeRoles('admin'), payrollController.searchEmployees);

// POST /api/payroll/structure/:userId
// ✅ FIXED: Removed implicit relative path.
router.post('/structure/:userId', authorizeRoles('admin'), payrollController.createOrUpdateSalaryStructure);

// GET /api/payroll/structures/all
// ✅ FIXED: This route was correct, but added slash for consistency.
router.get('/structures/all', authorizeRoles('admin'), payrollController.getAllSalaryStructures);


// --- Shared Routes (RBAC handled in controller or by roles) ---

// GET /api/payroll/structure/:userId
// This allows an admin, manager, or the specific member to view a salary structure.
// ✅ FIXED: Removed implicit relative path.
router.get('/structure/:userId', authorizeRoles('admin', 'manager', 'member'), payrollController.getSalaryStructure);


router.get('/employees/all', authorizeRoles('admin'), payrollController.getAllEmployeesWithSalary);

// ✨ --- NEW Routes for Salary Component Management --- ✨
router.route('/components')
    .get(authorizeRoles('admin', 'manager', 'member'), payrollComponentController.getAllComponents)
    .post(authorizeRoles('admin'), payrollComponentController.createComponent)

router.route('/components/:id')
    .delete(authorizeRoles('admin'), payrollComponentController.deleteComponent);


module.exports = router;
