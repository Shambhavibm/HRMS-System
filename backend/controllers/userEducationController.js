const { UserEducation } = require('../models'); 

exports.getEducation = async (req, res) => {
  try {
    const userId = req.user?.userId; 
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }
    const data = await UserEducation.findOne({ where: { user_id: userId } });
    res.json(data || {});
  } catch (error) {
    console.error("Error fetching education:", error);
    res.status(500).json({ message: "Failed to fetch education data" });
  }
};

exports.saveEducation = async (req, res) => {
  try {
    const userId = req.user?.userId; 
    const organizationId = req.body.organization_id; 

    console.log("Backend: userId from token:", userId);
    console.log("Backend: organizationId from req.body:", organizationId);
    console.log("Backend: req.body received:", req.body);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }
    if (!organizationId) {
        return res.status(400).json({ message: "Bad Request: Organization ID missing" });
    }

    const { user_id: bodyUserId, ...educationDetails } = req.body; 
    const existingEducation = await UserEducation.findOne({ where: { user_id: userId } });

    if (existingEducation) {
      await existingEducation.update(educationDetails);
      res.json({ message: "Education updated" });
    } else {
      await UserEducation.create({ 
        ...educationDetails,
        user_id: userId, 
        organization_id: organizationId,
      });
      res.json({ message: "Education created successfully" });
    }
  } catch (error) {
    console.error("Error saving education:", error);
    if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => err.message);
        return res.status(400).json({ message: "Validation error", errors: errors });
    }
    res.status(500).json({ message: "Failed to save education data" });
  }
};