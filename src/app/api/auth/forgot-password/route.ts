import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { createHash } from 'crypto';
import { sendRegistrationOtpEmail } from '../../../../lib/email';

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString().padStart(OTP_LENGTH, '0');
};

export const hashOtp = (otp: string) => {
  return createHash('sha256').update(otp).digest('hex');
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Email is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'user is not registered' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiry = new Date(Date.now() + OTP_TTL_MS);

    user.resetToken = otpHash;
    user.resetTokenExpiry = otpExpiry;
    await user.save();

    // Send OTP via email
    try {
      await sendRegistrationOtpEmail({
        to: email,
        name: user.name || 'User',
        otp: otp
      });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't reveal email sending failure to prevent enumeration
    }

    // For development, log the OTP (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Password reset OTP for ${email}: ${otp}`);
    }

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'If an account exists with this email, a password reset code has been sent.',
        // Remove this in production - for dev only
        ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {})
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in forgot password:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}