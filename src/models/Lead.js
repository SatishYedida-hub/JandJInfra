const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    whatsappOptIn: { type: Boolean, default: true },
    source: { type: String, default: "website-home" },
    status: {
      type: String,
      enum: ["new", "contacted", "converted"],
      default: "new"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
