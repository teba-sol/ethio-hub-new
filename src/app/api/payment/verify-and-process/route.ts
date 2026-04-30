import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Payment from '@/models/payment.model';
import { processSuccessfulPayment } from '@/services/payment.service';

const CHAPA_API_URL = 'https://api.chapa.co/v1';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { orderId, tx_ref } = body;

    if (!orderId || !tx_ref) {
      return NextResponse.json(
        { success: false, message: 'orderId and tx_ref are required' },
        { status: 400 }
      );
    }

    // 1. Find payment by transaction reference
    const payment = await Payment.findOne({ transactionRef: tx_ref });
    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }

    // 2. Verify orderId matches payment record (prevent tampering)
    if (payment.orderId?.toString() !== orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID mismatch' },
        { status: 400 }
      );
    }

    // 3. Verify payment with Chapa API before processing
    console.log(`[VerifyAndProcess] Verifying payment with Chapa for tx_ref: ${tx_ref}`);
    const chapaResponse = await fetch(`${CHAPA_API_URL}/transaction/verify/${tx_ref}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const chapaData = await chapaResponse.json();
    console.log(`[VerifyAndProcess] Chapa verification response:`, chapaData);

    if (!chapaResponse.ok || (chapaData.status !== 'success' && chapaData.data?.status !== 'success')) {
      console.error(`[VerifyAndProcess] Chapa verification failed for ${tx_ref}:`, chapaData.message);
      return NextResponse.json(
        { success: false, message: 'Payment verification failed with Chapa' },
        { status: 400 }
      );
    }

    // 5. Process business logic (updates order, creates transactions, splits wallets)
    // Pass the Chapa verification data as metadata
    const result = await processSuccessfulPayment(tx_ref, chapaData.data || chapaData);

    // 6. Update payment status only after successful processing
    if (result.success) {
      payment.status = 'Success';
      if (chapaData.data?.reference) {
        payment.paymentGatewayId = chapaData.data.reference;
      }
      await payment.save();
      console.log(`[VerifyAndProcess] Payment ${tx_ref} processed successfully`);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[VerifyAndProcess] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
