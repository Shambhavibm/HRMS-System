const { Holiday, optional_leave_booking, User, sequelize } = require("../models");
const normalizeCity = require("../utils/normalizeCity");
// Create holiday
exports.createHoliday = async (req, res) => {
  const data = await Holiday.create(req.body);  // ✅ Fix here
  res.json(data);
};

// Get all holidays
exports.getHolidays = async (req, res) => {
  const all = await Holiday.findAll({ order: [["date", "ASC"]] });  // ✅ Fix here
  res.json(all);
};

// Book optional holiday
exports.bookOptionalLeaves = async (req, res) => {
 const userId = req.user?.userId || req.user?.id;

  const selectedHolidayIds = req.body.holiday_ids;

  if (!Array.isArray(selectedHolidayIds) || selectedHolidayIds.length > 2) {
    return res.status(400).json({ error: "Select up to 2 optional holidays only." });
  }

  // Delete existing bookings for user
  await optional_leave_booking.destroy({ where: { user_id: userId } });

  // Create new bookings
  const records = selectedHolidayIds.map((id) => ({
    user_id: userId,
    holiday_id: id,
  }));

  await optional_leave_booking.bulkCreate(records);
  res.json({ message: "Optional holidays booked." });
};

// View who booked which optional holiday (admin use)

exports.getOptionalBookings = async (req, res) => {
  try {
    const bookings = await optional_leave_booking.findAll({
      include: [
        {
          model: User,
          as: "employee",
          attributes: [
            [sequelize.literal("CONCAT(employee.first_name, ' ', employee.last_name)"), "full_name"],
            "official_email_id"
          ]
        },
        {
          model: Holiday,
          as: "holiday",
          attributes: ["name", "date"]
        }
      ]
    });

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching optional bookings:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// GET /api/holidays/mandatory
exports.getMandatoryHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.findAll({
      where: { type: 'mandatory' },
      order: [['date', 'ASC']],
    });
    res.json(holidays);
  } catch (err) {
    console.error('Error fetching mandatory holidays', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getLocationFilteredHolidays = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    const userLocation = normalizeCity(user?.work_location || "");

    if (!userLocation) {
      return res.status(400).json({ message: "User work location not defined" });
    }

    // Fetch all holidays
    const holidays = await Holiday.findAll();

    // Mandatory holidays for user's location
    const mandatoryHolidays = holidays.filter(h => {
      if (h.type !== "mandatory") return false;
      let locations = [];
      try {
        locations = JSON.parse(h.locations || "[]");
      } catch {
        return false;
      }
      return locations.map(normalizeCity).includes(userLocation);
    });

    // Fetch booked optional holidays
    const bookedOptional = await optional_leave_booking.findAll({
      where: { user_id: req.user.userId },
      include: [{ model: Holiday, as: "holiday" }],
    });

    const optionalHolidays = bookedOptional
      .map(b => b.holiday)
      .filter(h => {
        if (!h || h.type !== "optional") return false;
        let locations = [];
        try {
          locations = JSON.parse(h.locations || "[]");
        } catch {
          return false;
        }
        return locations.map(normalizeCity).includes(userLocation);
      });

    res.json([...mandatoryHolidays, ...optionalHolidays]);
  } catch (err) {
    console.error("Error fetching location-filtered holidays:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/admin/holidays — fetch all holidays (no filtering)
exports.getAllHolidaysForAdmin = async (req, res) => {
  try {
    const holidays = await Holiday.findAll({
      order: [["date", "ASC"]],
    });
    res.json(holidays);
  } catch (err) {
    console.error("Error fetching all holidays for admin:", err);
    res.status(500).json({ error: "Failed to fetch all holidays" });
  }
};


