import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType = 'ORDER_PAYMENT' | 'ADMIN_COMMISSION' | 'WITHDRAWAL' | 'REFUND' | 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'PRODUCT_FEE' | 'SHIPPING_FEE' | 'THIRD_PARTY_SETTLEMENT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'HELD_IN_ESCROW';

export interface ITransaction extends Document {
  walletId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  quantity?: number;
  unitPrice?: number;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentRef?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    quantity: {
      type: Number,
      min: 1,
    },
    unitPrice: {
      type: Number,
      min: 0,
    },
    type: {
      type: String,
      enum: ['ORDER_PAYMENT', 'ADMIN_COMMISSION', 'WITHDRAWAL', 'REFUND', 'ESCROW_HOLD', 'ESCROW_RELEASE', 'PRODUCT_FEE', 'SHIPPING_FEE', 'THIRD_PARTY_SETTLEMENT'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'HELD_IN_ESCROW'],
      default: 'COMPLETED',
    },
    paymentRef: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ orderId: 1 });
TransactionSchema.index({ bookingId: 1 });
TransactionSchema.index({ type: 1 });

const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export default Transaction;
