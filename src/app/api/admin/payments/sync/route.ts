import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/services/auth.service';
import { processSuccessfulPayment } from '@/services/payment.service';

/**
 * Admin utility to manually sync a payment that might have failed to update wallets/transactions
 * POST /api/admin/payments/sync
 * Body: { txRef: string }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // 1. Verify admin authorization
    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const tokenResult: any = await verifyToken(token);
    if (!tokenResult || tokenResult.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
    }

    // 2. Get transaction reference
    const body = await request.json();
    const { txRef } = body;

    if (!txRef) {
      return NextResponse.json({ success: false, message: 'Transaction reference (txRef) is required' }, { status: 400 });
    }

    console.log(`[AdminSync] Manually triggering sync for txRef: ${txRef}`);

    // 3. Process the payment
    const result = await processSuccessfulPayment(txRef, { source: 'admin_manual_sync' });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message || 'Payment synced successfully',
        data: result.order || result.booking
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Failed to sync payment'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error in payment sync route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
