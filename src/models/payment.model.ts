import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  transactionRef: string;
  paymentGatewayId?: string;
  method: string;
  amount: number;
  status: string;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
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
    transactionRef: {
      type: String,
      required: true,
      unique: true,
    },
    paymentGatewayId: {
      type: String,
    },
    method: {
      type: String,
      default: 'chapa',
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: 'Pending',
    },
    invoiceUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
