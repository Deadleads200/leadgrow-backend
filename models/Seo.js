const mongoose = require("mongoose");

const SeoSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, unique: true }, // page key (home, blogs)

    metaTitle: { type: String, required: true },
    metaDescription: { type: String, required: true },
    metaKeywords: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seo", SeoSchema);
