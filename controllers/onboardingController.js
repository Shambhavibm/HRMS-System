/**
 * © 2023–Present Vipra Software Private Limited
 * Product: VipraGo :  Next-Gen Talent & Workflow Orchestrator.
 * Description: Streamline. Simplify. Scale. – That’s VipraGo.
 * Website: https://www.viprasoftware.com
 *
 * This source code is part of VipraGo and is owned by Vipra Software Private Limited.
 * Unauthorized use, duplication, or distribution is strictly prohibited.
 */

const { sequelize, Organization, User } = require('../models'); // Get models and sequelize instance
const jwt = require('jsonwebtoken');
const { sendResetEmail } = require('../utils/emailService'); // Your email utility
const crypto = require('crypto'); // For secure token generation
const bcrypt = require('bcryptjs'); // For initial temp password hashing

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

exports.onboardOrganizationAndAdmin = async (req, res) => {
  const {
    organization_name,
    organization_official_email,
    organization_phone_number,
    organization_website,
    organization_address_line1,
    organization_address_line2,
    organization_city,
    organization_state,
    organization_zip_code,
    organization_country,
    organization_industry_type,
    organization_company_size_range,
    admin_first_name,
    admin_last_name,
    admin_email // This is the official_email_id for the admin user
  } = req.body;

  // Input validation (basic example, expand as needed)
  if (!organization_name || !admin_email || !admin_first_name) {
    return res.status(400).json({ message: 'Missing required organization or admin details.' });
  }

  // Start a transaction to ensure atomicity
  const t = await sequelize.transaction();

  try {
    // 1. Create the Organization record
    const newOrg = await Organization.create({
      name: organization_name,
      official_email: organization_official_email,
      phone_number: organization_phone_number,
      website: organization_website,
      address_line1: organization_address_line1,
      address_line2: organization_address_line2,
      city: organization_city,
      state: organization_state,
      zip_code: organization_zip_code,
      country: organization_country,
      industry_type: organization_industry_type,
      company_size_range: organization_company_size_range,
      status: 'active', // Organization is active immediately upon onboarding
      // created_by_user_id: req.user.user_id, // If superadmin has a user_id
    }, { transaction: t });

    // 2. Create the initial Admin User record for this organization
    const invitationToken = generateSecureToken();
    const inviteExpiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Token expires in 2 days

    // Hash a placeholder password. The admin will set their real password via the link.
    // This is needed because 'password_hash' is NOT NULL in the schema.
    const tempPassword = generateTempPassword(); // A random temp password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const adminUser = await User.create({
      organization_id: newOrg.organization_id, // Link to the newly created organization
      first_name: admin_first_name,
      last_name: admin_last_name,
      official_email_id: admin_email,
      role: 'admin',
      password_hash: hashedPassword, // Store hashed temporary password
      invite_token: invitationToken, // Store the token for later verification
      temp_password_expires: inviteExpiresAt,
      status: 'invited', // User is in 'invited' state
      created_at: new Date(),
      updated_at: new Date()
      // Other user fields can be null initially, filled during first login or by admin
    }, { transaction: t });

    // Commit the transaction if both operations succeeded
    await t.commit();

    // 3. Send the invitation email (outside the transaction for reliability)
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${invitationToken}`; // Frontend route for reset
    await sendResetEmail(admin_email, resetLink, admin_first_name);

    res.status(201).json({
      message: 'Organization and initial admin user onboarded successfully. Invitation email sent.',
      organization_id: newOrg.organization_id,
      admin_user_id: adminUser.user_id
    });

  } catch (err) {
    await t.rollback(); // Rollback if any error occurs
    console.error("❌ Onboarding error:", err);

    let errorMessage = 'Error onboarding organization. Please try again.';
    if (err.name === 'SequelizeUniqueConstraintError') {
      if (err.fields.name) errorMessage = 'Organization name already exists.';
      else if (err.fields.official_email) errorMessage = 'Organization official email already exists.';
      else if (err.fields.official_email_id) errorMessage = 'Admin email is already in use by another user.';
    }

    res.status(500).json({ message: errorMessage });
  }
};