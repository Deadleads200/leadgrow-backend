const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  }
},{ timestamps: true });

module.exports = mongoose.model("Brand", BrandSchema);
