import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Direct registration is disabled. Please complete signup via OTP verification.",
      nextStep: "/api/auth/register/request-otp",
    },
    { status: 410 }
  );
}
