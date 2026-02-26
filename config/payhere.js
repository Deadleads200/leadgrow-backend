module.exports = {
  sandboxUrl: "https://sandbox.payhere.lk/pay/checkout",
  merchantId: process.env.PAYHERE_MERCHANT_ID,
  secret: process.env.PAYHERE_SECRET,
  returnUrl: `${process.env.FRONTEND_URL}/payment-success`,
  cancelUrl: `${process.env.FRONTEND_URL}/payment-failed`,
  notifyUrl: `${process.env.FRONTEND_URL}/api/webhook/payhere`
};
