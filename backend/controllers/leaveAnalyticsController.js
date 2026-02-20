// File: backend/controllers/leaveAnalyticsController.js

const { leave_requests, User, leave_type_setting } = require('../models');
const { Op } = require('sequelize');
const {  users_onboarded } = require("../models");
const { team_members } = require('../models');

exports.getAdminLeaveAnalytics = async (req, res) => {
  try {
    const {
      startDate = null,
      endDate = null,
      leaveType = null,
      status = null,
      teamId = null,
    } = req.query;

    const organizationId = req.user.organization_id;

    // 1. Get all employees in the organization
    const employees = await User.findAll({
      where: { organization_id: organizationId },
      attributes: ['user_id', 'gender', 'marital_status'],
    });

    let employeeIds = employees.map((e) => e.user_id);

    // 2. Apply team filter
    if (teamId && teamId !== 'null' && teamId !== '') {
      const members = await require('../models').team_members.findAll({
        where: { team_id: teamId },
        attributes: ['user_id'],
      });
      employeeIds = members.map((m) => m.user_id);
    }

    // 3. Fetch leave types
    const leaveTypes = await leave_type_setting.findAll({
      where: { organization_id: organizationId },
    });

    // 4. Deduplicate leave types
    const uniqueLeaveTypesMap = {};
    leaveTypes.forEach((type) => {
      if (!uniqueLeaveTypesMap[type.type]) {
        uniqueLeaveTypesMap[type.type] = type.max_days_per_year || 0;
      }
    });

    // 5. Fetch leave requests with filters
    const whereClause = {
      organization_id: organizationId,
      status: 'Approved',
      employee_id: employeeIds.length > 0 ? { [Op.in]: employeeIds } : [],
    };

    if (startDate && endDate) {
      whereClause.start_date = { [Op.between]: [startDate, endDate] };
    }

    if (leaveType) {
      whereClause.leave_type = leaveType;
    }

    if (status) {
      whereClause.status = status;
    }

    const leaveRequests = await leave_requests.findAll({ where: whereClause });

    // 6. Final leave analytics calculation
    const analytics = Object.entries(uniqueLeaveTypesMap).map(([type, maxDays]) => {
      const eligibleEmployees = employees.filter((emp) => {
        if (type === 'paternity leave') {
          return emp.gender?.toLowerCase() === 'male' && emp.marital_status?.toLowerCase() === 'married';
        }
        if (type === 'maternity leave') {
          return emp.gender?.toLowerCase() === 'female' && emp.marital_status?.toLowerCase() === 'married';
        }
        return true;
      });

      const totalAllowed = maxDays * eligibleEmployees.length;

      const used = leaveRequests
        .filter((l) => l.leave_type === type)
        .reduce((sum, l) => sum + (l.total_days || 0), 0);

      return {
        type,
        allowed: totalAllowed,
        used,
        remaining: Math.max(totalAllowed - used, 0),
      };
    });

    res.status(200).json(analytics);
  } catch (err) {
    console.error('❌ Admin Leave Analytics Error:', err);
    res.status(500).json({ error: 'Failed to fetch leave analytics' });
  }
};



exports.getManagerTeamLeaveAnalytics = async (req, res) => {
  try {
    const managerId = req.user.userId;
    const organizationId = req.user.organization_id;

    const teamMembers = await User.findAll({
      where: {
        [Op.or]: [
          { manager_id_primary: managerId },
          { manager_id_secondary: managerId },
        ],
      },
      attributes: ['user_id', 'gender', 'marital_status'], // ✅ add these
    });

    const memberIds = teamMembers.map((m) => m.user_id);
    console.log("🔍 Team Members:", memberIds);

    if (memberIds.length === 0) {
      console.log("⚠️ No team members assigned to this manager.");
      return res.status(200).json([]);
    }

    const leaveTypes = await leave_type_setting.findAll({
      where: { organization_id: organizationId },
    });

    console.log("🗂 Leave Types:", leaveTypes.map(t => ({
      type: t.type,
      max: t.max_days_per_year
    })));

    // ✅ Deduplicate leave types
    const uniqueLeaveTypesMap = {};
    leaveTypes.forEach((type) => {
      if (!uniqueLeaveTypesMap[type.type]) {
        uniqueLeaveTypesMap[type.type] = type.max_days_per_year || 0;
      }
    });

    const leaveRequests = await leave_requests.findAll({
      where: {
        employee_id: { [Op.in]: memberIds },
        status: 'Approved',
      },
    });

    console.log("📄 Leave Requests:", leaveRequests.map(l => ({
      employee_id: l.employee_id,
      leave_type: l.leave_type,
      total_days: l.total_days
    })));

    const result = Object.entries(uniqueLeaveTypesMap).map(([type, maxDays]) => {
      // ✅ Filter eligible members per leave type
      
      const eligibleMembers = teamMembers.filter((member) => {
  if (type === 'paternity leave') {
    return member.gender?.toLowerCase() === 'male' && member.marital_status?.toLowerCase() === 'married';
  }
  if (type === 'maternity leave') {
    return member.gender?.toLowerCase() === 'female' && member.marital_status?.toLowerCase() === 'married';
  }
  return true;
});


      const totalAllowed = maxDays * eligibleMembers.length;

      const used = leaveRequests
        .filter((req) => req.leave_type === type)
        .reduce((sum, r) => sum + (r.total_days || 0), 0);

      return {
        type,
        allowed: totalAllowed,
        used,
        remaining: Math.max(totalAllowed - used, 0),
      };
    });

    console.log("✅ Final Analytics:", result);

    res.status(200).json(result);
  } catch (err) {
    console.error('❌ Manager Leave Analytics Error:', err);
    res.status(500).json({ error: 'Failed to fetch leave analytics' });
  }
};

exports.getLeaveAnalytics = async (req, res) => {
  try {
    const {
      startDate = null,
      endDate = null,
      leaveType = null,
      status = null,
      teamId = null,
    } = req.query;

    const organizationId = req.user.organization_id;
    const { team_members } = require('../models');

    const whereClause = {
      organization_id: organizationId
    };

    if (startDate && endDate) {
      whereClause.start_date = { [Op.between]: [startDate, endDate] };
    }

    if (leaveType) {
      whereClause.leave_type = leaveType;
    }

    if (status) {
      whereClause.status = status;
    }

   let totalEmployees = 0;
let memberIds = [];

const userInclude = {
  model: User,
  as: "employee",
  attributes: ["user_id", "first_name", "last_name"],
};

if (teamId && teamId !== "null" && teamId !== "undefined" && teamId !== "") {
  const members = await team_members.findAll({
    where: { team_id: teamId },
    attributes: ['user_id']
  });
  memberIds = members.map((m) => m.user_id);
  totalEmployees = memberIds.length;

  if (memberIds.length > 0) {
    whereClause.employee_id = { [Op.in]: memberIds };
  } else {
    return res.status(200).json({
      leaves: [],
      stats: { leaveTypes: {}, statusCount: {}, byTeam: {} },
      teamMemberCount: 0,
      employeeStats: { total: 0, onLeave: 0, available: 0 },
    });
  }
} else {
  totalEmployees = await User.count({
    where: { organization_id: organizationId, status: 'active' },
  });
}


    const leaves = await leave_requests.findAll({
      where: whereClause,
      include: [userInclude],
    });

    // 👉 Aggregate stats
    const stats = {
      totalLeaves: leaves.length,
      leaveTypes: {},
      statusCount: { approved: 0, rejected: 0, pending: 0 },
      byTeam: {},
    };

    for (const leave of leaves) {
      const type = leave.leave_type || "Unknown";
      const leaveStatus = (leave.status || "unknown").toLowerCase();
      const teamKey = leave.employee?.team_id || "Unassigned";

      stats.leaveTypes[type] = (stats.leaveTypes[type] || 0) + 1;
      stats.statusCount[leaveStatus] = (stats.statusCount[leaveStatus] || 0) + 1;
      stats.byTeam[teamKey] = (stats.byTeam[teamKey] || 0) + 1;
    }

    // 👉 Fetch all employees in org (not filtered)




if (teamId && teamId !== 'null' && teamId !== 'undefined' && teamId !== '') {
  const members = await team_members.findAll({
    where: { team_id: teamId },
    attributes: ['user_id'],
  });
  memberIds = members.map((m) => m.user_id);
  totalEmployees = memberIds.length;

  if (memberIds.length > 0) {
    whereClause.employee_id = { [Op.in]: memberIds };
  } else {
    // No members in this team
    return res.status(200).json({
      leaves: [],
      stats: { leaveTypes: {}, statusCount: {}, byTeam: {} },
      teamMemberCount: 0,
      employeeStats: { total: 0, onLeave: 0, available: 0 },
    });
  }
} else {
  totalEmployees = await User.count({
    where: { organization_id: organizationId, status: 'active' },
  });
}



    // Get unique employee IDs who are on leave in current result
    const onLeaveSet = new Set();
    leaves.forEach((lv) => onLeaveSet.add(lv.employee_id));
    const onLeaveCount = onLeaveSet.size;
    const availableCount = totalEmployees - onLeaveCount;

    return res.status(200).json({
      leaves,
      stats,
        teamMemberCount: totalEmployees,
      employeeStats: {
        total: totalEmployees,
        onLeave: onLeaveCount,
        available: availableCount,
      },
    });
  } catch (err) {
    console.error("❌ Error in getLeaveAnalytics:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};