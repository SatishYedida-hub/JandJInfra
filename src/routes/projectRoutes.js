const express = require("express");
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} = require("../controllers/projectController");
const { protectAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();
const mediaUpload = upload.fields([
  { name: "images", maxCount: 20 },
  { name: "videos", maxCount: 10 }
]);

router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", protectAdmin, mediaUpload, createProject);
router.put("/:id", protectAdmin, mediaUpload, updateProject);
router.delete("/:id", protectAdmin, deleteProject);

module.exports = router;
