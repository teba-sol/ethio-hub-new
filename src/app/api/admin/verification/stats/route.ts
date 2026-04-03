import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    if (!db) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Database not connected' }),
        { status: 503, headers: { 'content-type': 'application/json' } }
      );
    }

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jwtVerify(token, secret);
    const adminRole = payload.role as string;

    if (adminRole !== 'admin') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Admin access required' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    const pending = await User.countDocuments({ role: 'artisan', artisanStatus: 'Pending' });
    const underReview = await User.countDocuments({ role: 'artisan', artisanStatus: 'Under Review' });
    const approved = await User.countDocuments({ role: 'artisan', artisanStatus: 'Approved' });
    const rejected = await User.countDocuments({ role: 'artisan', artisanStatus: 'Rejected' });

    return new NextResponse(
      JSON.stringify({
        success: true,
        stats: {
          pending,
          underReview,
          approved,
          rejected,
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching verification stats:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
