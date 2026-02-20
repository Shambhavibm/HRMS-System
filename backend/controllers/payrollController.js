const { User, SalaryStructure } = require('../models');
const { Op } = require('sequelize');

/**
 * Search for employees to manage their payroll.
 * Accessible by: Admin
 */
exports.searchEmployees = async (req, res) => {
    const { searchTerm } = req.query;
    const { organization_id } = req.user;

    if (!searchTerm) {
        return res.status(400).json({ message: 'Search term is required.' });
    }

    try {
        const users = await User.findAll({
            where: {
                organization_id,
                [Op.or]: [
                    { first_name: { [Op.like]: `%${searchTerm}%` } },
                    { last_name: { [Op.like]: `%${searchTerm}%` } },
                    { official_email_id: { [Op.like]: `%${searchTerm}%` } },
                ],
                // Optionally exclude admins from the search results
                role: { [Op.ne]: 'admin' }
            },
            attributes: ['user_id', 'first_name', 'last_name', 'official_email_id', 'designation'],
            // The `include` will now work because SalaryStructure is a known model
            include: [{
                model: SalaryStructure,
                as: 'SalaryStructure',
                attributes: ['structure_id', 'ctc', 'is_active'],
                required: false // Use `required: false` for a LEFT JOIN to include users even if they don't have a salary structure yet
            }]
        });

        if (users.length === 0) {
            return res.json({ message: 'No results found.', data: [] });
        }

        res.json(users);

    } catch (error) {
        // This will now provide more detailed errors if there's an issue with the model associations
        console.error('Error searching employees for payroll:', error);
        res.status(500).json({ message: 'Server error while searching employees.' });
    }
};


/**
 * @desc Create or Update a salary structure for a user using dynamic components.
 * @route POST /api/payroll/structure/:userId
 * @access Admin
 */
exports.createOrUpdateSalaryStructure = async (req, res) => {
    const { userId: targetUserId } = req.params;
    const { organization_id, userId: adminUserId } = req.user;
    // The payload now contains `component_values` instead of individual fields
    const { ctc, effective_date, component_values } = req.body;

    if (!ctc || !effective_date || !component_values) {
        return res.status(400).json({ message: 'CTC, Effective Date, and Component Values are required.' });
    }

    try {
        const targetUser = await User.findOne({ where: { user_id: targetUserId, organization_id } });
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found in your organization.' });
        }

        const existingStructure = await SalaryStructure.findOne({ where: { user_id: targetUserId } });

        const payload = {
            ctc,
            effective_date,
            component_values, // The JSON object with component values
            organization_id,
            updated_by: adminUserId,
        };

        if (existingStructure) {
            // Logic to update revision history
            const oldStructureData = { ...existingStructure.get({ plain: true }) };
            delete oldStructureData.revision_history; // Exclude previous history from the new snapshot
            
            const revision_history = Array.isArray(existingStructure.revision_history) ? existingStructure.revision_history : [];
            revision_history.push({
                ...oldStructureData,
                updated_at_revision: new Date(),
                updated_by_revision: adminUserId,
            });
            payload.revision_history = revision_history;
            
            await existingStructure.update(payload);
            return res.status(200).json({ message: 'Salary structure updated successfully.', structure: existingStructure });

        } else {
            // Creating a new structure
            payload.user_id = targetUserId;
            payload.created_by = adminUserId;
            payload.revision_history = [];
            const newStructure = await SalaryStructure.create(payload);
            return res.status(201).json({ message: 'Salary structure created successfully.', structure: newStructure });
        }
    } catch (error) {
        console.error('Error in create/update salary structure:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Server error while managing salary structure.' });
    }
};

/**
 * @desc Get the salary structure for a user.
 * @route GET /api/payroll/structure/:userId
 * @access Admin, Manager (for their team), Member (for self)
 */
exports.getSalaryStructure = async (req, res) => {
    const { userId: targetUserId } = req.params;
    const { organization_id, userId: requesterId, role } = req.user;

    try {
        const targetUser = await User.findOne({ where: { user_id: targetUserId, organization_id } });
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // --- Role-Based Access Control (RBAC) ---
        if (role === 'member' && Number(targetUserId) !== requesterId) {
            return res.status(403).json({ message: 'Forbidden: You can only view your own salary details.' });
        }

        // --- CORRECTED LOGIC FOR MANAGER ---
        if (role === 'manager' && Number(targetUserId) !== requesterId) {
            // Check if the requester is the primary OR secondary manager of the target user
            if (targetUser.manager_id_primary !== requesterId && targetUser.manager_id_secondary !== requesterId) {
                return res.status(403).json({ message: 'Forbidden: You can only view your own salary or that of your direct reports.' });
            }
        }

        const structure = await SalaryStructure.findOne({ 
            where: { user_id: targetUserId, organization_id },
            include: [{
                model: User,
                attributes: ['first_name', 'last_name', 'official_email_id']
            }]
        });

        if (!structure) {
            return res.status(404).json({ message: 'Salary structure not found for this user.' });
        }

        res.json(structure);

    } catch (error) {
        console.error('Error fetching salary structure:', error);
        res.status(500).json({ message: 'Server error while fetching salary structure.' });
    }
};

/**
 * @desc Get all salary structures for the organization.
 * @route GET /api/payroll/structures/all
 * @access Admin
 */
exports.getAllSalaryStructures = async (req, res) => {
    const { organization_id } = req.user;

    try {
        const structures = await SalaryStructure.findAll({
            where: { organization_id },
            include: [{
                model: User,
                attributes: ['user_id', 'first_name', 'last_name', 'official_email_id', 'designation']
            }],
            order: [['updatedAt', 'DESC']]
        });

        res.json(structures);
    } catch (error) {
        console.error('Error fetching all salary structures:', error);
        res.status(500).json({ message: 'Server error while fetching salary structures.' });
    }
};

/**
 * @desc Get all employees with their salary structure for the organization, with pagination and search.
 * @route GET /api/payroll/employees/all
 * @access Admin
 */
exports.getAllEmployeesWithSalary = async (req, res) => {
    // 1. Get query parameters with defaults
    const { page = 1, limit = 15, searchTerm = '' } = req.query; // Default to 15 records per page
    const { organization_id } = req.user;

    // 2. Calculate offset for the database query
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 3. Build the where clause for searching
    const whereClause = {
        organization_id,
        role: { [Op.ne]: 'admin' }
    };

    if (searchTerm) {
        whereClause[Op.or] = [
            { first_name: { [Op.like]: `%${searchTerm}%` } },
            { last_name: { [Op.like]: `%${searchTerm}%` } },
            { official_email_id: { [Op.like]: `%${searchTerm}%` } }
        ];
    }

    try {
        // 4. Use findAndCountAll for pagination
        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            attributes: ['user_id', 'first_name', 'last_name', 'official_email_id', 'designation'],
            include: [{
                model: SalaryStructure,
                as: 'SalaryStructure',
                required: false // LEFT JOIN to include users without a salary structure
            }],
            order: [['first_name', 'ASC']],
            distinct: true // Important for correct counts with includes
        });

        // 5. Send a structured response with pagination data
        res.json({
            totalRecords: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            employees: rows
        });

    } catch (error) {
        console.error('Error fetching all employees with salary:', error);
        res.status(500).json({ message: 'Server error while fetching employee data.' });
    }
};