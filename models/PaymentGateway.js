const mongoose = require("mongoose");

const paymentGatewaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    secretKey: {
      type: String,
      required: true
    },
    webhookUrl: {
      type: String,
      required: true
    },
    fixedCharge: {
      type: Number,
      required: true,
      default: 0
    },
    iconName: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentGateway", paymentGatewaySchema);
