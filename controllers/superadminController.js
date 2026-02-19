/**
 * © 2023–Present Vipra Software Private Limited
 * Product: VipraGo :  Next-Gen Talent & Workflow Orchestrator.
 * Description: Streamline. Simplify. Scale. – That’s VipraGo.
 * Website: https://www.viprasoftware.com
 *
 * This source code is part of VipraGo and is owned by Vipra Software Private Limited.
 * Unauthorized use, duplication, or distribution is strictly prohibited.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // For comparing hardcoded hashed password

// --- FOR TESTING PURPOSES ONLY ---
// In a real application, superadmin credentials would be securely stored
// and managed, likely not hardcoded or in environment variables directly accessible.
const SUPERADMIN_USERNAME = process.env.SUPERADMIN_USERNAME || 'superadmin';
const SUPERADMIN_PASSWORD_HASH = process.env.SUPERADMIN_PASSWORD_HASH || '$2b$10$E0pe3QxcaZP5CzX5av0.aeLf6w0Q8NaBw.8lLcSW9yIZzJH/R0mOO'; // Hashed 'vipraadmin'
// You can generate this hash once: bcrypt.hash('vipraadmin', 10)
// --- END FOR TESTING PURPOSES ONLY ---


exports.superadminLogin = async (req, res) => {
  const { username, password } = req.body;

  console.log("DEBUG: Attempting superadmin login...");
  console.log("DEBUG: Username from request:", username);
  console.log("DEBUG: Password from request:", password); // For debugging only, don't log sensitive data in production!
  console.log("DEBUG: Expected username:", SUPERADMIN_USERNAME);
  console.log("DEBUG: Expected HASH from env/fallback:", SUPERADMIN_PASSWORD_HASH);


  if (username !== SUPERADMIN_USERNAME) {
    console.log("DEBUG: Username mismatch.");
    return res.status(401).json({ message: 'Invalid superadmin credentials.' });
  }

  // Compare the provided password with the hardcoded hashed password
  const isPasswordValid = await bcrypt.compare(password, SUPERADMIN_PASSWORD_HASH);

  if (!isPasswordValid) {
    console.log("DEBUG: Password hash comparison failed.");
    return res.status(401).json({ message: 'Invalid superadmin credentials.' });
  }
  console.log("DEBUG: Superadmin credentials VALID.");
  // If credentials are valid, generate a specific JWT for the superadmin
  const superadminToken = jwt.sign(
    {
      userId: 'superadmin_id', // A unique ID for the superadmin
      username: SUPERADMIN_USERNAME,
      role: 'superadmin', // Assign a 'superadmin' role
    },
    process.env.JWT_SECRET, // Use your existing JWT secret
    { expiresIn: '1h' } // Token valid for 1 hour
  );

  res.json({ token: superadminToken, message: 'Superadmin login successful.' });
};