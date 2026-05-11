import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

async function getAdminUser(token: string | undefined) {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jwtVerify(token, secret);
    const user = await User.findById((payload as any).userId).select('-password');
    return user;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get('sessionToken')?.value;
    const user = await getAdminUser(token);
    if (!user || user.role !== 'admin') {
      return new NextResponse(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return new NextResponse(JSON.stringify({ success: false, message: 'productId is required' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const orders = await Order.find({ 
      product: productId,
      status: { $nin: ['Cancelled', 'Returned'] }
    })
    .populate('tourist', 'name email profilePicture')
    .sort({ createdAt: -1 })
    .lean();

    const mappedOrders = orders.map((o: any) => ({
      id: o._id.toString(),
      customer: o.contactInfo?.fullName || o.tourist?.name || 'Unknown',
      email: o.contactInfo?.email || o.tourist?.email || '',
      avatar: o.tourist?.profilePicture || '',
      date: new Date(o.createdAt).toLocaleDateString(),
      quantity: o.quantity,
      totalPaid: o.totalPrice,
      paymentMethod: o.paymentMethod || 'Chap',
      paymentStatus: (o.paymentStatus === 'paid' || o.status === 'Delivered' || o.status === 'Paid') ? 'Paid' : 'Pending',
      transactionId: o.paymentRef || o._id.toString(),
    }));

    return new NextResponse(JSON.stringify({
      success: true,
      orders: mappedOrders,
      stockHistory: [] // Can be implemented later if needed
    }), { status: 200, headers: { 'content-type': 'application/json' } });

  } catch (error: any) {
    console.error('Error fetching product orders:', error);
    return new NextResponse(JSON.stringify({ success: false, message: 'Failed to fetch orders' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
