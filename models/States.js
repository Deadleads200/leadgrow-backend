const mongoose = require("mongoose");

const StateSchema = new mongoose.Schema({
  country: { type: mongoose.Schema.Types.ObjectId, ref: "Countries", required: true },
  name: { type: String, required: true },
  status: { type: Boolean, default: true }, // Enabled by default
}, { timestamps: true });

module.exports = mongoose.model("State", StateSchema);
