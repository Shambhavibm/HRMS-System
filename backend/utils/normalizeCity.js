// backend/utils/normalizeCity.js
const normalizeCity = (name) => {
  return name.trim().toLowerCase().replace(/[^a-z]/g, '');
};

module.exports = normalizeCity;
