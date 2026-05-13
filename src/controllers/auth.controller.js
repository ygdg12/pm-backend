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

function pickFirstString(body, ...candidateKeys) {
  if (!body || typeof body !== "object") return "";
  for (const key of candidateKeys) {
    if (body[key] != null && String(body[key]).trim() !== "") {
      return String(body[key]).trim();
    }
  }
  const lowerToValue = new Map();
  for (const [k, v] of Object.entries(body)) {
    if (v == null || String(v).trim() === "") continue;
    lowerToValue.set(k.toLowerCase(), String(v).trim());
  }
  for (const key of candidateKeys) {
    const v = lowerToValue.get(key.toLowerCase());
    if (v) return v;
  }
  return "";
}

function pickManagerTextFields(body) {
  const b = body && typeof body === "object" ? body : {};
  return {
    fullName: pickFirstString(b, "fullName", "fullname", "full_name", "name"),
    email: pickFirstString(b, "email", "emailAddress", "mail"),
    phoneNumber: pickFirstString(b, "phoneNumber", "phonenumber", "phone_number", "phone", "mobile"),
    password: pickFirstString(b, "password"),
  };
}

function firstUploadedFile(files, keys) {
  if (!files || typeof files !== "object") return null;
  for (const key of keys) {
    const arr = files[key];
    if (Array.isArray(arr) && arr[0] && arr[0].buffer) return arr[0];
  }
  return null;
}

async function persistManagerWithProofs({ fullName, email, phoneNumber, password, ownershipFile, telebirrFile }) {
  const propertyOwnershipProofFileId = await uploadBufferToGridFS({
    buffer: ownershipFile.buffer,
    filename: ownershipFile.originalname || "ownership",
    contentType: ownershipFile.mimetype || "application/octet-stream",
  });
  const telebirrMerchantAccountProofFileId = await uploadBufferToGridFS({
    buffer: telebirrFile.buffer,
    filename: telebirrFile.originalname || "telebirr",
    contentType: telebirrFile.mimetype || "application/octet-stream",
  });

  const manager = await registerManager({
    fullName,
    email,
    phoneNumber,
    password,
    propertyOwnershipProofFileId,
    telebirrMerchantAccountProofFileId,
  });

  return manager;
}

/**
 * Multipart only — use in Insomnia: Body → Multipart Form, pick files (not URLs).
 * Text fields: fullName, email, phoneNumber, password.
 */
const registerManagerMultipartController = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password } = pickManagerTextFields(req.body);
  if (!fullName || !email || !phoneNumber || !password) {
    throw badRequest(
      "fullName, email, phoneNumber and password are required as text fields in the multipart body. " +
        "Field names are matched case-insensitively (e.g. fullname or fullName). " +
        "In Insomnia: Body → Multipart Form → four Text fields and two File fields."
    );
  }

  const files = req.files || {};
  const ownershipFile = firstUploadedFile(files, [
    "propertyOwnershipProof",
    "propertyownershipproof",
    "property_ownership_proof",
    "ownershipProof",
  ]);
  const telebirrFile = firstUploadedFile(files, [
    "telebirrMerchantAccountProof",
    "telebirrmerchantaccountproof",
    "telebirr_merchant_account_proof",
    "telebirrProof",
  ]);

  if (!ownershipFile) {
    throw badRequest(
      "Missing ownership proof file. Add a File field named propertyOwnershipProof (or property_ownership_proof / ownershipProof)."
    );
  }
  if (!telebirrFile) {
    throw badRequest(
      "Missing Telebirr proof file. Add a File field named telebirrMerchantAccountProof (or telebirr_merchant_account_proof / telebirrProof)."
    );
  }

  const manager = await persistManagerWithProofs({
    fullName,
    email,
    phoneNumber,
    password,
    ownershipFile,
    telebirrFile,
  });

  res.status(201).json({
    manager: formatUserSafe(manager),
    message: "Manager registration submitted. Admin approval required.",
  });
});

/**
 * Accepts raw base64 or data URL (images or PDF for proofs).
 */
function parseProofBase64Field(value, defaultFilename) {
  if (value == null) return null;
  if (typeof value === "object" && typeof value.base64 === "string") {
    return parseProofBase64Field(value.base64, value.filename || defaultFilename);
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

  const ct = contentType.toLowerCase();
  const okMime = ct.startsWith("image/") || ct === "application/pdf";
  if (!okMime) {
    throw badRequest("Proof must be image/* or application/pdf (data URL or base64 with explicit type)");
  }

  const buffer = Buffer.from(base64Part, "base64");
  if (!buffer.length) {
    throw badRequest("Invalid or empty base64 data");
  }

  return {
    buffer,
    contentType,
    filename: defaultFilename,
  };
}

/** Optional JSON path (base64); for real file picks use POST /register/manager with Multipart Form. */
const registerManagerJsonController = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password } = pickManagerTextFields(req.body);
  if (!fullName || !email || !phoneNumber || !password) {
    throw badRequest("fullName, email, phoneNumber and password are required");
  }

  const b = req.body || {};
  const ownership = parseProofBase64Field(
    b.propertyOwnershipProofBase64 ?? b.propertyOwnershipProof,
    "property-ownership.jpg"
  );
  const telebirr = parseProofBase64Field(
    b.telebirrMerchantAccountProofBase64 ?? b.telebirrMerchantAccountProof,
    "telebirr-merchant.pdf"
  );
  if (!ownership) {
    throw badRequest("propertyOwnershipProofBase64 (or propertyOwnershipProof with base64) is required");
  }
  if (!telebirr) {
    throw badRequest("telebirrMerchantAccountProofBase64 (or telebirrMerchantAccountProof with base64) is required");
  }

  const manager = await persistManagerWithProofs({
    fullName,
    email,
    phoneNumber,
    password,
    ownershipFile: {
      buffer: ownership.buffer,
      originalname: ownership.filename,
      mimetype: ownership.contentType,
    },
    telebirrFile: {
      buffer: telebirr.buffer,
      originalname: telebirr.filename,
      mimetype: telebirr.contentType,
    },
  });

  res.status(201).json({
    manager: formatUserSafe(manager),
    message: "Manager registration submitted. Admin approval required.",
  });
});

const registerVisitorController = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password } = pickManagerTextFields(req.body);
  if (!fullName || !email || !phoneNumber || !password) {
    throw badRequest("fullName, email, phoneNumber and password are required");
  }

  const { user, token } = await registerVisitor({ fullName, email, phoneNumber, password });
  res.status(201).json({ token, user: formatUserSafe(user) });
});

const registerTenantController = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const { fullName, email, phoneNumber, password } = pickManagerTextFields(b);
  const kebeleId = pickFirstString(b, "kebeleId", "kebele_id", "kebeleid");
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
  registerManagerMultipartController,
  registerManagerJsonController,
  registerVisitorController,
  registerTenantController,
};
