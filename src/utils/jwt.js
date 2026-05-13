const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function signToken({ userId, role, email, fullName }) {
  return jwt.sign(
    { role, email, fullName },
    env.JWT_SECRET,
    { subject: userId, expiresIn: env.JWT_EXPIRES_IN }
  );
}

module.exports = { signToken };

