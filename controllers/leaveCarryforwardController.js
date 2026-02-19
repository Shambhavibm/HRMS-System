const { User, leave_type_setting, leave_requests, LeaveCarryforward } = require('../models');
const { Op } = require('sequelize');

exports.runCarryforward = async (req, res) => {
  try {
    const { year } = req.body;
    const organization_id = req.user.organization_id;

    if (!year || isNaN(year)) {
      return res.status(400).json({ error: 'Invalid or missing year.' });
    }

    // ✅ Include only members and managers
    const users = await User.findAll({
      where: {
        organization_id,
        role: { [Op.in]: ['member', 'manager'] },
        deleted_at: null
      }
    });

    const leaveTypes = await leave_type_setting.findAll({
      where: { organization_id, carry_forward: true }
    });

    const carryforwardData = [];

    for (const user of users) {
      for (const type of leaveTypes) {
        const used = await leave_requests.sum('total_days', {
          where: {
            employee_id: user.user_id,
            leave_type: type.type,
            status: 'Approved',
            start_date: {
              [Op.gte]: new Date(`${year}-01-01`),
              [Op.lte]: new Date(`${year}-12-31`)
            }
          }
        });

        const allowed = type.max_days_per_year;
        const remaining = Math.max(allowed - (used || 0), 0);

        if (remaining > 0) {
          carryforwardData.push({
            employee_id: user.user_id,
            leave_type: type.type,
            year: parseInt(year),
            carried_forward_days: remaining,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }

    await LeaveCarryforward.bulkCreate(carryforwardData);

    res.status(200).json({
      message: `Carryforward processed for year ${year}.`,
      records: carryforwardData.length
    });

  } catch (err) {
    console.error('Carryforward error:', err);
    res.status(500).json({ error: 'Failed to run leave carryforward.' });
  }
};

exports.getCarryforwardSummary = async (req, res) => {
  try {
    const { year } = req.query;
    const organization_id = req.user.organization_id;

    const records = await LeaveCarryforward.findAll({
      where: { year },
      include: [{
        model: User,
        as: 'employee',
        attributes: ['first_name', 'last_name', 'official_email_id'],
        where: { organization_id }
      }],
      order: [['leave_type', 'ASC']]
    });

    const result = records.map(r => ({
      employee_name: `${r.employee.first_name} ${r.employee.last_name}`,
      email: r.employee.official_email_id,
      leave_type: r.leave_type,
      year: r.year,
      carried_forward_days: r.carried_forward_days
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error('Error in getCarryforwardSummary:', err);
    res.status(500).json({ error: 'Failed to fetch carryforward summary' });
  }
};
