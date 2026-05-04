import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/booking.model';
import Payment from '@/models/payment.model';
import mongoose from 'mongoose';
import { verifyToken } from '@/services/auth.service';

const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

async function getUserFromToken(token: string) {
  const result = await verifyToken(token);
  if (!result.valid || !result.payload) return null;
  return result.payload;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    let userId = null;
    
    if (token) {
      const user: any = await getUserFromToken(token);
      if (user) userId = user.userId;
    }

    const body = await request.json();
    const { 
      bookingId,
      orderId,
      amount, 
      currency = 'ETB',
      email,
      firstName,
      lastName,
      phone,
      description
    } = body;

    console.log('Chapa payment request:', { bookingId, orderId, amount, currency });

    if ((!bookingId && !orderId) || !amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Booking ID is required' },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!email || !firstName || !phone) {
      return NextResponse.json(
        { success: false, message: 'Missing required customer info (email, firstName, phone)' },
        { status: 400 }
      );
    }

    if (!CHAPA_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: 'Chapa not configured. Add CHAPA_SECRET_KEY in .env' },
        { status: 500 }
      );
    }

    // ✅ Generate transaction reference
    const txRef = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // ✅ Correct Chapa payload
    const chapaData = {
      amount: amount.toString(),
      currency: 'ETB', // Always use ETB for Chapa
      email: email || 'customer@example.com',
      first_name: firstName || 'Guest',
      last_name: lastName || 'User',
      phone_number: phone || '0900000000',
      tx_ref: txRef,
      callback_url: `${FRONTEND_URL}/api/payment/chapa/callback`,
      return_url: `${FRONTEND_URL}/pay-result?status=success&tx_ref=${txRef}&bookingId=${bookingId}`,
      customization: {
        title: "EthioHub Payment",
        description: `Payment for ${bookingId ? 'Booking' : 'Order'} #${txRef}`,
      },
      meta: {
        bookingId: bookingId || undefined,
        orderId: orderId || undefined,
        type: bookingId ? 'booking' : 'order',
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

    // ✅ Success case
    if (data.status === 'success' && data.data?.checkout_url) {
      // Create a payment record
      try {
        await Payment.create({
          userId: userId ? new mongoose.Types.ObjectId(userId) : new mongoose.Types.ObjectId(), // Fallback if no user
          orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
          bookingId: bookingId ? new mongoose.Types.ObjectId(bookingId) : undefined,
          transactionRef: txRef,
          method: 'chapa',
          amount: amount,
          status: 'Pending',
        });
      } catch (payError) {
        console.log('Payment record creation skipped:', payError);
      }

      try {
        if (bookingId) {
          await Booking.findByIdAndUpdate(bookingId, {
            paymentRef: txRef,
            paymentStatus: 'pending',
          });
        } else if (orderId) {
          const Order = (await import('@/models/order.model')).default;
          await Order.findByIdAndUpdate(orderId, {
            paymentRef: txRef,
            paymentStatus: 'pending',
          });
        }
      } catch (dbError) {
        console.log('Payment ref update skipped:', dbError);
      }
      
      return NextResponse.json({
        success: true,
        checkoutUrl: data.data.checkout_url,
        txRef,
        bookingId,
      });
    }

    // ❌ Failure case
    return NextResponse.json(
      {
        success: false,
        message: data.message || 'Failed to initialize payment',
        details: data,
      },
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

export async function GET() {
  return NextResponse.json({
    message: 'Chapa payment API is running',
    configured: !!process.env.CHAPA_SECRET_KEY,
  });
}