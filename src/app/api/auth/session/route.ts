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
      const result = await verifyToken(sessionToken);
      if (result.valid) {
        payload = result.payload;
      }
    }

    // If session token is invalid/expired but refresh token exists, try to refresh
    if (!payload && refreshToken) {
<<<<<<< HEAD
      const refreshResult = await verifyToken(refreshToken);
      if (refreshResult.valid && refreshResult.payload) {
        const refreshPayload = refreshResult.payload;
=======
      const result = await verifyToken(refreshToken);
      if (result.valid) {
>>>>>>> origin/aman
        // Refresh token is valid, generate new access token
        const refreshPayload: any = result.payload;
        const newAccessToken = await generateAccessToken({
          userId: refreshPayload.userId,
          email: refreshPayload.email,
          role: refreshPayload.role
        });

        // Update for current request
        payload = refreshPayload;
        sessionToken = newAccessToken;
      }
    }

    if (!payload || !payload.userId) {
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

    // If we refreshed the token, set it on the response
    if (sessionToken && sessionToken !== cookieStore.get('sessionToken')?.value) {
       response.cookies.set('sessionToken', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 3600, // 24 hours
          path: '/',
        });
    }

    return response;
  } catch (error) {
    console.error('Session API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message, user: null }, { status: 500 });
  }
}
