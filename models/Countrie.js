const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema({
name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  status: {
    type: Boolean,
    default: true, 
  },
}, { timestamps: true });

module.exports = mongoose.model("Countries", countrySchema);
