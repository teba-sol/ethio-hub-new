import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import User from '../../../../models/User';
import { connectDB } from '../../../../lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('sessionToken')?.value;

    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'No session token found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jwtVerify(token, secret);
    
    await connectDB();
    const user = await User.findById(payload.userId).select('-password');
    
    console.log('Session user touristProfile:', user?.touristProfile);

    if (!user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

return new NextResponse(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          artisanStatus: user.artisanStatus,
          organizerStatus: user.organizerStatus,
          organizerProfile: user.organizerProfile || null,
          touristProfile: user.touristProfile ? {
            phone: user.touristProfile?.phone || null,
            country: user.touristProfile?.country || null,
            nationality: user.touristProfile?.nationality || null,
            dateOfBirth: user.touristProfile?.dateOfBirth || null,
            profileImage: user.touristProfile?.profileImage || null,
          } : null,
        } 
      }),
      { 
        status: 200, 
        headers: { 
          'content-type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        } 
      }
    );

  } catch (error) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Invalid session token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}