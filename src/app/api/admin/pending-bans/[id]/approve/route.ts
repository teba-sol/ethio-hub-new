import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Report from '@/models/report.model';
import User from '@/models/User';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET as string;

// POST /api/admin/pending-bans/[id]/approve - Approve ban
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

    // Update report status
    report.status = 'Resolved';
    report.resolvedBy = new mongoose.Types.ObjectId(adminIdFromToken);
    report.resolvedAt = new Date();
    if (reason) {
      report.adminNote = reason;
    }
    await report.save();

    // Ban the user
    if (report.targetType === 'User') {
      await User.findByIdAndUpdate(report.targetId, {
        status: 'Banned',
        adminApprovalReason: reason || 'Banned after report investigation'
      });
    }

    // Send ban email
    try {
      const targetUser = await User.findById(report.targetId);
      if (targetUser) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/notifications/ban-email`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetUser.email,
            name: targetUser.name,
            targetType: report.targetType,
            reason: reason || report.reason,
            description: report.description,
          })
        });
      }
    } catch (emailError) {
      console.error('Send ban email error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Ban approved successfully',
      report
    });

  } catch (error: any) {
    console.error('Approve ban error:', error);
    return NextResponse.json({ success: false, message: 'Failed to approve ban' }, { status: 500 });
  }
}
