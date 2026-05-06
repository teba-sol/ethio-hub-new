import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  targetId: string;
  targetType: 'Event' | 'Product' | 'User' | 'Review';
  reason: string;
  reasonOther?: string;
  description?: string;
  evidence: string[]; // URLs to uploaded files (images, PDFs, docs) - max 3
  status: 'Pending' | 'Investigating' | 'Resolved' | 'Dismissed' | 'PendingBan';
  adminNote?: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['Event', 'Product', 'User', 'Review'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    reasonOther: {
      type: String,
    },
    description: {
      type: String,
    },
    evidence: {
      type: [String],
      default: [],
      validate: [(val: string[]) => val.length <= 3, '{PATH} exceeds the limit of 3'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Investigating', 'Resolved', 'Dismissed', 'PendingBan'],
      default: 'Pending',
      index: true,
    },
    adminNote: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
ReportSchema.index({ targetId: 1, targetType: 1 });
ReportSchema.index({ reporterId: 1, targetId: 1 }, { unique: true }); // Prevent duplicate reports
ReportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

export default Report;
