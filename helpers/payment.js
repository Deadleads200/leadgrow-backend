const getStripe  = require("../config/stripe");
// const razorpay = require("../config/razorpay");
const { paypal, client } = require("../config/paypal");
// const gateway = require("../config/braintree");
const config = require("../config/payhere");
const Payment = require("../models/Payment");
const PricingPlan = require("../models/PricingPlan");
const User = require("../models/User");
 

// stripe payment creation
const createStripePayment = async ({ amount, currency, productId, billingType, userId, charge }) => {
try{
  console.log("createStripePayment");
      const { stripe } = await getStripe(); //  DB se secret key


  const plan = await PricingPlan.findById(productId);
  if (!plan) {
    throw new Error("Pricing plan not found");
  }
  
    const numericAmount = Number(amount);
    const numericCharge = Number(charge);

    const totalPayable = numericAmount + numericCharge;
  const stripeAmount = Math.round(totalPayable * 100); 

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `${plan.name} (${billingType})`,
          },
          unit_amount: stripeAmount,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.FRONTEND_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_BASE_URL}/failed`,
    metadata: {
      userId: userId.toString(),
      productId: productId.toString(),
      billingType,
      amount: String(stripeAmount),
    },
  });


     const conversion = {
      fromAmount: amount,
      fromCurrency: currency,
      toAmount: amount,
      toCurrency: currency,
      totalAmount: numericAmount + numericCharge,
      totalCharge: charge,
    };

  await Payment.create({
    gateway: "stripe",
    transactionId: session.id, 
    userId,
    productId,
    billingType,
    amount,
    currency,
    conversion,
    totals: {
      firstAmount: conversion.fromAmount,
      fromCurrency: conversion.fromCurrency,
      secondAmount: conversion.toAmount,
      toCurrency: conversion.toCurrency,
      totalAmount: conversion.totalAmount,
    },
    status: "open",
  });

  return { url: session.url, gateway: "stripe", transactionId: session.id };
  } catch (error) {
    console.log("createStripePayment error:--------", error);
  
  // if (error.type === "StripeInvalidRequestError") {
  //   throw new Error("Payment amount is too low. Please increase the amount.");
  // }

  return error; 
  }
};

// razorpay payment creation
const createRazorpayPayment = async ({ amount, currency, productId, billingType, userId, charge }) => {
  // Razorpay uses paise
  const razorpayAmount = Math.round(amount * 100);

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount: razorpayAmount,
    currency: currency.toUpperCase(),
    receipt: `receipt_${Date.now()}`,
    notes: {
      userId: userId.toString(),
    },
  });

  // Convert currency
     const conversion = {
      fromAmount: amount,
      fromCurrency: currency,
      toAmount: amount,
      toCurrency: currency,
      totalAmount: amount + charge,
      totalCharge: charge,
    };


  // Save Payment in DB
  await Payment.create({
    gateway: "razorpay",
    transactionId: order.id,
    userId,
    amount,
    currency,
    productId,
    billingType,
    conversion,
    charge,
    totals: {
      firstAmount: conversion.fromAmount,
      fromCurrency: conversion.fromCurrency,
      secondAmount: conversion.toAmount,
      toCurrency: conversion.toCurrency,
      totalAmount: conversion.totalAmount,
    },
    status: "pending",
  });

  // Return for frontend
  return {
    gateway: "razorpay",
    orderId: order.id,                // Razorpay order ID
    key: process.env.RAZORPAY_KEY_ID, // frontend key
    amount: order.amount,
    currency: order.currency,
  };
};


// paypal payment creation
const createPaypalPayment = async ({ amount, currency, productId, billingType, userId,charge }) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");

  // If you don't want productName, just remove it
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toString()
        }
        // description can be omitted if not needed
      }
    ],
    application_context: {
      return_url: `${process.env.FRONTEND_BASE_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_BASE_URL}/payment-failed`
    }
  });

  // Create the PayPal order
  const response = await client.execute(request);
  const order = response.result;

  // Currency conversion (await if convertCurrency is async)
  const conversion = {
      fromAmount: amount,
      fromCurrency: currency,
      toAmount: amount,
      toCurrency: currency,
      totalAmount: amount + charge,
      totalCharge: charge,   
     };

  // Save payment to DB
  await Payment.create({
    gateway: "paypal",
    transactionId: order.id,
    userId,
    amount,
    currency,
    productId,
    billingType,
    conversion,
    totals: {
      firstAmount: conversion.fromAmount,
      fromCurrency: conversion.fromCurrency,
      secondAmount: conversion.toAmount,
      toCurrency: conversion.toCurrency,
      totalAmount: conversion.totalAmount
    },
    status: "open"
  });

  // Find approval link
  const approveLink = order.links.find(link => link.rel === "approve")?.href;

  return {
    url: approveLink,
    gateway: "paypal",
    transactionId: order.id
  };
};


// Create Braintree Payment
const createBraintreePayment = async ({ amount, currency, productId, billingType, userId, charge }) => {
  // Generate client token
  const clientTokenResponse = await gateway.clientToken.generate({});

  // Currency conversion (await if async)
  const conversion = {
      fromAmount: amount,
      fromCurrency: currency,
      toAmount: amount,
      toCurrency: currency,
      totalAmount: amount + charge,
      totalCharge: charge,
        };

  // Save pending payment
  const payment = await Payment.create({
    gateway: "braintree",
    transactionId: "temp_" + Date.now(), // temporary until capture
    userId,
    amount,
    currency,
    productId,           // use productId instead of productName
    billingType,
    conversion,
    totals: {
      firstAmount: conversion.fromAmount,
      fromCurrency: conversion.fromCurrency,
      secondAmount: conversion.toAmount,
      toCurrency: conversion.toCurrency,
      totalAmount: conversion.totalAmount,
    },
    status: "open",
  });

  return {
    gateway: "braintree",
    paymentId: payment._id,
    clientToken: clientTokenResponse.clientToken, // send to frontend
  };
};

// Capture Braintree Payment
const captureBraintreePayment = async ({ paymentId, nonce, amount }) => {

  //  get payment first
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }

  const result = await gateway.transaction.sale({
    amount: amount.toString(),
    paymentMethodNonce: nonce,
    options: { submitForSettlement: true },
  });

  // ==============================
  // SUCCESS
  // ==============================
  if (result.success) {
    payment.transactionId = result.transaction.id;
    payment.status = "success";
    payment.statusTimeAgo = "just now";
    await payment.save();

      // -------------------------------
    // USER DETAILS (for PDF)
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
        const plan = await PricingPlan.findById(payment.productId);
    await Notification.create({
      userId: payment.userId || null,
      subject: "Payment Successful",
      message: "Payment received.",
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
  // ==============================
  // FAILED
  // ==============================
  else {
    payment.status = "failed";
    payment.statusTimeAgo = "just now";
    await payment.save();

    //  FAILED notification (FIX)
    await Notification.create({
      userId: payment.userId || null,
      subject: "Payment Failed",
      message: "Your payment has failed. Please try again.",
    });
  }

  return result;
};


const createPayHerePayment = async ({ amount, currency, productId, billingType, userId, charge }) => {
  // Convert currency (await if convertCurrency is async)
  const conversion = {
      fromAmount: amount,
      fromCurrency: currency,
      toAmount: amount,
      toCurrency: currency,
      totalAmount: amount + charge,
      totalCharge: charge,
    };

  // Create pending payment in DB
  const payment = await Payment.create({
    gateway: "payhere",
    transactionId: "temp_" + Date.now(), // temporary until PayHere callback updates it
    userId,
    amount,
    currency,
    productId,
    billingType,
    conversion,
    totals: {
      firstAmount: conversion.fromAmount,
      fromCurrency: conversion.fromCurrency,
      secondAmount: conversion.toAmount,
      toCurrency: conversion.toCurrency,
      totalAmount: conversion.totalAmount,
    },
    status: "open",
  });

  // Prepare PayHere form data
  const formData = {
    merchant_id: config.merchantId,
    return_url: config.returnUrl,
    cancel_url: config.cancelUrl,
    notify_url: config.notifyUrl,
    order_id: payment._id.toString(), // use DB _id
    items: `Product ${productId}`,     // simple description
    currency,
    amount,
  };

  return {
    gateway: "payhere",
    paymentId: payment._id,
    formData,
    checkoutUrl: config.sandboxUrl, // frontend can POST form to this URL
  };
};

module.exports = { createStripePayment, createRazorpayPayment, createPaypalPayment, createBraintreePayment, captureBraintreePayment, createPayHerePayment }; 