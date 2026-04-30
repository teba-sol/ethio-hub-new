import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { processSuccessfulPayment } from '@/services/payment.service';

const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const txRef = searchParams.get('tx_ref');

    if (!txRef) {
      return NextResponse.json({ success: false, message: 'Missing tx_ref' });
    }

    await connectDB();

    if (!CHAPA_SECRET_KEY) {
      return NextResponse.json({ 
        success: true, 
        status: 'success',
        message: 'Test mode - payment simulated'
      });
    }

    const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });

    const data = await response.json();
    console.log('[Chapa Verify] txRef:', txRef);
    console.log('[Chapa Verify] Full Response:', JSON.stringify(data));

    if ((data.status === 'success' || data.data?.status === 'success')) {
      console.log('[Chapa Verify] Payment verified! Calling processSuccessfulPayment...');
      const result = await processSuccessfulPayment(txRef, data.data);
      console.log('[Chapa Verify] processSuccessfulPayment result:', JSON.stringify(result));
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          status: 'success',
          message: 'Payment verified and processed successfully',
          data: data.data,
        });
      } else {
        console.error('[Chapa Verify] Failed:', result.message);
        return NextResponse.json({ 
          success: false, 
          message: result.message || 'Failed to process payment updates' 
        });
      }
    }

    console.log('[Chapa Verify] Payment not successful. Status:', data.data?.status);
    return NextResponse.json({ 
      success: false, 
      status: data.data?.status || 'failed',
      message: data.message || 'Payment not successful'
    });

  } catch (error: any) {
    console.error('Chapa verify error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    });
  }
}