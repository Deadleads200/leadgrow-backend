const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: Boolean, default: true }, 
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);
