import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
import User from '@/models/User';
import Payment from '@/models/payment.model';
import { verifyToken } from '@/services/auth.service';
import mongoose from 'mongoose';

const MIN_WITHDRAWAL = 2; // Minimum 2 ETB for organizers

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
    if (!tokenResult || !tokenResult.valid || !tokenResult.payload?.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = tokenResult.payload.userId as string;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Get organizer info
    const organizerUser = await User.findById(userObjectId);
    if (!organizerUser) {
      return NextResponse.json(
        { success: false, message: 'Organizer user not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { amount, phoneNumber } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { success: false, message: `Minimum withdrawal amount is ETB ${MIN_WITHDRAWAL}` },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required for withdrawal' },
        { status: 400 }
      );
    }

    const withdrawalAmount = Math.round(Number(amount) * 100) / 100;

    // Get wallet
    const wallet = await Wallet.findOne({ userId: userObjectId, userRole: 'organizer' });
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

    // Generate transaction reference
    const txRef = `WITHDRAW-ORG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update wallet balances (Deduct immediately)
    wallet.availableBalance = Math.round((wallet.availableBalance - withdrawalAmount) * 100) / 100;
    wallet.lifetimePaidOut = Math.round((wallet.lifetimePaidOut + withdrawalAmount) * 100) / 100;
    await wallet.save();

    // Create completed withdrawal transaction
    const transaction = await Transaction.create({
      walletId: wallet._id,
      userId: userObjectId,
      type: 'WITHDRAWAL',
      amount: withdrawalAmount,
      currency: 'ETB',
      status: 'COMPLETED',
      paymentRef: txRef,
      metadata: {
        withdrawalMethod: 'mock_transfer',
        phoneNumber: phoneNumber,
        completedAt: new Date(),
      },
    });

    // Create Payment Record (Receipt)
    try {
      await Payment.create({
        userId: userObjectId,
        transactionRef: txRef,
        method: 'mock_transfer',
        amount: withdrawalAmount,
        status: 'Success',
        metadata: { phoneNumber }
      });
    } catch (payError) {
      console.error('[WithdrawAPI] Payment record creation failed:', payError);
    }

    return NextResponse.json({
      success: true,
      message: `ETB ${withdrawalAmount} successfully transferred to ${phoneNumber}`,
      data: {
        transactionId: transaction._id,
        amount: withdrawalAmount,
        status: 'COMPLETED',
        phoneNumber,
        txRef
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