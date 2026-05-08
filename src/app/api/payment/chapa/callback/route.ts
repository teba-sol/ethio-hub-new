import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/booking.model';
import Order from '@/models/order.model';
import Payment from '@/models/payment.model';
import { processSuccessfulPayment } from '@/services/payment.service';

const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const txRef = searchParams.get('trx_ref') || searchParams.get('tx_ref');
    const status = searchParams.get('status') || searchParams.get('Status');

    console.log('Chapa callback received:', { txRef, status, fullParams: Object.fromEntries(searchParams.entries()) });

    if (!txRef) {
      return NextResponse.redirect(new URL('/?payment=error', request.url));
    }

    const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });

    const data = await response.json();
    console.log('Chapa verify response:', data);

    if (data.status === 'success' || data.data?.status === 'success') {
      const result = await processSuccessfulPayment(txRef, data.data);
      
      if (result.success) {
        // Build redirect URL with booking/order info
        let redirectPath = '/payment-success?status=success';
        
        if (result.booking?._id) {
          redirectPath += `&bookingId=${result.booking._id}&tx_ref=${txRef}`;
        } else if (result.order?._id) {
          redirectPath += `&orderId=${result.order._id}&tx_ref=${txRef}`;
        } else if (result.payment?.orderId) {
          redirectPath += `&orderId=${result.payment.orderId}&tx_ref=${txRef}`;
        }
        
        redirectPath += `&payment=success`;
        
        console.log('Redirecting to:', redirectPath);
        return NextResponse.redirect(new URL(redirectPath, request.url));
      } else {
        console.error('Failed to process payment:', result.message);
        return NextResponse.redirect(new URL('/?payment=error', request.url));
      }
    }

    // Payment failed - redirect to root with failed param
    return NextResponse.redirect(new URL('/?payment=failed', request.url));

  } catch (error: any) {
    console.error('Chapa callback error:', error);
    return NextResponse.redirect(new URL('/?payment=error', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Chapa webhook received:', body);

    const txRef = body.tx_ref || body.trx_ref || body.data?.tx_ref || body.data?.trx_ref;
    const status = body.status || body.data?.status;

    if (status === 'success' && txRef) {
      const result = await processSuccessfulPayment(txRef, body);
      
      if (result.success) {
        return NextResponse.json({ 
          received: true, 
          type: result.order ? 'order' : (result.booking ? 'booking' : 'unknown') 
        });
      } else {
        console.error('Failed to process webhook payment:', result.message);
        return NextResponse.json({ error: result.message }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Chapa webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
