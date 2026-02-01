
const mongoose = require("mongoose");

const requirementsSchema = new mongoose.Schema(
  {
    os: { type: String, default: "" },
    cpu: { type: String, default: "" },
    ram: { type: String, default: "" },
    gpu: { type: String, default: "" },
    storage: { type: String, default: "" },
  },
  { _id: false }
);

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },

    developer: { type: String, default: "", trim: true },
    sizeGB: { type: Number, default: 0, min: 0 },

    platform: { type: String, default: "", trim: true },
    genre: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },


    coverMedia: { type: String, default: "" }, // "/uploads/..." OR full URL that points to /uploads/...
    screenshots: { type: [String], default: [] }, // same rule

   
    trailerUrl: { type: String, default: "", trim: true }, // youtube link 

    modes: { type: [String], default: [] },
    onlineRequired: { type: Boolean, default: false },
    crossplay: { type: Boolean, default: false },
    controllerSupport: { type: Boolean, default: false },
    languages: { type: [String], default: [] },

    minimumRequirements: { type: requirementsSchema, default: () => ({}) },
    recommendedRequirements: { type: requirementsSchema, default: () => ({}) },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Game", gameSchema);
