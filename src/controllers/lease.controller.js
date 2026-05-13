const { asyncHandler } = require("../utils/asyncHandler");
const LeaseAgreement = require("../models/LeaseAgreement");
const Property = require("../models/Property");
const User = require("../models/User");
const { badRequest, notFound, forbidden } = require("../utils/httpError");

const getLeasesForMe = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  const query =
    role === "tenant"
      ? { tenantId: userId }
      : role === "manager"
      ? { managerId: userId }
      : {};

  if (!query.tenantId && !query.managerId && role !== "admin" && role !== "visitor") {
    throw forbidden("Not allowed");
  }

  const leases = await LeaseAgreement.find(query).sort({ createdAt: -1 }).limit(50).exec();
  res.json({ leases });
});

const getLeaseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lease = await LeaseAgreement.findById(id).exec();
  if (!lease) throw notFound("Lease not found");

  const role = req.user?.role;
  const userId = req.user?.userId;

  if (role === "tenant" && lease.tenantId.toString() !== userId) throw forbidden("Not allowed");
  if (role === "manager" && lease.managerId.toString() !== userId) throw forbidden("Not allowed");

  res.json({ lease });
});

const signLeaseTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName } = req.body || {};

  if (!fullName) throw badRequest("fullName is required");

  const lease = await LeaseAgreement.findById(id).exec();
  if (!lease) throw notFound("Lease not found");

  if (lease.tenantId.toString() !== req.user.userId) throw forbidden("Not allowed");

  lease.tenantSignature = { fullName, signedAt: new Date() };
  lease.status = "tenant_signed";
  await lease.save();

  res.json({ lease });
});

const signLeaseManager = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName } = req.body || {};

  if (!fullName) throw badRequest("fullName is required");

  const lease = await LeaseAgreement.findById(id).exec();
  if (!lease) throw notFound("Lease not found");

  if (lease.managerId.toString() !== req.user.userId) throw forbidden("Not allowed");
  if (!lease.tenantSignature?.signedAt) throw badRequest("Tenant must sign before manager signs");

  lease.managerSignature = { fullName, signedAt: new Date() };
  lease.status = "approved";
  lease.approvedAt = new Date();
  await lease.save();

  // Landlord approval: activate tenant access.
  await User.findByIdAndUpdate(lease.tenantId, { accountStatus: "active" }, { new: true }).exec();

  res.json({ lease });
});

module.exports = {
  getLeasesForMe,
  getLeaseById,
  signLeaseTenant,
  signLeaseManager,
};

