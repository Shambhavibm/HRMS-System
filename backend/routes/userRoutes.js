const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middleware/uploadMiddleware');
const { getPaginatedUsers } = require('../controllers/userController');
// --- Import the CORRECT and FINAL authentication middleware ---
// We only need authenticateToken and authorizeRoles from here now.
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// --- Import controllers ---
const { inviteUserByAdmin, getOrganizationUsers } = require('../controllers/userManagementController');
const { optional_leave_booking, Holiday, User } = require('../models');

/*
================================================================================
  USER & PROFILE ROUTES
================================================================================
*/

// 🔐 Invite user (Admin Only)
router.post('/invite', authenticateToken, authorizeRoles('admin'), inviteUserByAdmin);

// 👥 Get all users in the organization (Admin & Manager)
router.get('/', authenticateToken, authorizeRoles('admin', 'manager','member'), getOrganizationUsers);
// NEW route — for paginated frontend tables
router.get('/', authenticateToken, authorizeRoles('admin', 'manager'), getPaginatedUsers);
// 👤 Get the currently logged-in user's own profile
router.get('/profile', authenticateToken, userController.getMyProfile);

// 👤 Get a specific user's profile by their ID (accessible by any authenticated user)
// The controller should have logic to restrict what data is returned based on role.
router.get('/profile/:id', authenticateToken, userController.getUserProfileById);

// ✏️ Update a user's profile by their ID
// An admin should be able to update anyone. A user should only be able to update their own.
// This logic belongs in the userController.updateUserProfile function.
router.put('/profile/:id', authenticateToken, userController.updateUserProfile);

// 🖼️ Upload a profile picture for a specific user ID
router.post(
    "/profile/:id/upload-picture", // Using a more descriptive route
    authenticateToken,
    upload.single("image"), 
    userController.uploadProfilePicture
);

/*
================================================================================
  ADMINISTRATIVE ROUTES
================================================================================
*/

// 👑 Assign a user to the 'manager' role (Admin Only)
// This is the PATCH route that was causing the crash.
// ✅ FIXED: Using authorizeRoles('admin') instead of the old authenticateAdmin.
router.patch(
  '/assign-managers/:user_id',
  authenticateToken,
  authorizeRoles('admin'), // The new, correct way to protect admin routes
  userController.assignManagers // This will now work after you export it from the controller
);

/*
================================================================================
  TEAM MEMBERS ROUTES USED IN PAYROLL COMPONENTS
================================================================================
*/

router.get('/my-team', authenticateToken, authorizeRoles('manager'), userController.getManagerTeam);

// optional leave routes
router.get("/me/optional-bookings", authenticateToken, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(400).json({ error: "User ID missing from token." });
  }

  try {
    const bookings = await optional_leave_booking.findAll({
      where: { user_id: userId },
      include: [
        { model: Holiday, as: "holiday" },
        { model: User, as: "employee" },
      ],
    });
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching optional bookings:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
