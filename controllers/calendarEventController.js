const fs = require("fs");
const csv = require("csv-parser");
const { CalendarEvent, team_members, User } = require("../models");

exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      start_date,
      end_date,
      type,
      event_level,
      scope,
      team_id,
      target_user_id: frontend_target_user_id,
    } = req.body;

    const { organization_id, userId: created_by_user_id_from_token, role } = req.user;

    let targetUserIdForDB = null;

    // Role-based validation
    if (role === "admin") {
      if (scope !== "organization") {
        return res.status(403).json({ error: "Admins can only create organization-wide events." });
      }
    } else if (role === "manager") {
      if (!["private", "team"].includes(scope)) {
        return res.status(403).json({ error: "Managers can only create private or team events." });
      }

      if (scope === "private") {
        if (!frontend_target_user_id) {
          return res.status(400).json({ error: "Target user ID is required for private events." });
        }

        const targetUser = await User.findByPk(frontend_target_user_id);
        if (!targetUser || targetUser.organization_id !== organization_id) {
          return res.status(400).json({ error: "Target user not found or not in your organization." });
        }

        targetUserIdForDB = frontend_target_user_id;
      } else if (scope === "team") {
        if (!team_id) {
          return res.status(400).json({ error: "Team ID is required for team events." });
        }
        // (Optional: validate manager owns this team)
      }
    } else if (role === "employee") {
      if (scope !== "private") {
        return res.status(403).json({ error: "Employees can only create private events for themselves." });
      }
      targetUserIdForDB = created_by_user_id_from_token;
    } else {
      return res.status(403).json({ error: "Unauthorized role for event creation." });
    }

    const event = await CalendarEvent.create({
      title,
      description,
      start_date,
      end_date,
      type,
      event_level: event_level || "Normal",
      scope,
      team_id: scope === "team" ? team_id : null,
      target_user_id: targetUserIdForDB,
      created_by_user_id: created_by_user_id_from_token,
      organization_id,
    });

    res.status(201).json(event);
  } catch (err) {
    console.error("❌ Create event error:", err);
    res.status(500).json({ error: err.message || "Failed to create event" });
  }
};

// 🧠 Event Visibility: everyone sees org events; team members see team events; individuals see their own private events
exports.getVisibleEvents = async (req, res) => {
  try {
    const { organization_id, userId: current_user_id } = req.user;

    const teamMemberships = await team_members.findAll({
      where: { user_id: current_user_id },
      attributes: ["team_id"],
    });
    const userTeamIds = teamMemberships.map((m) => m.team_id);

    const events = await CalendarEvent.findAll({ where: { organization_id } });

    const visible = events.filter((e) => {
      const teamMatch = e.scope === "team" && userTeamIds.includes(e.team_id);
      const privateMatch = e.scope === "private" && e.target_user_id === current_user_id;
      const orgMatch = e.scope === "organization";
      const createdBySelf = e.created_by_user_id === current_user_id;
      return orgMatch || teamMatch || privateMatch || createdBySelf;
    });

    res.json(visible);
  } catch (err) {
    console.error("❌ Fetch event error:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

// ✅ Bulk Upload Events via CSV
exports.bulkUploadEvents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required." });
    }

    const results = [];
    const errors = [];
    const skipped = [];
    const { organization_id, userId, role } = req.user;

    if (role !== "admin") {
      return res.status(403).json({ message: "Only admins can perform bulk uploads." });
    }

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          try {
            const { title, start_date, end_date, type, scope } = row;

            if (!title || !start_date || !end_date || !type || !scope) {
              throw new Error(`Missing required fields in row ${i + 1}`);
            }

            const duplicate = await CalendarEvent.findOne({
              where: {
                title,
                start_date,
                end_date,
                type,
                scope,
                organization_id,
              },
            });

            if (duplicate) {
              skipped.push({ row: i + 1, reason: "Duplicate event found." });
              continue;
            }

            await CalendarEvent.create({
              title,
              description: row.description || "",
              start_date,
              end_date,
              type,
              scope,
              team_id: null,
              target_user_id: null,
              created_by_user_id: userId,
              organization_id,
              event_level: "Normal",
            });
          } catch (err) {
            errors.push({ row: i + 1, error: err.message });
          }
        }

        return res.status(207).json({
          message: "Bulk upload completed.",
          added: results.length - errors.length - skipped.length,
          skipped: skipped.length,
          errors,
          skippedDetails: skipped,
        });
      })
      .on("error", (err) => {
        return res.status(500).json({ message: "Error parsing CSV", error: err.message });
      });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
