const nodemailer = require("nodemailer");
const Contact = require("../models/Contact");

let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const contact = await Contact.findOne().lean();

  if (!contact || !contact.email || !contact.password) {
    throw new Error("Email credentials not found in Contact");
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: contact.email,
      pass: contact.password
    }
  });
  return cachedTransporter;
}

module.exports = getTransporter;
