const { ProjectUpdate, User, Project, ProjectAssignment, teams, team_members } = require("../models"); 
const moment = require('moment');
const { Op } = require('sequelize');

// Helper function to format date
const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
};

async function isUserAssignedToProject(userId, organizationId, projectId) {
    const assignedProjectCount = await Project.count({
        where: {
            project_id: projectId,
            organization_id: organizationId,
            [Op.or]: [
                { '$assignments.assigned_manager_id$': userId },
                { '$assignments.team.members.user_id$': userId }
            ]
        },
        include: [
            {
                model: ProjectAssignment,
                as: 'assignments',
                attributes: [],
                required: true,
                include: [
                    {
                        model: teams,
                        as: 'team',
                        attributes: [],
                        required: true,
                        include: [
                            {
                                model: team_members,
                                as: 'members',
                                attributes: [],
                                required: true,
                            }
                        ]
                    }
                ]
            }
        ]
    });

    return assignedProjectCount > 0;
}


// Get project progress timeline for a specific project
exports.getProjectProgressTimeline = async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const { organization_id, userId, role } = req.user; 

        if (!projectId || projectId === 'undefined') {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        // Verify project belongs to the organization
        const project = await Project.findOne({
            where: { project_id: projectId, organization_id }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found or unauthorized.' });
        }

        // Additional check for non-admin users to ensure they are assigned to the project
        if (role !== 'admin') {
            const isAssigned = await isUserAssignedToProject(userId, organization_id, projectId);
            if (!isAssigned) {
                return res.status(403).json({ message: "Unauthorized to view this project's progress timeline." });
            }
        }

        const updates = await ProjectUpdate.findAll({
            attributes: ['progress_percent', 'update_date'],
            where: {
                project_id: projectId,
                approval_status: 'Approved',
                organization_id
            },
            order: [['update_date', 'ASC']]
        });

        const timelineData = updates.map(update => {
            const dateMoment = moment(update.update_date);
            return {
                date: dateMoment.isValid() ? dateMoment.toISOString().split('T')[0] : null,
                progress: update.progress_percent
            };
        });

        res.json(timelineData);
    } catch (err) {
        console.error('Project progress timeline error:', err);
        res.status(500).json({ error: 'Failed to fetch project progress timeline.' });
    }
};


// Submit update for a project (Member role)
exports.submitUpdate = async (req, res) => {
    try {
        const { description, work_done, progress_percent } = req.body;
        const { id: projectId } = req.params;
        const { userId, organization_id, role } = req.user;

        if (!description || !work_done || progress_percent === undefined || progress_percent === null) {
            return res.status(400).json({ error: 'Description, work done, and progress percent are required.' });
        }

        const parsedProgressPercent = parseFloat(progress_percent);
        if (isNaN(parsedProgressPercent) || parsedProgressPercent < 0 || parsedProgressPercent > 100) {
            return res.status(400).json({ error: 'Progress percent must be a number between 0 and 100.' });
        }

        // Verify project belongs to the organization
        const projectExists = await Project.findOne({
            where: { project_id: projectId, organization_id }
        });
        if (!projectExists) {
            return res.status(404).json({ error: 'Project not found or unauthorized to submit update.' });
        }

        // Additional check for non-admin users to ensure they are assigned to the project
        if (role !== 'admin') {
            const isAssigned = await isUserAssignedToProject(userId, organization_id, projectId);
            if (!isAssigned) {
                return res.status(403).json({ message: "Unauthorized to submit updates for this project." });
            }
        }

        const update = await ProjectUpdate.create({
            description,
            work_done,
            progress_percent: parsedProgressPercent,
            project_id: projectId,
            user_id: userId,
            organization_id: organization_id,
            approval_status: 'Pending',
            update_date: new Date()
        });

        res.status(201).json(update);
    } catch (err) {
        console.error('Submit update error:', err);
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: 'Validation error submitting update',
                details: err.errors.map(e => e.message)
            });
        }
        res.status(500).json({ error: 'Failed to submit update.' });
    }
};


// Get pending updates for approval (Manager role)
exports.getPendingUpdates = async (req, res) => {
  try {
    const { organization_id, userId, role } = req.user;

    let projectIds = [];

    // Step 1: Get all projects assigned to this user (as manager or team member)
    const assignments = await ProjectAssignment.findAll({
      where: { organization_id },
      include: [{
        model: teams,
        as: 'team',
        include: [{
          model: team_members,
          as: 'members',
          where: { user_id: userId },
          required: false,
        }],
      }],
    });

    assignments.forEach(assign => {
      if (
        assign.assigned_manager_id === userId ||
        assign.team?.members?.some(member => member.user_id === userId)
      ) {
        projectIds.push(assign.project_id);
      }
    });

    if (projectIds.length === 0) {
      return res.json([]); 
    }

    // Step 2: Get pending updates for visible projects
    const updates = await ProjectUpdate.findAll({
      where: {
        approval_status: 'Pending',
        organization_id,
        project_id: { [Op.in]: projectIds },
        deleted_at: null,
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['project_id', 'project_name'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name'],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    // Step 3: Format the output
    const formatted = updates.map(update => ({
      update_id: update.update_id,
      description: update.description,
      work_done: update.work_done,
      progress_percent: update.progress_percent,
      project_name: update.project?.project_name || 'Unknown',
      user: update.user
        ? { first_name: update.user.first_name, last_name: update.user.last_name }
        : null,
      user_id: update.user_id,
    }));

    console.log("✅ Returning pending approvals:", formatted.length);
    res.json(formatted);
  } catch (error) {
    console.error("❌ Failed to fetch pending approvals:", error);
    res.status(500).json({ error: "Failed to load pending approvals." });
  }
};


// Approve or reject an update (Manager role)
exports.approveUpdate = async (req, res) => {
    try {
        const { id: updateId } = req.params;
        const { status } = req.body;
        const managerId = req.user.userId;
        const organizationId = req.user.organization_id;
        const { role } = req.user;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status provided. Must be "Approved" or "Rejected".' });
        }

        const update = await ProjectUpdate.findOne({
            where: {
                update_id: updateId,
                organization_id: organizationId
            }
        });

        if (!update) {
            console.warn(`Update ${updateId} not found or not in organization ${organizationId}.`);
            return res.status(404).json({ error: 'Update not found or not in your organization.' });
        }

        // Verify the manager is assigned to the project they are trying to approve/reject
        if (role === 'manager') {
            const isAssigned = await isUserAssignedToProject(managerId, organizationId, update.project_id);
            if (!isAssigned) {
                return res.status(403).json({ message: "Unauthorized to approve/reject updates for this project." });
            }
        }

        // Only allow approval/rejection of 'Pending' updates
        if (update.approval_status !== 'Pending') {
            console.warn(`Update ${updateId} already ${update.approval_status}. Cannot change status.`);
            return res.status(400).json({ error: `Update already ${update.approval_status}.` });
        }

        await update.update({
            approval_status: status,
            approved_by: managerId,
        });

        // If approved, update the project's overall progress by calculating the average
        if (status === 'Approved') {
            console.log('Update approved. Recalculating Project progress...');

            // Fetch all APPROVED updates for this project
            const approvedUpdates = await ProjectUpdate.findAll({
                where: {
                    project_id: update.project_id,
                    approval_status: 'Approved'
                },
                attributes: ['progress_percent']
            });

            const project = await Project.findByPk(update.project_id);
            if (project) {
                if (approvedUpdates.length > 0) {
                    const totalProgress = approvedUpdates.reduce((sum, current) => sum + current.progress_percent, 0);
                    const averageProgress = Math.round(totalProgress / approvedUpdates.length); // Round to nearest integer

                    console.log(`Calculated average progress for project ${update.project_id}: ${averageProgress}%`);
                    await project.update({ progress_percent: averageProgress });
                } else {
                    console.log(`No approved updates found for project ${update.project_id}. Setting progress to 0.`);
                    await project.update({ progress_percent: 0 });
                }
            } else {
                console.warn(`Project with ID ${update.project_id} not found for update ${update.update_id}. Cannot update project progress.`);
            }
        }

        res.json({ message: `Update ${status.toLowerCase()} successfully.` });
    } catch (err) {
        console.error('Error approving/rejecting update:', err);
        res.status(500).json({ error: 'Failed to approve/reject update.' });
    }
};


// Get weekly progress summary for Admin Dashboard
exports.getWeeklyProgressSummary = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const { role, userId } = req.user;
        console.log("Org ID from token (Weekly Progress):", organizationId);

        let whereProjectClause = { organization_id: organizationId };

        // If not admin, filter projects by user's assignments
        if (role !== 'admin') {
            const assignedProjects = await ProjectAssignment.findAll({
                where: {
                    organization_id: organizationId,
                    [Op.or]: [
                        { assigned_manager_id: userId },
                        {
                            '$team.members.user_id$': userId
                        }
                    ]
                },
                include: [{
                    model: teams,
                    as: 'team',
                    attributes: [],
                    required: true,
                    include: [{
                        model: team_members,
                        as: 'members',
                        attributes: [],
                        required: true,
                    }]
                }],
                attributes: ['project_id'],
                raw: true
            });
            const projectIds = assignedProjects.map(pa => pa.project_id);
            if (projectIds.length === 0) {
                return res.json([]);
            }
            whereProjectClause.project_id = { [Op.in]: projectIds };
        }

        const updates = await ProjectUpdate.findAll({
            where: {
                approval_status: 'Approved',
            },
            include: [
                {
                    model: Project,
                    as: 'project', 
                    attributes: [],
                    where: whereProjectClause,
                    required: true
                }
            ],
            attributes: ['progress_percent', 'update_date'],
            raw: true
        });

        const weekMap = {};

        for (const update of updates) {
            if (update.update_date) {
                const dateMoment = moment(update.update_date);

                if (dateMoment.isValid()) {
                    const week = dateMoment.isoWeek();
                    const year = dateMoment.year();
                    const key = `${year}-W${String(week).padStart(2, '0')}`;

                    if (!weekMap[key]) {
                        weekMap[key] = [];
                    }
                    weekMap[key].push(update.progress_percent);
                } else {
                    console.warn(`Skipping invalid date for weekly progress summary (update_id: ${update.update_id}): ${update.update_date}`);
                }
            } else {
                console.warn(`Skipping missing update_date for weekly progress summary (update_id: ${update.update_id}).`);
            }
        }

        const result = Object.entries(weekMap).map(([week, progresses]) => ({
            week,
            average_progress: Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length)
        })).sort((a, b) => {
            const [yearA, weekA] = a.week.split('-W').map(Number);
            const [yearB, weekB] = b.week.split('-W').map(Number);
            if (yearA !== yearB) return yearA - yearB;
            return weekA - weekB;
        });

        res.json(result);
    } catch (error) {
        console.error('Weekly progress summary error:', error);
        res.status(500).json({ error: 'Failed to fetch weekly progress summary' });
    }
};

// Get approval history (Approved/Rejected updates)
exports.getApprovalHistory = async (req, res) => {
    try {
        const { organization_id, userId, role } = req.user;

        let whereClause = {
            organization_id: organization_id,
            approval_status: ['Approved', 'Rejected']
        };

        let projectInclude = {
            model: Project,
            as: 'project',
            attributes: ['project_name'],
            required: true,
        };

        if (role === 'manager') {
            const projectIdsManaged = await ProjectAssignment.findAll({
                where: {
                    assigned_manager_id: userId,
                    organization_id: organization_id
                },
                attributes: ['project_id'],
                raw: true
            }).then(assignments => assignments.map(a => a.project_id));

            if (projectIdsManaged.length === 0) {
                return res.json([]);
            }
            whereClause.project_id = { [Op.in]: projectIdsManaged };

        } else if (role === 'member') {
            const assignedProjects = await ProjectAssignment.findAll({
                where: {
                    organization_id: organization_id,
                    '$team.members.user_id$': userId
                },
                include: [{
                    model: teams,
                    as: 'team',
                    attributes: [],
                    required: true,
                    include: [{
                        model: team_members,
                        as: 'members',
                        attributes: [],
                        required: true,
                    }]
                }],
                attributes: ['project_id'],
                raw: true
            });
            const projectIds = assignedProjects.map(pa => pa.project_id);
            if (projectIds.length === 0) {
                return res.json([]);
            }
            whereClause.project_id = { [Op.in]: projectIds };
        }

        const history = await ProjectUpdate.findAll({
            where: whereClause,
            include: [
                projectInclude,
                {
                    model: User,
                    as: 'user',
                    attributes: ['first_name', 'last_name'],
                    required: true
                },
                {
                    model: User,
                    as: 'approver',
                    attributes: ['first_name', 'last_name'],
                    required: false
                }
            ],
            order: [['updated_at', 'DESC']]
        });

        const formattedHistory = history.map(item => ({
            update_id: item.update_id,
            project_name: item.project ? item.project.project_name : 'N/A',
            submitted_by: item.user ? `${item.user.first_name} ${item.user.last_name}` : 'N/A',
            description: item.description,
            work_done: item.work_done,
            progress_percent: item.progress_percent,
            approval_status: item.approval_status,
            approved_by: item.approver ? `${item.approver.first_name} ${item.approver.last_name}` : 'N/A',
            approved_on: formatDate(item.updated_at),
            submitted_on: formatDate(item.update_date)
        }));

        res.json(formattedHistory);
    } catch (err) {
        console.error('Error fetching approval history:', err);
        res.status(500).json({ error: 'Failed to fetch approval history.' });
    }
};
