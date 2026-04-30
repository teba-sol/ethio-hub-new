import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  tourist: mongoose.Types.ObjectId;
  festival: mongoose.Types.ObjectId;
  organizer: mongoose.Types.ObjectId;
  ticketType: 'standard' | 'vip' | 'earlyBird';
  quantity: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentRef?: string;
  paymentMethod?: string;
  paymentDate?: Date;
  adminCommission: number;
  organizerEarnings: number;
  commissionRate: number;
  contactInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  bookingDetails?: {
    room?: {
      hotelName: string;
      roomName: string;
      roomPrice: number;
    };
    transport?: {
      type: string;
      price: number;
    };
  };
  bookedAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    tourist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    festival: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Festival',
      required: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticketType: {
      type: String,
      enum: ['standard', 'vip', 'earlyBird'],
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
    adminCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    organizerEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    commissionRate: {
      type: Number,
      default: 0.10,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    paymentRef: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
    paymentDate: {
      type: Date,
    },
    contactInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    specialRequests: {
      type: String,
    },
    bookingDetails: {
      room: {
        hotelName: { type: String },
        roomName: { type: String },
        roomPrice: { type: Number },
      },
      transport: {
        type: { type: String },
        price: { type: Number },
      },
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;