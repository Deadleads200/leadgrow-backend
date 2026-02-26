const mongoose = require("mongoose");

const DataRequestSchema = new mongoose.Schema({
   userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Countries", required: true },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: true },
  NumberOfData: { type: String},
  downloadType: { type: String, enum: ["csv", "excel", "pdf"], required: true },
  generatedFilePath: { type: String },
  
}, { timestamps: true });

module.exports = mongoose.model("DataRequest", DataRequestSchema);
