const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    gateway: { type: String, required: true }, // Razorpay / Stripe / PayPal
    transactionId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    // conversion example:
    // ₹1200 → $14.40
    conversion: {
      fromAmount: Number,
      fromCurrency: String,
      toAmount: Number,
      toCurrency: String,
      totalAmount: Number,  
      totalCharge: Number    
    },

    // NEW: total values block
    totals: {
      firstAmount: Number,
      fromCurrency: String,
      secondAmount: Number,
      toCurrency: String,
      totalAmount: Number
    },

    status: {
      type: String,
      enum: ["open", "success", "failed"],
      default: ""
    },
    
    initiatedAt: { type: Date, default: Date.now },

    statusTimeAgo: { type: String },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PricingPlan",
      required: true
    },

    billingType: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true
    },
    invoiceUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
