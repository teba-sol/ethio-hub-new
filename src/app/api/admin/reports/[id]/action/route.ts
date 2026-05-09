import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Report from '@/models/report.model';
import User from '@/models/User';
import Festival from '@/models/festival.model';
import Product from '@/models/artisan/product.model';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import { sendWarningEmail as sendWarnEmailLib, sendBanEmail as sendBanEmailLib, sendContentTakenDownEmail as sendTakenDownEmailLib } from '@/lib/email';

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

    const actionEmailMap: Record<string, 'warn' | 'takedown' | 'ban' | null> = {
      Warn: 'warn',
      TakeDown: 'takedown',
      Ban: 'ban',
      Dismiss: null,
      Resolve: null,
    };

    switch (action) {
      case 'Dismiss':
        updateData.status = 'Dismissed';
        break;
      case 'Resolve':
        updateData.status = 'Resolved';
        break;
      case 'Warn':
        updateData.status = 'Investigating';
        break;
      case 'TakeDown':
        updateData.status = 'Resolved';
        await takeDownContent(report);
        break;
      case 'Ban':
        updateData.status = 'Resolved';
        await banUserDirectly(report);
        break;
      default:
        return new NextResponse(JSON.stringify({ success: false, message: 'Invalid action' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    Object.assign(report, updateData);
    await report.save();

    const emailAction = actionEmailMap[action];
    let emailStatus: string = 'not_sent';

    if (emailAction) {
      const target = await getReportTarget(report);
      if (!target.email) {
        emailStatus = 'no_email';
      } else {
        try {
          if (emailAction === 'warn') await sendWarnEmailLib({ to: target.email, name: target.name, targetType: report.targetType, reportReason: report.reason, reportDescription: report.description, adminNote: adminNote });
          else if (emailAction === 'takedown') await sendTakenDownEmailLib({ to: target.email, name: target.name, targetType: report.targetType, reportReason: report.reason, reportDescription: report.description, adminNote: adminNote });
          else await sendBanEmailLib({ to: target.email, name: target.name, targetType: report.targetType, reportReason: report.reason, reportDescription: report.description, adminNote: adminNote });
          emailStatus = 'sent';
        } catch (err: any) {
          console.error(`Failed to send ${emailAction} email:`, err);
          emailStatus = `failed: ${err?.message || 'unknown'}`;
        }
      }
    }

    return new NextResponse(JSON.stringify({
      success: true,
      message: `Report ${action} action completed${emailAction && emailStatus !== 'sent' ? ` (email ${emailStatus})` : emailAction ? ' + email sent' : ''}`,
      report,
      emailAction: emailAction || null,
      emailStatus,
    }), { status: 200, headers: { 'content-type': 'application/json' } });

  } catch (error: any) {
    console.error('Report action error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to perform action' },
      { status: 500 }
    );
  }
}

// Helper: Get target user info from report
async function getReportTarget(report: any): Promise<{ email: string; name: string }> {
  if (report.targetType === 'Event') {
    const event = await Festival.findById(report.targetId).populate('organizer', 'email name').lean();
    if (event?.organizer) {
      return { email: (event.organizer as any).email || '', name: (event.organizer as any).name || 'User' };
    }
  } else if (report.targetType === 'Product') {
    const product = await Product.findById(report.targetId).populate('artisanId', 'email name').lean();
    if (product?.artisanId) {
      return { email: (product.artisanId as any).email || '', name: (product.artisanId as any).name || 'User' };
    }
  } else if (report.targetType === 'User') {
    const user = await User.findById(report.targetId).lean();
    if (user) {
      return { email: user.email || '', name: user.name || 'User' };
    }
  }
  return { email: '', name: 'User' };
}

// Helper: Take down content
async function takeDownContent(report: any) {
  if (report.targetType === 'Event') {
    await Festival.findByIdAndUpdate(report.targetId, { status: 'Cancelled' });
  } else if (report.targetType === 'Product') {
    await Product.findByIdAndUpdate(report.targetId, { status: 'Archived' });
  } else if (report.targetType === 'User') {
    await User.findByIdAndUpdate(report.targetId, { status: 'Suspended' });
  }
}

// Helper: Directly ban user
async function banUserDirectly(report: any) {
  if (report.targetType === 'Event') {
    await Festival.findByIdAndUpdate(report.targetId, { status: 'Cancelled' });
  } else if (report.targetType === 'Product') {
    await Product.findByIdAndUpdate(report.targetId, { status: 'Archived' });
  } else if (report.targetType === 'User') {
    await User.findByIdAndUpdate(report.targetId, { status: 'Banned' });
  }
}
