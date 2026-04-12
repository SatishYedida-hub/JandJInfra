const asyncHandler = require("../utils/asyncHandler");
const Lead = require("../models/Lead");
const { notifyLeadCreated } = require("../utils/leadNotifier");

const createLead = asyncHandler(async (req, res) => {
  const { name, phone, city, whatsappOptIn } = req.body;
  if (!name || !phone || !city) {
    res.status(400);
    throw new Error("name, phone and city are required");
  }

  const lead = await Lead.create({
    name,
    phone,
    city,
    whatsappOptIn: Boolean(whatsappOptIn)
  });

  await notifyLeadCreated(lead);

  res.status(201).json({
    message: "Designer request submitted successfully",
    leadId: lead._id
  });
});

const getLeads = asyncHandler(async (_req, res) => {
  const leads = await Lead.find().sort({ createdAt: -1 });
  res.json(leads);
});

const updateLeadStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["new", "contacted", "converted"].includes(status)) {
    res.status(400);
    throw new Error("Invalid lead status");
  }

  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  lead.status = status;
  const updated = await lead.save();
  res.json(updated);
});

module.exports = { createLead, getLeads, updateLeadStatus };
