const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StatusMaster = sequelize.define('StatusMaster', {
    status_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    status_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // Ensure status names are unique to prevent duplicates
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    tableName: 'status_master', // Explicitly set table name
    timestamps: false, // Manage timestamps manually
    // --- CRITICAL FIX: Add afterSync hook to seed initial data ---
    hooks: {
      afterSync: async (options) => {
        // This hook runs after the 'status_master' table is synced.
        // We use findOrCreate to prevent inserting duplicates on subsequent syncs.

        const defaultStatuses = [
          { status_name: 'To Do', order_index: 1 },
          { status_name: 'In Progress', order_index: 2 },
          { status_name: 'Done', order_index: 3 },
          { status_name: 'Accepted', order_index: 4 },
          { status_name: 'Released', order_index: 5 },
        ];

        // Removed: console.log('--- StatusMaster afterSync hook: Attempting to seed initial statuses ---');

        for (const statusData of defaultStatuses) {
          try {
            await StatusMaster.findOrCreate({
              where: { status_name: statusData.status_name }, // Check by unique name
              defaults: statusData // Data to create if not found
            });
            // Removed: console.log(`✅ Status '${status.status_name}' created.`);
            // Removed: console.log(`ℹ️ Status '${status.status_name}' already exists. Skipping.`);
          } catch (error) {
            // Removed: console.error(`❌ Error seeding status '${statusData.status_name}':`, error.message);
          }
        }
        // Removed: console.log('--- StatusMaster afterSync hook: Seeding complete ---');
      }
    }
  });

  return StatusMaster;
};
