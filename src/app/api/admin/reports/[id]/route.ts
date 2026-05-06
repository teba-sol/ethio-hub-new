import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Report from '@/models/report.model';
import User from '@/models/User';
import Festival from '@/models/festival.model';
import Product from '@/models/artisan/product.model';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';

// GET /api/admin/reports/[id] - Get single report with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Authenticate admin
    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
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

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid report ID' },
        { status: 400 }
      );
    }

    const report = await Report.findById(id)
      .populate('reporterId', 'name email')
      .populate('resolvedBy', 'name email')
      .lean();

    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }

    // Fetch target details based on targetType
    let targetDetails = null;
    if (report.targetType === 'Event') {
      targetDetails = await Festival.findById(report.targetId)
        .select('name name_en name_am status isVerified coverImage')
        .lean();
    } else if (report.targetType === 'Product') {
      targetDetails = await Product.findById(report.targetId)
        .select('name name_en name_am status verificationStatus images')
        .populate('artisanId', 'name email')
        .lean();
    } else if (report.targetType === 'User') {
      targetDetails = await User.findById(report.targetId)
        .select('name email role status reportsCount')
        .lean();
    }

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        targetDetails
      }
    });

  } catch (error: any) {
    console.error('Get report error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reports/[id] - Update report (status, adminNote, add evidence)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Authenticate admin
    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
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

    const { id } = await params;
    const body = await request.json();
    const { status, adminNote, evidence } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid report ID' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    // If adding evidence, append to existing
    if (evidence && Array.isArray(evidence)) {
      const report = await Report.findById(id);
      if (!report) {
        return NextResponse.json(
          { success: false, message: 'Report not found' },
          { status: 404 }
        );
      }
      const newEvidence = [...report.evidence, ...evidence].slice(0, 3); // Max 3
      updateData.evidence = newEvidence;
    }

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('reporterId', 'name email');

    if (!updatedReport) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report: updatedReport
    });

  } catch (error: any) {
    console.error('Update report error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update report' },
      { status: 500 }
    );
  }
}
