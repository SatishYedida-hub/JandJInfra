const Material = require("../models/Material");
const asyncHandler = require("../utils/asyncHandler");
const { uploadSingleMedia } = require("../utils/mediaUpload");

const getMaterials = asyncHandler(async (_req, res) => {
  const materials = await Material.find().sort({ createdAt: -1 });
  res.json(materials);
});

const createMaterial = asyncHandler(async (req, res) => {
  const { name, brand, category } = req.body;
  const imageFile = req.files?.image?.[0];
  const videoFile = req.files?.video?.[0];

  if (!imageFile) {
    res.status(400);
    throw new Error("Image is required");
  }

  const imageUrl = await uploadSingleMedia(req, imageFile, "infra/materials", "image");
  const videoUrl = await uploadSingleMedia(req, videoFile, "infra/materials", "video");

  const material = await Material.create({
    name,
    brand,
    category,
    imageUrl,
    videoUrl
  });
  res.status(201).json(material);
});

const updateMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }

  material.name = req.body.name || material.name;
  material.brand = req.body.brand || material.brand;
  material.category = req.body.category || material.category;
  if (req.files?.image?.[0]) {
    material.imageUrl = await uploadSingleMedia(
      req,
      req.files.image[0],
      "infra/materials",
      "image"
    );
  }
  if (req.files?.video?.[0]) {
    material.videoUrl = await uploadSingleMedia(
      req,
      req.files.video[0],
      "infra/materials",
      "video"
    );
  }

  const updated = await material.save();
  res.json(updated);
});

const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }

  await material.deleteOne();
  res.json({ message: "Material deleted" });
});

module.exports = { getMaterials, createMaterial, updateMaterial, deleteMaterial };
