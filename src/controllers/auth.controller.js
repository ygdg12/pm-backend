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

const registerManagerController = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password } = req.body || {};
  if (!fullName || !email || !phoneNumber || !password) {
    throw badRequest("fullName, email, phoneNumber and password are required");
  }

  const files = req.files || {};
  const propertyOwnershipProof = files.propertyOwnershipProof?.[0] || null;
  const telebirrMerchantAccountProof = files.telebirrMerchantAccountProof?.[0] || null;

  if (!propertyOwnershipProof) throw badRequest("propertyOwnershipProof file is required");
  if (!telebirrMerchantAccountProof) throw badRequest("telebirrMerchantAccountProof file is required");

  const propertyOwnershipProofFileId = propertyOwnershipProof
    ? await uploadBufferToGridFS({
        buffer: propertyOwnershipProof.buffer,
        filename: propertyOwnershipProof.originalname,
        contentType: propertyOwnershipProof.mimetype,
      })
    : null;

  const telebirrMerchantAccountProofFileId = telebirrMerchantAccountProof
    ? await uploadBufferToGridFS({
        buffer: telebirrMerchantAccountProof.buffer,
        filename: telebirrMerchantAccountProof.originalname,
        contentType: telebirrMerchantAccountProof.mimetype,
      })
    : null;

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

