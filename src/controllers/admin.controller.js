const { asyncHandler } = require("../utils/asyncHandler");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { badRequest, notFound } = require("../utils/httpError");

const listPendingManagers = asyncHandler(async (req, res) => {
  const managers = await User.find({ role: "manager", accountStatus: "pending" }).sort({ createdAt: -1 }).limit(100).exec();
  res.json({ managers });
});

const approveManager = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const manager = await User.findById(id).exec();
  if (!manager) throw notFound("Manager not found");
  if (manager.role !== "manager") throw badRequest("User is not a manager");

  manager.accountStatus = "active";
  await manager.save();

  res.json({ manager });
});

const rejectManager = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const manager = await User.findById(id).exec();
  if (!manager) throw notFound("Manager not found");
  if (manager.role !== "manager") throw badRequest("User is not a manager");

  manager.accountStatus = "rejected";
  await manager.save();

  res.json({ manager });
});

const transactionsSummaryByProperty = asyncHandler(async (req, res) => {
  const summary = await Transaction.aggregate([
    { $match: { status: { $in: ["pending", "success", "failed"] } } },
    {
      $lookup: {
        from: "properties",
        localField: "propertyId",
        foreignField: "_id",
        as: "property",
      },
    },
    { $unwind: { path: "$property", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$propertyId",
        compound: { $first: "$property.name_of_compound" },
        totalAmount: { $sum: "$amount" },
        transactionCount: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
        },
      },
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 50 },
  ]);

  res.json({ summary });
});

module.exports = {
  listPendingManagers,
  approveManager,
  rejectManager,
  transactionsSummaryByProperty,
};

