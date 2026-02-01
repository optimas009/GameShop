const mongoose = require("mongoose");
const Order = require("../models/Order");
const GameKey = require("../models/GameKey");

function out(status, body) {
  return { status, body };
}

/* ===================== LIBRARY ===================== */
async function getLibrary(userId) {
  const userObjId = new mongoose.Types.ObjectId(userId);

  const rows = await Order.aggregate([
    { $match: { userId: userObjId } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.gameId",
        title: { $first: "$items.title" },
        price: { $first: "$items.price" },

        
        imageUrl: { $first: "$items.imageUrl" },

        platform: { $first: "$items.platform" },
        genre: { $first: "$items.genre" },
        developer: { $first: "$items.developer" },
        sizeGB: { $first: "$items.sizeGB" },
        description: { $first: "$items.description" },
        totalQty: { $sum: "$items.quantity" },
      },
    },
    {
      $lookup: {
        from: "gamekeys",
        let: { g: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$userId", userObjId] }, { $eq: ["$gameId", "$$g"] }],
              },
            },
          },
          { $project: { key: 1, status: 1, usedAt: 1, createdAt: 1 } },
          { $sort: { createdAt: 1 } },
        ],
        as: "keys",
      },
    },
    {
      $project: {
        _id: 0,
        gameId: "$_id",
        title: 1,
        price: 1,
        imageUrl: 1,
        platform: 1,
        genre: 1,
        developer: 1,
        sizeGB: 1,
        description: 1,
        totalQty: 1,
        keys: 1,
      },
    },
  ]);

  return out(200, { library: rows });
}

/* ===================== KEY USE ===================== */
async function useKey(userId, keyId) {
  const k = await GameKey.findOne({ _id: keyId, userId });
  if (!k) return out(404, { message: "Key not found" });

  if (k.status === "used") {
    return out(200, { message: "This key has already been used" });
  }

  k.status = "used";
  k.usedAt = new Date();
  await k.save();

  return out(200, { message: "Key marked as used", keyId });
}

module.exports = { getLibrary, useKey };
