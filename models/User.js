const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  
  profileImage: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String},
  password: { type: String, required: true },

  emailVerified: { type: Boolean, default: false }, // EMAIL VERIFIED FLAG
  otp: { type: String },                             // OTP STORE
  otpExpiry: { type: Date },                         // OTP EXPIRY TIME

  address: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  country: { type: String },
  ip: { type: String },
   username: { 
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },

  status: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
