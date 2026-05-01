import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
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
import { EmailProviderError, sendRegistrationOtpEmail } from "../../../../../lib/email";
import { applyRateLimit, getRequestIp } from "../../../../../lib/rateLimit";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const email = normalizeEmail(body.email || "");
    const ip = getRequestIp(request);

    if (!email || !isAllowedRegistrationEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid Gmail address." },
        { status: 400 }
      );
    }

    const rate = applyRateLimit({
      key: `resend-otp:${ip}:${email}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many resend requests. Try again in ${rate.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const pending = await PendingRegistration.findOne({ email });
    if (!pending) {
      return NextResponse.json(
        {
          success: false,
          message: "No pending registration found. Please register again.",
        },
        { status: 404 }
      );
    }

    if (pending.otpExpiresAt > new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP already sent. Please wait before requesting a new one.",
          remainingSeconds: getRemainingOtpSeconds(pending.otpExpiresAt),
        },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    const otpExpiresAt = getOtpExpiryDate();
    await sendRegistrationOtpEmail({ to: email, name: pending.name, otp });

    pending.otpHash = hashOtp(otp);
    pending.otpExpiresAt = otpExpiresAt;
    pending.attempts = 0;
    pending.lastSentAt = new Date();
    pending.resendCount = Number(pending.resendCount || 0) + 1;
    await pending.save();

    return NextResponse.json(
      {
        success: true,
        message: "A new OTP has been sent to your Gmail inbox.",
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
        message: "Unable to resend OTP right now. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
