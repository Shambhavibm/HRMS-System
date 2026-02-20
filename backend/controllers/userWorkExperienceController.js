const { UserWorkExperience } = require("../models");
const fs = require("fs");
const path = require("path");

// GET: Fetch work experience
exports.getWorkExperience = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const data = await UserWorkExperience.findAll({
      where: { user_id: userId, deleted_at: null },
      order: [["created_at", "DESC"]],
      limit: 5,
    });

    res.json(data);
  } catch (error) {
    console.error("Error fetching work experience:", error);
    res.status(500).json({ message: "Failed to fetch work experience data." });
  }
};

// POST: Add new experience
exports.addWorkExperience = async (req, res) => {
  try {
    const { userId } = req.params;
    const organizationId = req.user?.organization_id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is missing from parameters." });
    }

    if (!organizationId) {
      return res.status(403).json({ message: "Organization ID is missing from authentication token." });
    }

    const {
      company_name,
      company_url,
      work_from,
      work_to,
      contact_number,
      contact_email,
    } = req.body;

    if (!company_name || !work_from || !work_to) {
      return res
        .status(400)
        .json({ message: "Company Name, Worked From, and Worked To are mandatory." });
    }

    const letterPath = req.file ? `uploads/${req.file.filename}` : null;

    const newWork = await UserWorkExperience.create({
      user_id: userId,
      organization_id: organizationId,
      company_name,
      company_url,
      work_from,
      work_to,
      contact_number,
      contact_email,
      letter: letterPath,
    });

    res.status(201).json({ message: "Work experience added successfully", data: newWork });
  } catch (error) {
    console.error("Error adding work experience:", error);
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => err.message);
      return res.status(400).json({ message: "Validation error", errors: errors });
    }
    res.status(500).json({ message: "Failed to add work experience." });
  }
};

// ✅ PUT: Update work experience
exports.updateWorkExperience = async (req, res) => {
  try {
    const { userId, experienceId } = req.params;
    const organizationId = req.user?.organization_id;

    // IMPORTANT: Basic validation for missing IDs
    if (!userId || !experienceId) {
        return res.status(400).json({ message: "User ID and Experience ID are required for update." });
    }
    if (!organizationId) {
        return res.status(403).json({ message: "Organization ID is missing from authentication token." });
    }

    const {
      company_name,
      company_url,
      work_from,
      work_to,
      contact_number,
      contact_email,
    } = req.body;

    // Add back the mandatory field validation as it's good practice for updates too
    if (!company_name || !work_from || !work_to) {
        return res.status(400).json({ message: "Company Name, Worked From, and Worked To are mandatory." });
    }

    const existingExperience = await UserWorkExperience.findOne({
      where: {
        work_experience_id: experienceId, // <--- CHANGED THIS LINE
        user_id: userId,
        organization_id: organizationId,
        deleted_at: null,
      },
    });

    if (!existingExperience) {
      return res.status(404).json({ message: "Work experience not found or unauthorized." });
    }

    // If new letter is uploaded
    if (req.file) {
      // Delete old file if it exists
      if (existingExperience.letter) {
        // Construct the full path to the old file relative to your project root
        // Adjust '..' as necessary based on your actual directory structure
        const oldPath = path.join(__dirname, "..", existingExperience.letter);
        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, (err) => { // Using async fs.unlink for non-blocking operation
            if (err) {
              console.error("Error deleting old letter file:", err);
            } else {
              console.log(`Successfully deleted old letter: ${oldPath}`);
            }
          });
        }
      }
      existingExperience.letter = `uploads/${req.file.filename}`;
    }

    // Update all other fields
    existingExperience.company_name = company_name;
    existingExperience.company_url = company_url;
    existingExperience.work_from = work_from;
    existingExperience.work_to = work_to;
    existingExperience.contact_number = contact_number;
    existingExperience.contact_email = contact_email;

    await existingExperience.save();

    res.json({ message: "Work experience updated successfully.", data: existingExperience });
  } catch (error) {
    console.error("Error updating work experience:", error);
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => err.message);
      return res.status(400).json({ message: "Validation error", errors: errors });
    }
    res.status(500).json({ message: "Failed to update work experience." });
  }
};