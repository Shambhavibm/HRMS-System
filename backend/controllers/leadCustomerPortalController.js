const { lead_customer_portal } = require("../models");
const { sendLeadConfirmationEmail } = require("../utils/emailService");

exports.createLead = async (req, res) => {
  try {
    const { full_name, email, contact_number, company_name, message } = req.body;

    const lead = await lead_customer_portal.create({
      full_name,
      email,
      contact_number,
      company_name,
      message,
      created_at: new Date(),
    });

    await sendLeadConfirmationEmail(email, full_name);

    res.status(201).json({ message: "Lead created successfully", lead });
  } catch (error) {
    console.error("Lead creation failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};