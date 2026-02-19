const { Project, ProjectCost, ProjectUpdate, User, ProjectMilestone, ProjectAssignment, teams, team_members } = require("../models");
const { Op } = require('sequelize');

// ✅ Helper: Generate a unique project key from the project name
async function generateUniqueProjectKey(projectName) {
  let baseKey = projectName
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();

  if (baseKey.length === 0) {
    baseKey = "PROJ";
  } else if (baseKey.length > 5) {
    baseKey = projectName.substring(0, 5).toUpperCase();
  }

  let finalKey = baseKey;
  let counter = 0;
  let keyExists = true;

  while (keyExists) {
    const existingProject = await Project.findOne({ where: { project_key: finalKey } });
    if (existingProject) {
      counter++;
      finalKey = `${baseKey}${counter}`;
    } else {
      keyExists = false;
    }
  }
  return finalKey;
}

// ✅ Check if user is assigned to a project
async function isUserAssignedToProject(userId, organizationId, projectId) {
  const assignedProjectCount = await Project.count({
    where: {
      project_id: projectId,
      organization_id,
      [Op.or]: [
        { '$assignments.assigned_manager_id$': userId },
        { '$assignments.team.members.user_id$': userId }
      ]
    },
    include: [{
      model: ProjectAssignment,
      as: 'assignments',
      attributes: [],
      required: true,
      include: [{
        model: teams,
        as: 'team',
        attributes: [],
        required: true,
        include: [{
          model: team_members,
          as: 'members',
          attributes: [],
          required: true
        }]
      }]
    }]
  });

  return assignedProjectCount > 0;
}

// ✅ Create Project
exports.createProject = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { project_name, ...restOfBody } = req.body;

    const project_key = await generateUniqueProjectKey(project_name);

    const maxProject = await Project.findOne({
      order: [["project_id", "DESC"]],
      where: { organization_id }
    });
    const nextId = maxProject ? maxProject.project_id + 1 : 1;

    const payload = {
      project_id: nextId,
      project_name,
      project_key,
      ...restOfBody,
      organization_id,
    };

    const project = await Project.create(payload);
    res.status(201).json({ message: "Project created successfully", project });
  } catch (err) {
    console.error("❌ Error creating project:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get next project ID
exports.getNextProjectId = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const maxProject = await Project.findOne({
      order: [["project_id", "DESC"]],
      where: { organization_id }
    });
    const nextId = maxProject ? maxProject.project_id + 1 : 1;
    res.json({ nextId });
  } catch (err) {
    console.error("❌ Error fetching next project ID:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get all projects (filtered by user role)
exports.getAllProjects = async (req, res) => {
  try {
    const { organization_id, userId, role } = req.user;
    let whereClause = { organization_id };
    let includeClause = [];

    if (role !== 'admin') {
      whereClause[Op.or] = [
        { '$assignments.assigned_manager_id$': userId },
        { '$assignments.team.members.user_id$': userId }
      ];
      includeClause.push({
        model: ProjectAssignment,
        as: 'assignments',
        attributes: [],
        required: true,
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
        }]
      });
    }

    const projects = await Project.findAll({
      where: whereClause,
      include: includeClause,
      attributes: [
        'project_id',
        'project_name',
        'client_name',
        'client_address',
        'status',
        'start_date',
        'end_date',
        'progress_percent',
        'project_key'
      ],
      order: [['project_id', 'ASC']]
    });

    res.json(projects);
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    res.status(500).json({ message: "Failed to load projects" });
  }
};

// ✅ Update Project
exports.updateProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { organization_id, userId, role } = req.user;

    const project = await Project.findOne({ where: { project_id, organization_id } });
    if (!project) return res.status(404).json({ message: "Project not found or unauthorized" });

    if (role !== 'admin') {
      const isAssigned = await isUserAssignedToProject(userId, organization_id, project_id);
      if (!isAssigned) return res.status(403).json({ message: "Unauthorized to update this project." });
    }

    await project.update(req.body);
    res.status(200).json({ message: "Project updated successfully", project });
  } catch (err) {
    console.error("❌ Error updating project:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { organization_id, role } = req.user;

    const project = await Project.findOne({ where: { project_id, organization_id } });
    if (!project) return res.status(404).json({ message: "Project not found or unauthorized" });

    if (role !== 'admin') return res.status(403).json({ message: "Only admins can delete projects." });

    await project.destroy();
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting project:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { organization_id, userId, role } = req.user;
    const projectId = req.params.id;

    const project = await Project.findOne({
      where: { project_id: projectId },
    });

    if (!project) return res.status(404).json({ message: 'Project not found or unauthorized' });

    if (role !== 'admin') {
      const isAssigned = await isUserAssignedToProject(userId, organization_id, projectId);
      if (!isAssigned) return res.status(403).json({ message: "Unauthorized to view this project." });
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Get projects with costs and approved updates
exports.getProjectsWithDetails = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { organization_id: req.user.organization_id },
      attributes: [
        'project_id',
        'project_name',
        'project_key',
        'client_name',
        'status',
        'start_date',
        'end_date',
        'progress_percent'
      ],
      include: [
        {
          model: ProjectCost,
          include: [{ model: User, attributes: ['first_name', 'last_name'] }]
        },
        {
          model: ProjectUpdate,
          where: { approval_status: 'Approved' },
          required: false,
          include: [{ model: User, attributes: ['first_name', 'last_name'] }]
        }
      ],
      order: [['start_date', 'DESC']]
    });

    res.json(projects);
  } catch (error) {
    console.error("❌ Failed to fetch project details:", error);
    res.status(500).json({ error: 'Failed to fetch projects with details' });
  }
};

// ✅ Get single project with costs, milestones, and all updates
exports.getProjectDetails = async (req, res) => {
  const projectId = req.params.id;
  try {
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: ProjectCost,
          include: [{ model: User, attributes: ['first_name', 'last_name'] }]
        },
        {
          model: ProjectMilestone,
        },
        {
          model: ProjectUpdate,
          include: [{ model: User, attributes: ['first_name', 'last_name'] }]
        }
      ]
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    console.error("❌ Failed to fetch project details:", error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
};