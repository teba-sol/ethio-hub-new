import mongoose, { Document, Schema } from 'mongoose';

// Define interfaces for nested objects
export interface IScheduleItem extends Document {
  day: number;
  title: string;
  title_en: string;
  title_am: string;
  activities: string;
  performers: string[];
  image?: string;
}

export interface ITicketType {
  name: string;           // For backward compatibility
  name_en: string;
  name_am: string;
  price: number;
  quantity: number;       // Total inventory
  available: number;      // Available (decremented on booking)
  perks?: string[];       // Priority perks (VIP only)
}

export interface IRoom extends Document {
  name: string;           // Room Name (for backward compatibility)
  name_en: string;
  name_am: string;
  image?: string;         // Room Image URL
  bedType: string;        // Bed Type (e.g., "1-bedroom", "2-bedroom")
  capacity: number;       // Capacity (number of people)
  pricePerNight: number;  // Price per night
  availability: number;   // Number of rooms available (total)
  available: number;      // Available rooms (decremented on booking)
  description?: string;    // Room description (for backward compatibility)
  description_en?: string;
  description_am?: string;
  sqm?: number;           // Room size in square meters
  tier: 'vip' | 'standard' | 'both';  // Which ticket tiers can book this room
  amenities?: string[];    // Room amenities (WiFi, AC, etc.)
}

// Hotel interface with simplified rooms
export interface IHotel extends Document {
  name: string; // for backward compatibility
  name_en: string;
  name_am: string;
  starRating: number;
  address: string;
  coordinates?: { lat?: number; lng?: number };
  description: string; // for backward compatibility
  description_en?: string;
  description_am?: string;
  fullDescription?: string; // for backward compatibility
  fullDescription_en?: string;
  fullDescription_am?: string;
  policies?: string;
  image: string;
  checkInTime?: string;
  checkOutTime?: string;
  facilities?: string[];
  gallery?: string[];
  rooms: IRoom[];
  hotelServices?: Array<{  // Pay-at-hotel services (display only)
    name: string;
    price: number;
    description?: string;
  }>;
}

export interface ITransportation extends Document {
  type: string; // for backward compatibility
  type_en: string;
  type_am: string;
  provider: string;
  price: number;
  description: string; // for backward compatibility
  description_en?: string;
  description_am?: string;
  image?: string;
  availability?: number;  // Total vehicles available
  available?: number;     // Available vehicles (decremented on booking)
  capacity?: number;      // Passenger capacity per vehicle
  vipIncluded?: boolean;  // If true, VIP ticket holders get this transport free
  features?: string[];    // Vehicle features (matches schema)
  pickupLocations?: string;
}

export interface IServices {
  foodPackages: any[];
  culturalServices: string[];
  culturalServices_en: string[];
  culturalServices_am: string[];
  specialAssistance: string[];
  specialAssistance_en: string[];
  specialAssistance_am: string[];
  extras: string[];
  extras_en: string[];
  extras_am: string[];
}

export interface IPolicies {
  cancellation: string;
  cancellation_en: string;
  cancellation_am: string;
  terms: string;
  terms_en: string;
  terms_am: string;
  safety: string;
  safety_en: string;
  safety_am: string;
  ageRestriction: string;
}

export interface IPricing {
  basePrice: number;
  vipPrice: number;
  currency: string;
  earlyBird: number; // percentage
  earlyBirdDays: number; // validity in days
  groupDiscount: number;
}

export interface IFestival extends Document {
  name: string; // for backward compatibility
  name_en: string;
  name_am: string;
  type: 'Religious' | 'Cultural/Traditional' | 'National/Public Holidays';
  shortDescription: string; // for backward compatibility
  shortDescription_en: string;
  shortDescription_am: string;
  fullDescription: string; // for backward compatibility
  fullDescription_en: string;
  fullDescription_am: string;
  startDate: Date;
  endDate: Date;
  totalCapacity: number;
  location: {
    name: string; // for backward compatibility
    name_en: string;
    name_am: string;
    address?: string;
    coordinates?: { lat?: number; lng?: number };
  };
  organizer: mongoose.Types.ObjectId;
  coverImage?: string;
  gallery?: string[];
  status: 'Draft' | 'Published' | 'Completed' | 'Cancelled';
  isVerified: boolean;
  verificationStatus: 'Draft' | 'Pending Approval' | 'Under Review' | 'Approved' | 'Rejected';
  region?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  changesVersion?: number;
  isEditedAfterApproval?: boolean;
  reverificationRequested?: boolean;
  lastEditedAt?: Date;
  schedule: IScheduleItem[];
  ticketTypes: ITicketType[];  // Ticket types with inventory
  hotels: IHotel[];
  transportation: ITransportation[];
  services: IServices;
  policies: IPolicies;
  pricing: IPricing;
  createdAt: Date;
  updatedAt: Date;
  reportsCount: number;
}

// Define schemas
const ScheduleItemSchema: Schema = new Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  title_en: { type: String, required: true },
  title_am: { type: String, required: true },
  activities: { type: String },
  performers: [{ type: String }],
});

// Ticket Type Schema with inventory tracking
const TicketTypeSchema: Schema = new Schema({
  name: { type: String },  // Optional - fallback from name_en or name_am
  name_en: { type: String },
  name_am: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 },     // Total inventory
  available: { type: Number, required: true, default: 0 },     // Available (decremented on booking)
  perks: [{ type: String }],  // Priority perks (VIP only)
}, { _id: true });

// SIMPLIFIED: Room Schema - with all fields
const RoomSchema: Schema = new Schema({
  name: { type: String },           // Optional - fallback from name_en or name_am
  name_en: { type: String },
  name_am: { type: String },
  image: { type: String },                           // Room Image URL
  bedType: { type: String, default: '1-bedroom' },   // Bed Type: '1-bedroom', '2-bedroom', etc.
  capacity: { type: Number, default: 2 },             // Capacity
  pricePerNight: { type: Number },                   // Price/Night
  availability: { type: Number, default: 5 },         // Total rooms available
  available: { type: Number, default: 5 },            // Available rooms (decremented on booking)
  description: { type: String, default: "" },                    // Room description
  description_en: { type: String, default: "" },
  description_am: { type: String, default: "" },
  sqm: { type: Number },                            // Room size in sqm
  tier: { type: String, enum: ['vip', 'standard', 'both'], default: 'both' },  // Which tiers can book
  amenities: [{ type: String }],                    // Room amenities
}, { _id: true });

// Food Package Schema
const FoodPackageSchema: Schema = new Schema({
  name: { type: String },
  name_en: { type: String },
  name_am: { type: String },
  description: { type: String },
  description_en: { type: String },
  description_am: { type: String },
  pricePerPerson: { type: Number, required: true },
  items: [{ type: String }], // ["Breakfast", "Lunch", "Dinner", "Drinks"]
}, { _id: true });

// Hotel Schema with all fields
const HotelSchema: Schema = new Schema({
  name: { type: String },  // Optional - fallback from name_en or name_am
  name_en: { type: String },
  name_am: { type: String },
  starRating: { type: Number },
  address: { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  description: { type: String },
  description_en: { type: String },
  description_am: { type: String },
  fullDescription: { type: String },
  fullDescription_en: { type: String },
  fullDescription_am: { type: String },
  policies: { type: String },
  image: { type: String },
  checkInTime: { type: String },
  checkOutTime: { type: String },
  facilities: [{ type: String }],
  gallery: [{ type: String }],
  rooms: [RoomSchema],
  hotelServices: [{  // Pay-at-hotel services (display only)
    name: { type: String },
    price: { type: Number },
    description: { type: String }
  }],
  foodAndDrink: [{ type: String }],
  hotelRules: [{ type: String }],
  propertyType: { type: String },
});

const TransportationSchema: Schema = new Schema({
  type: { type: String },  // Optional - fallback from type_en or type_am
  type_en: { type: String },
  type_am: { type: String },
  provider: { type: String },
  price: { type: Number },
  description: { type: String },
  description_en: { type: String },
  description_am: { type: String },
  image: { type: String },
  availability: { type: Number },       // Total vehicles available
  available: { type: Number },          // Available vehicles (decremented on booking)
  capacity: { type: Number },
  vipIncluded: { type: Boolean, default: false },  // VIP ticket holders get this free
  features: [{ type: String }],
  pickupLocations: { type: String },
});

const ServicesSchema: Schema = new Schema({
  foodPackages: [FoodPackageSchema],
  culturalServices: [{ type: String }],
  culturalServices_en: [{ type: String }],
  culturalServices_am: [{ type: String }],
  specialAssistance: [{ type: String }],
  specialAssistance_en: [{ type: String }],
  specialAssistance_am: [{ type: String }],
  extras: [{ type: String }],
  extras_en: [{ type: String }],
  extras_am: [{ type: String }],
}, { _id: false });

const PoliciesSchema: Schema = new Schema({
  cancellation: { type: String },
  cancellation_en: { type: String },
  cancellation_am: { type: String },
  terms: { type: String },
  terms_en: { type: String },
  terms_am: { type: String },
  safety: { type: String },
  safety_en: { type: String },
  safety_am: { type: String },
  ageRestriction: { type: String },
}, { _id: false });

const PricingSchema: Schema = new Schema({
  basePrice: { type: Number, default: 0 },
  vipPrice: { type: Number, default: 0 },
  currency: { type: String, default: 'ETB' },
  earlyBird: { type: Number, default: 0 },
  earlyBirdDays: { type: Number, default: 0 },
  groupDiscount: { type: Number, default: 0 },
}, { _id: false });

const FestivalSchema: Schema = new Schema(
  {
    name: { type: String },
    name_en: { type: String, required: true },
    name_am: { type: String, required: true },
    type: {
      type: String,
      required: true,
      default: 'CulturalTraditional'
    },
    shortDescription: { type: String, required: true },
    shortDescription_en: { type: String, required: true },
    shortDescription_am: { type: String, required: true },
    fullDescription: { type: String, required: true },
    fullDescription_en: { type: String, required: true },
    fullDescription_am: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalCapacity: { type: Number, default: 0 },
    location: {
  name: { type: String },
      name_en: { type: String, required: true },
      name_am: { type: String, required: true },
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
      enum: ['Draft', 'Published', 'Completed', 'Cancelled'],
      default: 'Draft',
    },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Under Review', 'Approved', 'Rejected'],
      default: 'Draft',
    },
    region: { type: String },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    changesVersion: { type: Number, default: 0 },
    isEditedAfterApproval: { type: Boolean, default: false },
    reverificationRequested: { type: Boolean, default: false },
    lastEditedAt: { type: Date },
    schedule: [ScheduleItemSchema],
    ticketTypes: [TicketTypeSchema],     // Ticket types with inventory
    hotels: [HotelSchema],
    transportation: [TransportationSchema],
    services: ServicesSchema,
    policies: PoliciesSchema,
    pricing: PricingSchema,
    reportsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Festival = mongoose.models.Festival || mongoose.model<IFestival>('Festival', FestivalSchema);

export default Festival;