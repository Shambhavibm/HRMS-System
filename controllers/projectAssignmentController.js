const notificationService = require('../services/notificationService');
const { Project, ProjectAssignment, team_members, teams, User  } = require('../models');

// ✅ Get next assignment ID
exports.getNextAssignmentId = async (req, res) => {
  try {
    const latest = await ProjectAssignment.findOne({
      order: [['assignment_id', 'DESC']],
    });

    const nextId = latest ? latest.assignment_id + 1 : 1;
    res.json({ nextId });
  } catch (err) {
    console.error("❌ Error fetching next assignment ID:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Create a new project assignment
exports.createAssignment = async (req, res) => {
  try {
    const { project_id, team_id, assigned_manager_id } = req.body;
    const { organization_id } = req.user;

    const newAssignment = await ProjectAssignment.create({
      project_id,
      team_id,
      assigned_manager_id,
      organization_id,
    });

    const project = await Project.findByPk(project_id, { attributes: ['project_name'] });
    const projectName = project ? project.project_name : 'Unnamed Project';

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: newAssignment,
    });

    await notificationService.createNotification({
      organizationId: organization_id,
      recipientUserId: assigned_manager_id,
      senderUserId: req.user.user_id,
      notificationType: 'project_assignment',
      title: 'New Project Assigned',
      message: `You have been assigned to a new project: "${projectName}" (ID: ${project_id}).`,
      resourceType: 'project',
      resourceId: project_id,
    });

    // Notify each team member
    
const members = await team_members.findAll({ where: { team_id } });

  for (const member of members) {
    await notificationService.createNotification({
      organizationId: organization_id,
      recipientUserId: member.user_id,
      senderUserId: req.user.user_id,
       notificationType: 'project_assignment',
      title: 'You Have Been Assigned to a Project',
      message: `You have been added to the project "${projectName}" (ID: ${project_id}) as a team member.`,
      resourceType: 'project',
      resourceId: project_id,
    });
  }


  } catch (err) {
    console.error("❌ Error creating project assignment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Update existing project assignment
exports.updateAssignment = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const { team_id, assigned_manager_id } = req.body;

    const assignment = await ProjectAssignment.findByPk(assignment_id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    assignment.team_id = team_id;
    assignment.assigned_manager_id = assigned_manager_id;
    await assignment.save();

    const project = await Project.findByPk(assignment.project_id, { attributes: ['project_name'] });
    const projectName = project ? project.project_name : 'Unnamed Project';

    await notificationService.createNotification({
      organizationId: assignment.organization_id,
      recipientUserId: assigned_manager_id,
      senderUserId: req.user.user_id,
      notificationType: 'project_assignment',
      title: 'Project Assignment Updated',
      message: `Your project assignment has been updated for "${projectName}" (ID: ${assignment.project_id}).`,
      resourceType: 'project',
      resourceId: assignment.project_id,
    });

    // Notify updated team members
const members = await team_members.findAll({ where: { team_id } });

for (const member of members) {
  await notificationService.createNotification({
    organizationId: assignment.organization_id,
    recipientUserId: member.user_id,
    senderUserId: req.user.user_id,
    notificationType: 'project_assignment',
    title: 'Project Assignment Updated',
    message: `Your team has been updated for the project "${projectName}" (ID: ${assignment.project_id}).`,
    resourceType: 'project',
    resourceId: assignment.project_id,
  });
}



    res.status(200).json({ message: "Assignment updated successfully", assignment });
  } catch (err) {
    console.error("❌ Error updating assignment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Delete project assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    const assignment = await ProjectAssignment.findByPk(assignment_id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const project = await Project.findByPk(assignment.project_id, { attributes: ['project_name'] });
    const projectName = project ? project.project_name : 'Unnamed Project';

    await assignment.destroy();

    await notificationService.createNotification({
      organizationId: assignment.organization_id,
      recipientUserId: assignment.assigned_manager_id,
      senderUserId: req.user.user_id,
      notificationType: 'project_assignment',
      title: 'Project Assignment Removed',
      message: `You have been unassigned from the project "${projectName}" (ID: ${assignment.project_id}).`,
      resourceType: 'project',
      resourceId: assignment.project_id,
    });

    // Notify former team members
const members = await team_members.findAll({ where: { team_id: assignment.team_id } });

for (const member of members) {
  await notificationService.createNotification({
    organizationId: assignment.organization_id,
    recipientUserId: member.user_id,
    senderUserId: req.user.user_id,
    notificationType: 'project_assignment',
    title: 'Project Assignment Removed',
     message: `You have been removed from the project "${projectName}" (ID: ${assignment.project_id}).`,
    resourceType: 'project',
    resourceId: assignment.project_id,
  });
}



    res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting assignment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// to get projects in viewproject sub module in admin dashboard
// ✅ View Projects - With manager_id included in response
exports.viewProjects = async (req, res) => {
  try {
    const { organization_id } = req.user;

    const projectList = await Project.findAll({
      where: { organization_id },
      include: [
        {
          model: ProjectAssignment,
          as: 'assignments',
          where: { organization_id },
          required: false,
          include: [
            {
              model: teams,
              as: 'team',
              attributes: ['name'],
            },
            {
              model: User,
              as: 'assigned_manager',
              attributes: ['first_name', 'last_name', 'profile_picture_url'],
            },
          ],
        },
      ],
    });

    const formatted = projectList.map((project) => {
      const assignment = project.assignments?.[0];
      const teamName = assignment?.team?.name || "-";
      const manager = assignment?.assigned_manager;
      const managerName = manager ? `${manager.first_name} ${manager.last_name}` : "-";
      const managerImage = manager?.profile_picture_url
        ? `http://localhost:5001/${manager.profile_picture_url}`
        : "/default-avatar.png";

      const managerId = assignment?.assigned_manager_id || null; // ✅ include manager_id for filtering

      return {
        project_id: project.project_id,
        project_name: project.project_name,
        status: project.status,
        team_name: teamName,
        start_date: project.start_date,       // ✅ Add this
        end_date: project.end_date,     
        team_id: assignment?.team_id || null, // ✅ Add this line
        manager_name: managerName,
        manager_image: managerImage,
        manager_id: managerId, // ✅ this is what the frontend uses for filtering
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ Error in viewProjects:", error);
    res.status(500).json({ message: "Failed to fetch project view data" });
  }
};



// ✅ Get list of already assigned project_ids
exports.getAssignedProjects = async (req, res) => {
  try {
    const assignments = await ProjectAssignment.findAll({
      attributes: ['project_id']
    });

    const assignedProjectIds = assignments.map(a => a.project_id);
    res.status(200).json(assignedProjectIds);
  } catch (error) {
    console.error("❌ Error fetching assigned projects:", error);
    res.status(500).json({ message: "Failed to fetch assigned projects" });
  }
};

// to edit project details
exports.getProjectAssignmentByProjectId = async (req, res) => {
  try {
    const assignment = await ProjectAssignment.findOne({
      where: { project_id: req.params.projectId },
      include: [
        { model: User, as: 'assigned_manager' }, // <-- THIS IS THE CRITICAL CHANGE!
        { model: teams, as: 'team' }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (err) {
    console.error("Error fetching assignment:", err);
    res.status(500).json({ message: 'Server error' });
  }
};
