const asyncHandler = require("../utils/asyncHandler");
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email: String(email || "").toLowerCase() });

  if (!admin || !(await admin.matchPassword(password || ""))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    token: generateToken(admin._id),
    admin: { id: admin._id, email: admin.email }
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json(req.admin);
});

module.exports = { loginAdmin, getMe };
