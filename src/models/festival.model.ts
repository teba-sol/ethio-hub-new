import mongoose, { Document, Schema } from 'mongoose';

// Define interfaces for nested objects
export interface IScheduleItem extends Document {
  day: number;
  title: string;
  activities: string;
  performers: string[];
}

// SIMPLIFIED: Room interface - only what you need
export interface IRoom extends Document {
  name: string;           // Room Name
  image?: string;         // Room Image URL
  bedType: string;        // Bed Type (e.g., "King Size")
  capacity: number;       // Capacity (number of people)
  pricePerNight: number;  // Price per night
  availability: number;   // Number of rooms available
  description?: string;    // Room description
  sqm?: number;           // Room size in square meters
  amenities?: string[];    // Room amenities (WiFi, AC, etc.)
}

// Hotel interface with simplified rooms
export interface IHotel extends Document {
  name: string;
  starRating: number;
  address: string;
  description: string;
  fullDescription?: string;
  policies?: string;
  image: string;
  checkInTime?: string;
  checkOutTime?: string;
  facilities?: string[];
  gallery?: string[];
  rooms: IRoom[];
}

export interface ITransportation extends Document {
  type: string;
  provider: string;
  price: number;
  description: string;
  image?: string;
  availability?: number;
  capacity?: number;
  pickupLocations?: string;
}

export interface IServices {
  foodPackages: string[];
  culturalServices: string[];
  specialAssistance: string[];
  extras: string[];
}

export interface IPolicies {
  cancellation: string;
  terms: string;
  safety: string;
  ageRestriction: string;
}

export interface IPricing {
  basePrice: number;
  vipPrice: number;
  currency: string;
  earlyBird: number;
  groupDiscount: number;
}

export interface IFestival extends Document {
  name: string;
  shortDescription: string;
  fullDescription: string;
  startDate: Date;
  endDate: Date;
  location: {
    name: string;
    address?: string;
    coordinates?: { lat?: number; lng?: number };
  };
  organizer: mongoose.Types.ObjectId;
  coverImage?: string;
  gallery?: string[];
  status: 'Draft' | 'Published' | 'Cancelled';
  isVerified: boolean;
  verificationStatus: 'Draft' | 'Pending Approval' | 'Under Review' | 'Approved' | 'Rejected';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  changesVersion?: number;
  isEditedAfterApproval?: boolean;
  reverificationRequested?: boolean;
  lastEditedAt?: Date;
  schedule: IScheduleItem[];
  hotels: IHotel[];
  transportation: ITransportation[];
  services: IServices;
  policies: IPolicies;
  pricing: IPricing;
  createdAt: Date;
  updatedAt: Date;
}

// Define schemas
const ScheduleItemSchema: Schema = new Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  activities: { type: String },
  performers: [{ type: String }],
});

// SIMPLIFIED: Room Schema - with all fields
const RoomSchema: Schema = new Schema({
  name: { type: String, required: true },           // Room Name
  image: { type: String },                           // Room Image URL
  bedType: { type: String, default: 'King Size' },   // Bed Type
  capacity: { type: Number, default: 2 }, // Capacity
  pricePerNight: { type: Number },   // Price/Night
  availability: { type: Number, default: 5 }, // Availability count
  description: { type: String },                    // Room description
  sqm: { type: Number },                            // Room size in sqm
  amenities: [{ type: String }],                    // Room amenities
}, { _id: true });

// Hotel Schema with all fields
const HotelSchema: Schema = new Schema({
  name: { type: String, required: true },
  starRating: { type: Number },
  address: { type: String },
  description: { type: String },
  fullDescription: { type: String },
  policies: { type: String },
  image: { type: String },
  checkInTime: { type: String },
  checkOutTime: { type: String },
  facilities: [{ type: String }],
  gallery: [{ type: String }],
  rooms: [RoomSchema],
});

const TransportationSchema: Schema = new Schema({
  type: { type: String, required: true },
  provider: { type: String },
  price: { type: Number },
  description: { type: String },
  image: { type: String },
  availability: { type: Number },
  capacity: { type: Number },
  features: [{ type: String }],
  pickupLocations: { type: String },
});

const ServicesSchema: Schema = new Schema({
  foodPackages: [{ type: String }],
  culturalServices: [{ type: String }],
  specialAssistance: [{ type: String }],
  extras: [{ type: String }],
}, { _id: false });

const PoliciesSchema: Schema = new Schema({
  cancellation: { type: String },
  terms: { type: String },
  safety: { type: String },
  ageRestriction: { type: String },
}, { _id: false });

const PricingSchema: Schema = new Schema({
  basePrice: { type: Number, default: 0 },
  vipPrice: { type: Number, default: 0 },
  currency: { type: String, default: 'ETB' },
  earlyBird: { type: Number, default: 0 },
  groupDiscount: { type: Number, default: 0 },
}, { _id: false });

const FestivalSchema: Schema = new Schema(
  {
  name: { type: String },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: {
  name: { type: String },
      address: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coverImage: { type: String },
    gallery: [{ type: String }],
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Cancelled'],
      default: 'Draft',
    },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Under Review', 'Approved', 'Rejected'],
      default: 'Draft',
    },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    changesVersion: { type: Number, default: 0 },
    isEditedAfterApproval: { type: Boolean, default: false },
    reverificationRequested: { type: Boolean, default: false },
    lastEditedAt: { type: Date },
    schedule: [ScheduleItemSchema],
    hotels: [HotelSchema],
    transportation: [TransportationSchema],
    services: ServicesSchema,
    policies: PoliciesSchema,
    pricing: PricingSchema,
  },
  {
    timestamps: true,
  }
);

const Festival = mongoose.models.Festival || mongoose.model<IFestival>('Festival', FestivalSchema);

export default Festival;