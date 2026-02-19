const { IssueType } = require('../models'); // Assuming your IssueType model

exports.getAllIssueTypes = async (req, res) => {
    try {
        const issueTypes = await IssueType.findAll();
        res.status(200).json({ success: true, data: issueTypes });
    } catch (error) {
        console.error('Error fetching issue types:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// You'll need to add createIssueType, updateIssueType, deleteIssueType later
exports.createIssueType = (req, res) => { res.status(501).json({ message: 'Not Implemented' }); };
exports.updateIssueType = (req, res) => { res.status(501).json({ message: 'Not Implemented' }); };
exports.deleteIssueType = (req, res) => { res.status(501).json({ message: 'Not Implemented' }); };