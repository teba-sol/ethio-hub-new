import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  artisanId: mongoose.Types.ObjectId;
  name: string;
  name_en: string;
  name_am: string;
  images: string[];
  description: string;
  description_en: string;
  description_am: string;
  material?: string;
  handmadeBy?: string;
  region?: string;
  careInstructions?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  sku?: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  weight?: string;
  deliveryTime: string;
  shippingFee: string;
  status: 'Draft' | 'Published' | 'Archived';
  verificationStatus: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  reportsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    artisanId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    name_en: {
      type: String,
      required: true,
      trim: true,
    },
    name_am: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      required: true,
    },
    description_en: {
      type: String,
      required: true,
    },
    description_am: {
      type: String,
      required: true,
    },
    material: {
      type: String,
    },
    handmadeBy: {
      type: String,
    },
    region: {
      type: String,
    },
    careInstructions: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    sku: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    subcategory: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    weight: {
      type: String,
    },
    deliveryTime: {
      type: String,
      required: true,
    },
    shippingFee: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Draft',
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    rejectionReason: {
      type: String,
    },
    reportsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ProductSchema.index({ artisanId: 1, status: 1 });
ProductSchema.index({ category: 1 });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
