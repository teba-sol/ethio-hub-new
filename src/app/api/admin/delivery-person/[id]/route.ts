import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Wallet from '@/models/wallet.model';
import DeliveryLog from '@/models/DeliveryLog';
import Order from '@/models/order.model';
import Payment from '@/models/payment.model';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

import Transaction from '@/models/transaction.model';

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: deliveryGuyId } = await params;
    
    // Verify admin
    const cookieStore = await cookies();
    const token = cookieStore.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const admin = await User.findById((payload as any).userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get delivery guy info
    const deliveryGuy = await User.findById(deliveryGuyId).select('-password');
    if (!deliveryGuy || deliveryGuy.role !== 'delivery') {
      return NextResponse.json({ success: false, message: 'Delivery person not found' }, { status: 404 });
    }
    
    // Get wallet info
    const wallet = await Wallet.findOne({ userId: deliveryGuyId });
    
    // Get delivered orders from DeliveryLog
    const deliveryLogs = await DeliveryLog.find({ deliveryGuyId: deliveryGuyId })
      .sort({ deliveredAt: -1 })
      .lean();
    
    // Calculate total earnings from logs (driver's share = 80% of shipping fee)
    const totalEarningsFromLogs = deliveryLogs.reduce((sum, log) => {
      const driverShare = log.shippingFee * 0.8; // 80% to driver
      return sum + driverShare;
    }, 0);
    
    // Get recent orders from Order model for additional details
    const recentOrders = await Order.find({ 
      assignedDeliveryGuy: deliveryGuyId,
      status: 'Delivered' 
    })
      .populate('product', 'name images price')
      .populate('tourist', 'name email')
      .sort({ updatedAt: -1 })
      .limit(20)
    // Get withdrawal transactions for this delivery guy
    const withdrawalTransactions = await Transaction.find({
      userId: deliveryGuyId,
      type: 'WITHDRAWAL'
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    return NextResponse.json({
      success: true,
      deliveryGuy: {
        _id: deliveryGuy._id,
        name: deliveryGuy.name,
        email: deliveryGuy.email,
        phone: deliveryGuy.phone,
        deliveryProfile: deliveryGuy.deliveryProfile || {},
      },
      wallet: wallet ? {
        availableBalance: wallet.availableBalance || 0,
        lifetimeEarned: wallet.lifetimeEarned || 0,
        deliveryEarnings: wallet.deliveryEarnings || 0,
        deliveryTripsCompleted: wallet.deliveryTripsCompleted || 0,
        shippingFeesReceived: wallet.shippingFeesReceived || 0,
        shippingFeesPaidOut: wallet.shippingFeesPaidOut || 0,
        lifetimePaidOut: wallet.lifetimePaidOut || 0,
      } : null,
      deliveryLogs: deliveryLogs.map(log => ({
        _id: log._id,
        orderId: log.orderId,
        deliveredAt: log.deliveredAt,
        shippingFee: log.shippingFee,
        driverShare: log.shippingFee * 0.8, // 80% to driver
        adminShare: log.shippingFee * 0.2, // 20% to admin
        customerName: log.customerName,
        customerPhone: log.customerPhone,
        productName: log.productName,
        distanceKm: log.distanceKm,
      })),
      recentOrders,
      withdrawalTransactions,
      summary: {
        totalTrips: deliveryLogs.length,
        totalEarnings: totalEarningsFromLogs,
        totalShippingFees: deliveryLogs.reduce((sum, log) => sum + log.shippingFee, 0),
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching delivery person details:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// Mock payment endpoint
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: deliveryGuyId } = await params;
    const body = await req.json();
    const { phone, amount } = body;
    
    // Mock payment - in real scenario, this would integrate with telebirr or bank API
    console.log(`Mock payment: Sending ${amount} ETB to phone ${phone} for delivery guy ${deliveryGuyId}`);
    
    // Generate transaction reference
    const txRef = `PAY-DRIVER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update wallet - deduct from availableBalance
    const wallet = await Wallet.findOne({ userId: deliveryGuyId });
    if (wallet) {
      if (wallet.availableBalance < amount) {
        return NextResponse.json({ success: false, message: 'Insufficient balance' }, { status: 400 });
      }
      wallet.availableBalance -= amount;
      wallet.lifetimePaidOut = (wallet.lifetimePaidOut || 0) + amount;
      await wallet.save();

      // Create transaction record for the driver
      await Transaction.create({
        walletId: wallet._id,
        userId: deliveryGuyId,
        type: 'WITHDRAWAL',
        amount: amount,
        currency: 'ETB',
        status: 'COMPLETED',
        paymentRef: txRef,
        metadata: {
          withdrawalMethod: 'admin_payout',
          phoneNumber: phone,
          processedBy: 'admin',
          completedAt: new Date(),
        },
      });

      // Create a formal payment receipt record
      await Payment.create({
        userId: deliveryGuyId,
        transactionRef: txRef,
        method: 'Admin Manual Payout',
        amount: amount,
        status: 'Completed',
      });

      // Update admin wallet to track shipping fees paid out
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        const adminWallet = await Wallet.findOne({ userId: adminUser._id, userRole: 'admin' });
        if (adminWallet) {
          adminWallet.shippingFeesPaidOut = (adminWallet.shippingFeesPaidOut || 0) + amount;
          await adminWallet.save();
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Payment of ${amount} ETB successfully transferred to ${phone}`,
      data: {
        amount: amount,
        phoneNumber: phone,
        txRef: txRef,
        date: new Date()
      }
    });
    
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ success: false, message: 'Payment failed' }, { status: 500 });
  }
}
