const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { badRequest, unauthorized } = require("../utils/httpError");

/** Trim + lowercase so login/register behave like most apps (case-insensitive email). */
function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Exact match on normalized email, then case-insensitive fallback for legacy rows. */
async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  let user = await User.findOne({ email: normalized }).exec();
  if (user) return user;
  return User.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, "i") },
  }).exec();
}

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

async function login({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) throw unauthorized("Invalid email or password");

  if (!user.passwordHash) {
    throw unauthorized("This account does not support password login");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw unauthorized("Invalid email or password");

  if (user.role === "manager" && user.accountStatus !== "active") {
    throw unauthorized("Manager account not approved yet");
  }

  const token = signToken({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  });
  return { user, token };
}

async function registerManager({
  fullName,
  email,
  phoneNumber,
  password,
  propertyOwnershipProofUrl,
  telebirrMerchantAccountProofUrl,
}) {
  if (!email) throw badRequest("email is required");
  if (!password) throw badRequest("password is required");

  const emailNorm = normalizeEmail(email);
  if (!emailNorm) throw badRequest("email is required");

  const existing = await findUserByEmail(email);
  if (existing) throw badRequest("Email already in use");

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    role: "manager",
    accountStatus: "pending",
    fullName,
    email: emailNorm,
    phoneNumber,
    passwordHash,
    propertyOwnershipProofUrl: propertyOwnershipProofUrl || null,
    telebirrMerchantAccountProofUrl: telebirrMerchantAccountProofUrl || null,
  });

  return user;
}

async function registerVisitor({ fullName, email, phoneNumber, password }) {
  if (!email) throw badRequest("email is required");
  if (!password) throw badRequest("password is required");

  const emailNorm = normalizeEmail(email);
  if (!emailNorm) throw badRequest("email is required");

  const existing = await findUserByEmail(email);
  if (existing) throw badRequest("Email already in use");

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    role: "visitor",
    accountStatus: "active",
    fullName,
    email: emailNorm,
    phoneNumber,
    passwordHash,
  });

  const token = signToken({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  });
  return { user, token };
}

async function registerTenant({ fullName, kebeleId, email, phoneNumber, password }) {
  if (!fullName) throw badRequest("fullName is required");
  if (!email) throw badRequest("email is required");
  if (!password) throw badRequest("password is required");
  if (!phoneNumber) throw badRequest("phoneNumber is required");
  if (!kebeleId) throw badRequest("kebeleId is required");

  const emailNorm = normalizeEmail(email);
  if (!emailNorm) throw badRequest("email is required");

  const existing = await findUserByEmail(email);
  if (existing) throw badRequest("Email already in use");

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    role: "tenant",
    accountStatus: "active",
    fullName,
    kebeleId: String(kebeleId).trim(),
    email: emailNorm,
    phoneNumber,
    passwordHash,
  });

  const token = signToken({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  });
  return { user, token };
}

async function seedAdmin({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    throw new Error("seedAdmin requires non-empty email and password");
  }

  const passwordHash = await hashPassword(password);

  // Single admin document: always sync email + password from env on startup so
  // Render secret rotation and first-time setup work without manual DB edits.
  let admin = await User.findOne({ role: "admin" }).exec();
  if (admin) {
    admin.email = normalizedEmail;
    admin.passwordHash = passwordHash;
    admin.accountStatus = "active";
    await admin.save();
    return admin;
  }

  const conflict = await findUserByEmail(normalizedEmail);
  if (conflict) {
    throw new Error(`ADMIN_EMAIL "${normalizedEmail}" is already used by a non-admin user`);
  }

  return User.create({
    role: "admin",
    accountStatus: "active",
    fullName: "Admin",
    email: normalizedEmail,
    phoneNumber: "",
    passwordHash,
  });
}

module.exports = {
  hashPassword,
  verifyPassword,
  login,
  registerManager,
  registerVisitor,
  registerTenant,
  seedAdmin,
  normalizeEmail,
};

