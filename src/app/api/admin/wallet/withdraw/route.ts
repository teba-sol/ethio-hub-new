import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
import User from '@/models/User';
import mongoose from 'mongoose';

const MIN_WITHDRAWAL = 500;
const CHAPA_API_URL = 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

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

    // Generate transaction reference
    const txRef = `WITHDRAW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize Chapa "Withdrawal" (technically a hosted payment link for the admin to confirm/pay out)
    if (!CHAPA_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: 'Chapa not configured' },
        { status: 500 }
      );
    }

    const chapaPayload = {
      amount: withdrawalAmount.toString(),
      currency: 'ETB',
      email: adminUser.email || 'admin@ethiohub.com',
      first_name: 'Admin',
      last_name: 'Withdrawal',
      tx_ref: txRef,
      callback_url: `${FRONTEND_URL}/api/admin/wallet/withdraw/callback`,
      return_url: `${FRONTEND_URL}/admin/wallet?status=success&tx_ref=${txRef}`,
      customization: {
        title: "EthioHub Admin Withdrawal",
        description: `Platform withdrawal for ETB ${withdrawalAmount}`
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

    // Update wallet balances (Deduct immediately as it's initiated)
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
      status: 'PENDING', // Will be confirmed via callback or return
      paymentRef: txRef,
      metadata: {
        withdrawalMethod: destination || 'chapa',
        initiatedAt: new Date(),
        checkoutUrl: chapaData.data.checkout_url,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin withdrawal initiated',
      checkoutUrl: chapaData.data.checkout_url,
      data: {
        transactionId: transaction._id,
        amount: withdrawalAmount,
        status: 'PENDING',
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
