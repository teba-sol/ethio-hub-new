import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/booking.model';
import Order from '@/models/order.model';

const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const txRef = searchParams.get('trx_ref') || searchParams.get('tx_ref');
    const status = searchParams.get('status');

    console.log('Chapa callback received:', { txRef, status });

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
      const updateData = data.data || {};
      const metadata = updateData.metadata || {};
      
      if (metadata.type === 'order') {
        // Update Order
        await Order.findOneAndUpdate(
          { paymentRef: txRef },
          { 
            paymentStatus: 'paid',
            paymentDate: new Date(),
            status: 'confirmed',
          },
          { new: true }
        );
      } else {
        // Update Booking (default)
        await Booking.findOneAndUpdate(
          { paymentRef: txRef },
          { 
            paymentStatus: 'paid',
            paymentDate: new Date(),
            status: 'confirmed',
          },
          { new: true }
        );
      }

      return NextResponse.redirect(new URL(`/payment/success?tx_ref=${txRef}&status=success`, request.url));
    }

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
    
    const { tx_ref, status } = body;
    
    if (status === 'success' && tx_ref) {
      await connectDB();
      
      // Try to find and update Booking first
      const booking = await Booking.findOneAndUpdate(
        { paymentRef: tx_ref },
        { 
          paymentStatus: 'paid',
          paymentDate: new Date(),
        }
      );
      
      // If not found in Booking, try Order
      if (!booking) {
        await Order.findOneAndUpdate(
          { paymentRef: tx_ref },
          { 
            paymentStatus: 'paid',
            paymentDate: new Date(),
          }
        );
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Chapa webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
