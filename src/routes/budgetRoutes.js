const express = require("express");
const { exportBudget } = require("../controllers/budgetController");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/export-budget", protectAdmin, exportBudget);

module.exports = router;
