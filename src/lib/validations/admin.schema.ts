import { z } from 'zod';

export const AdminRejectionSchema = z.object({
  reason: z.string()
    .min(10, "Rejection reason must be at least 10 characters long")
    .max(1000, "Rejection reason is too long"),
  role: z.string().optional(),
});

export const AdminApprovalSchema = z.object({
  role: z.string().optional(),
});
