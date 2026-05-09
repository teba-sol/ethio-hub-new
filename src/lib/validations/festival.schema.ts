import { z } from 'zod';

// Shared patterns
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// --- Sub-Schemas ---

export const LocationSchema = z.object({
  name: z.string().min(2, "Location name is too short").optional(),
  name_en: z.string().min(2, "English location name is too short").optional(),
  name_am: z.string().min(2, "Amharic location name is too short").optional(),
  address: z.string().min(5, "Address is too short").optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

export const HotelSchema = z.object({
  name_en: z.string().min(3, "Hotel name (EN) is required"),
  name_am: z.string().optional(),
  pricePerNight: z.number().nonnegative("Price cannot be negative"),
  rooms: z.array(z.object({
    name_en: z.string().min(2, "Room name is required"),
    pricePerNight: z.number().nonnegative(),
    capacity: z.number().int().positive(),
    availability: z.number().int().nonnegative(),
  })).min(1, "At least one room type is required"),
});

export const TransportSchema = z.object({
  type_en: z.string().min(3, "Transport type is required"),
  price: z.number().nonnegative("Price cannot be negative"),
  capacity: z.number().int().positive().optional(),
  availability: z.number().int().nonnegative().optional(),
});

// --- Base Schema (Without Refinements) ---
export const FestivalBaseSchema = z.object({
  name_en: z.string().min(5, "English name must be at least 5 characters"),
  name_am: z.string().optional(),
  type: z.string().default('CulturalTraditional'),
  shortDescription_en: z.string().min(20, "Short description must be at least 20 characters"),
  shortDescription_am: z.string().optional(),
  fullDescription_en: z.string().min(100, "Full description must be at least 100 characters"),
  fullDescription_am: z.string().optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  totalCapacity: z.number().int().positive("Capacity must be a positive number"),
  location: LocationSchema,
  pricing: z.object({
    basePrice: z.number().nonnegative("Base price cannot be negative"),
    vipPrice: z.number().nonnegative("VIP price cannot be negative").optional(),
    currency: z.string().default('ETB'),
    earlyBird: z.number().min(0).max(100).optional(),
    earlyBirdDays: z.number().int().nonnegative().optional(),
  }).optional(),
  hotels: z.array(HotelSchema).optional(),
  transportation: z.array(TransportSchema).optional(),
});

// --- Main Festival Schema (With Refinements) ---
export const FestivalSchema = FestivalBaseSchema.refine((data) => {
  if (!data.startDate || !data.endDate) return true;
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// For Drafts (more relaxed validation)
export const FestivalDraftSchema = FestivalBaseSchema.partial().extend({
  name_en: z.string().optional(), // Drafts can exist without names initially
});
