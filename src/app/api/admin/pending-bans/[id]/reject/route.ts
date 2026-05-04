import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Report from '@/models/report.model';
import User from '@/models/User';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET as string;

// POST /api/admin/pending-bans/[id]/reject - Reject ban
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Authenticate admin from session token
    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    let payload: any;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      payload = verifiedPayload;
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid session token' }, { status: 401 });
    }
    const admin = await User.findById(payload.userId);
    if (!admin || admin.role !== 'admin' || admin.status === 'Suspended' || admin.status === 'Banned') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const adminIdFromToken = admin._id.toString();

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid report ID' }, { status: 400 });
    }

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ success: false, message: 'Report not found' }, { status: 404 });
    }

    if (report.status !== 'PendingBan') {
      return NextResponse.json({ success: false, message: 'Report is not pending ban approval' }, { status: 400 });
    }

    // Update report status back to Investigating
    report.status = 'Investigating';
    report.resolvedBy = new mongoose.Types.ObjectId(adminIdFromToken);
    report.resolvedAt = new Date();
    report.adminNote = reason || 'Ban request rejected';
    await report.save();

    return NextResponse.json({
      success: true,
      message: 'Ban rejected successfully',
      report
    });

  } catch (error: any) {
    console.error('Reject ban error:', error);
    return NextResponse.json({ success: false, message: 'Failed to reject ban' }, { status: 500 });
  }
}
