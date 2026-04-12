const jwt = require("jsonwebtoken");

const generateToken = (adminId) =>
  jwt.sign({ id: adminId }, process.env.JWT_SECRET, { expiresIn: "1d" });

module.exports = generateToken;
