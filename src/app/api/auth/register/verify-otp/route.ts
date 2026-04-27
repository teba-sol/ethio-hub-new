import { NextResponse } from "next/server";
import { serialize } from "cookie";
import { SignJWT } from "jose";
import { connectDB } from "../../../../../lib/mongodb";
import User from "../../../../../models/User";
import PendingRegistration from "../../../../../models/PendingRegistration";
import {
  hashOtp,
  normalizeEmail,
  REGISTRATION_OTP_MAX_ATTEMPTS,
} from "../../../../../lib/registrationOtp";

const JWT_SECRET = process.env.JWT_SECRET || "ethio-hub-secret-key-2025";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const email = normalizeEmail(body.email || "");
    const otp = `${body.otp || ""}`.trim();

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
    };

    if (role === "organizer") {
      newUserData.organizerStatus = "Not Submitted";
    } else if (role === "artisan") {
      newUserData.artisanStatus = "Not Submitted";
    }

    const user = await User.create(newUserData);
    await PendingRegistration.deleteOne({ _id: pending._id });

    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(JWT_SECRET));

    const serialized = serialize("sessionToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60,
      path: "/",
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
          organizerProfile: user.organizerProfile || null,
          touristProfile: user.touristProfile || null,
        },
      },
      { status: 200 }
    );

    response.headers.set("Set-Cookie", serialized);
    return response;
  } catch (error: any) {
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
