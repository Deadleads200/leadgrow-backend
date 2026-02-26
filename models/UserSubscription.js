const mongoose = require("mongoose");

const userSubscriptionSchema = new mongoose.Schema(
  {
    // kis user ka plan
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // konsa plan liya hai
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PricingPlan",
      required: true
    },
             
    // monthly / yearly
    billingType: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true
    },

    // plan ke total leads
    totalLeads: {
      type: Number,
      required: true
    },

    // bachi hui leads
    remainingLeads: {
      type: Number,
      required: true
    },

    // plan start
    startDate: {
      type: Date,
      default: Date.now
    },

    // plan end
    endDate: {
      type: Date,
      required: true
    },

    // plan status
    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active"
    }
  },
  { timestamps: true }
);



userSubscriptionSchema.index(
  { userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

module.exports = mongoose.model("UserSubscription", userSubscriptionSchema);
