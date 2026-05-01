import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Get admin wallet by userId
    let adminWallet = await Wallet.findOne({ userId: adminUser._id, userRole: 'admin' }).lean();
    
    if (!adminWallet) {
      // Create default admin wallet if not exists
      const newWallet = new Wallet({ userId: adminUser._id, userRole: 'admin' });
      await newWallet.save();
      adminWallet = newWallet.toObject();
    }

    // Get transactions (all admin commission transactions)
    const [transactions, total] = await Promise.all([
      Transaction.find({ type: 'ADMIN_COMMISSION' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('orderId', 'totalPrice paymentRef quantity unitPrice')
        .populate('productId', 'name')
        .populate('userId', 'name email')
        .lean(),
      Transaction.countDocuments({ type: 'ADMIN_COMMISSION' }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        wallet: {
          pendingBalance: adminWallet.pendingBalance || 0,
          availableBalance: adminWallet.availableBalance || 0,
          lifetimeEarned: adminWallet.lifetimeEarned || 0,
          lifetimePaidOut: adminWallet.lifetimePaidOut || 0,
          lifetimeRefunded: adminWallet.lifetimeRefunded || 0,
          currency: adminWallet.currency || 'ETB',
        },
        transactions: transactions.map((tx) => ({
          id: tx._id,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          paymentRef: tx.paymentRef,
          createdAt: tx.createdAt,
          orderId: tx.orderId?._id || tx.orderId,
          productName: (tx.productId as any)?.name || null,
          artisanName: (tx.metadata as any)?.artisanId || null,
          quantity: tx.quantity || (tx.orderId as any)?.quantity || (tx.metadata as any)?.quantity || null,
          unitPrice: tx.unitPrice || (tx.orderId as any)?.unitPrice || (tx.metadata as any)?.unitPrice || null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin wallet:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
