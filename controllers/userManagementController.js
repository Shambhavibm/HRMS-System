/**
 * © 2023–Present Vipra Software Private Limited
 * Product: VipraGo :  Next-Gen Talent & Workflow Orchestrator.
 * Description: Streamline. Simplify. Scale. – That’s VipraGo.
 * Website: https://www.viprasoftware.com
 *
 * This source code is part of VipraGo and is owned by Vipra Software Private Limited.
 * Unauthorized use, duplication, or distribution is strictly prohibited.
 */

const { User, Organization } = require('../models');
const { Op } = require('sequelize'); 
const jwt = require('jsonwebtoken');
const { sendResetEmail } = require('../utils/emailService');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Helper function to generate a secure random token
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to generate a temporary password (for initial admin setup)
function generateTempPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

exports.inviteUserByAdmin = async (req, res) => {
  // req.user will be populated by the authenticateToken middleware
  const { organization_id, role: adminRole } = req.user; // Get org_id from the admin's JWT

  // Only 'admin' users can invite new users
  if (adminRole !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Only organization administrators can invite users.' });
  }

  const {
    first_name,
    last_name,
    official_email_id,
    role // 'member' or 'manager'
  } = req.body;

  // Basic validation
  if (!first_name || !last_name || !official_email_id || !role) {
    return res.status(400).json({ message: 'Missing required user details.' });
  }
  if (!['member', 'manager'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified. Must be "member" or "manager".' });
  }

  try {
    // Check if a user with this email already exists within this organization
    const existingUser = await User.findOne({
      where: {
        official_email_id: official_email_id,
        organization_id: organization_id, // Crucial for unique email within org (if not globally unique)
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists in this organization.' });
    }

    // Generate an invitation token for the new user
    const invitationToken = generateSecureToken();
    const inviteExpiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Token expires in 2 days

    // Hash a placeholder password (user will set their real password via the link)
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await User.create({
      organization_id: organization_id, // Assign to the admin's organization
      first_name,
      last_name,
      official_email_id,
      role,
      password_hash: hashedPassword, // Store hashed temporary password
      invite_token: invitationToken,
      temp_password_expires: inviteExpiresAt,
      status: 'invited', // Mark as invited
      created_at: new Date(),
      updated_at: new Date()
      // Other optional fields can be left null or handled via a separate "edit profile" endpoint
    });

    // Send invitation email to the new user
    const setupPasswordLink = `${process.env.BASE_URL}/reset-password?token=${invitationToken}`;
    await sendResetEmail(official_email_id, setupPasswordLink, first_name);

    res.status(201).json({
      message: 'User invited successfully. Password setup link sent to their email.',
      user_id: newUser.user_id
    });

  } catch (err) {
    console.error("❌ Error inviting user:", err);
    if (err.name === 'SequelizeUniqueConstraintError' && err.fields.official_email_id) {
        return res.status(409).json({ message: 'A user with this email already exists globally.' });
    }
    res.status(500).json({ message: 'Error inviting user. Please try again.' });
  }
};


// Example: Get all users for the current organization (for dashboard/user list)
exports.getOrganizationUsers = async (req, res) => {
  const { organization_id, role } = req.user;

  // Define what roles can view all users
  // --- FIXED: Added 'member' to the allowed roles list ---
  if (!['admin', 'manager', 'member'].includes(role)) {
    return res.status(403).json({ message: 'Forbidden: You do not have permission to view all users.' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const searchTerm = req.query.searchTerm || '';

  try {
    const whereCondition = {
      organization_id,
      deleted_at: null,
      [Op.or]: [
        { first_name: { [Op.like]: `%${searchTerm}%` } },
        { last_name: { [Op.like]: `%${searchTerm}%` } },
         { official_email_id: { [Op.like]: `%${searchTerm}%` } },
        { official_email_id: { [Op.like]: `%${searchTerm}%` } },
      ]
    };

    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: {
        exclude: ['password_hash', 'invite_token', 'temp_password_expires']
      },
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['name']
      }]
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      users: rows,
      currentPage: page,
      totalPages,
    });

  } catch (err) {
    console.error("❌ Error fetching paginated organization users:", err);
    res.status(500).json({ message: 'Error fetching users.' });
  }
};
