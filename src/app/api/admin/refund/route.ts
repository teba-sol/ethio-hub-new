import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';
import User from '@/models/User';
import RefundRequest from '@/models/RefundRequest';
import Wallet from '@/models/wallet.model';
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

export async function GET(req: Request) {
  try {
    await connectDB();
    
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    const query: any = {};
    if (status && status !== 'All') {
      query.status = status.toLowerCase();
    }

    const refundRequests = await RefundRequest.find(query)
      .populate('touristId', 'name email phone')
      .populate('artisanId', 'name email')
      .populate('orderId', 'status paymentStatus totalPrice shippingFee product')
      .populate('productId', 'name images')
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      total: refundRequests.length,
      pending: refundRequests.filter(r => r.status === 'pending').length,
      processing: refundRequests.filter(r => r.status === 'processing').length,
      completed: refundRequests.filter(r => r.status === 'completed').length,
      totalAmount: refundRequests.reduce((sum, r) => sum + r.amount, 0),
    };

    return NextResponse.json({
      success: true,
      refundRequests,
      stats,
    });
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { refundRequestId, action, adminNotes } = body;

    if (!refundRequestId || !action) {
      return NextResponse.json({ message: 'Refund request ID and action are required' }, { status: 400 });
    }

    const refundReq = await RefundRequest.findById(refundRequestId);
    if (!refundReq) {
      return NextResponse.json({ message: 'Refund request not found' }, { status: 404 });
    }

    if (action === 'process') {
      refundReq.status = 'processing';
      refundReq.adminNotes = adminNotes || '';
      await refundReq.save();

      return NextResponse.json({
        success: true,
        message: 'Refund is now being processed',
        refundRequest: refundReq,
      });
    }

    if (action === 'complete') {
      if (refundReq.status !== 'processing') {
        return NextResponse.json({ message: 'Refund must be in processing status to complete' }, { status: 400 });
      }

      const order = await Order.findById(refundReq.orderId);
      if (!order) {
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
      }

      const artisanEarnings = refundReq.artisanEarnings;
      const adminCommission = refundReq.adminCommission;

      const artisanWallet = await Wallet.findOne({ userId: refundReq.artisanId });
      if (artisanWallet) {
        artisanWallet.pendingBalance = Math.max(0, artisanWallet.pendingBalance - artisanEarnings);
        artisanWallet.lifetimeRefunded += artisanEarnings;
        await artisanWallet.save();
      }

      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        const adminWallet = await Wallet.findOne({ userId: adminUser._id });
        if (adminWallet) {
          adminWallet.pendingBalance = Math.max(0, adminWallet.pendingBalance - adminCommission);
          adminWallet.lifetimeRefunded += adminCommission;
          adminWallet.shippingFeesPaidOut += refundReq.shippingFee;
          await adminWallet.save();
        }
      }

      order.paymentStatus = 'refunded';
      order.status = 'Refunded';
      order.timeline.push({
        status: 'Refunded',
        date: new Date(),
        note: 'Refund processed and disbursed to customer.',
      });

      refundReq.status = 'completed';
      refundReq.processedAt = new Date();
      refundReq.processedBy = admin._id;
      refundReq.adminNotes = adminNotes || refundReq.adminNotes || '';

      await Promise.all([order.save(), refundReq.save()]);

      return NextResponse.json({
        success: true,
        message: 'Refund completed successfully',
        refundRequest: refundReq,
        disbursementDetails: {
          artisanDeducted: artisanEarnings,
          adminCommissionDeducted: adminCommission,
          shippingFeeKept: refundReq.shippingFee,
          customerReceived: refundReq.amount,
        },
      });
    }

    if (action === 'reject') {
      refundReq.status = 'pending';
      refundReq.adminNotes = adminNotes || 'Refund request rejected';

      const order = await Order.findById(refundReq.orderId);
      if (order && order.status === 'Returned') {
        order.status = 'Delivered';
        order.timeline.push({
          status: 'Delivered',
          date: new Date(),
          note: 'Refund request rejected. Order status restored.',
        });
        await order.save();
      }

      await refundReq.save();

      return NextResponse.json({
        success: true,
        message: 'Refund request rejected',
        refundRequest: refundReq,
      });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
