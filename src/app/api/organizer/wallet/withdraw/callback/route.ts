import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Transaction from '@/models/transaction.model';
import Wallet from '@/models/wallet.model';
import Payment from '@/models/payment.model';
import mongoose from 'mongoose';

const CHAPA_API_URL = 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const txRef = searchParams.get('tx_ref');
  const status = searchParams.get('status');

  if (!txRef) {
    return NextResponse.json({ success: false, message: 'Missing transaction reference' }, { status: 400 });
  }

  try {
    await connectDB();

    // 1. Find the transaction
    const transaction = await Transaction.findOne({ paymentRef: txRef, type: 'WITHDRAWAL' });
    if (!transaction) {
      console.error(`[WithdrawCallback] Withdrawal transaction not found: ${txRef}`);
      return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    }

    // If already processed, just return success
    if (transaction.status === 'COMPLETED') {
      return NextResponse.redirect(new URL('/dashboard/organizer/wallet?status=success', request.url));
    }

    // 2. Verify with Chapa
    const response = await fetch(`${CHAPA_API_URL}/transaction/verify/${txRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.status === 'success' && (data.data?.status === 'success' || status === 'success')) {
      // Success - Update transaction status
      transaction.status = 'COMPLETED';
      transaction.metadata = {
        ...transaction.metadata,
        completedAt: new Date(),
        gatewayResponse: data.data,
      };
      await transaction.save();

      // Update Payment status
      await Payment.updateOne(
        { transactionRef: txRef },
        { 
          $set: { 
            status: 'Success',
            paymentGatewayId: data.data?.reference || data.data?.id
          } 
        }
      );

      console.log(`[WithdrawCallback] Withdrawal successful for txRef: ${txRef}`);
      return NextResponse.redirect(new URL('/dashboard/organizer/wallet?status=success', request.url));
    } else {
      // Failed - Restore wallet balance
      const wallet = await Wallet.findById(transaction.walletId);
      if (wallet) {
        wallet.availableBalance = Math.round((wallet.availableBalance + transaction.amount) * 100) / 100;
        wallet.lifetimePaidOut = Math.round((wallet.lifetimePaidOut - transaction.amount) * 100) / 100;
        await wallet.save();
      }

      transaction.status = 'FAILED';
      transaction.metadata = {
        ...transaction.metadata,
        failedAt: new Date(),
        reason: data.message || 'Payment failed',
      };
      await transaction.save();

      // Update Payment status
      await Payment.updateOne(
        { transactionRef: txRef },
        { $set: { status: 'Failed' } }
      );

      console.log(`[WithdrawCallback] Withdrawal failed for txRef: ${txRef}. Balance restored.`);
      return NextResponse.redirect(new URL('/dashboard/organizer/wallet?status=failed', request.url));
    }
  } catch (error: any) {
    console.error('[WithdrawCallback] Error:', error);
    return NextResponse.redirect(new URL('/dashboard/organizer/wallet?status=error', request.url));
  }
}

// Chapa also sends POST callbacks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tx_ref, status } = body;

    if (!tx_ref) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    await connectDB();

    const transaction = await Transaction.findOne({ paymentRef: tx_ref, type: 'WITHDRAWAL' });
    if (!transaction || transaction.status === 'COMPLETED' || transaction.status === 'FAILED') {
      return NextResponse.json({ success: true });
    }

    if (status === 'success') {
      transaction.status = 'COMPLETED';
      transaction.metadata = {
        ...transaction.metadata,
        completedAt: new Date(),
      };
      await transaction.save();

      // Update Payment status
      await Payment.updateOne(
        { transactionRef: tx_ref },
        { $set: { status: 'Success' } }
      );
    } else {
      // Failed - Restore balance
      const wallet = await Wallet.findById(transaction.walletId);
      if (wallet) {
        wallet.availableBalance = Math.round((wallet.availableBalance + transaction.amount) * 100) / 100;
        wallet.lifetimePaidOut = Math.round((wallet.lifetimePaidOut - transaction.amount) * 100) / 100;
        await wallet.save();
      }

      transaction.status = 'FAILED';
      transaction.metadata = {
        ...transaction.metadata,
        failedAt: new Date(),
      };
      await transaction.save();

      // Update Payment status
      await Payment.updateOne(
        { transactionRef: tx_ref },
        { $set: { status: 'Failed' } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WithdrawCallback POST] Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
