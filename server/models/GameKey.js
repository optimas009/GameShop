const mongoose = require("mongoose");

const gameKeySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },

    key: { type: String, required: true, unique: true, trim: true, index: true }, //globally unique

    status: { type: String, enum: ["unused", "used"], default: "unused", index: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GameKey", gameKeySchema);
