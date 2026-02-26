const mongoose = require("mongoose");

const ticketMessageSchema = new mongoose.Schema(
  {
    sender: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "senderModel" 
      },
      name: { type: String, required: true },
      username: { type: String },
      email: { type: String }
    },
    senderModel: {
      type: String,
      enum: ["User", "Admin"],
      required: true
    },
    message: {
      type: String,
      required: true,
    },
    attachments: [
      {
        file: String,
        url: String,
      }
    ]
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,  
      enum: ["open", "closed", "answered"],
      default: "open",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    lastReply: {
      type: Date,
      default: null,
    },

    messages: [ticketMessageSchema],
  },
  { timestamps: true }
);   

module.exports = mongoose.model("SupportTicket", ticketSchema);
