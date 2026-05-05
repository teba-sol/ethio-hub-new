import { NextResponse, NextRequest } from "next/server";
import * as authService from "../../../../services/auth.service";
import { connectDB } from "../../../../lib/mongodb";
import { serialize } from "cookie";
import { applyRateLimit, getRequestIp } from "../../../../lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const ip = getRequestIp(request);
    const rate = applyRateLimit({
      key: `login:${ip}:${email}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many login attempts. Try again in ${rate.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    console.log('Login request body:', body); // <-- Add this line for debugging
const { token, user, showSuspensionModal } = await authService.login(body);

const serialized = serialize("sessionToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    const response = NextResponse.json({ success: true, user, showSuspensionModal }, { status: 200 });

    response.headers.set("Set-Cookie", serialized);

    return response;
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}