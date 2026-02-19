const { SalaryComponent } = require('../models');

// @desc    Get all salary components for the logged-in user's organization
// @route   GET /api/payroll/components
// @access  Admin
exports.getAllComponents = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const components = await SalaryComponent.findAll({
            where: { organization_id },
            order: [['type', 'ASC'], ['name', 'ASC']]
        });
        res.json(components);
    } catch (error) {
        console.error('Error fetching salary components:', error);
        res.status(500).json({ message: 'Server error while fetching components.' });
    }
};

// @desc    Create a new salary component
// @route   POST /api/payroll/components
// @access  Admin
exports.createComponent = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const { name, type } = req.body;

        if (!name || !type) {
            return res.status(400).json({ message: 'Component name and type are required.' });
        }

        const newComponent = await SalaryComponent.create({
            organization_id,
            name,
            type
        });

        res.status(201).json(newComponent);
    } catch (error) {
        console.error('Error creating salary component:', error);
        res.status(500).json({ message: 'Server error while creating component.' });
    }
};

// @desc    Delete a salary component
// @route   DELETE /api/payroll/components/:id
// @access  Admin
exports.deleteComponent = async (req, res) => {
    try {
        const { organization_id } = req.user;
        const { id } = req.params;

        const component = await SalaryComponent.findOne({
            where: { component_id: id, organization_id }
        });

        if (!component) {
            return res.status(404).json({ message: 'Component not found.' });
        }
        
        if (component.is_system_defined) {
            return res.status(403).json({ message: 'Cannot delete a system-defined component.' });
        }

        await component.destroy();
        res.status(200).json({ message: 'Component deleted successfully.' });

    } catch (error) {
        console.error('Error deleting salary component:', error);
        res.status(500).json({ message: 'Server error while deleting component.' });
    }
};