const mongoose = require("mongoose");

const adminPasswordResetTokenSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model("AdminPasswordResetToken", adminPasswordResetTokenSchema);
