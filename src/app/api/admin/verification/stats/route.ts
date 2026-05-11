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

    // Correct aggregation to get counts for both artisan and organizer statuses
    const [artisanStats, organizerStats, deliveryStats] = await Promise.all([
      User.aggregate([
        { $match: { role: 'artisan' } },
        { $group: { _id: '$artisanStatus', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: 'organizer' } },
        { $group: { _id: '$organizerStatus', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: 'delivery' } },
        { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } },
      ])
    ]);

    const statsMap: Record<string, number> = {
      'Not Submitted': 0,
      'Pending': 0,
      'Under Review': 0,
      'Approved': 0,
      'Rejected': 0,
      'Modification Requested': 0,
    };

    [artisanStats, organizerStats, deliveryStats].forEach((roleStats) => {
      roleStats.forEach((s: any) => {
        if (statsMap[s._id] !== undefined) {
          statsMap[s._id] += s.count;
        }
      });
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        stats: {
          notSubmitted: statsMap['Not Submitted'],
          pending: statsMap['Pending'],
          underReview: statsMap['Under Review'],
          approved: statsMap['Approved'],
          rejected: statsMap['Rejected'],
          modificationRequested: statsMap['Modification Requested'],
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
