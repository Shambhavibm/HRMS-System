const { StatusMaster } = require('../models'); // Assuming your StatusMaster model

exports.getAllStatuses = async (req, res) => {
    try {
        const statuses = await StatusMaster.findAll({
            order: [['order_index', 'ASC']] // Order by a numeric index if you have one
        });
        res.status(200).json({ success: true, data: statuses });
    } catch (error) {
        console.error('Error fetching statuses:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// You'll need to add createStatus, updateStatus, deleteStatus later
exports.createStatus = (req, res) => { res.status(501).json({ message: 'Not Implemented' }); };
exports.updateStatus = (req, res) => { res.status(501).json({ message: 'Not Implemented' }); };
exports.deleteStatus = (req, res) => { res.status(501).json({ message: 'Not Implemented' }); };