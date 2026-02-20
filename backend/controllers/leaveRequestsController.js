const notificationService = require('../services/notificationService');
//const { leave_requests, User, leave_type_setting,LeaveCarryforward } = require('../models');
const { leave_requests, User, leave_type_setting, CalendarEvent, LeaveCarryforward } = require('../models');
const { Op } = require('sequelize');

exports.getUpcomingLeaves = async (req, res) => {
  try {
    const today = new Date();
    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    const leaves = await leave_requests.findAll({
      where: {
        organization_id: req.user.organization_id,
        start_date: {
          [Op.between]: [today, next7]
        },
        status: 'Approved'
      },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['first_name', 'last_name']
        }
      ],
      order: [['start_date', 'ASC']]
    });

    const formattedLeaves = leaves.map(lv => ({
      id: lv.id,
      leave_type: lv.leave_type,
      start_date: lv.start_date,
      end_date: lv.end_date,
      status: lv.status,
      employee_name: lv.employee ? `${lv.employee.first_name} ${lv.employee.last_name}` : 'N/A'
    }));

    res.json(formattedLeaves);
  } catch (err) {
    console.error('Error in getUpcomingLeaves:', err);
    res.status(500).json({ error: 'Failed to fetch upcoming leaves.' });
  }
};

exports.applyLeave = async (req, res) => {
  try {
    const {
      leave_type,
      start_date,
      end_date,
      reason,
      total_days
    } = req.body;

    const { organization_id, userId } = req.user;
    const supporting_document = req.file ? req.file.filename : null;

    // ✅ Fetch user details
    const user = await User.findOne({
      where: {
        user_id: userId,
        organization_id
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // ✅ Validate paternity/maternity leave rules
    if (leave_type.toLowerCase() === 'paternity leave') {
      if (user.gender?.toLowerCase() !== 'male' || user.marital_status?.toLowerCase() !== 'married') {
        return res.status(400).json({ error: 'Paternity leave is only applicable to married male employees.' });
      }
    }

    if (leave_type.toLowerCase() === 'maternity leave') {
      if (user.gender?.toLowerCase() !== 'female' || user.marital_status?.toLowerCase() !== 'married') {
        return res.status(400).json({ error: 'Maternity leave is only applicable to married female employees.' });
      }
    }

    // ✅ Validate required fields
    if (!leave_type || !start_date || !end_date || !reason || !total_days) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const totalDaysParsed = parseInt(total_days);
    if (isNaN(totalDaysParsed)) {
      return res.status(400).json({ error: 'Invalid total_days value.' });
    }

    // 🚫 Check for overlapping leave requests


const overlappingLeave = await leave_requests.findOne({
  where: {
    employee_id: userId,
    organization_id,
    status: { [Op.not]: 'rejected' },
    [Op.or]: [
      {
        start_date: { [Op.between]: [start_date, end_date] },
      },
      {
        end_date: { [Op.between]: [start_date, end_date] },
      },
      {
        start_date: { [Op.lte]: start_date },
        end_date: { [Op.gte]: end_date },
      }
    ]
  }
});

if (overlappingLeave) {
  return res.status(400).json({
    error: 'You already have a leave request (pending/approved) overlapping with the selected date range.'
  });
}


    // ✅ Set approver details
    let approver_id = null;
    let approver_role = 'manager';
    let approval_level = null;

    // ✅ Prefer assigning to managers if available
    if (
      user.manager_id_primary !== null &&
      user.manager_id_primary !== undefined
    ) {
      approver_id = user.manager_id_primary;
      approver_role = 'manager';
      approval_level = 1;
    } else if (
      user.manager_id_secondary !== null &&
      user.manager_id_secondary !== undefined
    ) {
      approver_id = user.manager_id_secondary;
      approver_role = 'manager';
      approval_level = 2;
    } else {
      // fallback to admin
      const admin = await User.findOne({
        where: {
          role: 'admin',
          organization_id,
          deleted_at: null
        }
      });

      if (!admin) {
        return res.status(400).json({ error: 'No admin found to approve leave request.' });
      }

      approver_id = admin.user_id;
      approver_role = 'admin';
    }

    const now = new Date();

    // ✅ Create leave request
    const leave = await leave_requests.create({
      organization_id,
      employee_id: userId,
      leave_type,
      start_date,
      end_date,
      reason,
      total_days: totalDaysParsed,
      supporting_document,
      status: 'Pending',
      approver_id,
      approver_role,
      current_approver_id: null,        // no one has approved yet
      current_approver_role: null,
      approval_level: null,
      created_at: now,
      updated_at: now
    });

    await notificationService.createNotification({
  organizationId: organization_id,
  recipientUserId: approver_id,
  senderUserId: userId,
  notificationType: 'leave_request',
  title: 'New Leave Request',
  message: `${user.first_name} ${user.last_name} has applied for leave from ${start_date} to ${end_date}.`,
  resourceType: 'LeaveRequest',
  resourceId: leave.id,
  linkUrl: '/approvals/leave' // Adjust frontend route as needed
}); 

    res.status(201).json(leave);
  } catch (err) {
    console.error("❌ Final Error:", err.stack || err.message || err);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await leave_requests.findAll({
      where: {
        employee_id: req.user.userId,
        organization_id: req.user.organization_id // ✅ Ensure proper scoping
      },
      order: [['start_date', 'DESC']],
    });

    console.log('Leaves found:', leaves.length);

    res.json(leaves.map(lv => ({
      id: lv.id,
      type: lv.leave_type,
      start_date: lv.start_date,
      end_date: lv.end_date,
      reason: lv.reason,
      status: lv.status,
      total_days: lv.total_days,
      remarks: lv.remarks || null // ✅ include remarks
    })));
  } catch (err) {
    console.error('Error fetching user leaves:', err);
    res.status(500).json({ error: 'Failed to fetch leaves.' });
  }
};

exports.getManagerTeamLeaves = async (req, res) => {
  try {
    const managerId = req.user.userId;

    const leaves = await leave_requests.findAll({
      where: {
        approver_role: 'manager',
        [Op.or]: [
          { approver_id: managerId },         // This manager was recorded as either primary or secondary
          { '$employee.manager_id_primary$': managerId },   // employee’s primary
          { '$employee.manager_id_secondary$': managerId } // employee’s secondary
        ]
      },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['first_name', 'last_name', 'manager_id_primary', 'manager_id_secondary']
        }
      ],
      order: [['start_date', 'DESC']]
    });

    const formatted = leaves.map(lv => ({
      id: lv.id,
      type: lv.leave_type,
      start_date: lv.start_date,
      end_date: lv.end_date,
      reason: lv.reason,
      status: lv.status,
      approver_id: lv.approver_id,
      approver_role: lv.approver_role,
      employee: {
        first_name: lv.employee?.first_name || '',
        last_name: lv.employee?.last_name || '',
        manager_id_primary: lv.employee?.manager_id_primary || null,
        manager_id_secondary: lv.employee?.manager_id_secondary || null
      },
      employee_name: lv.employee
        ? `${lv.employee.first_name} ${lv.employee.last_name}`
        : 'N/A',
      supporting_document: lv.supporting_document,
      current_approver_id: lv.current_approver_id,
      current_approver_role: lv.current_approver_role,
      remarks: lv.remarks || null
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching manager team leaves:', err);
    res.status(500).json({ error: 'Failed to fetch leave requests for your team.' });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { status, remarks } = req.body;
    const approverId = req.user.userId;

    const leave = await leave_requests.findOne({ where: { id: leaveId } });
    if (!leave) return res.status(404).json({ error: "Leave not found" });

    const employee = await User.findOne({ where: { user_id: leave.employee_id } });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // 🔐 Authorize either primary or secondary manager
    const isPrimary = approverId === employee.manager_id_primary;
    const isSecondary = approverId === employee.manager_id_secondary;
    const isAdmin = approverId === leave.approver_id && leave.approver_role === 'admin';

    if (!isPrimary && !isSecondary && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to take action on this leave request" });
    }

    // 📝 Allow only remarks update
    if (!status && remarks !== undefined) {
      leave.remarks = remarks;
      await leave.save();
      return res.json({ message: 'Remarks saved successfully.' });
    }

    // ✅ Validate status value if present
    if (status && !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // ⛔ Rejection logic
    if (status === 'rejected') {
      leave.status = 'Rejected';
      leave.remarks = remarks || null;
      leave.current_approver_id = approverId;
      leave.current_approver_role = isAdmin ? 'admin' : 'manager';
      await leave.save();
      return res.json({ message: 'Leave rejected successfully' });
    }

    // ✅ Approval logic
    if (status === 'approved') {
      leave.status = 'Approved';
      leave.remarks = remarks || null;
      leave.current_approver_id = approverId;
      leave.current_approver_role = isAdmin ? 'admin' : 'manager';
      await leave.save();

      await notificationService.createNotification({
        organizationId: leave.organization_id,
        recipientUserId: leave.employee_id,
        senderUserId: approverId,
        notificationType: 'leave_approval',
        title: 'Leave Request Approved',
        message: `Your leave from ${leave.start_date} to ${leave.end_date} has been approved.`,
        resourceType: 'LeaveRequest',
        resourceId: leave.id,
        linkUrl: '/employee/leaves',

      });

      // ✅ Create calendar event for approved leave - visible to all in organization
      try {
        const event = await CalendarEvent.create({
          title: `${employee.first_name} is out of office`,
          start_date: leave.start_date,
          end_date: leave.end_date,
          type: 'Leave',
          scope: 'organization',  // 👈 Visible to all in organization
          target_user_id: null,
          created_by_user_id: approverId,
          organization_id: leave.organization_id,
          event_level: 'Normal'
        });
      } catch (err) {
        console.error("Calendar event creation failed:", err);
      }

      return res.json({ message: 'Leave approved successfully' });
    }

    // Fallback
    res.status(200).json({ message: "No status change made." });

  } catch (err) {
    console.error("Update leave status error:", err);
    res.status(500).json({ error: "Failed to update leave status" });
  }
};

exports.getLeaveStatsForMember = async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // 1. Get leave types
    const leaveTypes = await leave_type_setting.findAll();

    // 2. Get all approved leave requests for this year
    const leaveRequests = await leave_requests.findAll({
      where: {
        employee_id: userId,
        status: 'Approved',
        start_date: {
          [Op.gte]: new Date(`${currentYear}-01-01`),
          [Op.lte]: new Date(`${currentYear}-12-31`)
        }
      }
    });

    // 3. Get carryforwards from previous year
    const carryforwards = await LeaveCarryforward.findAll({
      where: {
        employee_id: userId,
        year: previousYear
      }
    });

    // 4. Create map for quick lookup
    const carryMap = {};
    carryforwards.forEach(cf => {
      carryMap[cf.leave_type] = cf.carried_forward_days;
    });

    // 5. Build final stats
    const stats = leaveTypes.map(type => {
      const used = leaveRequests
        .filter(req => req.leave_type === type.type)
        .reduce((sum, r) => sum + r.total_days, 0);

      const carry = carryMap[type.type] || 0;
      const allowed = type.max_days_per_year + carry;

      return {
        type: type.type,
        allowed,
        used,
        remaining: Math.max(allowed - used, 0),
        carried_forward: carry
      };
    });

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching leave stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getAdminLeaveRequests = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { page = 1, limit = 10, search = '', status } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {
      approver_id: adminId,
      approver_role: 'admin',
    };

    if (status) {
      whereClause.status = status;
    }

    // Include search logic on employee name or leave_type or reason
    const employeeWhere = search
      ? {
          [Op.or]: [
            { first_name: { [Op.iLike]: `%${search}%` } },
            { last_name: { [Op.iLike]: `%${search}%` } }
          ]
        }
      : {};

    const { rows, count } = await leave_requests.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['first_name', 'last_name'],
          where: employeeWhere,
        }
      ],
      order: [['start_date', 'DESC']],
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

    const formatted = rows.map(lv => ({
      id: lv.id,
      type: lv.leave_type,
      start_date: lv.start_date,
      end_date: lv.end_date,
      reason: lv.reason,
      status: lv.status,
      approver_id: lv.approver_id,
      approver_role: lv.approver_role,
      employee_name: lv.employee
        ? `${lv.employee.first_name} ${lv.employee.last_name}`
        : 'N/A',
      supporting_document: lv.supporting_document,
      current_approver_id: lv.current_approver_id,
      remarks: lv.remarks || null
    }));

    res.json({
      data: formatted,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count
    });
  } catch (err) {
    console.error('Admin leave fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch leave requests.' });
  }
};




exports.getManagerLeaveStats = async (req, res) => {
  try {
    const managerId = req.user.userId;

    const teamMembers = await User.findAll({
      where: { manager_id: managerId },
      attributes: ['user_id']
    });

    const memberIds = teamMembers.map(m => m.user_id);
    if (memberIds.length === 0) return res.status(200).json([]);

    const leaveTypes = await leave_type_setting.findAll();
    const leaveRequests = await leave_requests.findAll({
      where: {
        employee_id: memberIds,
        status: 'Approved'
      }
    });

    const currentYear = new Date().getFullYear();
    const carryRecords = await LeaveCarryforward.findAll({
      where: {
        employee_id: memberIds,
        year: currentYear - 1 // carry from previous year
      }
    });

    const stats = leaveTypes.map(type => {
      const used = leaveRequests
        .filter(req => req.leave_type === type.type)
        .reduce((sum, r) => sum + r.total_days, 0);

      const base = type.max_days_per_year * memberIds.length;

      const carry = carryRecords
        .filter(cr => cr.leave_type === type.type)
        .reduce((sum, r) => sum + (r.carried_forward_days || 0), 0);

      return {
        type: type.type,
        base_allowed: base,
        carried_forward: carry,
        allowed: base + carry,
        used,
        remaining: Math.max(base + carry - used, 0)
      };
    });

    res.status(200).json(stats);
  } catch (err) {
    console.error("Error fetching manager leave stats:", err);
    res.status(500).json({ error: "Failed to fetch team leave stats" });
  }
};
// Get all leave requests (for admin audit view/download)
exports.getAllLeavesForAudit = async (req, res) => {
  try {
    const { organization_id } = req.user;

    const leaves = await leave_requests.findAll({
      where: { organization_id },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['first_name', 'last_name', 'official_email_id', 'role']
        }
      ],
      order: [['start_date', 'DESC']]
    });

   const formatted = leaves.map(lv => ({
  id: lv.id,
  employee_name: lv.employee
    ? `${lv.employee.first_name} ${lv.employee.last_name}`
    : 'N/A',
  email: lv.employee?.official_email_id,
  role: lv.employee?.role,
  leave_type: lv.leave_type,
  start_date: lv.start_date,
  end_date: lv.end_date,
  total_days: lv.total_days,
  reason: lv.reason,
  status: lv.status,
  approver_id: lv.approver_id || '-',        // ✅ newly added
  approver_role: lv.approver_role || '-',    // ✅ newly added
  remarks: lv.remarks || '-',
  submitted_on: lv.created_at
}));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("❌ Error in getAllLeavesForAudit:", err);
    res.status(500).json({ error: 'Failed to fetch leave data for audit.' });
  }
};
