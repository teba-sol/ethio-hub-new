import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Festival from '@/models/festival.model';
import Order from '@/models/order.model';
import Booking from '@/models/booking.model';
import Report from '@/models/report.model';
import Product from '@/models/product.model';
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
      revenueChart,
      userGrowthChart,
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

      // Revenue and Transaction data (Combined Orders and Bookings)
      Promise.all([
        Order.aggregate([
          { $match: { paymentStatus: { $in: ['paid', 'refunded'] } } },
          {
            $group: {
              _id: '$paymentStatus',
              grossTotal: { $sum: '$totalPrice' },
              count: { $sum: 1 },
            },
          },
        ]),
        Booking.aggregate([
          { $match: { paymentStatus: 'paid' } },
          {
            $group: {
              _id: null,
              grossTotal: { $sum: '$totalPrice' },
              count: { $sum: 1 },
            },
          },
        ]),
        Order.countDocuments({ status: 'Cancelled' })
      ]).then(([orderRes, bookingRes, cancelledCount]) => {
        const paidOrders = orderRes.find(r => r._id === 'paid');
        const refundedOrders = orderRes.find(r => r._id === 'refunded');
        
        const orderGross = paidOrders?.grossTotal || 0;
        const refundGross = refundedOrders?.grossTotal || 0;
        const bookingGross = bookingRes[0]?.grossTotal || 0;
        
        const totalOrders = (paidOrders?.count || 0) + (refundedOrders?.count || 0);
        const totalBookings = bookingRes[0]?.count || 0;
        
        return {
          grossTotal: orderGross + bookingGross,
          refundTotal: refundGross,
          totalTransactions: totalOrders + totalBookings,
          totalOrders,
          totalBookings,
          cancellationRate: totalOrders > 0 ? (cancelledCount / totalOrders) * 100 : 0
        };
      }),

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

      // Pending products (products added in last 7 days as placeholder for 'new')
      Product.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).then(count => ({ count })),

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
        .populate('festival', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .then(bookings => bookings.map(b => ({
          id: b._id.toString(),
          touristName: (b.tourist as any)?.name || 'Unknown',
          eventName: (b.festival as any)?.name || 'Unknown',
          amount: b.totalPrice || 0,
          date: b.createdAt,
        }))),

      // Chart Data: Monthly Revenue (Last 6 months)
      Promise.all([
        Order.aggregate([
          { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
              revenue: { $sum: "$totalPrice" }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),
        Booking.aggregate([
          { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
              revenue: { $sum: "$totalPrice" }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ])
      ]).then(([orderChart, bookingChart]) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const combined = new Map();
        
        orderChart.forEach(item => {
          const key = `${months[item._id.month - 1]} ${item._id.year}`;
          combined.set(key, { name: months[item._id.month - 1], revenue: item.revenue, commission: item.revenue * 0.1 });
        });
        
        bookingChart.forEach(item => {
          const key = `${months[item._id.month - 1]} ${item._id.year}`;
          const existing = combined.get(key) || { name: months[item._id.month - 1], revenue: 0, commission: 0 };
          combined.set(key, { 
            name: existing.name, 
            revenue: existing.revenue + item.revenue, 
            commission: existing.commission + (item.revenue * 0.1) 
          });
        });
        
        return Array.from(combined.values()).slice(-6);
      }),

      // Chart Data: User Growth (Last 4 weeks)
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { 
              week: { $floor: { $divide: [{ $dayOfMonth: "$createdAt" }, 7] } },
              role: "$role"
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.week": 1 } }
      ]).then(results => {
        const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const chart = weeks.map(w => ({ name: w, tourists: 0, artisans: 0, organizers: 0 }));
        
        results.forEach(item => {
          const weekIdx = Math.min(item._id.week, 3);
          if (item._id.role === 'tourist') chart[weekIdx].tourists += item.count;
          if (item._id.role === 'artisan') chart[weekIdx].artisans += item.count;
          if (item._id.role === 'organizer') chart[weekIdx].organizers += item.count;
        });
        
        return chart;
      }),
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
          charts: {
            revenue: revenueChart,
            userGrowth: userGrowthChart
          }
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
