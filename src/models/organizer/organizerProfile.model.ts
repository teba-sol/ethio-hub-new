import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrganizerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  phone: string;
  website?: string;
  bio: string;
  country: string;
  region: string;
  city: string;
  address: string;
  payoutMethod: 'bank' | 'telebirr' | 'chapa';
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  telebirrNumber?: string;
  chapaAccountId?: string;
  logo?: string;
  businessLicense?: string;
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
    phone: {
      type: String,
      required: true,
    },
    website: {
      type: String,
    },
    bio: {
      type: String,
      required: true,
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
    payoutMethod: {
      type: String,
      required: true,
      enum: ['bank', 'telebirr', 'chapa'],
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
  },
  {
    timestamps: true,
  }
);

const OrganizerProfile: Model<IOrganizerProfile> =
  mongoose.models.OrganizerProfile || mongoose.model<IOrganizerProfile>('OrganizerProfile', OrganizerProfileSchema);

export default OrganizerProfile;