import { NextResponse, NextRequest } from "next/server";
import * as authService from "../../../../services/auth.service";
import { connectDB } from "../../../../lib/mongodb";
import { serialize } from "cookie";

export async function POST(request: NextRequest) {
  await connectDB();

  try {
    const body = await request.json();
    console.log('Login request body:', body); // <-- Add this line for debugging
    const { token, user } = await authService.login(body);

    const serialized = serialize("sessionToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    const response = NextResponse.json({ success: true, user }, { status: 200 });

    response.headers.set("Set-Cookie", serialized);

    return response;
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}