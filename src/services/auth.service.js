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
  const user = await User.findOne({ email }).exec();
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
  const existing = await User.findOne({ role: "admin", email }).exec();
  const passwordHash = await hashPassword(password);
  if (existing) {
    // Keep it simple: ensure passwordHash is set (in case env changed).
    if (!existing.passwordHash) existing.passwordHash = passwordHash;
    await existing.save();
    return existing;
  }

  return User.create({
    role: "admin",
    accountStatus: "active",
    fullName: "Admin",
    email,
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

