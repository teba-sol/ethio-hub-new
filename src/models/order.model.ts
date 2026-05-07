// src/models/order.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  tourist: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  artisan: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  adminCommission: number;
  artisanEarnings: number;
  commissionRate: number;
  currency: string;
  status: 'Awaiting Payment' | 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentRef?: string;
  paymentReference?: string;
  paymentMethod?: string;
  paymentDate?: Date;
  idempotencyKey?: string;
  contactInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  timeline: {
    status: string;
    date: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    tourist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ArtisanProduct',
      required: true,
    },
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    adminCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    artisanEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    commissionRate: {
      type: Number,
      default: 0.10, // 10% default commission
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    status: {
      type: String,
      enum: ['Awaiting Payment', 'Pending', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Awaiting Payment',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    paymentRef: {
      type: String,
    },
    paymentReference: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
     paymentDate: {
       type: Date,
     },
     idempotencyKey: {
       type: String,
       sparse: true,
       unique: true,
     },
     contactInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    shippingAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zipCode: { type: String },
    },
    timeline: [
      {
        status: { type: String, required: true },
        date: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
