const { HttpError } = require("../utils/httpError");

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const _path = req.path;

  if (err && err.name === "MulterError") {
    const code = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    let msg =
      err.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file is too large"
        : err.message || "File upload error";
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      msg =
        "Unexpected file field name. For property images use any field name (e.g. images, image, photos) with image/* files — max 10 files.";
    }
    if (res.headersSent) return next(err);
    return res.status(code).json({
      error: { message: msg, code, details: { multerCode: err.code } },
    });
  }

  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const message = err instanceof HttpError ? err.message : "Internal Server Error";

  const payload = {
    error: {
      message,
      code: statusCode,
      details: err.details,
    },
  };

  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json(payload);
}

module.exports = { errorHandler };

