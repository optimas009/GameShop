const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },

    developer: { type: String, default: "" },
    sizeGB: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },

    platform: { type: String, default: "" },
    genre: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { collection: "game" }   // ✅ singular collection name
);

module.exports = mongoose.model("Game", gameSchema);
