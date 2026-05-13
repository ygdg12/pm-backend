const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { unauthorized } = require("../utils/httpError");

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string") {
    return next(unauthorized("Missing Authorization header"));
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(unauthorized("Invalid Authorization header format"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      userId: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      fullName: decoded.fullName,
    };
    return next();
  } catch (err) {
    return next(unauthorized("Invalid or expired token"));
  }
}

module.exports = { authRequired };

