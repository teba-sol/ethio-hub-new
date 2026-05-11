import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, generateAccessToken } from '@/services/auth.service';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    // 1. Connect to DB early
    await connectDB();

    const cookieStore = await cookies();
    let sessionToken = cookieStore.get('sessionToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!sessionToken && !refreshToken) {
      return NextResponse.json({ user: null });
    }

    let payload: any = null;
    let isRefreshed = false;

    // 2. Try to verify session token
    if (sessionToken) {
      const result = await verifyToken(sessionToken);
      if (result.valid) {
        payload = result.payload;
      }
    }

    // 3. If session token invalid/expired but refresh token exists, try to refresh
    if (!payload && refreshToken) {
      const result = await verifyToken(refreshToken);
      if (result.valid && result.payload) {
        const refreshPayload: any = result.payload;
        
        // Generate new session token
        sessionToken = await generateAccessToken({
          userId: refreshPayload.userId,
          email: refreshPayload.email,
          role: refreshPayload.role
        });

        payload = refreshPayload;
        isRefreshed = true;
      }
    }

    // 4. If still no payload, user is not authenticated
    if (!payload || !payload.userId) {
      return NextResponse.json({ user: null });
    }

    // 5. Fetch user from DB
    const user = await User.findById(payload.userId)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const response = NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        touristProfile: user.touristProfile,
        artisanStatus: user.artisanStatus,
        organizerStatus: user.organizerStatus,
        deliveryStatus: user.deliveryStatus || 'Not Submitted',
        deliveryProfile: user.deliveryProfile || null,
        rejectionReason: user.rejectionReason || null,
        status: user.status
      }
    });

    // 6. If we refreshed the token, update the cookie
    if (isRefreshed && sessionToken) {
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
    // Standard practice: return user null on non-critical session check errors
    // to allow the app to handle "not logged in" state gracefully
    return NextResponse.json({ user: null });
  }
}
