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

function uploadSingle(field) {
  return baseUpload.single(field);
}

function uploadArray(field, maxCount) {
  return baseUpload.array(field, maxCount);
}

function uploadFields(fields) {
  return baseUpload.fields(fields);
}

module.exports = { uploadSingle, uploadArray, uploadFields };

