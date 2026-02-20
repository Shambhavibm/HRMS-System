const bcrypt = require('bcryptjs'); // Ensure bcryptjs is used
const jwt = require('jsonwebtoken');
const { User, Organization } = require('../models'); // Import User and Organization models

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      where: { official_email_id: email, deleted_at: null }, // Ensure user is not soft-deleted
      include: [{ // Eager load organization details if needed in JWT or dashboard setup
        model: Organization,
        as: 'organization',
        attributes: ['name', 'organization_id'] // Only fetch necessary org details
      }]
    });

    if (!user) {
      console.log("Login attempt: User not found for email:", email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if the user's status allows login
    if (user.status === 'invited') {
        return res.status(403).json({ message: 'Your account is pending setup. Please check your email for the password setup link.' });
    }
    if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Your account has been suspended. Please contact your administrator.' });
    }

    // Compare the provided password with the hashed password
    if (!(await user.comparePassword(password))) { // Use the instance method
      console.log("Login attempt: Password mismatch for user:", email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT with crucial information for multitenancy and RBAC
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.official_email_id,
        organization_id: user.organization_id, // CRUCIAL for data isolation
        role: user.role,                     // CRUCIAL for RBAC
        organization_name: user.organization ? user.organization.name : null // Include organization name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Set a reasonable expiry (e.g., 8 hours)
    );

    res.json({ token, message: 'Login successful' });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: 'Internal server error during login' });
  }
};