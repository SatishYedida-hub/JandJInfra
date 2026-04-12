const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const { uploadManyMedia } = require("../utils/mediaUpload");

const parseMaterials = (materialsInput) => {
  if (Array.isArray(materialsInput)) return materialsInput;
  if (typeof materialsInput === "string" && materialsInput.trim()) {
    try {
      const parsed = JSON.parse(materialsInput);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }
  return [];
};

const getProjects = asyncHandler(async (_req, res) => {
  const projects = await Project.find()
    .populate("materialsUsed", "name brand category imageUrl")
    .sort({ createdAt: -1 });
  res.json(projects);
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate(
    "materialsUsed",
    "name brand category imageUrl"
  );
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  res.json(project);
});

const createProject = asyncHandler(async (req, res) => {
  const materialsUsed = parseMaterials(req.body.materialsUsed);
  const imageUrls = await uploadManyMedia(
    req,
    req.files?.images || [],
    "infra/projects/images",
    "image"
  );
  const videoUrls = await uploadManyMedia(
    req,
    req.files?.videos || [],
    "infra/projects/videos",
    "video"
  );

  const project = await Project.create({
    name: req.body.name,
    description: req.body.description,
    materialsUsed,
    images: imageUrls,
    videos: videoUrls
  });

  const populated = await project.populate("materialsUsed", "name brand category imageUrl");
  res.status(201).json(populated);
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  project.name = req.body.name || project.name;
  project.description = req.body.description || project.description;
  if (req.body.materialsUsed) {
    project.materialsUsed = parseMaterials(req.body.materialsUsed);
  }

  const newImages = await uploadManyMedia(
    req,
    req.files?.images || [],
    "infra/projects/images",
    "image"
  );
  const newVideos = await uploadManyMedia(
    req,
    req.files?.videos || [],
    "infra/projects/videos",
    "video"
  );
  if (newImages.length) project.images = [...project.images, ...newImages];
  if (newVideos.length) project.videos = [...project.videos, ...newVideos];

  const updated = await project.save();
  const populated = await updated.populate("materialsUsed", "name brand category imageUrl");
  res.json(populated);
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  await project.deleteOne();
  res.json({ message: "Project deleted" });
});

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
