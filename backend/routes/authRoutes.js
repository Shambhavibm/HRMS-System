const express = require('express');
const router = express.Router();

const { onboardOrganizationAndAdmin } = require('../controllers/onboardingController');
const { loginUser } = require('../controllers/loginController');
const { resetPassword } = require('../controllers/resetPasswordController');
const { logoutUser } = require('../controllers/logoutController');
const { createLead } = require("../controllers/leadCustomerPortalController");
const { superadminLogin } = require('../controllers/superadminController'); // NEW

// --- Public Routes (No Auth Required) ---

// Superadmin Login (for the temporary UI)
router.post('/superadmin-login', superadminLogin); // NEW ROUTE

// Superadmin Onboarding (initial organization setup) - This route will be called by the Superadmin UI
router.post('/onboard-organization', onboardOrganizationAndAdmin);

// User Login (for regular org users)
router.post('/signin', loginUser);

// Password Reset/Initial Setup (uses invite_token)
router.post('/reset-password', resetPassword);

// Lead Customer Portal (as it was)
router.post("/lead-customer", createLead);

// Logout (might need auth depending on implementation, but often public for token clear)
router.post('/logout', logoutUser);

module.exports = router;