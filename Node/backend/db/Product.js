const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    category: String,
    company: String
  },
  { collection: "product" } // force collection name karon moongooese model plural ney
);

module.exports = mongoose.model("Product", productSchema);
