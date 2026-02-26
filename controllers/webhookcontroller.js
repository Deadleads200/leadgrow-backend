const getStripe  = require("../config/stripe");
const Payment = require("../models/Payment");
const config = require("../config/payhere");
const UserSubscription = require("../models/UserSubscription");
const PricingPlan = require("../models/PricingPlan");
const Notification = require('../models/Notification')
const moment = require("moment");
const generatePDF = require("../helpers/GeneratePDF");
const User = require("../models/User");
const crypto = require("crypto");
const  sendTemplateEmail = require("../helpers/sendresetlink");
const Contact=require('../models/Contact')
//stripe webhook
module.exports.handleWebhook = async (req, res) => {

  console.log("Webhook hit");
    const { stripe, webhookSecret } = await getStripe(); //  DB se

  const sig = req.headers["stripe-signature"];
  let event;


  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log("Event type:", event.type);

  } catch (err) {
    console.log("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  } 

  try {
    // -------------------------------
    // Payment Success
    // -------------------------------
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Update Payment
      const payment = await Payment.findOneAndUpdate(
        { transactionId: session.id },
        { status: "success", statusTimeAgo:  new Date() },
        { new: true }
      );

      let user = null;
      if (payment.userId) {
        const dbUser = await User.findById(payment.userId);
        if (dbUser) {
          user = {
            email: dbUser.email || "-",
            firstName: dbUser.firstName || "-",
            lastName: dbUser.lastName || "-"
          };
        }
      }
      if (payment) {
        // Calculate subscription dates
        const plan = await PricingPlan.findById(payment.productId);
        if (!plan) {
          console.log("Plan not found for productId:", payment.productId);
          return res.status(400).send("Plan not found");
        }
        const startDate = new Date();
        let endDate = new Date();

        if (payment.billingType === "monthly") {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (payment.billingType === "yearly") {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        const totalLeads = payment.billingType === "monthly" ? plan.monthlyLeadLimit : plan.yearlyLeadLimit;

        // Expire old active subscription
        // await UserSubscription.updateMany(
        //   { userId: payment.userId, status: "active" },
        //   { status: "expired" }
        // );
        // Find LAST active subscription (latest one)
        const lastActiveSubscription = await UserSubscription.findOne({
          userId: payment.userId,
          status: "active"
        }).sort({ createdAt: -1 }); 

        if (lastActiveSubscription) {
          lastActiveSubscription.status = "expired";
          lastActiveSubscription.endDate = startDate;  
          lastActiveSubscription.expiredAt = startDate; 
          await lastActiveSubscription.save();
        }

        // Upsert UserSubscription
        await UserSubscription.create({
          userId: payment.userId,
          planId: payment.productId,
          billingType: payment.billingType,
          totalLeads,
          remainingLeads: totalLeads,
          startDate,
          endDate,
          status: "active",
        });


        await Notification.create({
          userId: payment.userId || null,
          subject: "Payment Successful",
          message: `Payment received.`,
        });

        // -------------------------------
        // Generate PDF invoice with full details
        // -------------------------------

        const contactSettings = await Contact.findOne({});
const currencySymbol = contactSettings?.currencySymbol;
const currencyCode = contactSettings?.currency;
// short transaction id (first 6 + last 4)
const shortTransactionId = payment.transactionId
  ? `${payment.transactionId.slice(0, 6)}...${payment.transactionId.slice(-4)}`
  : "-";

        const pdfData = {
  leadData: [
    {
      "Payment Gateway": payment.gateway || "-",
      "Transaction ID":shortTransactionId,
      "Name": user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown",
      "Email": user ? user.email : "-",
      "Plan": plan.name || "-",
      "Billing Type": payment.billingType || "-",
      "Amount": payment.amount != null ? `${currencySymbol} ${payment.amount} ${currencyCode}` : "-",

      // Totals with conversion charge included
      "Totals": payment.totals
        ? `${currencySymbol} ${payment.totals.firstAmount} ${payment.totals.fromCurrency} + ${currencySymbol} ${payment.conversion?.totalCharge || 0} ${payment.totals.fromCurrency} = ${currencySymbol} ${payment.totals.totalAmount + (payment.conversion?.totalCharge || 0)} ${currencyCode}`
        : "-",

      "Status": payment.status || "-",
      "Created At": payment.createdAt ? moment(payment.createdAt).format("DD MMM YYYY, hh:mm A") : "-",
    }
  ]
        };

        const pdfPath = await generatePDF(pdfData, "PAYMENT INVOICE", "Payment_Invoice");

        // Update Payment with invoice URL
        payment.invoiceUrl = pdfPath;

        
    if (user?.email) {
        const emailVars = {
          firstName: user.firstName || "User",
          site_name: "GrowLead",
          site_logo:`${process.env.BASE_URL}${contactSettings.logo}`,
          plan_name: plan.name,
        };

        try {
          await sendTemplateEmail(
            "subscription_success",
            user.email,
            emailVars
          );
        } catch (mailErr) {
          console.error("Subscription email failed:", mailErr.message);
        }
      }   

        await payment.save();
        
      }

    }
    // ------------------------------------------------
    // PAYMENT FAILED 
    // ------------------------------------------------
    if (
      event.type === "payment_intent.payment_failed" ||
      event.type === "charge.failed"
    ) {
      let paymentIntentId = null;

      if (event.type === "payment_intent.payment_failed") {
        paymentIntentId = event.data.object.id;
      }

      if (event.type === "charge.failed") {
        paymentIntentId = event.data.object.payment_intent;
      }

      if (paymentIntentId) {
        const sessions = await Stripe.checkout.sessions.list({
          payment_intent: paymentIntentId,
          limit: 1,
        });

        if (sessions.data.length) {
          const payment = await Payment.findOne({ transactionId: sessions.data[0].id });

          //  already failed hai toh kuch mat karo
          if (payment && payment.status === "failed") {
            return;
          }
          const updatedPayment = await Payment.findOneAndUpdate(
            { transactionId: sessions.data[0].id },
            { status: "failed", statusTimeAgo: "just now" }
          );

          if (updatedPayment && updatedPayment.userId) {
            await Notification.create({
              userId: updatedPayment.userId,
              subject: "Payment Failed",
              message: "Your payment has failed. Please try again.",
            });
          }

        }
      }
    }




    // Respond to Stripe
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).send("Webhook processing error");
  }
};

//razorpay webhook
module.exports.razorpayWebhook = async (req, res) => {
  try {
    console.log("Razorpay Webhook hit");

    // -------------------------------
    // Verify Signature
    // -------------------------------
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const body = req.body.toString();

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid Razorpay Signature");
      return res.status(400).json({ success: false });
    }

    const event = JSON.parse(body);
    console.log("Razorpay Event:", event.event);

    // =====================================
    // PAYMENT SUCCESS
    // =====================================
    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;

      const orderId = paymentEntity.order_id;

      // Update Payment
      const payment = await Payment.findOneAndUpdate(
        { transactionId: orderId },
        { status: "success", statusTimeAgo: "just now" },
        { new: true }
      );

      if (!payment) {
        console.error("Payment not found:", orderId);
        return res.json({ received: true });
      }

      // -------------------------------
// Get User Details (FIX)
// -------------------------------
let user = null;
if (payment.userId) {
  const dbUser = await User.findById(payment.userId);
  if (dbUser) {
    user = {
      email: dbUser.email || "-",
      firstName: dbUser.firstName || "-",
      lastName: dbUser.lastName || "-"
    };
  }
}

      //  Get plan
      const plan = await PricingPlan.findById(payment.productId);
      if (!plan) {
        console.error("Pricing plan not found");
        return res.json({ received: true });
      }

      //  Calculate dates
      const startDate = new Date();
      let endDate = new Date(startDate);

      if (payment.billingType === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      //  Leads calculation
      const totalLeads =
        payment.billingType === "monthly"
          ? plan.monthlyLeadLimit
          : plan.yearlyLeadLimit;

      //  Expire old subscription
      const lastActiveSubscription = await UserSubscription.findOne({
        userId: payment.userId,
        status: "active"
      }).sort({ startDate: -1 });

      if (lastActiveSubscription) {
        lastActiveSubscription.status = "expired";
        lastActiveSubscription.endDate = startDate;
        lastActiveSubscription.expiredAt = startDate;
        await lastActiveSubscription.save();
      }

      //  Create new subscription
      await UserSubscription.create({
        userId: payment.userId,
        planId: payment.productId,
        billingType: payment.billingType,
        totalLeads,
        remainingLeads: totalLeads,
        startDate,
        endDate,
        status: "active"
      });

      await Notification.create({
        userId: payment.userId || null,
        subject: "Payment Successful",
        message: `Payment received.`,
      });
    // -------------------------------
        // Generate PDF invoice with full details
        // -------------------------------


        const pdfData = {
          leadData: [
            {
              "Payment Gateway": payment.gateway || "-",
              "Transaction ID": payment.transactionId || "-",
              "Username": user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown",
              "Email": user ? user.email : "-",
              "Product / Plan": plan.name || "-",
              "Billing Type": payment.billingType || "-",
              "Amount": payment.amount != null ? `${payment.currency} ${payment.amount}` : "-",
              "Conversion": payment.conversion
                ? `${payment.conversion.fromCurrency} ${payment.conversion.fromAmount} → ${payment.conversion.toCurrency} ${payment.conversion.toAmount}`
                : "-",
              "Totals": payment.totals
                ? `${payment.totals.firstAmount} ${payment.totals.fromCurrency} → ${payment.totals.secondAmount} ${payment.totals.toCurrency}`
                : "-",
              "Total After Conversion": payment.totals && payment.totals.totalAmount
                ? `${payment.totals.totalAmount} ${payment.totals.toCurrency}`
                : "-",
              "Status": payment.status || "-",
              "Initiated At": payment.initiatedAt ? moment(payment.initiatedAt).format("DD MMM YYYY, hh:mm A") : "-",
              "Time Ago": payment.initiatedAt ? moment(payment.initiatedAt).fromNow() : "-",
              "Created At": payment.createdAt ? moment(payment.createdAt).format("DD MMM YYYY, hh:mm A") : "-",
              "Updated At": payment.updatedAt ? moment(payment.updatedAt).format("DD MMM YYYY, hh:mm A") : "-"
            }
          ]
        };

        const pdfPath = await generatePDF(pdfData, "PAYMENT INVOICE", "Payment_Invoice");

        // Update Payment with invoice URL
        payment.invoiceUrl = pdfPath;
        await payment.save();
      console.log("Razorpay subscription created for:", payment.userId);
    }

   // =====================================
    // PAYMENT FAILED
    // =====================================
    if (event.event === "payment.failed") {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      const payment = await Payment.findOne({ transactionId: orderId });

      if (!payment) {
        console.error("Failed payment not found:", orderId);
        return res.json({ received: true });
      }

      //  already failed
      if (payment.status === "failed") {
        return res.json({ received: true });
      }

      //  update status
      payment.status = "failed";
      payment.statusTimeAgo = "just now";
      await payment.save();

      //  Failed notification
      if (payment.userId) {
        await Notification.create({
          userId: payment.userId,
          subject: "Payment Failed",
          message: "Your payment has failed. Please try again.",
        });
      }

      console.log("Razorpay FAILED handled:", orderId);
    }
    res.json({ received: true });

  } catch (err) {
    console.error("Razorpay webhook error:", err);
    res.status(500).json({ success: false });
  }
};
 

//paypal webhook
module.exports.paypalWebhook = async (req, res) => {
  try {
    console.log("PayPal Webhook hit");

    const headers = req.headers;
    const event = JSON.parse(req.body.toString());

    // ------------------------------------------------
    // BASIC VALIDATION (production me PayPal SDK se verify hota hai)
    // ------------------------------------------------
    if (!headers["paypal-transmission-id"]) {
      console.error("Invalid PayPal webhook");
      return res.status(400).send("Invalid webhook");
    }

    console.log("PayPal Event:", event.event_type);

    // =================================================
    // PAYMENT SUCCESS
    // =================================================
    if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
      const orderId = event.resource.id;

      //  Update Payment
      const payment = await Payment.findOneAndUpdate(
        { transactionId: orderId },
        { status: "success", statusTimeAgo: "just now" },
        { new: true }
      );

      if (!payment) {
        console.error("Payment not found for order:", orderId);
        return res.json({ received: true });
      }

         // -------------------------------
      // FIX: USER DETAILS (for PDF)
      // -------------------------------
      let user = null;
      if (payment.userId) {
        const dbUser = await User.findById(payment.userId);
        if (dbUser) {
          user = {
            email: dbUser.email || "-",
            firstName: dbUser.firstName || "-",
            lastName: dbUser.lastName || "-"
          };
        }
      }
      //  Get Pricing Plan
      const plan = await PricingPlan.findById(payment.productId);
      if (!plan) {
        console.error("Pricing plan not found");
        return res.json({ received: true });
      }

      //  Calculate dates
      const startDate = new Date();
      let endDate = new Date(startDate);

      if (payment.billingType === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      //  Lead limits
      const totalLeads =
        payment.billingType === "monthly"
          ? plan.monthlyLeadLimit
          : plan.yearlyLeadLimit;

      //  Expire old subscription
      await UserSubscription.updateMany(
        { userId: payment.userId, status: "active" },
        { status: "expired" }
      );

      //  Create new subscription
      await UserSubscription.create({
        userId: payment.userId,
        planId: payment.productId,
        billingType: payment.billingType,
        totalLeads,
        remainingLeads: totalLeads,
        startDate,
        endDate,
        status: "active"
      });
      // notifiction 
      await Notification.create({
        userId: payment.userId || null,
        subject: "Payment Successful",
        message: `Payment received.`,
      });

    const pdfData = {
          leadData: [
            {
              "Payment Gateway": payment.gateway || "-",
              "Transaction ID": payment.transactionId || "-",
              "Username": user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown",
              "Email": user ? user.email : "-",
              "Product / Plan": plan.name || "-",
              "Billing Type": payment.billingType || "-",
              "Amount": payment.amount != null ? `${payment.currency} ${payment.amount}` : "-",
              "Conversion": payment.conversion
                ? `${payment.conversion.fromCurrency} ${payment.conversion.fromAmount} → ${payment.conversion.toCurrency} ${payment.conversion.toAmount}`
                : "-",
              "Totals": payment.totals
                ? `${payment.totals.firstAmount} ${payment.totals.fromCurrency} → ${payment.totals.secondAmount} ${payment.totals.toCurrency}`
                : "-",
              "Total After Conversion": payment.totals && payment.totals.totalAmount
                ? `${payment.totals.totalAmount} ${payment.totals.toCurrency}`
                : "-",
              "Status": payment.status || "-",
              "Initiated At": payment.initiatedAt ? moment(payment.initiatedAt).format("DD MMM YYYY, hh:mm A") : "-",
              "Time Ago": payment.initiatedAt ? moment(payment.initiatedAt).fromNow() : "-",
              "Created At": payment.createdAt ? moment(payment.createdAt).format("DD MMM YYYY, hh:mm A") : "-",
              "Updated At": payment.updatedAt ? moment(payment.updatedAt).format("DD MMM YYYY, hh:mm A") : "-"
            }
          ]
        };

        const pdfPath = await generatePDF(pdfData, "PAYMENT INVOICE", "Payment_Invoice");

        // Update Payment with invoice URL
        payment.invoiceUrl = pdfPath;
        await payment.save();
    }

    // =================================================
    // PAYMENT FAILED
    // =================================================
    if (
      event.event_type === "CHECKOUT.ORDER.DENIED" ||
      event.event_type === "PAYMENT.CAPTURE.DENIED"
    ) {
      const orderId = event.resource.id;

      const payment = await Payment.findOne({ transactionId: orderId });

      if (!payment) {
        console.error("Failed PayPal payment not found:", orderId);
        return res.json({ received: true });
      }

      //  already failed
      if (payment.status === "failed") {
        return res.json({ received: true });
      }

      // update status
      payment.status = "failed";
      payment.statusTimeAgo = "just now";
      await payment.save();

      //  Failed notification
      if (payment.userId) {
        await Notification.create({
          userId: payment.userId,
          subject: "Payment Failed",
          message: "Your payment has failed. Please try again.",
        });
      }

      console.log("PayPal FAILED handled:", orderId);
    }
    // =================================================
    res.json({ received: true });

  } catch (err) {
    console.error("PayPal webhook error:", err);
    res.status(500).json({ success: false });
  }
};

// payhere webhook
module.exports.payhereWebhook = async (req, res) => {
  try {
    const data = req.body;

    // ---------------------------------
    // Verify hash / signature
    // ---------------------------------
    const hashString = `${data.merchant_id}${data.order_id}${data.amount}${data.currency}${config.secret}`;
    const expectedHash = crypto.createHash("md5").update(hashString).digest("hex");

    if (expectedHash !== data.hash) {
      return res.status(400).send("Invalid signature");
    }

    // ---------------------------------
    // Update Payment
    // ---------------------------------
    const payment = await Payment.findOneAndUpdate(
      { transactionId: data.order_id 
      });
 
   if (!payment) {
      console.error("Payment not found:", data.order_id);
      return res.send("OK");
    }

    // =================================================
    // PAYMENT FAILED
    // =================================================
    if (data.status !== "2") {

      // already failed
      if (payment.status !== "failed") {
        payment.status = "failed";
        payment.statusTimeAgo = "just now";
        await payment.save();

        if (payment.userId) {
          await Notification.create({
            userId: payment.userId,
            subject: "Payment Failed",
            message: "Your payment has failed. Please try again.",
          });
        }

        console.log("PayHere FAILED payment handled:", data.order_id);
      }

      return res.send("OK");
    }
 // ---------------------------------
    // FIX: USER DETAILS (for PDF)
    // ---------------------------------
    let user = null;
    if (payment.userId) {
      const dbUser = await User.findById(payment.userId);
      if (dbUser) {
        user = {
          email: dbUser.email || "-",
          firstName: dbUser.firstName || "-",
          lastName: dbUser.lastName || "-"
        };
      }
    }
    // =================================
    // SUBSCRIPTION LOGIC 
    // =================================

    // Get Pricing Plan
    const plan = await PricingPlan.findById(payment.productId);
    if (!plan) {
      console.error("Pricing plan not found");
      return res.send("OK");
    }

    // Dates
    const startDate = new Date();
    let endDate = new Date(startDate);

    if (payment.billingType === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Lead limits
    const totalLeads =
      payment.billingType === "monthly"
        ? plan.monthlyLeadLimit
        : plan.yearlyLeadLimit;

    // Expire old subscription
    await UserSubscription.updateMany(
      { userId: payment.userId, status: "active" },
      { status: "expired" }
    );

    // Create new subscription
    await UserSubscription.create({
      userId: payment.userId,
      planId: payment.productId,
      billingType: payment.billingType,
      totalLeads,
      remainingLeads: totalLeads,
      startDate,
      endDate,
      status: "active",
    });

    // notifiction 
    await Notification.create({
      userId: payment.userId || null,
      subject: "Payment Successful",
      message: `Payment received.`,
    });
      const pdfData = {
          leadData: [
            {
              "Payment Gateway": payment.gateway || "-",
              "Transaction ID": payment.transactionId || "-",
              "Username": user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown",
              "Email": user ? user.email : "-",
              "Product / Plan": plan.name || "-",
              "Billing Type": payment.billingType || "-",
              "Amount": payment.amount != null ? `${payment.currency} ${payment.amount}` : "-",
              "Conversion": payment.conversion
                ? `${payment.conversion.fromCurrency} ${payment.conversion.fromAmount} → ${payment.conversion.toCurrency} ${payment.conversion.toAmount}`
                : "-",
              "Totals": payment.totals
                ? `${payment.totals.firstAmount} ${payment.totals.fromCurrency} → ${payment.totals.secondAmount} ${payment.totals.toCurrency}`
                : "-",
              "Total After Conversion": payment.totals && payment.totals.totalAmount
                ? `${payment.totals.totalAmount} ${payment.totals.toCurrency}`
                : "-",
              "Status": payment.status || "-",
              "Initiated At": payment.initiatedAt ? moment(payment.initiatedAt).format("DD MMM YYYY, hh:mm A") : "-",
              "Time Ago": payment.initiatedAt ? moment(payment.initiatedAt).fromNow() : "-",
              "Created At": payment.createdAt ? moment(payment.createdAt).format("DD MMM YYYY, hh:mm A") : "-",
              "Updated At": payment.updatedAt ? moment(payment.updatedAt).format("DD MMM YYYY, hh:mm A") : "-"
            }
          ]
        };

        const pdfPath = await generatePDF(pdfData, "PAYMENT INVOICE", "Payment_Invoice");

        // Update Payment with invoice URL
        payment.invoiceUrl = pdfPath;
        await payment.save();
    console.log("PayHere subscription created for:", payment.userId);

    res.send("OK");
  } catch (err) {
    console.error("PayHere webhook error:", err);
    res.status(500).send("Webhook error");
  }
};
