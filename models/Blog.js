const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    isRecent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", BlogSchema);
 