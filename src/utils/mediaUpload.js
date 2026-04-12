const fs = require("fs/promises");
const cloudinary = require("../config/cloudinary");

const hasCloudinaryConfig = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const localFileUrl = (req, file) =>
  `${process.env.BASE_URL || `${req.protocol}://${req.get("host")}`}/uploads/${file.filename}`;

const uploadSingleMedia = async (req, file, folder, resourceType = "auto") => {
  if (!file) return "";

  if (!hasCloudinaryConfig()) {
    return localFileUrl(req, file);
  }

  const uploaded = await cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: resourceType
  });

  await fs.unlink(file.path).catch(() => {});
  return uploaded.secure_url;
};

const uploadManyMedia = async (req, files = [], folder, resourceType = "auto") => {
  const urls = [];
  for (const file of files) {
    const url = await uploadSingleMedia(req, file, folder, resourceType);
    if (url) urls.push(url);
  }
  return urls;
};

module.exports = { uploadSingleMedia, uploadManyMedia, hasCloudinaryConfig };
