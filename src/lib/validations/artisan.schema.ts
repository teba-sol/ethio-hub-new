import { z } from 'zod';

export const ArtisanProductSchema = z.object({
  name: z.string().optional(),
  name_en: z.string().min(3, "English name must be at least 3 characters"),
  name_am: z.string().min(3, "Amharic name must be at least 3 characters"),
  description: z.string().optional(),
  description_en: z.string().min(20, "English description must be at least 20 characters"),
  description_am: z.string().min(20, "Amharic description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  price: z.number().positive("Price must be a positive number"),
  discountPrice: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative("Stock cannot be negative"),
  deliveryTime: z.string().min(1, "Delivery time estimate is required"),
  shippingFee: z.number().nonnegative("Shipping fee cannot be negative"),
  images: z.array(z.string().url()).min(1, "At least one product image is required"),
  material: z.string().optional(),
  materials: z.string().optional(),
  handmadeBy: z.string().optional(),
  region: z.string().optional(),
  careInstructions: z.string().optional(),
  sku: z.string().optional(),
  tags: z.array(z.string()).optional().or(z.string().transform(val => val.split(',').map(t => t.trim()))),
  weight: z.string().optional(),
  status: z.string().optional(),
});

export const ArtisanProductDraftSchema = ArtisanProductSchema.partial().extend({
  // Drafts only need a name to be started
  name_en: z.string().optional(),
  name_am: z.string().optional(),
});
