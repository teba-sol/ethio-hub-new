import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRefundRequest extends Document {
  orderId: mongoose.Types.ObjectId;
  touristId: mongoose.Types.ObjectId;
  artisanId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  reason: string;
  imageUrl?: string;
  refundMethod: 'bank' | 'telebirr';
  bankName?: string;
  accountNumber?: string;
  telebirrNumber?: string;
  amount: number;
  shippingFee: number;
  artisanEarnings: number;
  adminCommission: number;
  status: 'pending' | 'processing' | 'completed';
  adminNotes?: string;
  processedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

const RefundRequestSchema = new Schema<IRefundRequest>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    touristId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    artisanId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'ArtisanProduct',
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    refundMethod: {
      type: String,
      enum: ['bank', 'telebirr'],
      required: true,
    },
    bankName: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    telebirrNumber: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    artisanEarnings: {
      type: Number,
      required: true,
      min: 0,
    },
    adminCommission: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

RefundRequestSchema.index({ touristId: 1 });
RefundRequestSchema.index({ status: 1 });
RefundRequestSchema.index({ createdAt: -1 });

const RefundRequest: Model<IRefundRequest> =
  mongoose.models.RefundRequest || mongoose.model<IRefundRequest>('RefundRequest', RefundRequestSchema);

export default RefundRequest;
