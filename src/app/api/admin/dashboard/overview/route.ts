import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Festival from '@/models/festival.model';
import Order from '@/models/order.model';
import Booking from '@/models/booking.model';
import Report from '@/models/report.model';
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

    // Fetch all data in parallel
    const [
      userStats,
      eventStats,
      revenueData,
      verificationStats,
      pendingEvents,
      pendingProducts,
      pendingVerifications,
      recentReports,
      recentUsers,
      recentOrders,
      recentBookings,
    ] = await Promise.all([
      // User stats
      User.aggregate([
        { $match: { status: { $ne: 'Deleted' } } },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]).then(results => {
        const stats: Record<string, number> = {};
        results.forEach(r => { stats[r._id] = r.count; });
        return {
          total: Object.values(stats).reduce((a, b) => a + b, 0),
          admin: stats['admin'] || 0,
          organizer: stats['organizer'] || 0,
          artisan: stats['artisan'] || 0,
          tourist: stats['tourist'] || 0,
        };
      }),

      // Event stats
      Festival.aggregate([
        {
          $group: {
            _id: '$verificationStatus',
            count: { $sum: 1 },
          },
        },
      ]).then(results => {
        const stats: Record<string, number> = {};
        results.forEach(r => { stats[r._id] = r.count; });
        return {
          total: Object.values(stats).reduce((a, b) => a + b, 0),
          pending: stats['Pending Approval'] || 0,
          underReview: stats['Under Review'] || 0,
          approved: stats['Approved'] || 0,
          rejected: stats['Rejected'] || 0,
        };
      }),

      // Revenue data
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: null,
            grossTotal: { $sum: '$totalPrice' },
            totalOrders: { $sum: 1 },
          },
        },
      ]).then(result => ({
        grossTotal: result[0]?.grossTotal || 0,
        totalOrders: result[0]?.totalOrders || 0,
      })),

      // Verification stats (artisan verifications)
      User.aggregate([
        { $match: { role: 'artisan' } },
        {
          $group: {
            _id: '$artisanStatus',
            count: { $sum: 1 },
          },
        },
      ]).then(results => {
        const stats: Record<string, number> = {};
        results.forEach(r => { stats[r._id] = r.count; });
        return {
          pending: stats['Pending'] || 0,
          underReview: stats['Under Review'] || 0,
          approved: stats['Approved'] || 0,
          rejected: stats['Rejected'] || 0,
        };
      }),

      // Pending events
      Festival.find({ verificationStatus: 'Pending Approval' })
        .populate('organizer', 'name')
        .sort({ submittedAt: -1 })
        .limit(5)
        .then(events => events.map(e => ({
          id: e._id.toString(),
          name: e.name,
          submitter: (e.organizer as any)?.name || 'Unknown',
          date: e.submittedAt || e.createdAt,
        }))),

      // Pending products (need to check Product model)
      Promise.resolve([]), // Placeholder - implement when Product model is available

      // Pending verifications
      User.find({ role: 'artisan', artisanStatus: 'Pending' })
        .sort({ createdAt: -1 })
        .limit(5)
        .then(users => users.map(u => ({
          id: u._id.toString(),
          name: u.name,
          role: u.role,
          date: u.createdAt,
          avatar: u.name?.charAt(0).toUpperCase() || 'U',
        }))),

      // Recent reports
      Report.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .then(reports => reports.map(r => ({
          id: r._id.toString(),
          type: r.targetType,
          message: r.reason || 'Report submitted',
          time: r.createdAt,
        }))),

      // Recent users
      User.find({ status: { $ne: 'Deleted' } })
        .sort({ createdAt: -1 })
        .limit(5)
        .then(users => users.map(u => ({
          id: u._id.toString(),
          name: u.name,
          role: u.role,
          date: u.createdAt,
        }))),

      // Recent orders
      Order.find({ paymentStatus: 'paid' })
        .populate('buyer', 'name')
        .populate('artisan', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .then(orders => orders.map(o => ({
          id: o._id.toString(),
          buyerName: (o.buyer as any)?.name || 'Unknown',
          amount: o.totalPrice,
          date: o.createdAt,
        }))),

      // Recent bookings
      Booking.find()
        .populate('tourist', 'name')
        .populate('event', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .then(bookings => bookings.map(b => ({
          id: b._id.toString(),
          touristName: (b.tourist as any)?.name || 'Unknown',
          eventName: (b.event as any)?.name || 'Unknown',
          amount: b.totalPrice || 0,
          date: b.createdAt,
        }))),
    ]);

    return new NextResponse(
      JSON.stringify({
        success: true,
        data: {
          userStats,
          eventStats,
          revenueData,
          verificationStats,
          pendingItems: {
            events: pendingEvents,
            products: pendingProducts,
            verifications: pendingVerifications,
            reports: recentReports,
          },
          recentActivity: {
            users: recentUsers,
            orders: recentOrders,
            bookings: recentBookings,
          },
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching dashboard overview:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
