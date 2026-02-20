const { ProjectCost, Project, User, ProjectAssignment, teams, team_members, sequelize } = require("../models"); // Ensure all necessary models and sequelize are imported
const { Op } = require('sequelize'); 

// data isolotion code
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

// ✅ Add Cost Entry
exports.addCostEntry = async (req, res) => {
    try {
        const { item_name, amount, description, category } = req.body;
        const { id: projectId } = req.params;

        const userIdFromToken = req.user.userId;
        const organizationIdFromToken = req.user.organization_id;
        const userRole = req.user.role; 

        // Basic validation
        if (!item_name || !amount || !category) {
            return res.status(400).json({ error: 'Item name, amount, and category are required' });
        }

        // Validate amount is a positive number
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number.' });
        }

        // Authorization check: Only assigned users (or admin) can add costs
        if (userRole !== 'admin') {
            const isAssigned = await isUserAssignedToProject(userIdFromToken, organizationIdFromToken, projectId);
            if (!isAssigned) {
                return res.status(403).json({ message: "Unauthorized to add cost to this project." });
            }
        }

        // Create the new cost entry
        const cost = await ProjectCost.create({
            item_name,
            description,
            category,
            amount: parsedAmount, 
            project_id: projectId,
            added_by: userIdFromToken,
            added_on: new Date(), 
            organization_id: organizationIdFromToken
        });

        // Update the project's budget
        const project = await Project.findByPk(projectId, {
            where: { organization_id: organizationIdFromToken } 
        });

       if (project) {
            const newBudget = (parseFloat(project.budget) || 0) + parsedAmount;
            await project.update({ budget: newBudget });
            console.log(`✅ Project ${projectId} budget increased. New budget: ${newBudget}`);
        } else {
            console.warn(`Project with ID ${projectId} not found for cost update. Budget not adjusted.`);
        }

        res.status(201).json(cost);
    } catch (err) {
        console.error('Failed to add cost entry:', err);
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: 'Validation error when adding cost entry',
                details: err.errors.map(e => e.message)
            });
        }
        res.status(500).json({ error: 'Failed to add cost entry due to server error.' });
    }
};


// ✅ Get project cost summary grouped by project
exports.getCostSummary = async (req, res) => {
  try {
    const { organization_id, userId, role } = req.user;

    let whereClause = { organization_id };
    let includeProjectClause = {
      model: Project,
      as: 'project',
      attributes: ['project_name'],
      required: true
    };

    // Filter projects if not admin
    if (role !== 'admin') {
      const assignedProjects = await ProjectAssignment.findAll({
        where: {
          organization_id,
          [Op.or]: [
            { assigned_manager_id: userId },
            { '$team.members.user_id$': userId }
          ]
        },
        include: [{
          model: teams,
          as: 'team',
          include: [{
            model: team_members,
            as: 'members'
          }]
        }],
        attributes: ['project_id'],
        raw: true
      });

      const projectIds = assignedProjects.map(pa => pa.project_id);
      if (projectIds.length === 0) return res.json([]);

      whereClause.project_id = { [Op.in]: projectIds };
    }

    const costs = await ProjectCost.findAll({
      where: whereClause,
      include: [
        includeProjectClause
      ],
      attributes: ['item_name','category',  'amount', 'added_on'],
      order: [['added_on', 'DESC']]
    });

    const formatted = costs.map(entry => ({
      projectName: entry.project?.project_name || 'N/A',
      category: entry.category,
      itemName: entry.item_name || 'Unknown',
      totalSpent: parseFloat(entry.amount),
      description: entry.description || '',
      date: entry.added_on
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error in getCostSummary:", error);
    res.status(500).json({ error: 'Failed to fetch cost summary.' });
  }
};


// ✅ Get detailed cost history
exports.getCostHistory = async (req, res) => {
    try {
        const { organization_id, userId, role } = req.user;

        let whereClause = { organization_id: organization_id };
        let includeProjectClause = {
            model: Project,
            as: 'project', 
            attributes: ['project_name'],
            required: true
        };

        // If not admin, filter projects by user's assignments
        if (role !== 'admin') {
            const assignedProjects = await ProjectAssignment.findAll({
                where: {
                    organization_id: organization_id,
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
            whereClause.project_id = { [Op.in]: projectIds };
        }

        const costHistory = await ProjectCost.findAll({
            where: whereClause,
            include: [
                includeProjectClause, 
                {
                    model: User,
                    as: 'addedByUser', 
                    attributes: ['first_name', 'last_name']
                }
            ],
            order: [['added_on', 'DESC']] 
        });

        const formatted = costHistory.map(entry => ({
            cost_id: entry.cost_id,
            item_name: entry.item_name,
            category: entry.category,
            amount: parseFloat(entry.amount), 
            added_on: entry.added_on,
            project_name: entry.project?.project_name || 'N/A', 
            added_by_user: entry.addedByUser ? `${entry.addedByUser.first_name} ${entry.addedByUser.last_name}` : 'N/A' 
        }));

        res.json(formatted);
    } catch (err) {
        console.error("❌ Error fetching cost history:", err);
        res.status(500).json({ error: 'Failed to load cost history' });
    }
};

// ✅ Update the cost summary in costhistory admin dashboard
exports.updateCostEntry = async (req, res) => {
    try {
        const { cost_id } = req.params; // Assuming route parameter is :cost_id
        const { item_name, amount, description, category } = req.body;
        const { organization_id, userId, role } = req.user;

        // Basic validation
        if (!item_name || !amount || !category) {
            return res.status(400).json({ error: 'Item name, amount, and category are required' });
        }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number.' });
        }


        const costEntry = await ProjectCost.findOne({
            where: {
                cost_id,
                organization_id: organization_id
            }
        });

        if (!costEntry) {
            return res.status(404).json({ error: 'Cost entry not found or unauthorized' });
        }

        if (role !== 'admin' && costEntry.added_by !== userId) {
             // Fetch the project to check manager assignment
            const isAssigned = await isUserAssignedToProject(userId, organization_id, costEntry.project_id);
            if (!isAssigned) {
                return res.status(403).json({ message: "Unauthorized to update this cost entry." });
            }
        }

        // Store old amount for budget adjustment
        const oldAmount = parseFloat(costEntry.amount);

        await costEntry.update({
            item_name,
            amount: parsedAmount,
            description,
            category
        });

        // Update the project's budget based on the change in cost
        const project = await Project.findByPk(costEntry.project_id, {
            where: { organization_id: organization_id }
        });

        if (project) {
            const amountDifference = parsedAmount - oldAmount;
            const newBudget = (parseFloat(project.budget) || 0) - amountDifference;
            await project.update({ budget: newBudget });
        } else {
            console.warn(`Project with ID ${costEntry.project_id} not found for cost update. Budget not adjusted.`);
        }

        res.status(200).json({ message: 'Cost entry updated successfully', costEntry });
    } catch (error) {
        console.error('❌ Error updating cost entry:', error);
        res.status(500).json({ error: 'Internal server error while updating cost entry' });
    }
};

// ✅ Delete cost entry
exports.deleteCostEntry = async (req, res) => {
    try {
        const { cost_id } = req.params; 
        const { organization_id, userId, role } = req.user;

        const costEntry = await ProjectCost.findOne({
            where: {
                cost_id,
                organization_id: organization_id
            }
        });

        if (!costEntry) {
            return res.status(404).json({ error: 'Cost entry not found or unauthorized' });
        }
        if (role !== 'admin' && costEntry.added_by !== userId) {
            const isAssigned = await isUserAssignedToProject(userId, organization_id, costEntry.project_id);
            if (!isAssigned) {
                return res.status(403).json({ message: "Unauthorized to delete this cost entry." });
            }
        }

        const deletedAmount = parseFloat(costEntry.amount);

        await costEntry.destroy(); 
        // Re-adjust the project's budget by adding the deleted amount back
        const project = await Project.findByPk(costEntry.project_id, {
            where: { organization_id: organization_id }
        });

        if (project) {
                const newBudget = (parseFloat(project.budget) || 0) + deletedAmount;
            await project.update({ budget: newBudget });
            console.log(`✅ Project ${project.project_id} budget re-adjusted after deletion. New budget: ${newBudget}`);
        } else {
            console.warn(`Project with ID ${costEntry.project_id} not found for cost adjustment after deletion. Budget not adjusted.`);
        }

        res.status(200).json({ message: 'Cost entry deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting cost entry:', error);
        res.status(500).json({ error: 'Internal server error while deleting cost entry' });
    }
};
