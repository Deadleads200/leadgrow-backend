const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const webhookController = require("../controllers/webhookcontroller");

// STRIPE 
router.post(
   "/stripe",
  express.raw({ type: "application/json" }),
  webhookController.handleWebhook
);

// RAZORPAY 
router.post(
  "/razorpay",
  bodyParser.raw({ type: "application/json" }),
  webhookController.razorpayWebhook
);

// PAYPAL 
router.post(
  "/paypal",
  express.raw({ type: "application/json" }),
  webhookController.paypalWebhook
);

// BRAINTREE
router.post("/payhere", express.urlencoded({ extended: true }), webhookController.payhereWebhook);


module.exports = router;
