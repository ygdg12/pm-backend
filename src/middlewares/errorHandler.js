const { HttpError } = require("../utils/httpError");

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const _path = req.path;

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

