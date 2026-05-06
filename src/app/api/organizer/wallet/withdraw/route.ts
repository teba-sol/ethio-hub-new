import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
import User from '@/models/User';
import Payment from '@/models/payment.model';
import { verifyToken } from '@/services/auth.service';
import mongoose from 'mongoose';

const MIN_WITHDRAWAL = 500; // Minimum 500 ETB
const CHAPA_API_URL = 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

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

    const tokenResult = await verifyToken(token);
    if (!tokenResult.valid || !tokenResult.payload?.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = tokenResult.payload.userId as string;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Get organizer info for Chapa
    const organizerUser = await User.findById(userObjectId);
    if (!organizerUser) {
      return NextResponse.json(
        { success: false, message: 'Organizer user not found' },
        { status: 404 }
      );
    }

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

    // Initialize Chapa for Withdrawal
    if (!CHAPA_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: 'Chapa not configured' },
        { status: 500 }
      );
    }

    const chapaPayload = {
      amount: withdrawalAmount.toString(),
      currency: 'ETB',
      email: organizerUser.email || 'organizer@example.com',
      first_name: organizerUser.name?.split(' ')[0] || 'Organizer',
      last_name: organizerUser.name?.split(' ').slice(1).join(' ') || 'User',
      tx_ref: txRef,
      callback_url: `${FRONTEND_URL}/api/organizer/wallet/withdraw/callback`,
      return_url: `${FRONTEND_URL}/dashboard/organizer/wallet?status=success&tx_ref=${txRef}`,
      customization: {
        title: "EthioHub Organizer Withdrawal",
        description: `Wallet withdrawal for ETB ${withdrawalAmount}`
      },
    };

    const chapaResponse = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chapaPayload),
    });

    const chapaData = await chapaResponse.json();

    if (!chapaResponse.ok || !chapaData.data?.checkout_url) {
      return NextResponse.json(
        { success: false, message: chapaData.message || 'Chapa initialization failed' },
        { status: 400 }
      );
    }

    // Update wallet balances (Deduct immediately)
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
      status: 'PENDING',
      paymentRef: txRef,
      metadata: {
        withdrawalMethod: 'chapa',
        initiatedAt: new Date(),
        checkoutUrl: chapaData.data.checkout_url,
      },
    });

    // Create Payment Record (Receipt)
    try {
      await Payment.create({
        userId: userObjectId,
        transactionRef: txRef,
        method: 'chapa',
        amount: withdrawalAmount,
        status: 'Pending',
        invoiceUrl: chapaData.data.checkout_url,
      });
    } catch (payError) {
      console.error('[WithdrawAPI] Payment record creation failed:', payError);
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal initiated successfully',
      checkoutUrl: chapaData.data.checkout_url,
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