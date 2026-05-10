import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { otp, email } = body;

    if (!otp || !email) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'OTP and email are required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Hash the provided OTP
    const otpHash = createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetToken: otpHash,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid or expired verification code' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Code verified successfully' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in verify-otp:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
