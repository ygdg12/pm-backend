const qrcode = require("qrcode");

async function generateInviteQRCode(inviteUrl) {
  // Data URL so the frontend can render directly without storing an image.
  return qrcode.toDataURL(inviteUrl, { margin: 1, errorCorrectionLevel: "M" });
}

module.exports = { generateInviteQRCode };

