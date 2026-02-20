const { OfficeLocation } = require("../models");
const normalizeCity = require("../utils/normalizeCity");

exports.getCities = async (req, res) => {
  try {
    const locations = await OfficeLocation.findAll({
      attributes: ["city"],
      where: { is_active: true },
      group: ["city"],
    });

    // Capitalize city names and remove null/undefined
    const cities = locations
      .map(loc => loc.city)
      .filter(Boolean)
      .map(city => city.charAt(0).toUpperCase() + city.slice(1).toLowerCase());

    res.json([...new Set(cities)]); // remove duplicates
  } catch (err) {
    console.error("Error fetching cities", err);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
};


exports.addOfficeCity = async (req, res) => {
  const { city } = req.body;

  if (!city || typeof city !== "string") {
    return res.status(400).json({ error: "City name is required" });
  }

  const normalized = normalizeCity(city);

  try {
    const existing = await OfficeLocation.findOne({
      where: { normalized_city: normalized },
    });

    if (existing) {
      return res.status(409).json({ error: "This city or a similar variant already exists" });
    }

    const newCity = await OfficeLocation.create({
      organization_id: req.user.organization_id,
      city: city.trim(),
      normalized_city: normalized,
      name: city.trim(), // ✅ FIX: Add this line to satisfy the 'name' field
      location_type: "Branch Office",
      is_active: true,
    });

    res.status(201).json({ message: "City added successfully", city: newCity });
  } catch (err) {
    console.error("Failed to add city:", err);
    res.status(500).json({ error: "Server error while adding city" });
  }
};