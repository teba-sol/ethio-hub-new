import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
import { verifyToken } from '@/services/auth.service';
import mongoose from 'mongoose';

const MIN_WITHDRAWAL = 500; // Minimum 500 ETB

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const tokenResult: any = await verifyToken(token);
    if (!tokenResult || !tokenResult.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = tokenResult.userId as string;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const body = await request.json();
    const { amount } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { success: false, message: `Minimum withdrawal amount is ETB ${MIN_WITHDRAWAL}` },
        { status: 400 }
      );
    }

    const withdrawalAmount = Math.round(Number(amount) * 100) / 100;

    // Get wallet
    const wallet = await Wallet.findOne({ userId: userObjectId });
    if (!wallet) {
      return NextResponse.json(
        { success: false, message: 'Wallet not found' },
        { status: 404 }
      );
    }

    if (wallet.availableBalance < withdrawalAmount) {
      return NextResponse.json(
        { success: false, message: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Update wallet balances
    wallet.availableBalance = Math.round((wallet.availableBalance - withdrawalAmount) * 100) / 100;
    wallet.lifetimePaidOut = Math.round((wallet.lifetimePaidOut + withdrawalAmount) * 100) / 100;
    await wallet.save();

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      walletId: wallet._id,
      userId: userObjectId,
      type: 'WITHDRAWAL',
      amount: withdrawalAmount,
      currency: 'ETB',
      status: 'PENDING', // Awaiting admin approval
      metadata: {
        withdrawalMethod: 'chapa',
        requestedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        transactionId: transaction._id,
        amount: withdrawalAmount,
        status: 'PENDING',
      },
    });
  } catch (error: any) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
