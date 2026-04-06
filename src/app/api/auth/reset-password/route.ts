import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { token, newPassword, email } = body;

    // Development bypass: allow password reset by email directly (remove in production)
    if (email && newPassword && process.env.NODE_ENV !== 'production') {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'User not found' }),
          { status: 404, headers: { 'content-type': 'application/json' } }
        );
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();

      return new NextResponse(
        JSON.stringify({ success: true, message: 'Password has been reset successfully!' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    // Normal token-based reset
    if (!token || !newPassword) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Token and new password are required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    if (newPassword.length < 6) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Password must be at least 6 characters' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid or expired reset token' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Password has been reset successfully!' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in reset password:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}