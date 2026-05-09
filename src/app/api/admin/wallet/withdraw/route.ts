import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
import User from '@/models/User';
import Payment from '@/models/payment.model';
import mongoose from 'mongoose';

const MIN_WITHDRAWAL = 40;
const CHAPA_API_URL = 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

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

    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Get admin wallet by userId
    let adminWallet = await Wallet.findOne({ userId: adminUser._id, userRole: 'admin' });
    if (!adminWallet) {
      adminWallet = new Wallet({ userId: adminUser._id, userRole: 'admin' });
      await adminWallet.save();
    }

    if (adminWallet.availableBalance < withdrawalAmount) {
      return NextResponse.json(
        { success: false, message: 'Insufficient balance in admin wallet' },
        { status: 400 }
      );
    }

    // Generate transaction reference
    const txRef = `WITHDRAW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update wallet balances (Mock: Deduct and complete immediately)
    adminWallet.availableBalance = Math.round((adminWallet.availableBalance - withdrawalAmount) * 100) / 100;
    adminWallet.lifetimePaidOut = Math.round((adminWallet.lifetimePaidOut + withdrawalAmount) * 100) / 100;
    await adminWallet.save();

    // Create completed withdrawal transaction
    const transaction = await Transaction.create({
      walletId: adminWallet._id,
      userId: adminUser._id,
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
        userId: adminUser._id,
        transactionRef: txRef,
        method: 'mock_transfer',
        amount: withdrawalAmount,
        status: 'Success',
        metadata: { phoneNumber }
      });
    } catch (payError) {
      console.error('[AdminWithdrawAPI] Payment record creation failed:', payError);
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
    console.error('Error processing admin withdrawal:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
