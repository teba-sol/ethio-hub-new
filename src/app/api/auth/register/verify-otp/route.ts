import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PendingRegistration from "@/models/PendingRegistration";
import {
  hashOtp,
  normalizeEmail,
  REGISTRATION_OTP_MAX_ATTEMPTS,
} from "@/lib/registrationOtp";
import { applyRateLimit, getRequestIp } from "@/lib/rateLimit";
import { generateAccessToken, generateRefreshToken } from "@/services/auth.service";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const email = normalizeEmail(body.email || "");
    const otp = `${body.otp || ""}`.trim();

    const ip = getRequestIp(request);
    const rate = applyRateLimit({
      key: `verify-otp:${ip}:${email}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many verification attempts. Try again in ${rate.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required." },
        { status: 400 }
      );
    }

    const pending = await PendingRegistration.findOne({ email });
    if (!pending) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No pending registration found for this email. Please request a new OTP.",
        },
        { status: 404 }
      );
    }

    if (pending.otpExpiresAt <= new Date()) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return NextResponse.json(
        {
          success: false,
          message: "This OTP has expired. Please request a new one.",
        },
        { status: 410 }
      );
    }

    if (pending.attempts >= REGISTRATION_OTP_MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many incorrect attempts. Please request a new OTP and try again.",
        },
        { status: 429 }
      );
    }

    const providedOtpHash = hashOtp(otp);
    if (providedOtpHash !== pending.otpHash) {
      await PendingRegistration.updateOne(
        { _id: pending._id },
        { $inc: { attempts: 1 } }
      );
      return NextResponse.json(
        { success: false, message: "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return NextResponse.json(
        {
          success: false,
          message: "A user with this email already exists. Please log in.",
        },
        { status: 409 }
      );
    }

    const role = pending.role?.toLowerCase?.() || "tourist";
    const newUserData: Record<string, unknown> = {
      name: pending.name,
      email: pending.email,
      password: pending.passwordHash,
      role,
      isVerified: true,
      adminApprovalStatus: "NOT_REQUIRED",
    };

    if (role === "organizer") {
      newUserData.organizerStatus = "Not Submitted";
    } else if (role === "artisan") {
      newUserData.artisanStatus = "Not Submitted";
    }

    const user = await User.create(newUserData);
    await PendingRegistration.deleteOne({ _id: pending._id });

    // Generate tokens for automatic login after verification
    const accessToken = await generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    const refreshToken = await generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Email verified. Your account is now active.",
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          artisanStatus: user.artisanStatus || "Not Submitted",
          organizerStatus: user.organizerStatus || "Not Submitted",
          deliveryStatus: user.deliveryStatus || "Not Submitted",
          organizerProfile: user.organizerProfile || null,
          touristProfile: user.touristProfile || null,
          deliveryProfile: user.deliveryProfile || null,
          rejectionReason: user.rejectionReason || null,
        },
      },
      { status: 200 }
    );

    // Set Access Token (1 hour)
    response.cookies.set('sessionToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    // Set Refresh Token (7 days)
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 3600, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Unable to verify OTP right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
