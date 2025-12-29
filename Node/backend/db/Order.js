// backend/db/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },

    items: [
      {
        gameId: { type: mongoose.Schema.Types.ObjectId, ref: "game", required: true },
        title: String,
        price: Number,
        imageUrl: String,
      },
    ],

    total: { type: Number, required: true },
    status: { type: String, default: "paid" }, // simple for now
  },
  { timestamps: true, collection: "orders" }
);

module.exports = mongoose.model("Order", orderSchema);
