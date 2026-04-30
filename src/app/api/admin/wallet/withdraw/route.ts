import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
import User from '@/models/User';
import mongoose from 'mongoose';

const MIN_WITHDRAWAL = 500;

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { amount, destination } = body; // destination: 'chapa' or other payout method

    if (!amount || isNaN(Number(amount)) || Number(amount) < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { success: false, message: `Minimum withdrawal amount is ETB ${MIN_WITHDRAWAL}` },
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

    // Update wallet balances
    adminWallet.availableBalance = Math.round((adminWallet.availableBalance - withdrawalAmount) * 100) / 100;
    adminWallet.lifetimePaidOut = Math.round((adminWallet.lifetimePaidOut + withdrawalAmount) * 100) / 100;
    await adminWallet.save();

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      walletId: adminWallet._id,
      userId: adminUser._id,
      type: 'WITHDRAWAL',
      amount: withdrawalAmount,
      currency: 'ETB',
      status: 'COMPLETED', // Admin withdrawals are processed immediately
      metadata: {
        withdrawalMethod: destination || 'chapa',
        processedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin withdrawal processed successfully',
      data: {
        transactionId: transaction._id,
        amount: withdrawalAmount,
        status: 'COMPLETED',
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
