const mongoose = require("mongoose");

const pageSectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,     
      lowercase: true,   
      trim: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    shortDescription: {
      type: String,
      required: true
    },
    label: {
      type: String,
      trim: true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PageSection", pageSectionSchema);
