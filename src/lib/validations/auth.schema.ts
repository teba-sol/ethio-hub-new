import { z } from 'zod';

export const RegisterRequestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string()
    .email("Invalid email address")
    .refine(email => email.endsWith('@gmail.com'), "Please use a valid Gmail address (@gmail.com)"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(['tourist', 'organizer', 'artisan'], {
    errorMap: () => ({ message: "Invalid registration role" })
  }).default('tourist'),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
