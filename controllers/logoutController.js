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

exports.logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err.message || err);
    return res.status(400).json({ message: 'Invalid or expired token on logout' });
  }
};
