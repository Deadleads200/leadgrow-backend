const mongoose = require("mongoose");

const PricingPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    planType: {
      type: String,
      enum: ["basic", "standard", "Premium"],
      required: true
    },
    
    shortDescription: {
      type: String,
      default: "",
      required: true
    },

    monthlyPrice: {
      type: Number,
      default: 0,
      required: true
    },

    yearlyPrice: {
      type: Number,
      default: 0,
      required: true
    },
  
    monthlyLeadLimit: { type: Number, default: 100,required: true },
    yearlyLeadLimit: { type: Number, default: 100,required: true }, 
    expiredDaysMonthly: {
      type: String,
      default: "",
      required: true
    },

    expiredDaysYearly: {
      type:  String,
      default: "",
      required: true
    },

    monthlyCredit: {
      type: String,
      default: "",
      required: true
    },

    yearlyCredit: {
      type: String,
      default: "",
      required: true
    },
    monthlyDescription: {
      type: String,
      default: "",
      required: true
    },

    yearlyDescription: {
      type: String,
      default: ""
    },

    monthlyFeatures: {
      type: String,
      default: ""
    },

    yearlyFeatures: {
      type: String,
      default: ""
    },

    status: {
      type: Boolean,
      default: true
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    billingType: {
      type: [String],
      enum: ["monthly", "yearly"],
      default: ["monthly", "yearly"]
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PricingPlan", PricingPlanSchema);
