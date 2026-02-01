const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
    title: String,
    price: Number,
    imageUrl: String,
    platform: String,
    genre: String,
    developer: String,
    sizeGB: Number,
    description: String,

    quantity: { type: Number, required: true, default: 1, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    status: { type: String, default: "paid" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
