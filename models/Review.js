const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  image: { type: String, default: "" },
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, trim: true }, 
  review: { type: String, required: true, trim: true },
  rating: { type: Number, default: 5 } // 1-5
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
