import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/booking.model';

const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { 
      bookingId, 
      amount, 
      currency = 'ETB',
      email,
      firstName,
      lastName,
      phone,
      description
    } = body;

    console.log('Chapa payment request:', { bookingId, amount, currency });

    if (!bookingId || !amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!CHAPA_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: 'Chapa not configured. Please set CHAPA_SECRET_KEY in .env' },
        { status: 500 }
      );
    }

    const txRef = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const chapaData = {
      amount: amount.toString(),
      currency,
      email: email || 'customer@email.com',
      first_name: firstName || 'Customer',
      last_name: lastName || 'User',
      phone_number: phone || '0912345678',
      tx_ref: txRef,
      callback_url: `${FRONTEND_URL}/api/payment/chapa/callback`,
      return_url: `${FRONTEND_URL}/payment/success?tx_ref=${txRef}`,
      metadata: {
        bookingId: bookingId,
      },
    };

    console.log('Sending to Chapa:', chapaData);

    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chapaData),
    });

    const data = await response.json();
    console.log('Chapa response:', data);

    if (data.status === 'success' && data.data?.checkout_url) {
      try {
        await Booking.findByIdAndUpdate(bookingId, {
          paymentRef: txRef,
          paymentStatus: 'pending',
        });
      } catch (dbError) {
        console.log('Booking update skipped (model may not exist):', dbError);
      }

      return NextResponse.json({
        success: true,
        checkoutUrl: data.data.checkout_url,
        txRef,
      });
    }

    return NextResponse.json(
      { success: false, message: data.message || 'Failed to initialize payment', details: data },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Chapa payment error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Payment failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Chapa payment API is running',
    configured: !!process.env.CHAPA_SECRET_KEY 
  });
}
