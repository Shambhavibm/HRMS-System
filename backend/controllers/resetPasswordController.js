const { User } = require('../models'); // Correctly imports the initialized User model from backend/models/index.js
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize'); // <--- ADD THIS LINE TO IMPORT OPERATORS

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body; // 'token' here is your invite_token

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  try {
    // 1. Find the user by the invite_token and check if it's expired
    const user = await User.findOne({
      where: { // In Sequelize, use 'where' for conditions
        invite_token: token,
        temp_password_expires: { // Check if the token is still valid
          [Op.gt]: new Date() // <--- USE Op.gt directly after importing Op
        }
      }
    });

    if (!user) {
      console.log("❌ Password reset error: Invalid or expired token provided.");
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10); // Using 10 salt rounds

    // 3. Update the user's password_hash and clear the token fields
    user.password_hash = hashedPassword; // Use 'password_hash' as per your model
    user.invite_token = null;           // Clear the token by setting to null
    user.temp_password_expires = null;  // Clear the expiry
    user.status = 'active';             // Set status to active after password reset
    await user.save(); // Save the changes to the database

    res.status(200).json({ message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error("❌ Password reset error:", error);
    res.status(500).json({ message: 'An error occurred during password reset. Please try again later.' });
  }
};