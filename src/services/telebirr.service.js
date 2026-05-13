const crypto = require("crypto");
const { env } = require("../config/env");

function computeHmacSha256Hex(rawBodyBuffer, secret) {
  return crypto.createHmac("sha256", secret).update(rawBodyBuffer).digest("hex");
}

function verifyWebhookSignature({ rawBodyBuffer, signatureHeaderValue, secret = env.TELEBIRR_WEBHOOK_SECRET }) {
  if (!secret) return true; // If no secret is configured, don't block.
  if (!signatureHeaderValue) return false;

  const expected = computeHmacSha256Hex(rawBodyBuffer, secret);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeaderValue));
}

function generateReference() {
  return `telebirr_${crypto.randomBytes(12).toString("hex")}`;
}

module.exports = { verifyWebhookSignature, generateReference };

