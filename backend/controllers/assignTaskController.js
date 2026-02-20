// backend/controllers/assignTaskController.js
const { AssignTask, Project, User, StatusMaster, IssueType, Organization, teams, ProjectAssignment, team_members, IssueActivityLog } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize'); // Import sequelize for literal functions like fn('MAX')

// --- Helper Functions to get human-readable names from IDs ---
function isNumeric(value) {
  return value !== '' && value !== null && value !== undefined && !isNaN(Number(value));
}

async function getUserDisplayName(userId) {
  if (!userId) return null;
  const user = await User.findByPk(userId, { attributes: ['first_name', 'last_name'] });
  return user ? `${user.first_name} ${user.last_name}` : `User ID ${userId}`;
}

async function getProjectDisplayName(projectId) {
  if (!projectId) return null;
  const project = await Project.findByPk(projectId, { attributes: ['project_name'] });
  return project ? project.project_name : `Project ID ${projectId}`;
}

async function getTeamDisplayName(teamId) {
  if (!teamId) return null;
  const team = await teams.findByPk(teamId, { attributes: ['name'] });
  return team ? team.name : `Team ID ${teamId}`;
}

async function getIssueTypeDisplayName(issueTypeId) {
  if (!issueTypeId) return null;
  const issueType = await IssueType.findByPk(issueTypeId, { attributes: ['type_name'] });
  return issueType ? issueType.type_name : `Issue Type ID ${issueTypeId}`;
}

async function getStatusDisplayName(statusId) {
  if (!statusId) return null;
  const status = await StatusMaster.findByPk(statusId, { attributes: ['status_name'] });
  return status ? status.status_name : `Status ID ${statusId}`;
}

// Create a new issue/task (Story, Task, Bug, Epic)
exports.createAssignTask = async (req, res) => {
  try {
    const {
      title, description, issue_type_id, project_id, team_id,
      assignee_id, parent_issue_id, priority, due_date, story_points,
      time_spent, remarks, attachment_url, current_status_id,
      start_date, actual_start_date, actual_end_date,
      original_estimate_hours, remaining_estimate_hours
    } = req.body;

    const reporter_id = req.user ? req.user.userId : null;
    const organization_id = req.user ? req.user.organization_id : null;

    // --- REFINED VALIDATION LOGIC ---
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!issue_type_id) missingFields.push('issue_type_id');
    if (!project_id) missingFields.push('project_id');
    if (!current_status_id) missingFields.push('current_status_id');
    if (!reporter_id) missingFields.push('reporter_id');
    if (!organization_id) missingFields.push('organization_id');

    // Conditional validation for assignee_id: required ONLY if no team_id is provided
    if (!team_id && !assignee_id) {
      missingFields.push('assignee_id or team_id');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}.`
      });
    }

    // --- Validate existence of foreign key IDs ---
    const [projectExists, issueTypeExists, statusExists, reporterExists] = await Promise.all([
      Project.findByPk(project_id),
      IssueType.findByPk(issue_type_id),
      StatusMaster.findByPk(current_status_id),
      User.findByPk(reporter_id)
    ]);

    if (!projectExists) return res.status(400).json({ success: false, message: 'Invalid project_id.' });
    if (!issueTypeExists) return res.status(400).json({ success: false, message: 'Invalid issue_type_id.' });
    if (!statusExists) return res.status(400).json({ success: false, message: 'Invalid current_status_id.' });
    if (!reporterExists) return res.status(400).json({ success: false, message: 'Invalid reporter_id (user not found).' });

    // Validate assignee_id ONLY if it's provided (i.e., not null/undefined/empty string)
    if (assignee_id && isNumeric(assignee_id) && !(await User.findByPk(assignee_id))) {
      return res.status(400).json({ success: false, message: 'Invalid assignee_id.' });
    }

    // Validate optional foreign keys if provided
    if (team_id && isNumeric(team_id) && !(await teams.findByPk(team_id))) {
      return res.status(400).json({ success: false, message: 'Invalid team_id.' });
    }

    // --- NEW/UPDATED: Validate parent_issue_id for Epics ---
    const currentIssueType = await IssueType.findByPk(issue_type_id);
if (!currentIssueType) {
  return res.status(400).json({ success: false, message: 'Invalid issue_type_id.' });
}

const epicIssueType = await IssueType.findOne({ where: { type_name: 'Epic' } });
const isCurrentIssueEpic = epicIssueType && currentIssueType.type_name === 'Epic';

    if (isCurrentIssueEpic && parent_issue_id) {
        return res.status(400).json({ success: false, message: 'An Epic cannot have a parent issue.' });
    }

    if (!isCurrentIssueEpic && parent_issue_id) {
    const parentIssueRecord = await AssignTask.findByPk(parent_issue_id, {
        include: [{ model: IssueType, as: 'issueType', attributes: ['type_name'] }]
    });
    if (!parentIssueRecord) {
        return res.status(400).json({ success: false, message: 'Invalid parent_issue_id: Parent issue not found.' });
    }

    if (currentIssueType.type_name === 'Story') {
        // Stories can only be linked under an Epic
        if (parentIssueRecord.issueType.type_name !== 'Epic') {
            return res.status(400).json({ success: false, message: 'Invalid parent_issue_id: Story must be linked under an Epic.' });
        }
    } else if (currentIssueType.type_name === 'Task' || currentIssueType.type_name === 'Bug') {
        // Task/Bug can only be linked under a Story
        if (parentIssueRecord.issueType.type_name !== 'Story') {
            return res.status(400).json({ success: false, message: 'Invalid parent_issue_id: Task/Bug must be linked under a Story.' });
        }
    }
}

    // --- END NEW/UPDATED ---
    // --- NEW: Validate Bug/Task Mapping under Story ---

if (currentIssueType && (currentIssueType.type_name === 'Bug' || currentIssueType.type_name === 'Task')) {
    if (!parent_issue_id) {
        return res.status(400).json({ success: false, message: 'Bug/Task must be linked to a parent Story.' });
    }

    const parentIssue = await AssignTask.findByPk(parent_issue_id, {
        include: [{ model: IssueType, as: 'issueType', attributes: ['type_name'] }]
    });

    if (!parentIssue) {
        return res.status(400).json({ success: false, message: 'Invalid parent_issue_id: Story not found.' });
    }

    if (parentIssue.issueType.type_name !== 'Story') {
        return res.status(400).json({ success: false, message: 'Bug/Task can only be created under a Story.' });
    }
}

    // --- Generate Issue Key and Issue Number ---
    const projectKey = projectExists.project_key; // Get the project key from the fetched project
    if (!projectKey) {
        return res.status(500).json({ success: false, message: 'Selected project does not have a key. Please ensure project keys are generated.' });
    }

    // Find the maximum existing issue_number for this project
    const maxIssueNumberResult = await AssignTask.findOne({
      where: { project_id: project_id, issue_number: { [Op.ne]: null } },
      attributes: [[sequelize.fn('MAX', sequelize.col('issue_number')), 'maxIssueNumber']],
      raw: true,
    });

    const nextIssueNumber = (maxIssueNumberResult && maxIssueNumberResult.maxIssueNumber) ? maxIssueNumberResult.maxIssueNumber + 1 : 1;
    const formattedIssueNumber = String(nextIssueNumber).padStart(2, '0');
    const issue_key = `${projectKey}-${formattedIssueNumber}`;

    // --- Sanitize and convert optional numeric fields from empty string to null/0 ---
    const parsedParentIssueId = parent_issue_id && isNumeric(parent_issue_id) ? parseInt(parent_issue_id) : null;
    const parsedStoryPoints = isNumeric(story_points) ? parseFloat(story_points) : null;
    const parsedTimeSpent = isNumeric(time_spent) ? parseFloat(time_spent) : 0;
    const parsedOriginalEstimate = isNumeric(original_estimate_hours) ? parseFloat(original_estimate_hours) : null; // Use null if empty
    const parsedRemainingEstimate = isNumeric(remaining_estimate_hours) ? parseFloat(remaining_estimate_hours) : parsedOriginalEstimate; // Default to original if remaining is empty

    const newAssignTask = await AssignTask.create({
      title,
      description: description || null,
      issue_type_id,
      parent_issue_id: parsedParentIssueId,
      project_id,
      team_id: team_id || null,
      organization_id,
      assignee_id: assignee_id || null,
      reporter_id,
      current_status_id,
      priority: priority || 'Medium',
      start_date: start_date || null,
      due_date: due_date || null,
      actual_start_date: actual_start_date || null,
      actual_end_date: actual_end_date || null,
      story_points: parsedStoryPoints,
      time_spent: parsedTimeSpent,
      original_estimate_hours: parsedOriginalEstimate,
      remaining_estimate_hours: parsedRemainingEstimate,
      attachment_url: attachment_url || null,
      remarks: remarks || null,
      issue_key,
      issue_number: nextIssueNumber,
    });

    // --- LOG: Issue Created Activity ---
    const reporterName = await getUserDisplayName(reporter_id);
    await IssueActivityLog.create({
      issue_id: newAssignTask.issue_id,
      user_id: reporter_id,
      activity_type: 'issue_created',
      description: `Issue created by ${reporterName}: ${newAssignTask.title} (${newAssignTask.issue_key})`,
    });

    // Fetch the newly created task with its associations for the response
    const createdTaskWithAssociations = await AssignTask.findByPk(newAssignTask.issue_id, {
      include: [
        { model: Project, as: 'project', attributes: ['project_id', 'project_name', 'project_key'] },
        { model: User, as: 'assignee', attributes: ['user_id', 'first_name', 'last_name', 'official_email_id'], required: false },
        { model: User, as: 'reporter', attributes: ['user_id', 'first_name', 'last_name', 'official_email_id'] },
        { model: StatusMaster, as: 'currentStatus', attributes: ['status_id', 'status_name'] },
        { model: IssueType, as: 'issueType', attributes: ['issue_type_id', 'type_name'] },
        { model: teams, as: 'team', attributes: ['id', 'name'], required: false }
      ]
    });

    const formattedNewTask = {
      issue_id: createdTaskWithAssociations.issue_id,
      issue_key: createdTaskWithAssociations.issue_key,
      issue_number: createdTaskWithAssociations.issue_number,
      title: createdTaskWithAssociations.title,
      description: createdTaskWithAssociations.description,
      issue_type_id: createdTaskWithAssociations.issue_type_id,
      issue_type_name: createdTaskWithAssociations.issueType ? createdTaskWithAssociations.issueType.type_name : null,
      parent_issue_id: createdTaskWithAssociations.parent_issue_id,
      project_id: createdTaskWithAssociations.project_id,
      project_name: createdTaskWithAssociations.project ? createdTaskWithAssociations.project.project_name : null,
      project_key: createdTaskWithAssociations.project ? createdTaskWithAssociations.project.project_key : null,
      team_id: createdTaskWithAssociations.team_id,
      team_name: createdTaskWithAssociations.team ? createdTaskWithAssociations.team.name : null,
      organization_id: createdTaskWithAssociations.organization_id,
      assignee_id: createdTaskWithAssociations.assignee_id,
      assignee_name: createdTaskWithAssociations.assignee ? `${createdTaskWithAssociations.assignee.first_name} ${createdTaskWithAssociations.assignee.last_name}` : null,
      assignee_email: createdTaskWithAssociations.assignee ? createdTaskWithAssociations.assignee.official_email_id : null,
      reporter_id: createdTaskWithAssociations.reporter_id,
      reporter_name: createdTaskWithAssociations.reporter ? `${createdTaskWithAssociations.reporter.first_name} ${createdTaskWithAssociations.reporter.last_name}` : null,
      reporter_email: createdTaskWithAssociations.reporter ? createdTaskWithAssociations.reporter.official_email_id : null,
      current_status_id: createdTaskWithAssociations.current_status_id,
      current_status_name: createdTaskWithAssociations.currentStatus ? createdTaskWithAssociations.currentStatus.status_name : null,
      priority: createdTaskWithAssociations.priority,
      start_date: createdTaskWithAssociations.start_date,
      due_date: createdTaskWithAssociations.due_date,
      actual_start_date: createdTaskWithAssociations.actual_start_date,
      actual_end_date: createdTaskWithAssociations.actual_end_date,
      story_points: createdTaskWithAssociations.story_points,
      time_spent: createdTaskWithAssociations.time_spent,
      original_estimate_hours: createdTaskWithAssociations.original_estimate_hours,
      remaining_estimate_hours: createdTaskWithAssociations.remaining_estimate_hours,
      attachment_url: createdTaskWithAssociations.attachment_url,
      remarks: createdTaskWithAssociations.remarks,
      created_at: createdTaskWithAssociations.created_at,
      updated_at: createdTaskWithAssociations.updated_at,
      deleted_at: createdTaskWithAssociations.deleted_at,
    };

    res.status(201).json({ success: true, message: 'Assign Task created successfully.', data: formattedNewTask });
  } catch (error) {
    console.error('❌ Error creating assign task:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'A task with this issue key already exists. Please try again.' });
    }
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all issues/tasks (for Kanban board, lists, etc.)
exports.getAllAssignTasks = async (req, res) => {
  try {
    const { projectId, assigneeId, statusId, type, parentId, search } = req.query;
    const organizationId = req.user.organization_id;
    const userRole = req.user.role;
    const userId = req.user.userId;

    let conditions = [
      { organization_id: organizationId },
      { deleted_at: null }
    ];

    if (projectId) conditions.push({ project_id: projectId });
    if (statusId) conditions.push({ current_status_id: statusId });
    if (parentId) conditions.push({ parent_issue_id: parentId });
    if (type) conditions.push({ issue_type_id: type });

    if (userRole.toLowerCase() === 'member') {
      const userTeams = await team_members.findAll({
        where: { user_id: userId, deleted_at: null },
        attributes: ['team_id']
      });
      const userTeamIds = userTeams.map(tm => tm.team_id);

      let memberOrConditions = [];

      // Always include tasks directly assigned to the user
      memberOrConditions.push({ assignee_id: userId });

      // If user is part of any team, include tasks assigned to their teams with no specific assignee
      if (userTeamIds.length > 0) {
        memberOrConditions.push({
          team_id: { [Op.in]: userTeamIds },
          assignee_id: { [Op.is]: null }
        });
      }

      // Now, combine these member-specific OR conditions with the main AND conditions.
      // The assigneeId filter from the frontend needs careful handling here.
      if (assigneeId) {
        // If an assigneeId is provided by the frontend filter:
        // If it's the current user's ID, the memberOrConditions already cover it.
        // If it's a different user's ID, we should override the memberOrConditions
        // and just filter by that specific assignee.
        if (String(assigneeId) === String(userId)) {
          // Frontend filter is 'My Tasks' or equivalent
          conditions.push({ [Op.or]: memberOrConditions });
        } else {
          // Frontend filter is for a specific *other* assignee
          conditions.push({ assignee_id: assigneeId });
        }
      } else {
        // If no assigneeId filter is provided (meaning 'All Assignees' for this member's view)
        // Apply the full memberOrConditions (direct tasks + team tasks)
        conditions.push({ [Op.or]: memberOrConditions });
      }
    } else if (assigneeId) {
      // For managers or other roles, if assigneeId is provided, apply it directly
      conditions.push({ assignee_id: assigneeId });
    }

    // Apply search filter
    if (search) {
      conditions.push({
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { issue_key: { [Op.like]: `%${search}%` } }
        ]
      });
    }

    const finalWhereClause = { [Op.and]: conditions };

    let includeClause = [
      { model: Project, as: 'project', attributes: ['project_id', 'project_name', 'project_key'] },
      { model: User, as: 'assignee', attributes: ['user_id', 'first_name', 'last_name', 'official_email_id'], required: false },
      { model: User, as: 'reporter', attributes: ['user_id', 'first_name', 'last_name', 'official_email_id'] },
      { model: StatusMaster, as: 'currentStatus', attributes: ['status_id', 'status_name'] },
      { model: IssueType, as: 'issueType', attributes: ['issue_type_id', 'type_name'] },
      { model: teams, as: 'team', attributes: ['id', 'name'], required: false }
    ];

    const assignTasks = await AssignTask.findAll({
      where: finalWhereClause,
      include: includeClause,
      order: [['updated_at', 'DESC']],
      attributes: {
        exclude: ['deleted_at', 'created_at', 'updated_at']
      }
    });

    const formattedTasks = assignTasks.map(task => ({
      issue_id: task.issue_id,
      issue_key: task.issue_key,
      issue_number: task.issue_number,
      title: task.title,
      description: task.description,
      issue_type_id: task.issue_type_id,
      issue_type_name: task.issueType ? task.issueType.type_name : null,
      parent_issue_id: task.parent_issue_id,
      project_id: task.project_id,
      project_name: task.project ? task.project.project_name : null,
      project_key: task.project ? task.project.project_key : null,
      team_id: task.team_id,
      team_name: task.team ? task.team.name : null,
      organization_id: task.organization_id,
      assignee_id: task.assignee_id,
      assignee_name: task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : null,
      assignee_email: task.assignee ? task.assignee.official_email_id : null,
      reporter_id: task.reporter_id,
      reporter_name: task.reporter ? `${task.reporter.first_name} ${task.reporter.last_name}` : null,
      reporter_email: task.reporter ? task.reporter.official_email_id : null,
      current_status_id: task.current_status_id,
      current_status_name: task.currentStatus ? task.currentStatus.status_name : null,
      priority: task.priority,
      start_date: task.start_date,
      due_date: task.due_date,
      actual_start_date: task.actual_start_date,
      actual_end_date: task.actual_end_date,
      story_points: task.story_points,
      time_spent: task.time_spent,
      original_estimate_hours: task.original_estimate_hours,
      remaining_estimate_hours: task.remaining_estimate_hours,
      attachment_url: task.attachment_url,
      remarks: task.remarks,
      created_at: task.created_at,
      updated_at: task.updated_at,
      deleted_at: task.deleted_at,
    }));

    res.status(200).json({ success: true, data: formattedTasks });
  } catch (error) {
    console.error('Error fetching assign tasks:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update only the status of an issue/task (for drag-and-drop)
exports.updateAssignTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatusId } = req.body;
    const organizationId = req.user.organization_id;
    const userRole = req.user.role;
    const userId = req.user.userId;

    const assignTask = await AssignTask.findOne({
      where: { issue_id: id, organization_id: organizationId }
    });

    if (!assignTask) {
      return res.status(404).json({ success: false, message: 'Assign Task not found or unauthorized.' });
    }

    // A member can update status if they are the assignee OR if the task is assigned to their team (and no specific assignee)
    if (userRole.toLowerCase() === 'member') {
      let isAuthorized = false;
      if (assignTask.assignee_id === userId) {
        isAuthorized = true;
      } else if (assignTask.team_id && assignTask.assignee_id === null) {
        const isTeamMember = await team_members.findOne({
          where: { user_id: userId, team_id: assignTask.team_id, deleted_at: null }
        });
        if (isTeamMember) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only update status for issues directly assigned to you or your team.' });
      }
    }

    const oldStatusId = assignTask.current_status_id;

    const statusExists = await StatusMaster.findByPk(newStatusId);
    if (!statusExists) {
      return res.status(400).json({ success: false, message: 'Invalid status ID provided.' });
    }

    assignTask.current_status_id = newStatusId;
    await assignTask.save();

    const userName = await getUserDisplayName(userId);
    const oldStatusName = await getStatusDisplayName(oldStatusId);
    const newStatusName = await getStatusDisplayName(newStatusId);

    await IssueActivityLog.create({
      issue_id: assignTask.issue_id,
      user_id: userId,
      activity_type: 'field_change',
      description: `Status changed by ${userName}`,
      field_name: 'status',
      old_value: oldStatusName,
      new_value: newStatusName,
    });

    res.status(200).json({ success: true, message: 'Assign Task status updated successfully.', data: assignTask });
  } catch (error) {
    console.error('Error updating assign task status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update an assigned task (generic for any field)
// @route   PUT /api/assign-tasks/:issue_id
// @access  Private (admin, manager, member)
exports.updateAssignTask = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { userId, organization_id, role } = req.user;
    const updates = req.body;

    const assignTask = await AssignTask.findOne({
      where: { issue_id: issue_id, organization_id: organization_id, deleted_at: null },
      include: [{ model: Project, as: 'project', attributes: ['project_id', 'project_name', 'project_manager_id'] }]
    });

    if (!assignTask) {
      return res.status(404).json({ success: false, message: 'Assign Task not found or unauthorized.' });
    }

    let isAuthorized = false;
    if (role.toLowerCase() === 'admin' || role.toLowerCase() === 'manager') {
      isAuthorized = true;
    } else if (role.toLowerCase() === 'member') {
      if (assignTask.assignee_id === userId || assignTask.reporter_id === userId) {
        isAuthorized = true;
      } else if (assignTask.team_id && assignTask.assignee_id === null) {
        const isTeamMember = await team_members.findOne({
          where: { user_id: userId, team_id: assignTask.team_id, deleted_at: null }
        });
        if (isTeamMember) {
          isAuthorized = true;
        }
      }
      if (assignTask.project && assignTask.project.project_id) {
        const isProjectManager = await ProjectAssignment.findOne({
          where: { project_id: assignTask.project.project_id, assigned_manager_id: userId, deleted_at: null }
        });
        if (isProjectManager) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to update this issue.' });
    }

    const updatedFields = {};
    const changes = [];
    const userName = await getUserDisplayName(userId);

    for (const field in updates) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        const oldValue = assignTask[field];
        const newValue = updates[field];

        // Handle numeric fields that might come as empty string from frontend
        let parsedNewValue = newValue;
        if (['story_points', 'original_estimate_hours', 'time_spent', 'remaining_estimate_hours'].includes(field)) {
            parsedNewValue = isNumeric(newValue) ? parseFloat(newValue) : null;
        }

        if (oldValue !== parsedNewValue) { // Compare parsed values
          updatedFields[field] = parsedNewValue;
          let oldDisplayValue = oldValue;
          let newDisplayValue = parsedNewValue; // Use parsed new value for display

          if (field === 'assignee_id') {
            oldDisplayValue = await getUserDisplayName(oldValue);
            newDisplayValue = await getUserDisplayName(newValue); // Use original newValue here for display of ID
          } else if (field === 'current_status_id') {
            oldDisplayValue = await getStatusDisplayName(oldValue);
            newDisplayValue = await getStatusDisplayName(newValue);
          } else if (field === 'issue_type_id') {
            oldDisplayValue = await getIssueTypeDisplayName(oldValue);
            newDisplayValue = await getIssueTypeDisplayName(newValue);
          } else if (field === 'project_id') {
            oldDisplayValue = await getProjectDisplayName(oldValue);
            newDisplayValue = await getProjectDisplayName(newValue);
          } else if (field === 'team_id') {
            oldDisplayValue = await getTeamDisplayName(oldValue);
            newDisplayValue = await getTeamDisplayName(newValue);
          }

          changes.push({
            field_name: field,
            old_value: oldDisplayValue,
            new_value: newDisplayValue,
          });
        }
      }
    }

    if (Object.keys(updatedFields).length === 0) {
      return res.status(200).json({ success: true, message: 'No changes detected for update.' });
    }

    await assignTask.update(updatedFields);

    for (const change of changes) {
      await IssueActivityLog.create({
        issue_id: assignTask.issue_id,
        user_id: userId,
        activity_type: 'field_change',
        description: `Updated ${change.field_name} from "${change.old_value || 'N/A'}" to "${change.new_value || 'N/A'}" by ${userName}`,
        field_name: change.field_name,
        old_value: String(change.old_value),
        new_value: String(change.new_value),
      });
    }

    res.status(200).json({ success: true, message: 'Assign Task updated successfully.', data: assignTask });
  } catch (error) {
    console.error('Error updating assign task:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get a single assigned task by ID with all details
// @route   GET /api/assign-tasks/:issue_id
// @access  Private
exports.getAssignedTaskById = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const organizationId = req.user.organization_id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const task = await AssignTask.findOne({
      where: { issue_id: issue_id, organization_id: organizationId },
      paranoid: false,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['project_id', 'project_name', 'project_key', 'project_manager_id'],
          required: false,
          paranoid: false,
          include: [{
            model: User,
            as: 'projectManager',
            attributes: ['user_id', 'first_name', 'last_name'],
            required: false,
            paranoid: false,
          }]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['user_id', 'first_name', 'last_name', 'official_email_id'],
          required: false,
          paranoid: false,
        },
        {
          model: User,
          as: 'reporter',
          attributes: ['user_id', 'first_name', 'last_name', 'official_email_id'],
          paranoid: false,
        },
        {
          model: StatusMaster,
          as: 'currentStatus',
          attributes: ['status_id', 'status_name'],
          paranoid: false,
        },
        {
          model: IssueType,
          as: 'issueType',
          attributes: ['issue_type_id', 'type_name'],
          paranoid: false,
        },
        {
          model: teams,
          as: 'team',
          attributes: ['id', 'name', 'manager_id'],
          required: false,
          paranoid: false,
          include: [{
            model: User,
            as: 'manager',
            attributes: ['user_id', 'first_name', 'last_name'],
            required: false,
            paranoid: false,
          }],
        },
        {
          association: 'parentIssue',
          attributes: ['issue_id', 'issue_key', 'title', 'issue_type_id'],
          required: false,
          paranoid: false,
          include: [{
              model: IssueType,
              as: 'issueType',
              attributes: ['type_name'],
              required: false
          }]
        }
      ],
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Assigned task not found or unauthorized.' });
    }

    let isAuthorized = false;
    if (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'manager') {
      isAuthorized = true;
    } else if (userRole.toLowerCase() === 'member') {
      if (task.assignee_id === userId || task.reporter_id === userId) {
        isAuthorized = true;
      } else if (task.team_id && task.assignee_id === null) {
        const isTeamMember = await team_members.findOne({
          where: { user_id: userId, team_id: task.team_id, deleted_at: null }
        });
        if (isTeamMember) {
          isAuthorized = true;
        }
      }
      if (task.project && task.project.project_id) {
        const isProjectManager = await ProjectAssignment.findOne({
          where: { project_id: task.project.project_id, assigned_manager_id: userId, deleted_at: null }
        });
        if (isProjectManager) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to view this issue.' });
    }

    const formattedTask = {
      issue_id: task.issue_id,
      title: task.title,
      description: task.description,
      issue_key: task.issue_key,
      issue_number: task.issue_number,
      parent_issue_id: task.parent_issue_id,
      parent_issue_key: task.parentIssue ? task.parentIssue.issue_key : null,
      parent_issue_title: task.parentIssue ? task.parentIssue.title : null,
      parent_issue_type_name: task.parentIssue && task.parentIssue.issueType ? task.parentIssue.issueType.type_name : null,
      priority: task.priority,
      start_date: task.start_date,
      due_date: task.due_date,
      actual_start_date: task.actual_start_date,
      actual_end_date: task.actual_end_date,
      story_points: task.story_points,
      time_spent: task.time_spent,
      original_estimate_hours: task.original_estimate_hours,
      remaining_estimate_hours: task.remaining_estimate_hours,
      attachment_url: task.attachment_url,
      remarks: task.remarks,
      created_at: task.created_at,
      updated_at: task.updated_at,
      deleted_at: task.deleted_at,
      project: task.project ? {
        project_id: task.project.project_id,
        project_name: task.project.project_name,
        project_key: task.project.project_key,
        project_manager_id: task.project.project_manager_id,
        project_manager_name: task.project.projectManager ? `${task.project.projectManager.first_name} ${task.project.projectManager.last_name}` : null,
      } : null,
      team: task.team ? {
        team_id: task.team.id,
        name: task.team.name,
        manager_id: task.team.manager_id,
        manager_name: task.team.manager ? `${task.team.manager.first_name} ${task.team.manager.last_name}` : null,
      } : null,
      assignee: task.assignee ? {
        user_id: task.assignee.user_id,
        first_name: task.assignee.first_name,
        last_name: task.assignee.last_name,
        full_name: `${task.assignee.first_name} ${task.assignee.last_name}`,
      } : null,
      reporter: task.reporter ? {
        user_id: task.reporter.user_id,
        first_name: task.reporter.first_name,
        last_name: task.reporter.last_name,
        full_name: `${task.reporter.first_name} ${task.reporter.last_name}`,
      } : null,
      currentStatus: task.currentStatus ? {
        status_id: task.currentStatus.status_id,
        status_name: task.currentStatus.status_name,
      } : null,
      issueType: task.issueType ? {
        issue_type_id: task.issueType.issue_type_id,
        type_name: task.issueType.type_name,
      } : null,
    };

    res.status(200).json({ success: true, data: formattedTask });
  } catch (error) {
    console.error('Error fetching assigned task by ID:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get Epic issues for a specific project
// @route   GET /api/epics/:projectId
// @access  Private (admin, manager, member)
exports.getEpicsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const organizationId = req.user.organization_id;
        const userRole = req.user.role;
        const userId = req.user.userId;

        let isAuthorized = false;
        // Simplified authorization check based on roles (admin, manager, member can view epics)
        if (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'manager' || userRole.toLowerCase() === 'member') {
            isAuthorized = true;
        }

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to view epics for this project.' });
        }

        const epicIssueType = await IssueType.findOne({ where: { type_name: 'Epic' } });
        if (!epicIssueType) {
            return res.status(404).json({ success: false, message: 'Epic issue type not found in database. Please ensure it exists.' });
        }

        const epics = await AssignTask.findAll({
            where: {
                project_id: projectId,
                issue_type_id: epicIssueType.issue_type_id,
                organization_id: organizationId,
                deleted_at: null
            },
            attributes: ['issue_id', 'issue_key', 'title'],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({ success: true, data: epics });

    } catch (error) {
        console.error('Error fetching epics by project:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// NEW FUNCTION: @desc    Get Story issues for a specific project
// NEW FUNCTION: @route   GET /api/stories/:projectId
// NEW FUNCTION: @access  Private (admin, manager, member)
exports.getStoriesByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const organizationId = req.user.organization_id;
        const userRole = req.user.role;
        const userId = req.user.userId;

        // Authorization check (similar to getEpicsByProject)
        let isAuthorized = false;
        if (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'manager' || userRole.toLowerCase() === 'member') {
            isAuthorized = true;
        }

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to view stories for this project.' });
        }

        const storyIssueType = await IssueType.findOne({ where: { type_name: 'Story' } });
        if (!storyIssueType) {
            return res.status(404).json({ success: false, message: 'Story issue type not found in database. Please ensure it exists.' });
        }

        const stories = await AssignTask.findAll({
            where: {
                project_id: projectId,
                issue_type_id: storyIssueType.issue_type_id,
                organization_id: organizationId,
                deleted_at: null
            },
            attributes: ['issue_id', 'issue_key', 'title'],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({ success: true, data: stories });

    } catch (error) {
        console.error('Error fetching stories by project:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get sub-issues for a specific parent issue (Epic)
// @route   GET /api/assign-tasks/sub-issues/:parentId
// @access  Private (admin, manager, member)
exports.getSubIssuesByParentId = async (req, res) => {
  try {
    const { parentId } = req.params;
    const organizationId = req.user.organization_id;
    const userRole = req.user.role;
    const userId = req.user.userId;

    // First, verify the parent issue exists and is an Epic within the organization
    const parentIssue = await AssignTask.findOne({
      where: { issue_id: parentId, organization_id: organizationId, deleted_at: null },
      include: [{ model: IssueType, as: 'issueType', attributes: ['type_name'] }]
    });

    if (!parentIssue) {
      return res.status(404).json({ success: false, message: 'Parent issue not found or unauthorized.' });
    }

    if (parentIssue.issueType.type_name.toLowerCase() !== 'epic') {
      return res.status(400).json({ success: false, message: 'The provided parent ID does not belong to an Epic issue type.' });
    }

    // Authorization check (similar to getAssignedTaskById)
    let isAuthorized = false;
    if (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'manager') {
      isAuthorized = true;
    } else if (userRole.toLowerCase() === 'member') {
      // A member can view sub-issues if they can view the parent Epic
      // This means they are the assignee/reporter of the Epic, or a member of the Epic's team,
      // or a project manager for the Epic's project.
      if (parentIssue.assignee_id === userId || parentIssue.reporter_id === userId) {
        isAuthorized = true;
      } else if (parentIssue.team_id && parentIssue.assignee_id === null) {
        const isTeamMember = await team_members.findOne({
          where: { user_id: userId, team_id: parentIssue.team_id, deleted_at: null }
        });
        if (isTeamMember) {
          isAuthorized = true;
        }
      }
      // Note: The previous logic for checking project manager for member was slightly off.
      // A member might be a project manager for a specific project, so this check is valid.
      if (parentIssue.project_id) {
        const isProjectManager = await Project.findOne({ // Check Project table for project_manager_id
          where: { project_id: parentIssue.project_id, project_manager_id: userId, deleted_at: null }
        });
        if (isProjectManager) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to view sub-issues for this Epic.' });
    }

    const subIssues = await AssignTask.findAll({
      where: {
        parent_issue_id: parentId,
        organization_id: organizationId,
        deleted_at: null
      },
      include: [
        { model: IssueType, as: 'issueType', attributes: ['type_name'] },
        { model: StatusMaster, as: 'currentStatus', attributes: ['status_name'] }
      ],
      attributes: ['issue_id', 'issue_key', 'title', 'issue_type_id', 'current_status_id', 'priority'],
      order: [['created_at', 'ASC']]
    });

    const formattedSubIssues = subIssues.map(issue => ({
      issue_id: issue.issue_id,
      issue_key: issue.issue_key,
      title: issue.title,
      issue_type_id: issue.issue_type_id,
      issue_type_name: issue.issueType ? issue.issueType.type_name : 'N/A',
      current_status_id: issue.current_status_id,
      current_status_name: issue.currentStatus ? issue.currentStatus.status_name : 'N/A',
      priority: issue.priority,
    }));

    res.status(200).json({ success: true, data: formattedSubIssues });

  } catch (error) {
    console.error('Error fetching sub-issues by parent ID:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Log time for an issue
// @route   POST /api/issues/:issue_id/log-time
// @access  Private
exports.logTimeForIssue = async (req, res) => {
  const { issue_id } = req.params;
  const { hours, comment } = req.body;
  const user_id = req.user.userId;
  const organizationId = req.user.organization_id;
  const userRole = req.user.role;

  if (!hours || hours <= 0) {
    return res.status(400).json({ success: false, message: 'Hours to log must be a positive number.' });
  }

  try {
    const task = await AssignTask.findOne({
      where: { issue_id: issue_id, organization_id: organizationId, deleted_at: null }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Assigned task not found or unauthorized.' });
    }

    let isAuthorized = false;
    if (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'manager') {
      isAuthorized = true;
    } else if (userRole.toLowerCase() === 'member') {
      if (task.assignee_id === user_id || task.reporter_id === user_id) {
        isAuthorized = true;
      } else if (task.team_id && task.assignee_id === null) {
        const isTeamMember = await team_members.findOne({
          where: { user_id: user_id, team_id: task.team_id, deleted_at: null }
        });
        if (isTeamMember) {
          isAuthorized = true;
        }
      }
      if (task.project && task.project.project_id) {
        const isProjectManager = await Project.findOne({ // Check Project table for project_manager_id
          where: { project_id: task.project.project_id, project_manager_id: user_id, deleted_at: null }
        });
        if (isProjectManager) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to log time for this issue.' });
    }

    // Update the time_spent and remaining_estimate_hours in assigned_tasks
    const newTimeSpent = (task.time_spent || 0) + hours;
    const newRemainingEstimate = Math.max(0, (task.remaining_estimate_hours || 0) - hours);

    await task.update({
      time_spent: newTimeSpent,
      remaining_estimate_hours: newRemainingEstimate,
    });

    // Log the time log activity in IssueActivityLog
    const userName = await getUserDisplayName(user_id);
    const description = `logged ${hours} hours`;
    const activityType = 'time_log';

    await IssueActivityLog.create({
      issue_id: issue_id,
      user_id: user_id,
      activity_type: activityType,
      description: `${userName} ${description}`,
      comment_text: comment || null,
      hours_logged: hours,
    });

    res.status(200).json({
      success: true,
      message: 'Time logged successfully',
      data: {
        issue_id: task.issue_id,
        time_spent: newTimeSpent,
        remaining_estimate_hours: newRemainingEstimate,
      }
    });
  } catch (error) {
    console.error('Error logging time for issue:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get activity logs for a specific issue
// @route   GET /api/issues/:issue_id/activity
// @access  Private
exports.getIssueActivityLogs = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const organizationId = req.user.organization_id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // First, verify the issue exists and belongs to the organization
    const issue = await AssignTask.findOne({
      where: { issue_id: issue_id, organization_id: organizationId, deleted_at: null },
      attributes: ['issue_id', 'project_id', 'team_id', 'assignee_id', 'reporter_id']
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found or unauthorized.' });
    }

    let isAuthorized = false;
    if (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'manager') {
      isAuthorized = true;
    } else if (userRole.toLowerCase() === 'member') {
      if (issue.assignee_id === userId || issue.reporter_id === userId) {
        isAuthorized = true;
      } else if (issue.team_id && issue.assignee_id === null) {
        const isTeamMember = await team_members.findOne({
          where: { user_id: userId, team_id: issue.team_id, deleted_at: null }
        });
        if (isTeamMember) {
          isAuthorized = true;
        }
      }
      if (issue.project_id) {
        const isProjectManager = await Project.findOne({ // Check Project table for project_manager_id
          where: { project_id: issue.project_id, project_manager_id: userId, deleted_at: null }
        });
        if (isProjectManager) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to view activity for this issue.' });
    }

    const activityLogs = await IssueActivityLog.findAll({
      where: { issue_id: issue_id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['first_name', 'last_name'],
      }],
      order: [['created_at', 'DESC']],
    });

    const formattedLogs = activityLogs.map(log => ({
      log_id: log.log_id,
      issue_id: log.issue_id,
      user_id: log.user_id,
      user_name: log.user ? `${log.user.first_name} ${log.user.last_name}` : `User ID ${log.user_id}`,
      activity_type: log.activity_type,
      description: log.description,
      comment_text: log.comment_text,
      field_name: log.field_name,
      old_value: log.old_value,
      new_value: log.new_value,
      hours_logged: log.hours_logged,
      created_at: log.created_at,
    }));

    res.status(200).json({ success: true, data: formattedLogs });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all projects for the authenticated organization with their assigned managers
exports.getAllProjects = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const projects = await Project.findAll({
      where: { organization_id: organizationId, deleted_at: null },
      attributes: ['project_id', 'project_name', 'project_key', 'project_manager_id'],
      include: [{
        model: User,
        as: 'projectManager',
        attributes: ['user_id', 'first_name', 'last_name'],
        required: false,
      }]
    });

    const formattedProjects = projects.map(p => {
      const manager = p.projectManager;

      return {
        project_id: p.project_id,
        project_name: p.project_name,
        project_key: p.project_key,
        project_manager_id: manager ? manager.user_id : null,
        project_manager_name: manager ? `${manager.first_name} ${manager.last_name}` : null
      };
    });

    res.status(200).json({ success: true, data: formattedProjects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all teams for the authenticated organization
exports.getAllTeams = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const teamsData = await teams.findAll({
      where: { organization_id: organizationId, deleted_at: null },
      attributes: ['id', 'name', 'manager_id'],
      include: [{
        model: User,
        as: 'manager',
        attributes: ['user_id', 'first_name', 'last_name'],
        required: false
      }]
    });
    const formattedTeams = teamsData.map(team => ({
      team_id: team.id,
      team_name: team.name,
      manager_id: team.manager_id,
      manager_name: team.manager ? `${team.manager.first_name} ${team.manager.last_name}` : null
    }));
    res.status(200).json({ success: true, data: formattedTeams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all users for the authenticated organization
exports.getAllUsers = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const users = await User.findAll({
      where: { organization_id: organizationId, deleted_at: null },
      attributes: ['user_id', 'first_name', 'last_name', 'official_email_id']
    });
    const formattedUsers = users.map(user => ({
      user_id: user.user_id,
      full_name: `${user.first_name} ${user.last_name}`,
      email: user.official_email_id
    }));
    res.status(200).json({ success: true, data: formattedUsers });
  }
  catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get users assigned to a specific team (for assignee dropdown) - REVISED
exports.getUsersByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const organizationId = req.user.organization_id;

    const teamMemberships = await team_members.findAll({
      where: {
        team_id: teamId,
        deleted_at: null
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['user_id', 'first_name', 'last_name', 'official_email_id'],
        where: { organization_id: organizationId, deleted_at: null }
      }]
    });

    const users = teamMemberships
      .filter(tm => tm.user)
      .map(tm => ({
        user_id: tm.user.user_id,
        full_name: `${tm.user.first_name} ${tm.user.last_name}`,
        email: tm.user.official_email_id
      }));

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users by team:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all issue types
exports.getAllIssueTypes = async (req, res) => {
  try {
    const issueTypes = await IssueType.findAll({
      attributes: ['issue_type_id', 'type_name']
    });
    res.status(200).json({ success: true, data: issueTypes });
  } catch (error) {
    console.error('Error fetching issue types:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all status master entries
exports.getAllStatusMaster = async (req, res) => {
  try {
    const statuses = await StatusMaster.findAll({
      attributes: ['status_id', 'status_name', 'order_index'],
      order: [['order_index', 'ASC']]
    });
    res.status(200).json({ success: true, data: statuses });
  } catch (error) {
    console.error('Error fetching statuses:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getSubIssuesByParentId = async (req, res) => {
    const { parentId } = req.params;

    try {
        const subIssues = await AssignTask.findAll({
            where: { parent_issue_id: parentId },
            include: [
                { model: IssueType, as: 'issueType', attributes: ['type_name'] },
                { model: StatusMaster, as: 'currentStatus', attributes: ['status_name'] }
            ]
        });

        res.status(200).json({ success: true, data: subIssues });
    } catch (error) {
        console.error('Error fetching sub-issues:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc Delete an assigned task (soft delete)
// @route DELETE /api/assign-tasks/:issue_id
// @access Private (admin, manager, or project manager/reporter)
exports.deleteAssignTask = async (req, res) => {
  try {
    // FIX: Change 'issue_id' to 'id' to match the route parameter name
    const { id } = req.params;
    const { userId, organization_id, role } = req.user;

    // Check if the parameter is present
    if (!id) {
      return res.status(400).json({ success: false, message: 'Issue ID is required.' });
    }

    const assignTask = await AssignTask.findOne({
      where: { issue_id: id, organization_id: organization_id, deleted_at: null },
      include: [{
        model: Project,
        as: 'project',
        attributes: ['project_id', 'project_name'],
        required: false,
      }]
    });

    if (!assignTask) {
      return res.status(404).json({ success: false, message: 'Assign Task not found or already deleted.' });
    }

    let isAuthorized = false;
    if (role.toLowerCase() === 'admin' || role.toLowerCase() === 'manager') {
      isAuthorized = true;
    } else {
      // Check if the user is the project manager of the task's project
      const isProjectManager = await ProjectAssignment.findOne({
        where: { project_id: assignTask.project.project_id, assigned_manager_id: userId, deleted_at: null }
      });
      if (isProjectManager) {
        isAuthorized = true;
      }
      // Or if the user is the reporter of the task
      if (assignTask.reporter_id === userId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to delete this issue.' });
    }

    // Perform a soft delete by setting the deleted_at timestamp
    await assignTask.update({ deleted_at: new Date() });

    // Log the deletion activity
    const userName = await getUserDisplayName(userId);
    await IssueActivityLog.create({
      issue_id: assignTask.issue_id,
      user_id: userId,
      activity_type: 'issue_deleted',
      description: `Issue deleted by ${userName}`
    });

    res.status(200).json({ success: true, message: 'Assign Task deleted successfully.', data: { issue_id: assignTask.issue_id } });

  } catch (error) {
    console.error('Error deleting assign task:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};