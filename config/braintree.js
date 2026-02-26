const braintree = require("braintree");

const environment = process.env.BRAINTREE_ENVIRONMENT === "production"
  ? braintree.Environment.Production
  : braintree.Environment.Sandbox; // Sandbox = Test mode

const gateway = new braintree.BraintreeGateway({
  environment,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

module.exports = gateway;  
