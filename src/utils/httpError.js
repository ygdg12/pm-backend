class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function badRequest(message, details) {
  return new HttpError(400, message || "Bad Request", details);
}

function notFound(message, details) {
  return new HttpError(404, message || "Not Found", details);
}

function forbidden(message, details) {
  return new HttpError(403, message || "Forbidden", details);
}

function unauthorized(message, details) {
  return new HttpError(401, message || "Unauthorized", details);
}

function internal(message, details) {
  return new HttpError(500, message || "Internal Server Error", details);
}

module.exports = {
  HttpError,
  badRequest,
  notFound,
  forbidden,
  unauthorized,
  internal,
};

