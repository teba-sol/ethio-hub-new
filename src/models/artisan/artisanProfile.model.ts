import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IArtisanProfile extends Document {
  userId: mongoose.Types.ObjectId;
  phone: string;
  gender: string;
  businessName: string;
  category: string;
  experience: number;
  bio: string;
  country: string;
  region: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  profileImage?: string;
  idDocument?: string;
  workshopPhoto?: string;
  craftProcessPhoto?: string;
  productSamplePhotos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ArtisanProfileSchema = new Schema<IArtisanProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other'],
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Textiles', 'Pottery', 'Jewelry', 'Woodwork', 'Traditional Clothing', 'Coffee Items'],
    },
    experience: {
      type: Number,
      required: true,
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
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    bankName: {
      type: String,
      required: true,
    },
    accountName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
    },
    idDocument: {
      type: String,
    },
    workshopPhoto: {
      type: String,
    },
    craftProcessPhoto: {
      type: String,
    },
    productSamplePhotos: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const ArtisanProfile: Model<IArtisanProfile> =
  mongoose.models.ArtisanProfile || mongoose.model<IArtisanProfile>('ArtisanProfile', ArtisanProfileSchema);

export default ArtisanProfile;
