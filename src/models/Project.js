const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    materialsUsed: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true }
    ],
    images: [{ type: String }],
    videos: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
