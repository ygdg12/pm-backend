const { asyncHandler } = require("../utils/asyncHandler");
const { login, registerManager, registerVisitor, registerTenant } = require("../services/auth.service");
const { uploadBufferToGridFS } = require("../services/gridfs.service");
const { badRequest } = require("../utils/httpError");

const formatUserSafe = (u) => ({
  id: u._id.toString(),
  role: u.role,
  accountStatus: u.accountStatus,
  email: u.email,
  fullName: u.fullName,
  phoneNumber: u.phoneNumber,
  kebeleId: u.kebeleId,
});

const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw badRequest("email and password are required");

  const { user, token } = await login({ email, password });
  res.json({ token, user: formatUserSafe(user) });
});

function pickManagerTextFields(body) {
  const b = body && typeof body === "object" ? body : {};
  return {
    fullName: String(b.fullName ?? b.full_name ?? b.name ?? "").trim(),
    email: String(b.email ?? b.emailAddress ?? "").trim(),
    phoneNumber: String(b.phoneNumber ?? b.phone ?? b.phone_number ?? "").trim(),
    password: String(b.password ?? "").trim(),
  };
}

/**
 * Accepts raw base64 or data URL: data:image/png;base64,xxxx
 */
function parseImageBase64Field(value, defaultFilename) {
  if (value == null) return null;
  if (typeof value === "object" && typeof value.base64 === "string") {
    return parseImageBase64Field(value.base64, value.filename || defaultFilename);
  }
  if (typeof value !== "string") return null;
  let str = value.trim();
  if (!str) return null;

  let contentType = "image/jpeg";
  let base64Part = str;
  const dataUrl = /^data:([^;]+);base64,(.+)$/i.exec(str);
  if (dataUrl) {
    contentType = dataUrl[1].trim();
    base64Part = dataUrl[2].trim();
  }

  if (!contentType.startsWith("image/")) {
    throw badRequest("Proof images must use an image/* content type");
  }

  const buffer = Buffer.from(base64Part, "base64");
  if (!buffer.length) {
    throw badRequest("Invalid or empty base64 image data");
  }

  return {
    buffer,
    contentType,
    filename: defaultFilename,
  };
}

const registerManagerController = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password } = pickManagerTextFields(req.body);
  if (!fullName || !email || !phoneNumber || !password) {
    throw badRequest(
      "fullName, email, phoneNumber and password are required. " +
        "Use either (1) Body → form-data with keys fullName, email, phoneNumber, password plus two image files, or " +
        "(2) Body → raw JSON with the same text fields plus propertyOwnershipProofBase64 and telebirrMerchantAccountProofBase64 (image base64 or data URLs)."
    );
  }

  let propertyOwnershipProofFileId;
  let telebirrMerchantAccountProofFileId;

  if (req.is("application/json")) {
    const b = req.body || {};
    const ownership = parseImageBase64Field(
      b.propertyOwnershipProofBase64 ?? b.propertyOwnershipProof,
      "property-ownership.jpg"
    );
    const telebirr = parseImageBase64Field(
      b.telebirrMerchantAccountProofBase64 ?? b.telebirrMerchantAccountProof,
      "telebirr-merchant.jpg"
    );
    if (!ownership) throw badRequest("propertyOwnershipProofBase64 (or propertyOwnershipProof with base64) is required for JSON body");
    if (!telebirr) throw badRequest("telebirrMerchantAccountProofBase64 (or telebirrMerchantAccountProof with base64) is required for JSON body");

    propertyOwnershipProofFileId = await uploadBufferToGridFS({
      buffer: ownership.buffer,
      filename: ownership.filename,
      contentType: ownership.contentType,
    });
    telebirrMerchantAccountProofFileId = await uploadBufferToGridFS({
      buffer: telebirr.buffer,
      filename: telebirr.filename,
      contentType: telebirr.contentType,
    });
  } else {
    const files = req.files || {};
    const propertyOwnershipProof = files.propertyOwnershipProof?.[0] || null;
    const telebirrMerchantAccountProof = files.telebirrMerchantAccountProof?.[0] || null;

    if (!propertyOwnershipProof) throw badRequest("propertyOwnershipProof file is required");
    if (!telebirrMerchantAccountProof) throw badRequest("telebirrMerchantAccountProof file is required");

    propertyOwnershipProofFileId = await uploadBufferToGridFS({
      buffer: propertyOwnershipProof.buffer,
      filename: propertyOwnershipProof.originalname,
      contentType: propertyOwnershipProof.mimetype,
    });
    telebirrMerchantAccountProofFileId = await uploadBufferToGridFS({
      buffer: telebirrMerchantAccountProof.buffer,
      filename: telebirrMerchantAccountProof.originalname,
      contentType: telebirrMerchantAccountProof.mimetype,
    });
  }

  const manager = await registerManager({
    fullName,
    email,
    phoneNumber,
    password,
    propertyOwnershipProofFileId,
    telebirrMerchantAccountProofFileId,
  });

  res.status(201).json({
    manager: formatUserSafe(manager),
    message: "Manager registration submitted. Admin approval required.",
  });
});

const registerVisitorController = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password } = req.body || {};
  if (!fullName || !email || !phoneNumber || !password) {
    throw badRequest("fullName, email, phoneNumber and password are required");
  }

  const { user, token } = await registerVisitor({ fullName, email, phoneNumber, password });
  res.status(201).json({ token, user: formatUserSafe(user) });
});

const registerTenantController = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password, kebeleId } = req.body || {};
  if (!fullName || !email || !phoneNumber || !password || !kebeleId) {
    throw badRequest("fullName, email, phoneNumber, password and kebeleId are required");
  }

  const { user, token } = await registerTenant({
    fullName,
    email,
    phoneNumber,
    password,
    kebeleId,
  });
  res.status(201).json({ token, user: formatUserSafe(user) });
});

module.exports = {
  loginController,
  registerManagerController,
  registerVisitorController,
  registerTenantController,
};

