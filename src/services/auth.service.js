const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { badRequest, unauthorized } = require("../utils/httpError");

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

async function login({ email, password }) {
  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  const user = await User.findOne({ email: trimmedEmail }).exec();
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

async function registerManager({ fullName, email, phoneNumber, password, propertyOwnershipProofFileId, telebirrMerchantAccountProofFileId }) {
  if (!email) throw badRequest("email is required");
  if (!password) throw badRequest("password is required");

  const existing = await User.findOne({ email }).exec();
  if (existing) throw badRequest("Email already in use");

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    role: "manager",
    accountStatus: "pending",
    fullName,
    email,
    phoneNumber,
    passwordHash,
    propertyOwnershipProofFileId: propertyOwnershipProofFileId || null,
    telebirrMerchantAccountProofFileId: telebirrMerchantAccountProofFileId || null,
  });

  return user;
}

async function registerVisitor({ fullName, email, phoneNumber, password }) {
  if (!email) throw badRequest("email is required");
  if (!password) throw badRequest("password is required");

  const existing = await User.findOne({ email }).exec();
  if (existing) throw badRequest("Email already in use");

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    role: "visitor",
    accountStatus: "active",
    fullName,
    email,
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
  if (!email) throw badRequest("email is required");
  if (!password) throw badRequest("password is required");

  const existing = await User.findOne({ email }).exec();
  if (existing) throw badRequest("Email already in use");

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    role: "tenant",
    accountStatus: "pending_approval",
    fullName,
    kebeleId,
    email,
    phoneNumber,
    passwordHash,
  });

  return user;
}

async function seedAdmin({ email, password }) {
  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  if (!trimmedEmail || !password) {
    throw new Error("seedAdmin requires non-empty email and password");
  }

  const passwordHash = await hashPassword(password);

  // Single admin document: always sync email + password from env on startup so
  // Render secret rotation and first-time setup work without manual DB edits.
  let admin = await User.findOne({ role: "admin" }).exec();
  if (admin) {
    admin.email = trimmedEmail;
    admin.passwordHash = passwordHash;
    admin.accountStatus = "active";
    await admin.save();
    return admin;
  }

  const conflict = await User.findOne({ email: trimmedEmail }).exec();
  if (conflict) {
    throw new Error(`ADMIN_EMAIL "${trimmedEmail}" is already used by a non-admin user`);
  }

  return User.create({
    role: "admin",
    accountStatus: "active",
    fullName: "Admin",
    email: trimmedEmail,
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
};

