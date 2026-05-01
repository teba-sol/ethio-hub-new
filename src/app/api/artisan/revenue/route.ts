import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';
import Product from '@/models/artisan/product.model';
import { verifyToken } from '@/services/auth.service';
import { JWTPayload } from 'jose';
import mongoose from 'mongoose';

async function getUserFromToken(token: string) {
  const result = await verifyToken(token);
  if (!result.valid || !result.payload) return null;
  return result.payload as JWTPayload & { userId: string; role: string };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Convert userId to ObjectId for querying
    const artisanId = new mongoose.Types.ObjectId(user.userId);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    
    const now = new Date();
    let startDate = new Date(0);
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(0);
    }

    // Query orders for this artisan using ObjectId
    const query: any = { 
      artisan: artisanId,
      paymentStatus: 'paid',
    };
    
    if (period !== 'all') {
      query.createdAt = { $gte: startDate };
    }

    const orders = await Order.find(query)
      .populate('product', 'name images')
      .populate('tourist', 'name email')
      .sort({ createdAt: -1 });

    // Calculate totals using ObjectId
    const grossResult = await Order.aggregate([
      { $match: { artisan: artisanId, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const grossTotal = grossResult[0]?.total || 0;
 
     // Group sales by product
    const productSales = await Order.aggregate([
      { $match: { artisan: artisanId, paymentStatus: 'paid' } },
      { $group: { _id: '$product', totalSales: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);

    // Get product details
    const productIds = productSales.map(p => p._id);
    const products = await Product.find({ _id: { $in: productIds } }).select('name images');
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const revenueByProduct = productSales.map(p => ({
      productId: p._id,
      productName: productMap.get(p._id.toString())?.name || 'Unknown',
      totalSales: p.totalSales,
      count: p.count,
    }));

    // Map order data
    const mappedOrders = orders.map(o => ({
      _id: o._id,
      date: o.createdAt,
      productName: (o.product as any)?.name || 'Product',
      productImage: (o.product as any)?.images?.[0] || '',
      buyerName: (o.tourist as any)?.name || 'Customer',
      quantity: o.quantity,
      gross: o.totalPrice,
      status: o.paymentStatus,
    }));

    return NextResponse.json({
      orders: mappedOrders,
      stats: {
        grossTotal,
        totalOrders: orders.length,
      },
      revenueByProduct,
      period,
    });
  } catch (error: any) {
    console.error('Error fetching artisan revenue:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}