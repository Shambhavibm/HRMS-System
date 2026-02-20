const { leave_type_setting } = require('../models');

exports.getLeaveSettings = async (req, res) => {
  try {
    const orgId = req.user.organization_id;  // Ensure auth middleware sets this
    const settings = await leave_type_setting.findAll({ where: { organization_id: orgId } });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch leave settings.' });
  }
};

exports.updateLeaveSetting = async (req, res) => {
  try {
    await leave_type_setting.update(req.body, {
      where: { id: req.params.id, organization_id: req.user.organization_id }
    });
    res.json({ message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Unable to update leave setting.' });
  }
};

exports.addLeaveSetting = async (req, res) => {
  try {
    const newLeave = await leave_type_setting.create({
      ...req.body,
      organization_id: req.user.organization_id
    });
    res.status(201).json(newLeave);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to add leave setting.' });
  }
};

exports.deleteLeaveSetting = async (req, res) => {
  try {
    const deleted = await leave_type_setting.destroy({
      where: {
        id: req.params.id,
        organization_id: req.user.organization_id
      }
    });
    res.json({ success: deleted > 0 });
  } catch (error) {
    res.status(500).json({ error: 'Unable to delete leave setting.' });
  }
};
