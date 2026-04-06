import mongoose, { Schema, Document, Model } from 'mongoose';

export type VerificationAction = 'approved' | 'rejected' | 'under_review';

export interface IVerificationRecord extends Document {
  userId: mongoose.Types.ObjectId;
  userRole: 'artisan' | 'organizer';
  artisanProfileId?: mongoose.Types.ObjectId;
  action: VerificationAction;
  adminId: mongoose.Types.ObjectId;
  reason?: string;
  reviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationRecordSchema = new Schema<IVerificationRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ['artisan', 'organizer'],
      required: true,
    },
    artisanProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'ArtisanProfile',
    },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'under_review'],
      required: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
    },
    reviewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

VerificationRecordSchema.index({ userId: 1, userRole: 1 });
VerificationRecordSchema.index({ action: 1 });

const VerificationRecord: Model<IVerificationRecord> =
  mongoose.models.VerificationRecord ||
  mongoose.model<IVerificationRecord>('VerificationRecord', VerificationRecordSchema);

export default VerificationRecord;
