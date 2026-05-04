import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Report from '@/models/report.model';
import User from '@/models/User';
import Festival from '@/models/festival.model';
import Product from '@/models/artisan/product.model';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';

// POST /api/admin/reports/[id]/action - Perform admin actions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, adminNote } = body;

    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { success: false, message: 'Report ID is missing' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid report ID format' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Missing action' },
        { status: 400 }
      );
    }

    // Authenticate admin
    await connectDB();
    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    let payload: any;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, secret);
      payload = verifiedPayload;
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid session token' }, { status: 401 });
    }
    const admin = await User.findById(payload.userId);
    if (!admin || admin.role !== 'admin' || admin.status === 'Suspended' || admin.status === 'Banned') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const adminIdFromToken = admin._id;

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }

    let updateData: any = {
      resolvedBy: adminIdFromToken,
      resolvedAt: new Date(),
    };

    if (adminNote) {
      updateData.adminNote = adminNote;
    }

    switch (action) {
      case 'Dismiss':
        updateData.status = 'Dismissed';
        break;

      case 'Resolve':
        updateData.status = 'Resolved';
        break;

      case 'Warn':
        updateData.status = 'Investigating';
        // Send warning email to target owner
        await sendWarningEmail(report);
        break;

      case 'TakeDown':
        updateData.status = 'Resolved';
        // Set target's isPublished to false
        await takeDownContent(report);
        break;

      case 'Ban':
        updateData.status = 'PendingBan';
        // Send ban notification email to target owner
        await sendBanEmail(report);
        // Mark for second admin approval
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    Object.assign(report, updateData);
    await report.save();

    return NextResponse.json({
      success: true,
      message: `Report ${action} action completed`,
      report
    });

  } catch (error: any) {
    console.error('Report action error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to perform action' },
      { status: 500 }
    );
  }
}

// Helper: Send warning email
async function sendWarningEmail(report: any, request?: NextRequest) {
  try {
    let targetEmail = '';
    let targetName = '';

    if (report.targetType === 'Event') {
      const event = await Festival.findById(report.targetId).populate('organizer', 'email name');
      if (event?.organizer) {
        targetEmail = (event.organizer as any).email;
        targetName = (event.organizer as any).name;
      }
    } else if (report.targetType === 'Product') {
      const product = await Product.findById(report.targetId).populate('artisanId', 'email name');
      if (product?.artisanId) {
        targetEmail = (product.artisanId as any).email;
        targetName = (product.artisanId as any).name;
      }
    } else if (report.targetType === 'User') {
      const user = await User.findById(report.targetId);
      if (user) {
        targetEmail = user.email;
        targetName = user.name;
      }
    }

    if (!targetEmail) return;

    // Use external URL for email notification API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/notifications/warn-email`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: targetEmail,
        name: targetName,
        targetType: report.targetType,
        reason: report.reason,
        description: report.description,
      })
    });
  } catch (error) {
    console.error('Send warning email error:', error);
  }
}

// Helper: Send ban notification email
async function sendBanEmail(report: any) {
  try {
    let targetEmail = '';
    let targetName = '';

    if (report.targetType === 'Event') {
      const event = await Festival.findById(report.targetId).populate('organizer', 'email name');
      if (event?.organizer) {
        targetEmail = (event.organizer as any).email;
        targetName = (event.organizer as any).name;
      }
    } else if (report.targetType === 'Product') {
      const product = await Product.findById(report.targetId).populate('artisanId', 'email name');
      if (product?.artisanId) {
        targetEmail = (product.artisanId as any).email;
        targetName = (product.artisanId as any).name;
      }
    } else if (report.targetType === 'User') {
      const user = await User.findById(report.targetId);
      if (user) {
        targetEmail = user.email;
        targetName = user.name;
      }
    }

    if (!targetEmail) return;

    // Use external URL for email notification API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/notifications/ban-email`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: targetEmail,
        name: targetName,
        targetType: report.targetType,
        reason: report.reason,
        description: report.description,
      })
    });
  } catch (error) {
    console.error('Send ban email error:', error);
  }
}

// Helper: Take down content
async function takeDownContent(report: any) {
  try {
    let targetEmail = '';
    let targetName = '';
    let targetId = report.targetId;

    if (report.targetType === 'Event') {
      await Festival.findByIdAndUpdate(targetId, { status: 'Cancelled' });
      const event = await Festival.findById(targetId).populate('organizer', 'email name');
      if (event?.organizer) {
        targetEmail = (event.organizer as any).email;
        targetName = (event.organizer as any).name;
      }
    } else if (report.targetType === 'Product') {
      await Product.findByIdAndUpdate(targetId, { status: 'Archived' });
      const product = await Product.findById(targetId).populate('artisanId', 'email name');
      if (product?.artisanId) {
        targetEmail = (product.artisanId as any).email;
        targetName = (product.artisanId as any).name;
      }
    } else if (report.targetType === 'User') {
      await User.findByIdAndUpdate(targetId, { status: 'Suspended' });
      const user = await User.findById(targetId);
      if (user) {
        targetEmail = user.email;
        targetName = user.name;
      }
    }

    if (targetEmail) {
      // Use external URL for email notification API
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
      const url = `${baseUrl}/api/notifications/suspended-email`;
      
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          name: targetName,
          targetType: report.targetType,
          reason: report.reason,
          description: report.description,
        })
      });
    }
  } catch (error) {
    console.error('Take down content error:', error);
  }
}
