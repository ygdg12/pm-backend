require("../config/env");
const cloudinary = require("cloudinary").v2;
const { badRequest } = require("../utils/httpError");

function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET)
  );
}

function configureFromEnv() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
    return;
  }
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
}

configureFromEnv();

/**
 * Upload a single file buffer to Cloudinary.
 * @returns {Promise<{ secureUrl: string, publicId: string }>}
 */
function uploadBufferToCloudinary({ buffer, filename, folder = "pm-backend/general", resourceType = "auto" }) {
  if (!isCloudinaryConfigured()) {
    throw badRequest(
      "File uploads are not configured. Set CLOUDINARY_URL (from the Cloudinary dashboard) or set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw badRequest("Empty file buffer");
  }

  const safeName = String(filename || "upload")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        filename_override: safeName,
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url) return reject(new Error("Cloudinary upload returned no URL"));
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

module.exports = { uploadBufferToCloudinary, isCloudinaryConfigured, cloudinary };
