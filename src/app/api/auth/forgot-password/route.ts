import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';

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
    
    // Always return success to prevent email enumeration
    // But only proceed if user exists
    if (!user) {
      return new NextResponse(
        JSON.stringify({ success: true, message: 'If an account exists with this email, a password reset link has been sent.' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    // Generate a reset token
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // In production, send email with reset link
    // For now, we'll just return success and log the token
    console.log(`Password reset token for ${email}: ${resetToken}`);

    // TODO: Send email with reset link:
    // const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
    // await sendEmail(email, 'Password Reset', `Click here to reset: ${resetLink}`);

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'If an account exists with this email, a password reset link has been sent.',
        // Remove this in production - for dev only
        devToken: resetToken,
        devResetLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
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