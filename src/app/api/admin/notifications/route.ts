import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Report from '@/models/report.model';
import Festival from '@/models/festival.model';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Fetch real data to derive notifications
    const [recentUsers, recentReports, pendingFestivals] = await Promise.all([
      User.find({ status: { $ne: 'Deleted' } })
        .sort({ createdAt: -1 })
        .limit(5),
      Report.find({ status: 'Pending' })
        .sort({ createdAt: -1 })
        .limit(3),
      Festival.find({ verificationStatus: 'Pending Approval' })
        .sort({ submittedAt: -1 })
        .limit(3)
    ]);

    const notifications = [];

    // 1. New Registrations
    recentUsers.forEach(user => {
      notifications.push({
        id: `user-${user._id}`,
        title: 'New Registration',
        message: `${user.name} registered as ${user.role}`,
        time: user.createdAt,
        type: 'registration',
        color: 'text-blue-500',
        bg: 'bg-blue-50'
      });
    });

    // 2. New Reports (System Alerts)
    recentReports.forEach(report => {
      notifications.push({
        id: `report-${report._id}`,
        title: 'System Alert',
        message: `New report: ${report.reason}`,
        time: report.createdAt,
        type: 'system',
        color: 'text-red-500',
        bg: 'bg-red-50'
      });
    });

    // 3. Pending Festivals
    pendingFestivals.forEach(fest => {
      notifications.push({
        id: `fest-${fest._id}`,
        title: 'Festival Submission',
        message: `New festival "${fest.name}" needs review`,
        time: fest.submittedAt || (fest as any).createdAt,
        type: 'festival',
        color: 'text-amber-500',
        bg: 'bg-amber-50'
      });
    });

    // Sort by time
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({
      success: true,
      notifications: notifications.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
