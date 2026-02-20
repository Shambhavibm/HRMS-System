/*
================================================================================
 FILE: /backend/middleware/authMiddleware.js (CONSOLIDATED & REFINED)
================================================================================
 PURPOSE: This is now your SINGLE source of truth for backend authentication.
          Replace your existing authMiddleware.js with this.
*/

const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate a token from the Authorization header.
 * This should be the FIRST middleware in any protected route chain.
 */
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Normalize token fields to expected controller format
    req.user = {
      user_id: decoded.userId || decoded.user_id,          // map to user_id
      organization_id: decoded.organization_id,
      role: decoded.role,
      email: decoded.email,
      ...decoded // (optional) preserve extra fields
    };

    // Sanity check
    if (!req.user.user_id || !req.user.organization_id) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token payload.' });
    }

    next(); // ✅ Valid token, move to controller
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access Denied: Token has expired.' });
    }
    return res.status(403).json({ message: 'Forbidden: Invalid token.' });
  }
};

/**
 * Middleware to authorize users based on their role.
 */
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      // This error should ideally be caught by authenticateToken, but acts as a safeguard.
      return res.status(401).json({ message: 'Unauthorized: User role not found in token.' });
    }

    const userRole = req.user.role;
    // Convert user's role to lowercase for case-insensitive comparison
    const lowerCaseUserRole = userRole.toLowerCase();
    // Ensure allowedRoles are also converted to lowercase for comparison
    const lowerCaseAllowedRoles = allowedRoles.map(role => role.toLowerCase());

    const hasPermission = lowerCaseAllowedRoles.includes(lowerCaseUserRole);

    if (hasPermission) {
      next(); // ✅ User role is allowed
    } else {
      res.status(403).json({ message: 'Forbidden: You do not have the required permissions.' });
    }
  };
};
