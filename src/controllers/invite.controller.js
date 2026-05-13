const { asyncHandler } = require("../utils/asyncHandler");
const { badRequest, notFound } = require("../utils/httpError");
const TenantInvite = require("../models/TenantInvite");
const Property = require("../models/Property");
const LeaseAgreement = require("../models/LeaseAgreement");
const { registerTenant, normalizeEmail } = require("../services/auth.service");
const { renderLeaseHtml } = require("../services/leaseTemplate.service");
const { generateInviteQRCode } = require("../services/qr.service");
const { signToken } = require("../utils/jwt");

function buildInviteUrl(req, token) {
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}/api/invites/${token}`;
}

const createInviteController = asyncHandler(async (req, res) => {
  const { propertyId, unitId, tenantEmail, expiresInMinutes } = req.body || {};
  if (!propertyId || !unitId || !tenantEmail) throw badRequest("propertyId, unitId, tenantEmail are required");
  const tenantEmailNorm = normalizeEmail(tenantEmail);
  if (!tenantEmailNorm) throw badRequest("tenantEmail is invalid");

  const property = await Property.findById(propertyId).exec();
  if (!property) throw notFound("Property not found");

  const unit = property.units.find((u) => u._id.toString() === unitId.toString());
  if (!unit) throw badRequest("Invalid unitId for the selected property");

  if (property.managerId.toString() !== req.user.userId) {
    throw badRequest("You can only create invites for your own properties");
  }

  const token = require("uuid").v4();
  const minutes = Number(expiresInMinutes || 60 * 24); // default: 24 hours

  const invite = await TenantInvite.create({
    token,
    tenantEmail: tenantEmailNorm,
    managerId: property.managerId,
    propertyId: property._id,
    unitId,
    expiresAt: new Date(Date.now() + minutes * 60 * 1000),
  });

  const inviteUrl = buildInviteUrl(req, invite.token);
  const qrCodeDataUrl = await generateInviteQRCode(inviteUrl);

  res.status(201).json({
    token: invite.token,
    inviteUrl,
    qrCodeDataUrl,
    expiresAt: invite.expiresAt,
  });
});

const getInviteController = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const invite = await TenantInvite.findOne({ token }).exec();
  if (!invite) throw notFound("Invite not found");
  if (invite.usedAt) throw badRequest("Invite already used");
  if (invite.expiresAt < new Date()) throw badRequest("Invite expired");

  const property = await Property.findById(invite.propertyId).exec();
  if (!property) throw notFound("Property not found");

  const unit = property.units.find((u) => u._id.toString() === invite.unitId.toString());
  if (!unit) throw badRequest("Unit not found");

  res.json({
    token: invite.token,
    tenantEmail: invite.tenantEmail,
    property: {
      id: property._id.toString(),
      name_of_compound: property.name_of_compound,
      street_address: property.street_address,
    },
    unit: {
      id: unit._id.toString(),
      unit_label: unit.unit_label,
      square_meters: unit.square_meters,
      lease_price: unit.lease_price,
      availability: unit.availability,
    },
    expiresAt: invite.expiresAt,
  });
});

const completeInviteController = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { fullName, kebeleId, phoneNumber, password } = req.body || {};

  if (!fullName || !kebeleId || !phoneNumber || !password) {
    throw badRequest("fullName, kebeleId, phoneNumber and password are required");
  }

  const invite = await TenantInvite.findOne({ token }).exec();
  if (!invite) throw notFound("Invite not found");
  if (invite.usedAt) throw badRequest("Invite already used");
  if (invite.expiresAt < new Date()) throw badRequest("Invite expired");

  const property = await Property.findById(invite.propertyId).exec();
  if (!property) throw notFound("Property not found");

  const unit = property.units.find((u) => u._id.toString() === invite.unitId.toString());
  if (!unit) throw badRequest("Unit not found");

  // Register tenant using invite email
  const tenant = await registerTenant({
    fullName,
    kebeleId,
    email: invite.tenantEmail,
    phoneNumber,
    password,
  });

  const agreementHtml = renderLeaseHtml({
    tenant,
    property,
    unit,
  });

  const lease = await LeaseAgreement.create({
    tenantId: tenant._id,
    managerId: invite.managerId,
    propertyId: property._id,
    unitId: unit._id,
    tenantEmail: invite.tenantEmail,
    agreementHtml,
    status: "generated",
  });

  invite.usedAt = new Date();
  invite.usedByTenantId = tenant._id;
  await invite.save();

  res.status(201).json({
    token: signToken({
      userId: tenant._id.toString(),
      role: tenant.role,
      email: tenant.email,
      fullName: tenant.fullName,
    }),
    tenant: { id: tenant._id.toString(), accountStatus: tenant.accountStatus },
    lease: { id: lease._id.toString(), status: lease.status, agreementHtml: lease.agreementHtml },
    // Tenant can sign using their auth token after login; return lease immediately for UX.
  });
});

module.exports = {
  createInviteController,
  getInviteController,
  completeInviteController,
};

