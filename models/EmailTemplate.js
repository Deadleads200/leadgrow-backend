const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }, 
  subject: { type: String, required: true },
  htmlContent: { type: String, required: true },
  variables: { type: [String], default: [] }, 
  from_name: { type: String, default: "" },
  from_email: { type: String, default: "" },
},{ timestamps: true });

module.exports = mongoose.model("EmailTemplate", emailTemplateSchema);
