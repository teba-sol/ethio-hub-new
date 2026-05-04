import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Report from '@/models/report.model';
import User from '@/models/User';
import Festival from '@/models/festival.model';
import Product from '@/models/artisan/product.model';
import { getCloudinaryImageUrl } from '@/lib/cloudinary';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';

// POST /api/reports - Submit a new report
export async function POST(request: NextRequest) {
  try {
    // Authenticate user via session token
    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    let payload: any;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid session token' },
        { status: 401 }
      );
    }

    const reporterIdFromToken = payload.userId;

    // Ensure database connection
    await connectDB();

    // Fetch reporter user
    const reporterUser = await User.findById(reporterIdFromToken);
    if (!reporterUser) {
      return NextResponse.json(
        { success: false, message: 'Reporter user not found' },
        { status: 404 }
      );
    }

    // Check if reporter is suspended or banned
    if (reporterUser.status === 'Suspended' || reporterUser.status === 'Banned') {
      return NextResponse.json(
        { success: false, message: 'Your account has been suspended or banned' },
        { status: 403 }
      );
    }

    // Parse body
    const body = await request.json();
    const { targetId, targetType, reason, reasonOther, description, evidence = [] } = body;

    // Validate required fields (reporterId taken from token)
    if (!targetId || !targetType || !reason || !description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate targetType
    if (!['Event', 'Product', 'User', 'Review'].includes(targetType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid target type' },
        { status: 400 }
      );
    }

    // Validate description length
    if (description.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Description must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Check if user already reported this target
    const existingReport = await Report.findOne({ reporterId: reporterIdFromToken, targetId });
    if (existingReport) {
      return NextResponse.json(
        { success: false, message: 'You have already reported this item' },
        { status: 409 }
      );
    }

    // Verify target exists and increment reportsCount
    let targetUpdate: any = null;
    if (targetType === 'Event') {
      targetUpdate = await Festival.findByIdAndUpdate(
        targetId,
        { $inc: { reportsCount: 1 } },
        { new: true }
      );
    } else if (targetType === 'Product') {
      targetUpdate = await Product.findByIdAndUpdate(
        targetId,
        { $inc: { reportsCount: 1 } },
        { new: true }
      );
    } else if (targetType === 'User') {
      targetUpdate = await User.findByIdAndUpdate(
        targetId,
        { $inc: { reportsCount: 1 } },
        { new: true }
      );
    }

    if (!targetUpdate && targetType !== 'Review') {
      return NextResponse.json(
        { success: false, message: 'Target not found' },
        { status: 404 }
      );
    }

    // Create report
    const report = new Report({
      reporterId: reporterIdFromToken,
      targetId,
      targetType,
      reason,
      reasonOther,
      description,
      evidence: evidence.slice(0, 3), // Max 3 evidence files
      status: 'Pending'
    });

    await report.save();

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      reportId: report._id
    });

  } catch (error: any) {
    console.error('Report submission error:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'You have already reported this item' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

// GET /api/reports - Get reports (for admin or user)
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    let payload: any;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid session token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // Ensure DB connection and fetch user
    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check account status
    if (user.status === 'Suspended' || user.status === 'Banned') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const targetType = searchParams.get('targetType');
    const reporterId = searchParams.get('reporterId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Authorization: if reporterId is provided, ensure it matches current user or admin
    if (reporterId) {
      const isAdmin = user.role?.toLowerCase() === 'admin';
      if (reporterId !== userId.toString() && !isAdmin) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }
    } else {
      // No reporterId means listing all reports; admin only
      if (user.role?.toLowerCase() !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    // Build query
    const query: any = {};
    if (status && status !== 'All') {
      query.status = status;
    }
    if (targetType && targetType !== 'All') {
      query.targetType = targetType;
    }
    if (reporterId) {
      query.reporterId = reporterId;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const reports = await Report.find(query)
      .populate('reporterId', 'name email profileImage role')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Report.countDocuments(query);

    return NextResponse.json({
      success: true,
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
