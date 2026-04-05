import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

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

    // Single aggregation query instead of 4 separate countDocuments calls
    const [result] = await User.aggregate([
      { $match: { role: 'artisan' } },
      {
        $group: {
          _id: '$artisanStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap: Record<string, number> = {};
    if (result) {
      statsMap[result._id] = result.count;
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        stats: {
          pending: statsMap['Pending'] || 0,
          underReview: statsMap['Under Review'] || 0,
          approved: statsMap['Approved'] || 0,
          rejected: statsMap['Rejected'] || 0,
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
