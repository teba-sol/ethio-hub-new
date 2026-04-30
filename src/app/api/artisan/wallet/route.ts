import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
import { verifyToken } from '@/services/auth.service';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const tokenResult = await verifyToken(token);
    if (!tokenResult.valid || !tokenResult.payload?.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = tokenResult.payload.userId as string;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get wallet
    const wallet = await Wallet.findOne({ userId: userObjectId }).lean();
    
    if (!wallet) {
      return NextResponse.json({
        success: true,
        data: {
          wallet: {
            pendingBalance: 0,
            availableBalance: 0,
            lifetimeEarned: 0,
            lifetimePaidOut: 0,
            lifetimeRefunded: 0,
            currency: 'ETB',
          },
          transactions: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        },
      });
    }

    // Get transactions
    const [transactions, total] = await Promise.all([
      Transaction.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('orderId', 'totalPrice paymentRef')
        .populate('productId', 'name')
        .lean(),
      Transaction.countDocuments({ userId: userObjectId }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        wallet: {
          pendingBalance: wallet.pendingBalance || 0,
          availableBalance: wallet.availableBalance || 0,
          lifetimeEarned: wallet.lifetimeEarned || 0,
          lifetimePaidOut: wallet.lifetimePaidOut || 0,
          lifetimeRefunded: wallet.lifetimeRefunded || 0,
          currency: wallet.currency || 'ETB',
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
    console.error('Error fetching artisan wallet:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
