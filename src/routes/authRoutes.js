const express = require("express");
const { loginAdmin, getMe } = require("../controllers/authController");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/me", protectAdmin, getMe);

module.exports = router;
