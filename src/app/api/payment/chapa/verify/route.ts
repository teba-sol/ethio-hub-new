import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/booking.model';

const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const txRef = searchParams.get('tx_ref');

    if (!txRef) {
      return NextResponse.json({ success: false, message: 'Missing tx_ref' });
    }

    if (!CHAPA_SECRET_KEY) {
      return NextResponse.json({ 
        success: true, 
        status: 'success',
        message: 'Test mode - payment simulated'
      });
    }

    await connectDB();

    const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status === 'success' && data.data?.status === 'success') {
      await Booking.findOneAndUpdate(
        { paymentRef: txRef },
        { 
          paymentStatus: 'paid',
          paymentDate: new Date(),
        }
      );

      return NextResponse.json({ 
        success: true, 
        status: 'success',
        data: data.data 
      });
    }

    return NextResponse.json({ 
      success: false, 
      status: data.data?.status || 'failed',
      message: data.message 
    });

  } catch (error: any) {
    console.error('Chapa verify error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    });
  }
}
