import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/booking.model';

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

    if (data.status === 'success') {
      const paymentData = data.data || {};
      console.log('Payment verified successfully:', paymentData);
      
      try {
        await Booking.findOneAndUpdate(
          { paymentRef: txRef },
          { 
            paymentStatus: 'paid',
            paymentDate: new Date(),
            status: 'confirmed',
          },
          { new: true }
        );
        console.log('Booking updated to paid');
      } catch (dbError) {
        console.log('Booking update error:', dbError);
      }

      // Redirect to root with success query param - the simple payment success page will handle it
      return NextResponse.redirect(new URL('/payment/success?status=success', request.url));
    }

    // Payment failed - redirect to root with failed param
    return NextResponse.redirect(new URL('/payment/success?status=failed', request.url));

  } catch (error: any) {
    console.error('Chapa callback error:', error);
    return NextResponse.redirect(new URL('/?payment=error', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Chapa webhook received:', body);
    
    const { tx_ref, status } = body;
    
    if (status === 'success' && tx_ref) {
      await connectDB();
      await Booking.findOneAndUpdate(
        { paymentRef: tx_ref },
        { 
          paymentStatus: 'paid',
          paymentDate: new Date(),
        }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Chapa webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
