const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Holiday = sequelize.define("holiday", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    date: DataTypes.DATEONLY,
    type: {
      type: DataTypes.ENUM("mandatory", "optional"),
      allowNull: false,
    },
    locations: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  });

  return Holiday;
};
