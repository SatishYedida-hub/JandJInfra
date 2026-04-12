const express = require("express");
const { createLead, getLeads, updateLeadStatus } = require("../controllers/leadController");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", createLead);
router.get("/", protectAdmin, getLeads);
router.put("/:id/status", protectAdmin, updateLeadStatus);

module.exports = router;
