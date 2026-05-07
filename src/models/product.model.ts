// src/models/product.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string; // For backward compatibility
  name_en: string;
  name_am: string;
  description: string; // For backward compatibility
  description_en: string;
  description_am: string;
  culturalStory_en: string;
  culturalStory_am: string;
  price: number;
  images: string[];
  artisan: mongoose.Schema.Types.ObjectId;
  category: string;
  stock: number;
  material_en?: string;
  material_am?: string;
  careInstructions_en?: string;
  careInstructions_am?: string;
  region?: string;
  origin?: string;
  rating: number;
  numReviews: number;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    name_en: { type: String, required: true },
    name_am: { type: String, required: true },
    description: { type: String, required: true },
    description_en: { type: String, required: true },
    description_am: { type: String, required: true },
    culturalStory_en: { type: String, default: '' },
    culturalStory_am: { type: String, default: '' },
    price: { type: Number, required: true },
    images: [{ type: String, required: true }],
    artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 1 },
    material_en: { type: String },
    material_am: { type: String },
    careInstructions_en: { type: String },
    careInstructions_am: { type: String },
    region: { type: String },
    origin: { type: String },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export default Product;