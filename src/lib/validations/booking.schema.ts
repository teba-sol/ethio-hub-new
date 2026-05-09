import { z } from 'zod';

export const BookingCheckoutSchema = z.object({
  festivalId: z.string().min(1, "Festival ID is required"),
  ticketType: z.string().min(1, "Ticket type is required"),
  quantity: z.number().int().min(1, "At least one ticket is required").max(10, "Maximum 10 tickets per booking"),
  contactInfo: z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(9, "Valid phone number is required"),
  }),
  selectedRoom: z.object({
    roomId: z.string(),
    roomName: z.string(),
    roomPrice: z.number(),
  }).optional(),
  selectedTransport: z.object({
    transportId: z.string(),
    type: z.string(),
    price: z.number(),
  }).optional(),
  specialRequests: z.string().max(500, "Special requests must be under 500 characters").optional(),
});

export const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z.string().min(10, "Comment must be at least 10 characters long").max(1000),
});
