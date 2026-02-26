const mongoose = require("mongoose");

const LeadSettingSchema = new mongoose.Schema({
  geminiApi: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String, default: "" }
  },
  openAi: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String, default: "" }
  },
  googleMap: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String, default: "" }
  },
  manualData: {
    enabled: { type: Boolean, default: false },
  },
  geographyApi: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String, default: "" }
  }
}, { timestamps: true });

module.exports = mongoose.model("LeadSetting", LeadSettingSchema);
