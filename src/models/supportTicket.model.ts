import mongoose from "mongoose";

const SupportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["New", "In Progress", "Resolved"],
      default: "New",
    },
    adminReply: {
      type: String,
      default: null,
    },
    adminReplyAt: {
      type: Date,
      default: null,
    },
    internalNote: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

SupportTicketSchema.index({ status: 1, createdAt: -1 });
SupportTicketSchema.index({ isRead: 1 });

const SupportTicket =
  mongoose.models.SupportTicket ||
  mongoose.model("SupportTicket", SupportTicketSchema);

export default SupportTicket;
