import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../../../lib/mongodb";
import User from "../../../../../models/User";
import PendingRegistration from "../../../../../models/PendingRegistration";
import {
  generateOtp,
  getOtpExpiryDate,
  getRemainingOtpSeconds,
  hashOtp,
  isAllowedRegistrationEmail,
  normalizeEmail,
  REGISTRATION_OTP_TTL_MS,
} from "../../../../../lib/registrationOtp";
import {
  EmailProviderError,
  probeGmailRecipient,
  sendRegistrationOtpEmail,
} from "../../../../../lib/email";
import { applyRateLimit, getRequestIp } from "../../../../../lib/rateLimit";
import { RegisterRequestSchema } from "../../../../../lib/validations/auth.schema";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    
    // --- Schema Validation ---
    const validationResult = RegisterRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Validation failed", 
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { name, email, password, role } = validationResult.data;
    const normalizedEmail = normalizeEmail(email);

    const ip = getRequestIp(request);
    const limiter = applyRateLimit({
      key: `request-otp:${ip}:${normalizedEmail}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!limiter.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many OTP requests. Try again in ${limiter.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const existingPending = await PendingRegistration.findOne({ email });
    if (existingPending && existingPending.otpExpiresAt > new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "An OTP was already sent. Please wait for it to expire before requesting a new one.",
          remainingSeconds: getRemainingOtpSeconds(existingPending.otpExpiresAt),
        },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(password, 10);
    const otpExpiresAt = getOtpExpiryDate();

    const probe = await probeGmailRecipient(email);
    if (probe.status === "invalid") {
      return NextResponse.json(
        {
          success: false,
          message: "Please use a valid Gmail address.",
        },
        { status: 400 }
      );
    }
    if (probe.status === "unknown") {
      return NextResponse.json(
        {
          success: false,
          message:
            "We could not verify this Gmail address right now. Please try again shortly.",
        },
        { status: 503 }
      );
    }

    await sendRegistrationOtpEmail({ to: email, name, otp });

    await PendingRegistration.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          email,
          passwordHash,
          role,
          otpHash: hashOtp(otp),
          otpExpiresAt,
          attempts: 0,
          lastSentAt: new Date(),
        },
        $inc: {
          resendCount: existingPending ? 1 : 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent successfully. Please check your Gmail inbox.",
        expiresInSeconds: Math.floor(REGISTRATION_OTP_TTL_MS / 1000),
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof EmailProviderError) {
      return NextResponse.json(
        {
          success: false,
          errorCode: error.code,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        errorCode: "EMAIL_PROVIDER_ERROR",
        message:
          error?.message ||
          "Unable to send verification OTP right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
