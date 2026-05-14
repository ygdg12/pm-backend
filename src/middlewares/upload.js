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

/** Field names Insomnia/Postman may use (camelCase + snake_case + short + lowercase) */
const MANAGER_REGISTRATION_FILE_FIELDS = [
  { name: "propertyOwnershipProof", maxCount: 1 },
  { name: "propertyownershipproof", maxCount: 1 },
  { name: "property_ownership_proof", maxCount: 1 },
  { name: "ownershipProof", maxCount: 1 },
  { name: "telebirrMerchantAccountProof", maxCount: 1 },
  { name: "telebirrmerchantaccountproof", maxCount: 1 },
  { name: "telebirr_merchant_account_proof", maxCount: 1 },
  { name: "telebirrProof", maxCount: 1 },
];

function uploadManagerRegistrationFiles() {
  return managerProofUpload.fields(MANAGER_REGISTRATION_FILE_FIELDS);
}

/** Property listing: accept any file field names (Insomnia often uses "file", "photo", etc.) — max 10 image parts */
const propertyImagesMulter = multer({
  storage,
  limits: { fileSize: env.UPLOAD_MAX_BYTES, files: 10 },
  fileFilter: imageOnlyFilter,
});

function uploadPropertyImagesAny() {
  return propertyImagesMulter.any();
}

/** Lease request: ID/passport + optional extras (same MIME rules as manager proofs) */
const leaseRequestDocMulter = multer({
  storage,
  limits: { fileSize: env.UPLOAD_MAX_BYTES, files: 15 },
  fileFilter: managerProofFileFilter,
});

/** Accept any part names (Insomnia/Postman vary); controller picks ID file by known aliases. */
function uploadLeaseRequestCreateFiles() {
  return leaseRequestDocMulter.any();
}

function uploadLeaseRequestCompletePhysical() {
  return leaseRequestDocMulter.fields([
    { name: "digitalCopy", maxCount: 1 },
    { name: "digital_copy", maxCount: 1 },
    { name: "signedContractPhoto", maxCount: 10 },
    { name: "signed_contract_photo", maxCount: 10 },
  ]);
}

function uploadLeaseRequestAdditionalDocs() {
  return leaseRequestDocMulter.fields([
    { name: "additionalDocument", maxCount: 5 },
    { name: "additional_document", maxCount: 5 },
  ]);
}

/** Payment proof: receipt/screenshot (images + PDF). Any field name; controller picks first matching file. */
function uploadPaymentProofFiles() {
  return leaseRequestDocMulter.any();
}

/** Multipart form fields only (no files). Use when clients send PATCH/POST as multipart/form-data — otherwise req.body stays empty. */
function parseMultipartFormFieldsIfNeeded() {
  return (req, res, next) => {
    const ct = String(req.headers["content-type"] || "").toLowerCase();
    if (ct.includes("multipart/form-data")) {
      return multer({ storage, limits: { fieldSize: 1_000_000 } }).none()(req, res, next);
    }
    return next();
  };
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
  uploadPropertyImagesAny,
  uploadLeaseRequestCreateFiles,
  uploadLeaseRequestCompletePhysical,
  uploadLeaseRequestAdditionalDocs,
  parseMultipartFormFieldsIfNeeded,
  uploadPaymentProofFiles,
};
