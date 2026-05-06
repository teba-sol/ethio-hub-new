import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Report from '@/models/report.model';
import User from '@/models/User';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET as string;

// GET /api/admin/pending-bans - Get all pending ban reports
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Authenticate and ensure admin
    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(JWT_SECRET);
    let payload: any;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, secret);
      payload = verifiedPayload;
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const admin = await User.findById(payload.userId);
    if (!admin || admin.role !== 'admin' || admin.status === 'Suspended' || admin.status === 'Banned') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const pendingBans = await Report.find({ status: 'PendingBan' })
      .populate('reporterId', 'name email profileImage role')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Fetch target user details for each pending ban with extended fields
    const pendingBansWithDetails = await Promise.all(
      pendingBans.map(async (report) => {
        let targetDetails = null;
        if (report.targetType === 'User') {
          const targetUser = await User.findById(report.targetId)
            .select('name email role status reportsCount profileImage phone createdAt artisanStatus organizerStatus')
            .lean();
          targetDetails = targetUser;
        }
        return {
          ...report,
          targetDetails
        };
      })
    );

    const total = await Report.countDocuments({ status: 'PendingBan' });

    return NextResponse.json({
      success: true,
      pendingBans: pendingBansWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Get pending bans error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pending bans' },
      { status: 500 }
    );
  }
}
