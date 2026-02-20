const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const IssueType = sequelize.define('IssueType', {
    issue_type_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // Ensure type names are unique
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true, // description can be null
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
  }, {
    tableName: 'issue_types', // Explicitly set table name
    timestamps: false, // Manage timestamps manually
    hooks: {
      afterSync: async (options) => {
        // This hook runs after the 'issue_types' table is synced.
        // We use findOrCreate to prevent inserting duplicates on subsequent syncs.

        const defaultIssueTypes = [
          { type_name: 'Story' },
          { type_name: 'Task' },
          { type_name: 'Bug' },
          { type_name: 'Epic' },
        ];

        // Removed: console.log('--- IssueType afterSync hook: Attempting to seed initial issue types ---');

        for (const issueTypeData of defaultIssueTypes) {
          try {
            await IssueType.findOrCreate({
              where: { type_name: issueTypeData.type_name }, // Check by unique name
              defaults: issueTypeData // Data to create if not found
            });
            // Removed: console.log(`✅ Issue Type '${issueType.type_name}' created.`);
            // Removed: console.log(`ℹ️ Issue Type '${issueType.type_name}' already exists. Skipping.`);
          } catch (error) {
            // Removed: console.error(`❌ Error seeding issue type '${issueTypeData.type_name}':`, error.message);
          }
        }
        // Removed: console.log('--- IssueType afterSync hook: Seeding complete ---');
      }
    }
  });

  return IssueType;
};
