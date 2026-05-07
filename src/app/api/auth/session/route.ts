import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, generateAccessToken } from '@/services/auth.service';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const cookieStore = await cookies();
    let sessionToken = cookieStore.get('sessionToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!sessionToken && !refreshToken) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    let payload = null;
    if (sessionToken) {
      payload = await verifyToken(sessionToken);
    }

    // If session token is invalid/expired but refresh token exists, try to refresh
    if (!payload && refreshToken) {
      const refreshPayload = await verifyToken(refreshToken);
      if (refreshPayload) {
        // Refresh token is valid, generate new access token
        const newAccessToken = await generateAccessToken({
          userId: refreshPayload.userId,
          email: refreshPayload.email,
          role: refreshPayload.role
        });

        // Update the payload for the current request
        payload = refreshPayload;

        // Set the new access token cookie
        // We will set this on the final response object below
        
        // We need to continue and fetch the user data
        sessionToken = newAccessToken;
      }
    }

    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await connectDB();
    const user = await User.findById(payload.userId)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const responseData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        touristProfile: user.touristProfile,
        artisanStatus: user.artisanStatus,
        organizerStatus: user.organizerStatus,
        status: user.status
      }
    };

    const response = NextResponse.json(responseData);

    // If we generated a new sessionToken during this request, make sure it's in the final response
    if (sessionToken && !cookieStore.get('sessionToken')) {
       response.cookies.set('sessionToken', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600,
          path: '/',
        });
    }

    return response;
  } catch (error) {
    console.error('Session API Error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
