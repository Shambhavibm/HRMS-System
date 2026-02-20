// Save this as `backend/populateTaskKeys.js`
// Then run it from your terminal: `node backend/populateTaskKeys.js`

require('dotenv').config(); // Load environment variables
const { sequelize } = require('./config/db'); // Your database connection
const { AssignTask, Project } = require('./models'); // Your AssignTask and Project models
const { Op } = require('sequelize'); // Import Op for OR condition

async function populateExistingTaskKeys() {
  try {
    // Ensure models are synced first (though server start should have done this)
    await sequelize.sync();

    console.log('Starting to populate issue_key and issue_number for existing tasks...');

    // Find tasks where issue_key or issue_number is NULL or empty string
    const tasksToUpdate = await AssignTask.findAll({
      where: {
        [Op.or]: [
          { issue_key: null },
          { issue_key: '' },
          { issue_number: null }
        ]
      },
      include: [{
        model: Project,
        as: 'project',
        attributes: ['project_key'] // Need the project_key to form the issue_key
      }]
    });

    if (tasksToUpdate.length === 0) {
      console.log('No existing tasks found with null/empty issue_key or issue_number. All good!');
      return;
    }

    console.log(`Found ${tasksToUpdate.length} tasks to update.`);

    // Group tasks by project_id to determine next issue_number sequentially per project
    const tasksByProject = tasksToUpdate.reduce((acc, task) => {
      if (!acc[task.project_id]) {
        acc[task.project_id] = [];
      }
      acc[task.project_id].push(task);
      return acc;
    }, {});

    for (const projectId in tasksByProject) {
      const tasksInProject = tasksByProject[projectId];

      // Find the maximum existing issue_number for this project
      const maxIssueNumberResult = await AssignTask.findOne({
        where: { project_id: projectId, issue_number: { [Op.ne]: null } },
        attributes: [[sequelize.fn('MAX', sequelize.col('issue_number')), 'maxIssueNumber']],
        raw: true, // Return raw data, not a Sequelize instance
      });

      let nextIssueNumber = (maxIssueNumberResult && maxIssueNumberResult.maxIssueNumber) ? maxIssueNumberResult.maxIssueNumber + 1 : 1;

      for (const task of tasksInProject) {
        if (!task.project || !task.project.project_key) {
          console.warn(`Skipping task ID ${task.issue_id}: Project key not found for project ID ${task.project_id}.`);
          continue;
        }

        const projectKey = task.project.project_key;
        const formattedIssueNumber = String(nextIssueNumber).padStart(2, '0'); // e.g., 1 -> '01'
        const newIssueKey = `${projectKey}-${formattedIssueNumber}`;

        // Update the task
        await task.update({
          issue_key: newIssueKey,
          issue_number: nextIssueNumber
        });
        console.log(`Updated task ID ${task.issue_id} ('${task.title}') with key: ${newIssueKey}`);
        nextIssueNumber++; // Increment for the next task in this project
      }
    }

    console.log('Finished populating issue_key and issue_number for existing tasks.');

  } catch (error) {
    console.error('❌ Error during task key population script:', error);
  } finally {
    // Close the DB connection when done
    await sequelize.close();
  }
}

// Execute the population function
populateExistingTaskKeys();
