const express = require("express");
const {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial
} = require("../controllers/materialController");
const { protectAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();
const materialUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 }
]);

router.get("/", getMaterials);
router.post("/", protectAdmin, materialUpload, createMaterial);
router.put("/:id", protectAdmin, materialUpload, updateMaterial);
router.delete("/:id", protectAdmin, deleteMaterial);

module.exports = router;
