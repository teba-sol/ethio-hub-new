import { NextResponse, NextRequest } from "next/server";
import * as authService from "@/services/auth.service";
import { connectDB } from "@/lib/mongodb";
import { applyRateLimit, getRequestIp } from "@/lib/rateLimit";
import { LoginSchema } from "@/lib/validations/auth.schema";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // --- Schema Validation ---
    const validationResult = LoginSchema.safeParse(body);

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

    const { email, password } = validationResult.data;
    const normalizedEmail = email.trim().toLowerCase();

    const ip = getRequestIp(request);
    const rate = applyRateLimit({
      key: `login:${ip}:${normalizedEmail}`,
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

    const { accessToken, refreshToken, user, showSuspensionModal } = await authService.login(body);

    const response = NextResponse.json({ success: true, user, showSuspensionModal }, { status: 200 });

    // Set Access Token (24 hours for better persistence)
    response.cookies.set('sessionToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 3600, // 24 hours
      path: '/',
    });

    // Set Refresh Token (7 days)
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',  // 'strict' blocks cookie on Chapa redirect (cross-site nav)
      maxAge: 7 * 24 * 3600, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 400 }
    );
  }
}