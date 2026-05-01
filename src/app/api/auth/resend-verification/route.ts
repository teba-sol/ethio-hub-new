import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { EmailProviderError, sendEmailVerificationLink } from "../../../../lib/email";
import { applyRateLimit, getRequestIp } from "../../../../lib/rateLimit";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_RESENDS_PER_HOUR = 3;
const RESEND_WINDOW_MS = 60 * 60 * 1000;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getBaseUrl = () =>
  process.env.APP_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "http://localhost:3000";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const email = normalizeEmail(body.email || "");
    const ip = getRequestIp(request);

    const rate = applyRateLimit({
      key: `resend-verification:${ip}:${email}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
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

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, message: "This email is already verified." },
        { status: 400 }
      );
    }

    const now = Date.now();
    const windowStart = user.emailVerificationResendWindowStart
      ? new Date(user.emailVerificationResendWindowStart).getTime()
      : 0;
    const inWindow = windowStart > 0 && now - windowStart < RESEND_WINDOW_MS;
    const resendCount = inWindow ? user.emailVerificationResendCount || 0 : 0;

    if (inWindow && resendCount >= MAX_RESENDS_PER_HOUR) {
      return NextResponse.json(
        {
          success: false,
          message: "Resend limit reached. Please wait before trying again.",
        },
        { status: 429 }
      );
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.emailVerificationTokenHash = tokenHash;
    user.emailVerificationTokenExpiry = new Date(now + EMAIL_VERIFICATION_TTL_MS);
    user.emailVerificationResendWindowStart = inWindow ? user.emailVerificationResendWindowStart : new Date(now);
    user.emailVerificationResendCount = resendCount + 1;
    await user.save();

    const verificationUrl = `${getBaseUrl()}/verify-email?token=${rawToken}`;
    await sendEmailVerificationLink({
      to: user.email,
      name: user.name || "there",
      verificationUrl,
    });

    return NextResponse.json(
      { success: true, message: "Verification email resent successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof EmailProviderError) {
      return NextResponse.json(
        { success: false, errorCode: error.code, message: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to resend verification email.",
      },
      { status: 500 }
    );
  }
}
