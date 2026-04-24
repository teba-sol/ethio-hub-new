import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/artisan/product.model';
import User from '@/models/User';
import ArtisanProfile from '@/models/artisan/artisanProfile.model';
import Order from '@/models/order.model';
import mongoose from 'mongoose';
import { verifyToken } from '@/services/auth.service';
import { JWTPayload } from 'jose';

const CHAPA_API_URL = 'https://api.chapa.co';

async function getUserFromToken(token: string) {
  const result = await verifyToken(token);
  if (!result.valid || !result.payload) return null;
  return result.payload as JWTPayload & { userId: string; role: string; name: string; email: string; phone?: string; avatar?: string };
}

function generateTxRef(): string {
  return 'TXF-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user || user.role !== 'tourist') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    const artisan = await User.findById(product.artisanId);
    if (!artisan) {
      return NextResponse.json(
        { success: false, message: 'Artisan not found' },
        { status: 404 }
      );
    }

    const unitPrice = product.discountPrice || product.price;
    const subtotal = unitPrice * quantity;
    const shippingCost = Number(product.shippingFee) || 0;
    const total = subtotal + shippingCost;

    const txRef = generateTxRef();

    // Create order first
    const order = new Order({
      tourist: new mongoose.Types.ObjectId(user.userId),
      product: product._id,
      artisan: product.artisanId,
      quantity,
      totalPrice: total,
      currency: 'ETB',
      status: 'pending',
      paymentStatus: 'pending',
      paymentRef: txRef,
      paymentMethod: 'chapa',
      contactInfo: {
        fullName: user.name || 'Tourist',
        email: user.email || '',
        phone: user.phone || 'Not Provided',
      },
      shippingAddress: {
        street: 'Not Provided',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        country: 'Ethiopia',
        zipCode: '',
      },
    });

    await order.save();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const response = await fetch(`${CHAPA_API_URL}/v1/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: total,
        currency: 'ETB',
        email: user.email,
        first_name: user.name?.split(' ')[0] || 'Tourist',
        last_name: user.name?.split(' ').slice(1).join(' ') || 'User',
        phone: user.phone || '',
        tx_ref: txRef,
        callback_url: `${baseUrl}/api/chapa/verify?tx_ref=${txRef}`,
        return_url: `${baseUrl}/confirmation/order/${order._id}?status=success`,
        customization: {
          title: `Purchase ${product.name}`,
          description: `Buying ${quantity} x ${product.name}`,
        },
        meta: {
          hide_receipt: "true",
          invoices: [
            { key: product.name, value: `${quantity}pcs` }
          ]
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.data?.checkout_url) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to initialize payment' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      checkout_url: data.data.checkout_url,
      tx_ref: txRef,
      orderId: order._id,
    });
  } catch (error: any) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
