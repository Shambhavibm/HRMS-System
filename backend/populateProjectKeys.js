// Save this as `backend/populateProjectKeys.js`
// Then run it from your terminal: `node backend/populateProjectKeys.js`

require('dotenv').config(); // Load environment variables
const { sequelize } = require('./config/db'); // Your database connection
const { Project } = require('./models'); // Your Project model
const { Op } = require('sequelize'); // Import Op for OR condition

// Re-use the key generation logic from your projectController
async function generateUniqueProjectKey(projectName) {
  let baseKey = projectName
    .split(/\s+/)
    .filter(word => word.length > 0) // Filter out empty strings from split
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();

  if (baseKey.length === 0) {
    baseKey = "PROJ"; // Default if name is just spaces or special chars
  } else if (baseKey.length > 5) {
    baseKey = projectName.substring(0, 5).toUpperCase();
  }

  let finalKey = baseKey;
  let counter = 0;
  let keyExists = true;

  while (keyExists) {
    const existingProject = await Project.findOne({
      where: { project_key: finalKey }
    });

    if (existingProject) {
      counter++;
      finalKey = `${baseKey}${counter}`;
    } else {
      keyExists = false;
    }
  }
  return finalKey;
}

async function populateExistingProjectKeys() {
  try {
    // Ensure models are synced first (though server start should have done this)
    await sequelize.sync(); 

    console.log('Starting to populate project_key for existing projects...');

    const projectsToUpdate = await Project.findAll({
      where: {
        [Op.or]: [ // Look for project_key that is NULL OR empty string
          { project_key: null },
          { project_key: '' }
        ]
      }
    });

    if (projectsToUpdate.length === 0) {
      console.log('No existing projects found with null or empty project_key. All good!');
      return;
    }

    console.log(`Found ${projectsToUpdate.length} projects to update.`);

    for (const project of projectsToUpdate) {
      const newKey = await generateUniqueProjectKey(project.project_name);
      await project.update({ project_key: newKey });
      console.log(`Updated project ID ${project.project_id} ('${project.project_name}') with key: ${newKey}`);
    }

    console.log('Finished populating project_key for existing projects.');

  } catch (error) {
    console.error('❌ Error during project key population script:', error);
  } finally {
    // Close the DB connection when done
    await sequelize.close();
  }
}

// Execute the population function
populateExistingProjectKeys();
