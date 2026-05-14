const mongoose = require("mongoose");
const { asyncHandler } = require("../utils/asyncHandler");
const { badRequest, notFound, forbidden } = require("../utils/httpError");
const Transaction = require("../models/Transaction");
const LeaseAgreement = require("../models/LeaseAgreement");
const { generateReference } = require("../services/telebirr.service");
const { verifyWebhookSignature } = require("../services/telebirr.service");
const { uploadBufferToGridFS } = require("../services/gridfs.service");

const STATUS_DISPLAY = {
  pending: "Pending payment",
  pending_review: "Awaiting manager review",
  success: "Confirmed",
  failed: "Failed or rejected",
};

function normField(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function firstUploadedBuffer(files, names) {
  if (!files || !files.length) return null;
  const wanted = new Set(names.map((n) => normField(n)));
  for (const f of files) {
    if (!f.buffer) continue;
    if (wanted.has(normField(f.fieldname))) return f;
  }
  return null;
}

function serializeTransaction(tx) {
  const o = tx.toObject ? tx.toObject() : { ...tx };
  if (o._id) o.id = String(o._id);
  o.statusDisplay = STATUS_DISPLAY[o.status] || o.status;
  if (o.proofFileId) {
    o.proofFileIdStr = String(o.proofFileId);
    o.proofDownloadPath = `/api/files/${String(o.proofFileId)}`;
  }
  return o;
}

async function transactionBelongsToManager(tx, managerUserId) {
  if (tx.managerId && String(tx.managerId) === String(managerUserId)) return true;
  const lease = await LeaseAgreement.findById(tx.leaseId).select("managerId").exec();
  return lease && String(lease.managerId) === String(managerUserId);
}

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
    managerId: lease.managerId,
    leaseId,
    propertyId: lease.propertyId,
    amount: Number(amount),
    paymentType,
    status: "pending",
    telebirr: { referenceId, rawStatus: "pending" },
  });

  res.status(201).json({
    transaction: {
      ...serializeTransaction(transaction),
      referenceId: transaction.telebirr?.referenceId,
    },
  });
});

const listMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ tenantId: req.user.userId }).sort({ createdAt: -1 }).limit(50).exec();
  res.json({ transactions: transactions.map((t) => serializeTransaction(t)) });
});

const listManagerTransactions = asyncHandler(async (req, res) => {
  const uid = req.user.userId;
  const leaseRows = await LeaseAgreement.find({ managerId: uid }).select("_id").lean().exec();
  const leaseIds = leaseRows.map((r) => r._id);

  const q = {
    $or: [{ managerId: uid }, { leaseId: { $in: leaseIds } }],
  };

  const status = req.query.status;
  if (status) q.status = status;

  const transactions = await Transaction.find(q).sort({ createdAt: -1 }).limit(100).exec();
  res.json({ transactions: transactions.map((t) => serializeTransaction(t)) });
});

const uploadPaymentProof = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid transaction id");

  const tx = await Transaction.findById(id).exec();
  if (!tx) throw notFound("Transaction not found");
  if (String(tx.tenantId) !== String(req.user.userId)) throw forbidden("Not allowed");
  if (tx.status !== "pending") {
    throw badRequest("You can only upload a receipt while the payment is pending (before manager review or confirmation)");
  }
  if (tx.proofFileId) throw badRequest("A receipt was already uploaded for this transaction");

  const files = req.files || [];
  const proofPart = firstUploadedBuffer(files, [
    "proof",
    "receipt",
    "screenshot",
    "payment_proof",
    "paymentProof",
    "file",
    "photo",
    "upload",
    "image",
  ]);
  if (!proofPart) {
    throw badRequest(
      "Upload a receipt or screenshot file. Use a multipart field such as: proof, receipt, screenshot, or file (image or PDF)."
    );
  }

  const b = req.body || {};
  const tenantProofNote = String(b.tenantProofNote || b.tenant_proof_note || "").trim();

  const proofFileId = await uploadBufferToGridFS({
    buffer: proofPart.buffer,
    filename: proofPart.originalname || "payment-proof",
    contentType: proofPart.mimetype || "application/octet-stream",
  });

  const result = await Transaction.updateOne(
    { _id: tx._id, status: "pending", proofFileId: null },
    {
      $set: {
        proofFileId,
        proofSubmittedAt: new Date(),
        tenantProofNote,
        status: "pending_review",
      },
    }
  ).exec();

  if (result.modifiedCount === 0) {
    throw badRequest("Could not attach proof (transaction may have changed). Refresh and try again.");
  }

  const updated = await Transaction.findById(tx._id).exec();
  res.status(201).json({
    transaction: serializeTransaction(updated),
    notification: {
      message: "Receipt submitted. Your property manager will review and confirm the payment.",
    },
  });
});

const reviewPaymentProof = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid transaction id");

  const tx = await Transaction.findById(id).exec();
  if (!tx) throw notFound("Transaction not found");

  const okManager = await transactionBelongsToManager(tx, req.user.userId);
  if (!okManager) throw forbidden("Not allowed");

  if (tx.status !== "pending_review") {
    throw badRequest("This transaction is not waiting for manager review");
  }

  const b = req.body || {};
  const action = String(b.action || "").trim();
  const note = String(b.managerReviewNote || b.manager_review_note || b.note || "").trim();

  if (action === "confirm") {
    const result = await Transaction.updateOne(
      { _id: tx._id, status: "pending_review" },
      {
        $set: {
          status: "success",
          confirmedAt: new Date(),
          managerReviewNote: note,
          "telebirr.rawStatus": "manager_confirmed",
        },
      }
    ).exec();
    if (result.modifiedCount === 0) throw badRequest("Could not confirm (transaction may have changed).");

    const updated = await Transaction.findById(tx._id).exec();
    return res.json({
      transaction: serializeTransaction(updated),
      notification: { message: "Payment confirmed." },
    });
  }

  if (action === "reject") {
    if (!note) throw badRequest("managerReviewNote (or note) is required when rejecting");
    const result = await Transaction.updateOne(
      { _id: tx._id, status: "pending_review" },
      {
        $set: {
          status: "failed",
          managerReviewNote: note,
          "telebirr.rawStatus": "manager_rejected",
        },
      }
    ).exec();
    if (result.modifiedCount === 0) throw badRequest("Could not reject (transaction may have changed).");

    const updated = await Transaction.findById(tx._id).exec();
    return res.json({
      transaction: serializeTransaction(updated),
      notification: { message: "Payment proof was rejected." },
    });
  }

  throw badRequest('Invalid action. Use "confirm" or "reject".');
});

const telebirrWebhook = asyncHandler(async (req, res) => {
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
    throw badRequest("Webhook payload must be valid JSON (adjust parser for your Telebirr format)");
  }

  const referenceId = payload.referenceId || payload.reference_id || payload.tx_reference;
  const statusRaw = payload.status || payload.paymentStatus || payload.state;
  const amountRaw = payload.amount;

  if (!referenceId) throw badRequest("Missing referenceId in webhook payload");

  const transaction = await Transaction.findOne({ "telebirr.referenceId": referenceId }).exec();
  if (!transaction) {
    return res.json({ ok: true, message: "Transaction not found (ignored)" });
  }

  if (transaction.status !== "pending") {
    return res.json({
      ok: true,
      message: "Transaction not in Telebirr pending state (ignored; may be awaiting manager or already finalized)",
    });
  }

  const status = String(statusRaw).toUpperCase();
  const isSuccess = status.includes("SUCCESS") || status.includes("COMPLETED") || status.includes("PAID");

  transaction.status = isSuccess ? "success" : "failed";
  transaction.telebirr.rawStatus = statusRaw ? String(statusRaw) : "unknown";
  if (amountRaw !== undefined) transaction.amount = Number(amountRaw);
  if (isSuccess) transaction.confirmedAt = new Date();

  await transaction.save();

  res.json({ ok: true, transactionId: transaction._id.toString() });
});

module.exports = {
  initiatePayment,
  listMyTransactions,
  listManagerTransactions,
  uploadPaymentProof,
  reviewPaymentProof,
  telebirrWebhook,
};
