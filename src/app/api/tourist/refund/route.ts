import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';
import User from '@/models/User';
import RefundRequest from '@/models/RefundRequest';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET as string;

async function getAuthenticatedUser(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sessionToken')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const user = await User.findById((payload as any).userId).select('-password');
    return user;
  } catch (error) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const tourist = await getAuthenticatedUser(req);
    if (!tourist || tourist.role !== 'tourist') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, reason, imageUrl, refundMethod, bankName, accountNumber, telebirrNumber } = body;

    if (!orderId || !reason || !refundMethod) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (!['bank', 'telebirr'].includes(refundMethod)) {
      return NextResponse.json({ message: 'Invalid refund method' }, { status: 400 });
    }

    if (refundMethod === 'bank' && (!bankName || !accountNumber)) {
      return NextResponse.json({ message: 'Bank details required' }, { status: 400 });
    }

    if (refundMethod === 'telebirr' && !telebirrNumber) {
      return NextResponse.json({ message: 'Telebirr number required' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.tourist.toString() !== tourist._id.toString()) {
      return NextResponse.json({ message: 'Not authorized to request refund for this order' }, { status: 403 });
    }

    if (order.paymentStatus !== 'paid') {
      return NextResponse.json({ message: 'Order must be paid before requesting refund' }, { status: 400 });
    }

    if (order.status === 'Refunded' || order.status === 'Cancelled') {
      return NextResponse.json({ message: 'Order is already refunded or cancelled' }, { status: 400 });
    }

    const existingRequest = await RefundRequest.findOne({ orderId, status: { $ne: 'completed' } });
    if (existingRequest) {
      return NextResponse.json({ message: 'A refund request is already pending for this order' }, { status: 400 });
    }

    const refundableAmount = order.totalPrice - (order.shippingFee || 0);
    const artisanEarnings = order.artisanEarnings || (order.totalPrice * 0.9);
    const adminCommission = order.adminCommission || (order.totalPrice * 0.1);

    const refundReq = new RefundRequest({
      orderId,
      touristId: tourist._id,
      artisanId: order.artisan,
      productId: order.product,
      reason,
      imageUrl: imageUrl || '',
      refundMethod,
      bankName: bankName || '',
      accountNumber: accountNumber || '',
      telebirrNumber: telebirrNumber || '',
      amount: refundableAmount,
      shippingFee: order.shippingFee || 0,
      artisanEarnings,
      adminCommission,
      status: 'pending',
    });

    order.status = 'Returned';
    order.timeline.push({
      status: 'Returned',
      date: new Date(),
      note: 'Refund requested by customer.',
    });

    await Promise.all([refundReq.save(), order.save()]);

    return NextResponse.json({
      success: true,
      message: 'Refund request submitted successfully',
      refundRequest: refundReq,
    });
  } catch (error) {
    console.error('Error creating refund request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    
    const tourist = await getAuthenticatedUser(req);
    if (!tourist || tourist.role !== 'tourist') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');

    const query: any = { touristId: tourist._id };
    if (orderId) {
      query.orderId = orderId;
    }

    const refundRequests = await RefundRequest.find(query)
      .populate('orderId', 'status paymentStatus totalPrice')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      refundRequests,
    });
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
