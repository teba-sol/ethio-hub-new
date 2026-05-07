import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';
import User from '@/models/User';
import Wallet from '@/models/wallet.model';
import DeliveryLog from '@/models/DeliveryLog';
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

const MAX_ATTEMPTS = 3;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const deliveryGuy = await getAuthenticatedUser(req);
    if (!deliveryGuy || deliveryGuy.role !== 'delivery') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { verificationCode } = body;
    const orderId = params.id;

    if (!verificationCode) {
      return NextResponse.json({ message: 'Verification code is required' }, { status: 400 });
    }

    const order = await Order.findById(orderId)
      .populate('tourist', 'name email phone')
      .populate('artisan', 'name email')
      .populate('product', 'name price');

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.assignedDeliveryGuy?.toString() !== deliveryGuy._id.toString()) {
      return NextResponse.json({ message: 'This order is not assigned to you' }, { status: 403 });
    }

    if (order.status === 'Delivered') {
      return NextResponse.json({ message: 'Order already delivered' }, { status: 400 });
    }

    if (order.status !== 'Shipped') {
      return NextResponse.json({ message: 'Order is not ready for delivery confirmation' }, { status: 400 });
    }

    if (order.isLocked) {
      return NextResponse.json({ 
        message: 'This order is locked. Please contact admin for assistance.',
        locked: true
      }, { status: 400 });
    }

    const enteredCode = verificationCode.toString().toUpperCase().trim();
    const actualCode = order.verificationCode?.toString().toUpperCase();

    order.deliveryAttempts.push({
      enteredCode,
      attemptedAt: new Date(),
      success: enteredCode === actualCode,
    });

    if (enteredCode === actualCode) {
      order.status = 'Delivered';
      order.timeline.push({
        status: 'Delivered',
        date: new Date(),
        note: 'Delivery confirmed via verification code.',
      });

      const artisanEarnings = order.artisanEarnings || (order.totalPrice * 0.9);
      const adminCommission = order.adminCommission || (order.totalPrice * 0.1);
      const shippingFee = order.shippingFee || 0;

      const artisanWallet = await Wallet.findOne({ userId: order.artisan });
      if (artisanWallet) {
        artisanWallet.pendingBalance = Math.max(0, artisanWallet.pendingBalance - artisanEarnings);
        artisanWallet.availableBalance += artisanEarnings;
        artisanWallet.lifetimeEarned += artisanEarnings;
        await artisanWallet.save();
      }

      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        const adminWallet = await Wallet.findOne({ userId: adminUser._id });
        if (adminWallet) {
          adminWallet.pendingBalance = Math.max(0, adminWallet.pendingBalance - adminCommission);
          adminWallet.availableBalance += adminCommission;
          adminWallet.lifetimeEarned += adminCommission;
          adminWallet.shippingFeesReceived += shippingFee;
          await adminWallet.save();
        }
      }

      const deliveryGuyWallet = await Wallet.findOne({ userId: deliveryGuy._id });
      if (deliveryGuyWallet) {
        deliveryGuyWallet.deliveryEarnings += shippingFee;
        deliveryGuyWallet.deliveryTripsCompleted += 1;
        await deliveryGuyWallet.save();
      }

      await DeliveryLog.create({
        orderId: order._id,
        deliveryGuyId: deliveryGuy._id,
        shippingFee,
        deliveredAt: new Date(),
        customerVerified: true,
        customerName: order.tourist?.name || 'N/A',
        customerPhone: order.tourist?.phone || 'N/A',
        customerEmail: order.tourist?.email || 'N/A',
        pickupAddress: 'Artisan Workshop',
        deliveryAddress: `${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''}`,
        distanceKm: order.distanceKm || 0,
        artisanName: (order.artisan as any)?.name || 'N/A',
        artisanPhone: (order.artisan as any)?.phone || 'N/A',
        productName: (order.product as any)?.name || 'N/A',
        productPrice: (order.product as any)?.price || 0,
      });

      await User.findByIdAndUpdate(deliveryGuy._id, {
        $inc: { 'deliveryProfile.totalDeliveries': 1 },
      });

      await order.save();

      return NextResponse.json({
        success: true,
        message: 'Delivery confirmed successfully!',
        orderId: order._id,
      });
    } else {
      const failedAttempts = order.deliveryAttempts.filter(
        (a) => !a.success
      ).length;

      await order.save();

      const remainingAttempts = MAX_ATTEMPTS - failedAttempts;

      if (remainingAttempts <= 0) {
        order.isLocked = true;
        order.lockedAt = new Date();
        order.lockedBy = 'VERIFICATION_ATTEMPTS';
        await order.save();

        return NextResponse.json({
          success: false,
          message: 'Too many failed attempts. Order is now locked. Admin has been alerted.',
          locked: true,
          remainingAttempts: 0,
        }, { status: 403 });
      }

      return NextResponse.json({
        success: false,
        message: `Incorrect code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
        remainingAttempts,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error verifying delivery:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const deliveryGuy = await getAuthenticatedUser(req);
    if (!deliveryGuy || deliveryGuy.role !== 'delivery') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const order = await Order.findById(params.id)
      .populate('tourist', 'name email phone')
      .populate('product', 'name images price description');

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.assignedDeliveryGuy?.toString() !== deliveryGuy._id.toString()) {
      return NextResponse.json({ message: 'This order is not assigned to you' }, { status: 403 });
    }

    const failedAttempts = order.deliveryAttempts.filter((a) => !a.success).length;
    const remainingAttempts = MAX_ATTEMPTS - failedAttempts;

    return NextResponse.json({
      success: true,
      order: {
        _id: order._id,
        status: order.status,
        product: order.product,
        tourist: order.tourist,
        shippingAddress: order.shippingAddress,
        distanceKm: order.distanceKm,
        shippingFee: order.shippingFee,
        isLocked: order.isLocked,
        remainingAttempts,
        deliveryAttempts: order.deliveryAttempts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
