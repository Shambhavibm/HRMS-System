const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const OptionalLeaveBooking = sequelize.define("optional_leave_booking", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    holiday_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return OptionalLeaveBooking;
};
