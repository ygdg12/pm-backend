const { asyncHandler } = require("../utils/asyncHandler");
const { badRequest, notFound, forbidden } = require("../utils/httpError");
const Transaction = require("../models/Transaction");
const LeaseAgreement = require("../models/LeaseAgreement");
const Property = require("../models/Property");
const { generateReference } = require("../services/telebirr.service");
const { verifyWebhookSignature } = require("../services/telebirr.service");
const { env } = require("../config/env");
const { v4: uuidv4 } = require("uuid");

const initiatePayment = asyncHandler(async (req, res) => {
  const { leaseId, paymentType, amount } = req.body || {};
  if (!leaseId || !paymentType || !amount) throw badRequest("leaseId, paymentType and amount are required");
  if (!["rent", "deposit"].includes(paymentType)) throw badRequest("Invalid paymentType");

  const lease = await LeaseAgreement.findById(leaseId).exec();
  if (!lease) throw notFound("Lease not found");

  if (lease.tenantId.toString() !== req.user.userId) throw forbidden("Not allowed");
  if (lease.status !== "approved") throw badRequest("Lease is not approved yet");

  const referenceId = generateReference();
  const transaction = await Transaction.create({
    tenantId: req.user.userId,
    leaseId,
    propertyId: lease.propertyId,
    amount: Number(amount),
    paymentType,
    status: "pending",
    telebirr: { referenceId, rawStatus: "pending" },
  });

  // In a real implementation, you would call Telebirr "initiate payment" API here.
  // We return the referenceId so the frontend can proceed and later rely on webhook confirmation.
  res.status(201).json({
    transaction: {
      id: transaction._id.toString(),
      referenceId,
      status: transaction.status,
      amount: transaction.amount,
      paymentType: transaction.paymentType,
    },
  });
});

const listMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ tenantId: req.user.userId }).sort({ createdAt: -1 }).limit(50).exec();
  res.json({ transactions });
});

const telebirrWebhook = asyncHandler(async (req, res) => {
  // Using express.raw, req.body is a Buffer.
  const rawBodyBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ""));

  const signatureHeaderValue =
    req.headers["x-telebirr-signature"] || req.headers["x-telebirr-hmac"] || req.headers["telebirr-signature"];

  const ok = verifyWebhookSignature({
    rawBodyBuffer,
    signatureHeaderValue: signatureHeaderValue ? String(signatureHeaderValue) : undefined,
  });

  if (!ok) throw badRequest("Invalid webhook signature");

  let payload = {};
  try {
    payload = JSON.parse(rawBodyBuffer.toString("utf8"));
  } catch {
    // If Telebirr sends form-encoded payloads, adjust parsing accordingly.
    throw badRequest("Webhook payload must be valid JSON (adjust parser for your Telebirr format)");
  }

  // Expected minimal shape (customize to your Telebirr payload):
  // { referenceId: "...", status: "SUCCESS"|"FAILED", amount: 123 }
  const referenceId = payload.referenceId || payload.reference_id || payload.tx_reference;
  const statusRaw = payload.status || payload.paymentStatus || payload.state;
  const amountRaw = payload.amount;

  if (!referenceId) throw badRequest("Missing referenceId in webhook payload");

  const transaction = await Transaction.findOne({ "telebirr.referenceId": referenceId }).exec();
  if (!transaction) {
    // Idempotency: return 200 so Telebirr doesn't retry forever.
    return res.json({ ok: true, message: "Transaction not found (ignored)" });
  }

  const status = String(statusRaw).toUpperCase();
  const isSuccess = status.includes("SUCCESS") || status.includes("COMPLETED") || status.includes("PAID");

  transaction.status = isSuccess ? "success" : "failed";
  transaction.telebirr.rawStatus = statusRaw ? String(statusRaw) : "unknown";
  if (amountRaw !== undefined) transaction.amount = Number(amountRaw);

  await transaction.save();

  res.json({ ok: true, transactionId: transaction._id.toString() });
});

module.exports = { initiatePayment, listMyTransactions, telebirrWebhook };

