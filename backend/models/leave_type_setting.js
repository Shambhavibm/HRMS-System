module.exports = (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;

  return sequelize.define('leave_type_setting', {
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
   type: {
  type: DataTypes.STRING,
  allowNull: false
}
,
    max_days_per_year: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    carry_forward: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    encashable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    description: {
      type: DataTypes.TEXT
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'leave_type_settings',
    timestamps: false
  });
};
