// backend/controllers/issueActivityLogController.js
const { IssueActivityLog, AssignTask, User, Project, StatusMaster, IssueType, teams } = require('../models');
const { Op } = require('sequelize'); // Not strictly needed here, but good to have if future logic requires it

// --- Helper Functions to get human-readable names from IDs ---
// These are duplicated here for self-containment of this controller.
// In a very large application, these might live in a shared 'utils' or 'helpers' file.
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


// --- 1. Add a comment to an issue ---
exports.addIssueComment = async (req, res) => {
  const { id } = req.params; // issue_id
  const { commentText } = req.body;
  const userId = req.user ? req.user.userId : null;

  if (!commentText || commentText.trim() === '') {
    return res.status(400).json({ success: false, message: 'Comment text cannot be empty.' });
  }
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: User not logged in.' });
  }

  try {
    const issue = await AssignTask.findByPk(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    const userName = await getUserDisplayName(userId);
    const description = `${userName} added a comment.`; // Human-readable description

    const newComment = await IssueActivityLog.create({
      issue_id: id,
      user_id: userId,
      activity_type: 'comment',
      comment_text: commentText.trim(),
      description: description, // Populate the new description field
    });

    // Fetch the created comment with user details for immediate display
    const fetchedComment = await IssueActivityLog.findByPk(newComment.log_id, {
      include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }]
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      data: {
        log_id: fetchedComment.log_id,
        issue_id: fetchedComment.issue_id,
        user_id: fetchedComment.user_id,
        user_name: fetchedComment.user ? `${fetchedComment.user.first_name} ${fetchedComment.user.last_name}` : 'Unknown User',
        activity_type: fetchedComment.activity_type,
        comment_text: fetchedComment.comment_text,
        description: fetchedComment.description, // Return the description
        created_at: fetchedComment.created_at,
      }
    });
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// --- 2. Log time on an issue ---
exports.logIssueTime = async (req, res) => {
  const { id } = req.params; // issue_id
  const { hours, comment } = req.body;
  const userId = req.user ? req.user.userId : null;

  if (!hours || isNaN(parseFloat(hours)) || parseFloat(hours) <= 0) {
    return res.status(400).json({ success: false, message: 'Hours to log must be a positive number.' });
  }
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: User not logged in.' });
  }

  try {
    const assignTask = await AssignTask.findByPk(id);
    if (!assignTask) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    const parsedHours = parseFloat(hours);

    // Update time_spent and remaining_estimate_hours
    const newTimeSpent = (parseFloat(assignTask.time_spent) || 0) + parsedHours;
    let newRemainingEstimate = (parseFloat(assignTask.remaining_estimate_hours) || 0) - parsedHours;
    if (newRemainingEstimate < 0) newRemainingEstimate = 0; // Don't go below zero

    await assignTask.update({
      time_spent: newTimeSpent,
      remaining_estimate_hours: newRemainingEstimate,
      updated_at: new Date(), // Manually update timestamp to reflect time logging
    });

    const userName = await getUserDisplayName(userId);
    let description = `${userName} logged ${parsedHours} hours.`;
    if (comment) {
      description += ` Comment: "${comment}"`;
    }

    // --- LOG: Time Logged Activity ---
    await IssueActivityLog.create({
      issue_id: id,
      user_id: userId,
      activity_type: 'time_log',
      hours_logged: parsedHours,
      log_comment: comment || null,
      description: description, // Populate the new description field
    });

    res.status(200).json({
      success: true,
      message: 'Time logged successfully.',
      data: {
        issue_id: assignTask.issue_id,
        time_spent: newTimeSpent,
        remaining_estimate_hours: newRemainingEstimate,
      }
    });
  } catch (error) {
    console.error('❌ Error logging time:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


// --- 3. Get all activities and comments for an issue ---
exports.getIssueActivity = async (req, res) => {
  const { id } = req.params; // issue_id

  try {
    const issue = await AssignTask.findByPk(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    const activities = await IssueActivityLog.findAll({
      where: { issue_id: id },
      include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }],
      order: [['created_at', 'ASC']], // Chronological order
    });

    // We already populate the 'description' field in the database, so we just return it.
    // The previous formatting logic is now mostly handled at creation/update time.
    const formattedActivities = activities.map((log) => {
      const userName = log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Unknown User';
      return {
        log_id: log.log_id,
        user_id: log.user_id,
        user_name: userName,
        activity_type: log.activity_type,
        description: log.description, // Directly use the stored description
        comment_text: log.comment_text, // Only present for 'comment' type
        hours_logged: log.hours_logged, // Only present for 'time_log' type
        field_name: log.field_name, // Only present for 'field_change' type
        old_value: log.old_value,   // Only present for 'field_change' type
        new_value: log.new_value,   // Only present for 'field_change' type
        created_at: log.created_at,
      };
    });

    res.status(200).json({ success: true, data: formattedActivities });
  } catch (error) {
    console.error('❌ Error fetching issue activity:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
