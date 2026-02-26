const StripeLib = require("stripe");
const PaymentGateway = require("../models/PaymentGateway");

let stripeInstance = null;
let webhookSecret = null;

async function getStripe() {
  if (stripeInstance) return { stripe: stripeInstance, webhookSecret };

  const gateway = await PaymentGateway.findOne({
    name: { $regex: /^stripe$/i }
  });

  if (!gateway || !gateway.secretKey || !gateway.webhookUrl) {
    throw new Error("Stripe keys not configured in PaymentGateway");
  }

  stripeInstance = new StripeLib(gateway.secretKey);
  webhookSecret = gateway.webhookUrl;

  return { stripe: stripeInstance, webhookSecret };
}

module.exports = getStripe;
