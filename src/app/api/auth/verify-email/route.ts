import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";

export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const token = url.searchParams.get("token") || "";

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Verification token is required." },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "This verification link is invalid or expired.",
        },
        { status: 400 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: true, message: "Email is already verified." },
        { status: 200 }
      );
    }

    user.isVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationTokenExpiry = null;
    await user.save();

    return NextResponse.json(
      { success: true, message: "Email verified successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to verify email right now.",
      },
      { status: 500 }
    );
  }
}
