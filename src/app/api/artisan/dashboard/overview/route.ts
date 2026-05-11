import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';
import Product from '@/models/artisan/product.model';
import User from '@/models/User';
import Wallet from '@/models/wallet.model';
import Review from '@/models/review.model';

export const dynamic = 'force-dynamic';

async function getArtisanUser(token: string | undefined) {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jwtVerify(token, secret);
    const user = await User.findById((payload as any).userId);
    return user;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get('sessionToken')?.value;
    const user = await getArtisanUser(token);
    if (!user || user.role !== 'artisan') {
      return new NextResponse(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const artisanId = user._id;

    // Parallel fetch for everything
    const [
      totalProducts,
      orderStats,
      lowStockCount,
      productStats,
      wallet,
      revenueChartData,
      recentOrders,
      orderStatusBreakdown,
      topProducts,
      recentReviews,
      customerMetrics
    ] = await Promise.all([
      Product.countDocuments({ artisanId }),
      Order.aggregate([
        { $match: { artisan: artisanId, status: { $ne: 'Cancelled' } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$artisanEarnings' }, // Fixed field name
            pendingOrders: {
              $sum: {
                $cond: [{ $in: ['$status', ['Pending', 'Paid', 'Ready for Pickup', 'Assigned', 'Shipped']] }, 1, 0]
              }
            }
          }
        }
      ]),
      Product.countDocuments({ artisanId, stock: { $lt: 5 }, status: 'Published' }),
      Product.aggregate([
        { $match: { artisanId } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' }
          }
        }
      ]),
      Wallet.findOne({ userId: artisanId }),
      Order.aggregate([
        { 
          $match: { 
            artisan: artisanId, 
            status: { $nin: ['Cancelled', 'Returned'] },
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            sales: { $sum: "$artisanEarnings" }, // Fixed field name
            orders: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      Order.find({ artisan: artisanId })
        .populate('tourist', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Order.aggregate([
        { $match: { artisan: artisanId } },
        {
          $group: {
            _id: '$status',
            value: { $sum: 1 }
          }
        }
      ]),
      Order.aggregate([
        { $match: { artisan: artisanId, status: { $nin: ['Cancelled', 'Returned'] } } },
        {
          $group: {
            _id: '$product',
            sales: { $sum: '$quantity' },
            revenue: { $sum: '$artisanEarnings' } // Fixed field name
          }
        },
        { $sort: { sales: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: '$productInfo' }
      ]),
      Review.find({ artisanId })
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      Order.aggregate([
        { $match: { artisan: artisanId, status: { $nin: ['Cancelled', 'Returned'] } } },
        {
          $group: {
            _id: '$tourist',
            orderCount: { $sum: 1 },
            totalSpent: { $sum: '$artisanEarnings' } // Fixed field name
          }
        },
        { $sort: { totalSpent: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'customerInfo'
          }
        },
        { $unwind: '$customerInfo' }
      ])
    ]);

    const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0, pendingOrders: 0 };
    const avgRating = productStats[0]?.avgRating || 0;

    // Prioritize wallet data for revenue if available
    const finalTotalRevenue = (wallet && wallet.lifetimeEarned > 0) ? wallet.lifetimeEarned : stats.totalRevenue;

    // Calculate customer insights
    const totalUniqueCustomers = customerMetrics.length;
    const returningCustomers = customerMetrics.filter(c => c.orderCount > 1).length;
    const returningPercentage = totalUniqueCustomers > 0 ? Math.round((returningCustomers / totalUniqueCustomers) * 100) : 0;
    const newPercentage = 100 - returningPercentage;

    // Format chart data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const match = revenueChartData.find(r => r._id === dateStr);
      return {
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: match?.sales || 0,
        orders: match?.orders || 0
      };
    });

    const statusColors: Record<string, string> = {
      'Pending': '#f59e0b',
      'Paid': '#3b82f6',
      'Ready for Pickup': '#8b5cf6',
      'Shipped': '#3b82f6',
      'Delivered': '#10b981',
      'Cancelled': '#ef4444',
      'Returned': '#6b7280'
    };

    const notifications = [
      ...recentOrders.slice(0, 2).map(o => ({
        id: `ord-${o._id}`,
        type: 'order',
        message: `New order ${o._id.toString().slice(-6).toUpperCase()} received`,
        time: o.createdAt
      })),
      ...recentReviews.map(r => ({
        id: `rev-${r._id}`,
        type: 'review',
        message: `${r.rating}-star review on your product`,
        time: r.createdAt
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return new NextResponse(JSON.stringify({
      success: true,
      data: {
        stats: {
          totalProducts,
          totalOrders: stats.totalOrders,
          totalRevenue: finalTotalRevenue,
          pendingOrders: stats.pendingOrders,
          lowStock: lowStockCount,
          avgRating: parseFloat(avgRating.toFixed(1))
        },
        chartData: last7Days,
        recentOrders: recentOrders.map(o => ({
          id: `#${o._id.toString().slice(-6).toUpperCase()}`,
          customer: o.contactInfo?.fullName || (o.tourist as any)?.name || 'Unknown',
          items: o.quantity,
          total: o.totalPrice,
          status: o.status,
          date: o.createdAt
        })),
        orderStatus: orderStatusBreakdown.map(s => ({
          name: s._id,
          value: s.value,
          color: statusColors[s._id] || '#9ca3af'
        })),
        topProducts: topProducts.map(p => ({
          name: p.productInfo.name,
          sales: p.sales,
          revenue: p.revenue,
          image: p.productInfo.images?.[0] || ''
        })),
        notifications: notifications.map(n => ({
          ...n,
          time: new Date(n.time).toLocaleString()
        })),
        topCustomers: customerMetrics.slice(0, 5).map(c => ({
          name: c.customerInfo.name,
          orders: c.orderCount,
          spent: c.totalSpent,
          avatar: c.customerInfo.name?.charAt(0) || 'C'
        })),
        customerInsights: {
          returning: returningPercentage,
          new: newPercentage
        }
      }
    }), { status: 200, headers: { 'content-type': 'application/json' } });

  } catch (error: any) {
    console.error('Error fetching artisan dashboard overview:', error);
    return new NextResponse(JSON.stringify({ success: false, message: 'Failed to fetch dashboard data' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
