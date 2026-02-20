const { User } = require("../models");
const path = require('path');
const { Op } = require('sequelize');


// 1️⃣ Get full user profile
exports.getUserProfileById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findOne({
      where: { user_id: id, deleted_at: null },
      attributes: { exclude: ['password_hash', 'invite_token', 'temp_password_expires'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
     // Convert to plain object
    const userData = user.get({ plain: true });
    
    // Safely build full image URL if needed
    if (userData.profile_picture_url) {
      const viteApiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:5001/api'; 
      const staticFilesBaseUrl = viteApiBaseUrl.replace('/api', '');
      userData.profile_picture_url = `${staticFilesBaseUrl}/${userData.profile_picture_url}`;
    
    }

    res.json(userData);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// 3️⃣ Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  const imageUrl = `uploads/${req.file.filename}`;

  try {
    await User.update(
      { profile_picture_url: imageUrl },
      { where: { user_id: id } }
    );

    res.json({ message: 'Profile picture uploaded', imageUrl });
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 2️⃣ Update user profile (any section — personal, emergency, etc.)
exports.updateUserProfile = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const [rowsAffected] = await User.update(updateData, {
      where: { user_id: id },
    });

    if (rowsAffected === 0) {
      return res.status(404).json({ message: 'User not found or update failed' });
    }

    res.json({ message: 'User profile updated successfully' });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// to  get  manager name in projectassignment page
// Enhance Existing Get All Users Controller:
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['user_id', 'first_name', 'last_name', 'manager_id_primary', 'manager_id_secondary'],
      include: [
        { model: User, as: 'PrimaryManager', attributes: ['first_name', 'last_name'] },
        { model: User, as: 'SecondaryManager', attributes: ['first_name', 'last_name'] }
      ]
    });

    const enrichedUsers = users.map(user => ({
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      manager_id_primary: user.manager_id_primary,
      manager_id_secondary: user.manager_id_secondary,
      PrimaryManagerName: user.PrimaryManager ? `${user.PrimaryManager.first_name} ${user.PrimaryManager.last_name}` : null,
      SecondaryManagerName: user.SecondaryManager ? `${user.SecondaryManager.first_name} ${user.SecondaryManager.last_name}` : null,
    }));

    res.json({ users: enrichedUsers });
  } catch (err) {
    console.error('Error fetching users with managers:', err);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};


const { LeaveCarryforward } = require('../models');

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        user_id: req.user.userId,
        organization_id: req.user.organization_id,
        deleted_at: null,
      },
      attributes: { exclude: ['password_hash', 'invite_token', 'temp_password_expires'] }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // ✅ Get carryforwards for previous year
    const currentYear = new Date().getFullYear();
    const carryforwards = await LeaveCarryforward.findAll({
      where: {
        employee_id: req.user.userId,
        year: currentYear - 1
      }
    });

    const response = {
      ...user.get({ plain: true }),
      carryforwards
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
};


exports.assignManagers = async (req, res) => {
  try {
    const { user_id } = req.params;
    // ✅ CORRECTLY read both potential managers from the request body.
    const { manager_id_primary, manager_id_secondary } = req.body;

    // Find the employee to be updated
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // ✅ DIRECTLY update the user with the provided data.
    // If the frontend sends `null` for a manager, the database field will be set to NULL.
    // If it sends a valid ID, the field will be updated with that ID.
    const [updateCount] = await User.update(
      {
        manager_id_primary: manager_id_primary,
        manager_id_secondary: manager_id_secondary,
      },
      {
        where: { user_id: user_id },
      }
    );

    if (updateCount > 0) {
        res.status(200).json({ message: 'Manager(s) assigned successfully.' });
    } else {
        // This case is unlikely but good practice to handle.
        res.status(200).json({ message: 'No changes were made to the assigned managers.' });
    }

  } catch (err) {
    console.error("Assign manager error:", err);
    res.status(500).json({ error: 'Failed to assign manager.' });
  }
};

// ✨ ADD THIS NEW FUNCTION ✨
// @desc    Get team members for the logged-in manager
// @route   GET /api/users/my-team
// @access  Manager

exports.getManagerTeam = async (req, res) => {
    try {
        const managerId = req.user.userId;
        const { organization_id } = req.user;

        const teamMembers = await User.findAll({
            where: {
                organization_id,
                // Find users whose primary or secondary manager is the current user
                [Op.or]: [
                    { manager_id_primary: managerId },
                    { manager_id_secondary: managerId }
                ]
            },
            attributes: ['user_id', 'first_name', 'last_name', 'official_email_id', 'designation']
        });

        res.json(teamMembers);

    } catch (error) {
        console.error('Error fetching manager team:', error);
        res.status(500).json({ message: 'Failed to fetch team members.' });
    }
};


exports.getPaginatedUsers = async (req, res) => {
  const { page = 1, limit = 10, searchTerm = '' } = req.query;
  const offset = (page - 1) * limit;

  try {
    const whereClause = {
      deleted_at: null,
      role: 'member',
    };

    if (searchTerm) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${searchTerm}%` } },
        { last_name: { [Op.like]: `%${searchTerm}%` } },
        { official_email_id: { [Op.like]: `%${searchTerm}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
      attributes: ['user_id', 'first_name', 'last_name', 'official_email_id']
    });

    res.status(200).json({
      users: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('❌ Error fetching paginated users:', error);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};
