const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    loginAt: {
      type: Date,
      default: Date.now
    },
    ip: {
      type: String,
      required: true
    },
    location: {
      type: String,
      default: "-"
    },
    browser: {
      type: String,
      default: "-"
    },
    os: {
      type: String,
      default: "-"
    }
  },
  {
    timestamps: true // createdAt, updatedAt automatically
  }
);

module.exports = mongoose.model("LoginHistory", loginHistorySchema);
