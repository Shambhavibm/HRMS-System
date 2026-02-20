const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // For comparing hardcoded hashed password


const SUPERADMIN_USERNAME = process.env.SUPERADMIN_USERNAME || 'superadmin';
const SUPERADMIN_PASSWORD_HASH = process.env.SUPERADMIN_PASSWORD_HASH || '$2b$10$E0pe3QxcaZP5CzX5av0.aeLf6w0Q8NaBw.8lLcSW9yIZzJH/R0mOO'; // Hashed 'vipraadmin'


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