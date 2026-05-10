import { z } from 'zod';

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const CommonProfileSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  phone: z.string().regex(phoneRegex, "Invalid phone number format").optional().or(z.literal('')),
  bio: z.string().max(1000, "Bio is too long").optional(),
  country: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  profileImage: z.string().url().optional().or(z.literal('')),
  nationality: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
});

export const OrganizerProfileSchema = CommonProfileSchema.extend({
  companyName: z.string().min(2, "Company name is required"),
  website: z.string().url().optional().or(z.literal('')),
  businessLicense: z.string().url().optional(),
  payoutMethod: z.enum(['Bank Transfer', 'Mobile Money', 'Other']).default('Bank Transfer'),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
});

export const ArtisanProfileSchema = CommonProfileSchema.extend({
  businessName: z.string().min(2, "Business name is required"),
  category: z.string().min(1, "Category is required"),
  experience: z.string().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  workshopPhoto: z.string().url().optional(),
  idDocument: z.string().url().optional(),
});

export const DeliveryProfileSchema = CommonProfileSchema.extend({
  vehicleType: z.enum(['Motorcycle', 'Bicycle', 'Car', 'Van']).default('Motorcycle'),
  licensePlate: z.string().min(3, "License plate is required"),
  idDocument: z.string().url().optional(),
});
