const path = require("path");
const multer = require("multer");
const { env } = require("../config/env");

const storage = multer.memoryStorage();

function imageOnlyFilter(req, file, cb) {
  const isImage = file.mimetype && file.mimetype.startsWith("image/");
  if (!isImage) return cb(null, false);
  cb(null, true);
}

const baseUpload = multer({
  storage,
  limits: { fileSize: env.UPLOAD_MAX_BYTES },
  fileFilter: imageOnlyFilter,
});

/** Images + PDF + common Insomnia/browser octet-stream for picked files */
function managerProofFileFilter(req, file, cb) {
  const mime = String(file.mimetype || "").toLowerCase();
  const ext = path.extname(String(file.originalname || "")).toLowerCase();
  const imageLike = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif", ".bmp", ".tif", ".tiff"];

  if (mime.startsWith("image/")) return cb(null, true);
  if (mime === "application/pdf") return cb(null, true);
  if (mime === "application/octet-stream" || mime === "binary/octet-stream") {
    if (imageLike.includes(ext) || ext === ".pdf") return cb(null, true);
    if (!ext) return cb(null, true);
    return cb(null, false);
  }
  return cb(null, false);
}

const managerProofUpload = multer({
  storage,
  limits: { fileSize: env.UPLOAD_MAX_BYTES },
  fileFilter: managerProofFileFilter,
});

/** Field names Insomnia/Postman may use (camelCase + snake_case + short) */
const MANAGER_REGISTRATION_FILE_FIELDS = [
  { name: "propertyOwnershipProof", maxCount: 1 },
  { name: "property_ownership_proof", maxCount: 1 },
  { name: "ownershipProof", maxCount: 1 },
  { name: "telebirrMerchantAccountProof", maxCount: 1 },
  { name: "telebirr_merchant_account_proof", maxCount: 1 },
  { name: "telebirrProof", maxCount: 1 },
];

function uploadManagerRegistrationFiles() {
  return managerProofUpload.fields(MANAGER_REGISTRATION_FILE_FIELDS);
}

function uploadSingle(field) {
  return baseUpload.single(field);
}

function uploadArray(field, maxCount) {
  return baseUpload.array(field, maxCount);
}

function uploadFields(fields) {
  return baseUpload.fields(fields);
}

module.exports = {
  uploadSingle,
  uploadArray,
  uploadFields,
  uploadManagerRegistrationFiles,
};
