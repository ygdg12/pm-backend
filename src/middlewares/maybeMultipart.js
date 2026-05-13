/**
 * Runs multer only for multipart requests. For application/json, skips multer so
 * express.json() can populate req.body (manager register supports JSON + base64 proofs).
 */
function maybeMultipart(uploadMiddleware) {
  return function (req, res, next) {
    const ct = String(req.headers["content-type"] || "").toLowerCase();
    if (ct.includes("application/json")) {
      return next();
    }
    return uploadMiddleware(req, res, next);
  };
}

module.exports = { maybeMultipart };
