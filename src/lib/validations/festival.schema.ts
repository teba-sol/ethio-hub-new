import { z } from 'zod';

// Shared patterns
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// --- Sub-Schemas ---

export const LocationSchema = z.object({
  name: z.string().nullable().optional(),
  name_en: z.string().nullable().optional(),
  name_am: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  coordinates: z.object({
    lat: z.number().nullable().optional(),
    lng: z.number().nullable().optional(),
  }).nullable().optional(),
}).passthrough();

export const HotelSchema = z.object({
  name_en: z.string().nullable().optional(),
  name_am: z.string().nullable().optional(),
  pricePerNight: z.any().nullable().optional(),
  rooms: z.array(z.any()).nullable().optional(),
}).passthrough();

export const TransportSchema = z.object({
  type_en: z.string().nullable().optional(),
  price: z.any().nullable().optional(),
  capacity: z.any().nullable().optional(),
  availability: z.any().nullable().optional(),
}).passthrough();

// --- Base Schema (Without Refinements) ---
export const FestivalBaseSchema = z.object({
  name_en: z.string().nullable().optional(),
  name_am: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  shortDescription_en: z.string().nullable().optional(),
  shortDescription_am: z.string().nullable().optional(),
  fullDescription_en: z.string().nullable().optional(),
  fullDescription_am: z.string().nullable().optional(),
  startDate: z.any().nullable().optional(),
  endDate: z.any().nullable().optional(),
  totalCapacity: z.any().nullable().optional(),
  location: LocationSchema.nullable().optional(),
  pricing: z.any().nullable().optional(),
  hotels: z.array(z.any()).nullable().optional(),
  transportation: z.array(z.any()).nullable().optional(),
}).passthrough();

// --- Main Festival Schema (With Refinements) ---
export const FestivalSchema = FestivalBaseSchema.refine((data) => {
  if (!data.startDate || !data.endDate) return true;
  try {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;
    return end >= start;
  } catch {
    return true;
  }
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// For Drafts (more relaxed validation)
export const FestivalDraftSchema = FestivalBaseSchema; // Already partial enough
