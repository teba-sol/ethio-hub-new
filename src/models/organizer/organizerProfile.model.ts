import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrganizerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  contactPersonName?: string;
  phone: string;
  organizerType?: string;
  website?: string;
  socialMedia?: string;
  bio: string;
  experienceYears?: string;
  country: string;
  region: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  payoutMethod: 'Bank Account' | 'Mobile Wallet' | 'telebirr' | 'chapa' | 'bank';
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  telebirrNumber?: string;
  chapaAccountId?: string;
  logo?: string;
  businessLicense?: string;
  tourismLicense?: string;
  taxCert?: string;
  eventPhotos?: string;
  eventPoster?: string;
  eventVideos?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizerProfileSchema = new Schema<IOrganizerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPersonName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    organizerType: {
      type: String,
    },
    website: {
      type: String,
    },
    socialMedia: {
      type: String,
    },
    bio: {
      type: String,
      required: true,
    },
    experienceYears: {
      type: String,
    },
    country: {
      type: String,
      required: true,
      default: 'Ethiopia',
    },
    region: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    payoutMethod: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
    },
    accountHolderName: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    telebirrNumber: {
      type: String,
    },
    chapaAccountId: {
      type: String,
    },
    logo: {
      type: String,
    },
    businessLicense: {
      type: String,
    },
    tourismLicense: {
      type: String,
    },
    taxCert: {
      type: String,
    },
    eventPhotos: {
      type: String,
    },
    eventPoster: {
      type: String,
    },
    eventVideos: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const OrganizerProfile: Model<IOrganizerProfile> =
  mongoose.models.OrganizerProfile || mongoose.model<IOrganizerProfile>('OrganizerProfile', OrganizerProfileSchema);

export default OrganizerProfile;