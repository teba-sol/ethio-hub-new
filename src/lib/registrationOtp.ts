import { createHash, randomInt } from "crypto";

export const REGISTRATION_OTP_TTL_MS = 2 * 60 * 1000;
export const REGISTRATION_OTP_LENGTH = 6;
export const REGISTRATION_OTP_MAX_ATTEMPTS = 5;
export const GOOGLE_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isAllowedRegistrationEmail = (email: string) =>
  GOOGLE_EMAIL_REGEX.test(normalizeEmail(email));

export const generateOtp = () =>
  `${randomInt(0, 10 ** REGISTRATION_OTP_LENGTH)}`.padStart(REGISTRATION_OTP_LENGTH, "0");

export const hashOtp = (otp: string) =>
  createHash("sha256").update(otp).digest("hex");

export const getOtpExpiryDate = () =>
  new Date(Date.now() + REGISTRATION_OTP_TTL_MS);

export const getRemainingOtpSeconds = (expiresAt: Date) =>
  Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
