const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  companyName: { type: String, default: "" },
  contactAddress: { type: String, default: "" },
  contactNumber: { type: String, default: "" },
  emailAddress: { type: String, default: "" },
  facebook: { type: String, default: "" },
  instagram: { type: String, default: "" },
  twitter: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  logo: { type: String, default: "" },
  favicon: { type: String, default: "" },
  currency: { type: String, default: "" },
  currencySymbol: { type: String, default: "" },
  email: { type: String, required: true }, 
  password: { type: String, required: true }, 
});

module.exports = mongoose.model("Contact", contactSchema);
