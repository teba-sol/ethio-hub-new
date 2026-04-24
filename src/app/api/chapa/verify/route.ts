import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';

const CHAPA_API_URL = 'https://api.chapa.co';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const txRef = searchParams.get('tx_ref') || searchParams.get('trx_ref');

    if (!txRef) {
      return NextResponse.json(
        { success: false, message: 'Transaction reference required' },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ paymentRef: txRef });
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.paymentStatus === 'Paid') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        order,
      });
    }

    const response = await fetch(`${CHAPA_API_URL}/v1/transaction/verify/${txRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || data.data?.status !== 'success') {
      await Order.findOneAndUpdate(
        { paymentRef: txRef },
        { paymentStatus: 'Failed' },
        { new: true }
      );
      
      return NextResponse.json(
        { success: false, message: data.message || 'Payment verification failed' },
        { status: response.status }
      );
    }

    await Order.findOneAndUpdate(
      { paymentRef: txRef },
      { 
        paymentStatus: 'Paid',
        paymentReference: data.data?.reference || txRef,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { txRef } = body;

    if (!txRef) {
      return NextResponse.json(
        { success: false, message: 'Transaction reference required' },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ paymentRef: txRef });
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.paymentStatus === 'Paid') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        order,
      });
    }

    const response = await fetch(`${CHAPA_API_URL}/v1/transaction/verify/${txRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || data.data?.status !== 'success') {
      await Order.findOneAndUpdate(
        { paymentRef: txRef },
        { paymentStatus: 'Failed' },
        { new: true }
      );
      
      return NextResponse.json(
        { success: false, message: data.message || 'Payment verification failed' },
        { status: response.status }
      );
    }

    await Order.findOneAndUpdate(
      { paymentRef: txRef },
      { 
        paymentStatus: 'Paid',
        paymentReference: data.data?.reference || txRef,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
