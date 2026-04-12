const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Infrastructure", "Interior"]
    },
    imageUrl: { type: String, required: true },
    videoUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);