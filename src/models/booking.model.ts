import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  tourist: mongoose.Types.ObjectId;
  festival: mongoose.Types.ObjectId;
  organizer: mongoose.Types.ObjectId;
  ticketType: 'standard' | 'vip' | 'earlyBird';
  ticketTypeName?: string;  // Store the ticket type name for inventory tracking
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
      hotelId?: string;
      roomId?: string;
      hotelName: string;
      roomName: string;
      roomPrice: number;
      hotelRefCode?: string;
    };
    transport?: {
      transportId?: string;
      type: string;
      price: number;
      transportRefCode?: string;
    };
  };
  // Split payment fields
  platformFee: number;        // EthioHub's commission from organizer (10%)
  organizerAmount: number;    // Amount organizer gets
  commissionPercent: number;  // Commission percentage used (10%)
  touristServiceFee: number; // EthioHub's service fee from tourist (5%)
  touristFeePercent: number; // Tourist service fee percentage (5%)
  hasHotelBooking: boolean;  // True if hotel booking (exempt from fees)
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
        hotelId: { type: String },
        roomId: { type: String },
        hotelName: { type: String },
        roomName: { type: String },
        roomPrice: { type: Number },
        hotelRefCode: { type: String },
      },
      transport: {
        transportId: { type: String },
        type: { type: String },
        price: { type: Number },
        transportRefCode: { type: String },
      },
    },
    // Split payment fields
    platformFee: {
      type: Number,
      default: 0,
    },
    organizerAmount: {
      type: Number,
      default: 0,
    },
    commissionPercent: {
      type: Number,
      default: 10, // Default 10%
    },
    touristServiceFee: {
      type: Number,
      default: 0,
    },
    touristFeePercent: {
      type: Number,
      default: 5, // Default 5%
    },
    hasHotelBooking: {
      type: Boolean,
      default: false,
    },
    hasTransportBooking: {
      type: Boolean,
      default: false,
    },
    settlementStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paidAt: {
      type: Date,
    },
    providerAmount: {
      type: Number,
      default: 0,
    },
    // Hotel and transport fees for organizer (5% each)
    hotelFee: {
      type: Number,
      default: 0,
    },
    transportFee: {
      type: Number,
      default: 0,
    },
    // Receipt information
    receipt: {
      eventName: { type: String },
      eventDate: { type: Date },
      ticketType: { type: String },
      ticketPrice: { type: Number },
      hotel: {
        name: { type: String },
        roomType: { type: String },
        roomPrice: { type: Number },
        checkIn: { type: Date },
        checkOut: { type: Date },
      },
      transport: {
        type: { type: String },
        price: { type: Number },
      },
      userInfo: {
        fullName: { type: String },
        email: { type: String },
        phone: { type: String },
      },
      totalPaid: { type: Number },
      paymentMethod: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
