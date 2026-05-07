import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeliveryLog extends Document {
  orderId: mongoose.Types.ObjectId;
  deliveryGuyId: mongoose.Types.ObjectId;
  shippingFee: number;
  deliveredAt: Date;
  customerVerified: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupAddress: string;
  deliveryAddress: string;
  distanceKm: number;
  artisanName: string;
  artisanPhone: string;
  productName: string;
  productPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryLogSchema = new Schema<IDeliveryLog>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    deliveryGuyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveredAt: {
      type: Date,
      required: true,
    },
    customerVerified: {
      type: Boolean,
      default: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
    },
    pickupAddress: {
      type: String,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    artisanName: {
      type: String,
    },
    artisanPhone: {
      type: String,
    },
    productName: {
      type: String,
    },
    productPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

DeliveryLogSchema.index({ deliveryGuyId: 1 });
DeliveryLogSchema.index({ deliveredAt: -1 });

const DeliveryLog: Model<IDeliveryLog> =
  mongoose.models.DeliveryLog || mongoose.model<IDeliveryLog>('DeliveryLog', DeliveryLogSchema);

export default DeliveryLog;
