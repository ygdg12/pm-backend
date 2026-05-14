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

/** PDF and other non-image uploads must use `raw` on Cloudinary; images use `auto`. */
function inferResourceType(mimetype, filename) {
  const mime = String(mimetype || "").toLowerCase();
  const ext = String(filename || "").toLowerCase().split(".").pop();
  if (mime === "application/pdf" || ext === "pdf") return "raw";
  if (mime.startsWith("image/")) return "auto";
  if (mime === "application/octet-stream" && ext === "pdf") return "raw";
  return "auto";
}

/**
 * Upload a single file buffer to Cloudinary.
 * @returns {Promise<{ secureUrl: string, publicId: string }>}
 */
async function uploadBufferToCloudinary({
  buffer,
  filename,
  folder = "pm-backend/general",
  resourceType,
  mimetype,
}) {
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

  const rt = resourceType || inferResourceType(mimetype, filename);

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: rt,
          use_filename: true,
          filename_override: safeName,
        },
        (err, res) => {
          if (err) return reject(err);
          if (!res?.secure_url) return reject(new Error("Cloudinary upload returned no URL"));
          resolve(res);
        }
      );
      uploadStream.end(buffer);
    });
    return { secureUrl: result.secure_url, publicId: result.public_id };
  } catch (err) {
    const msg = err && err.message ? String(err.message) : "Upload failed";
    const hint =
      rt === "raw"
        ? " If this was a PDF, ensure the file is a valid PDF and under your Cloudinary plan limits."
        : " Allowed types include common image formats and PDF (for documents).";
    throw badRequest(`Cloudinary upload failed: ${msg}.${hint}`, { cloudinary: err?.http_code || true });
  }
}

module.exports = { uploadBufferToCloudinary, isCloudinaryConfigured, cloudinary, inferResourceType };
