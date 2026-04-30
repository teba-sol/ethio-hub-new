import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';
import Product from '@/models/artisan/product.model';
import ArtisanProfile from '@/models/artisan/artisanProfile.model';
import mongoose from 'mongoose';
import * as jose from 'jose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const touristId = payload.userId as string;

    if (!touristId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Tourist ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const orderId = searchParams.get('id');

    let touristObjectId;
    try {
      touristObjectId = new mongoose.Types.ObjectId(touristId);
    } catch (e) {
      touristObjectId = touristId;
    }

    if (orderId) {
      // Fetch single order by ID with full details
      try {
        const order = await Order.findOne({ 
          _id: orderId, 
          tourist: touristObjectId 
        })
          .populate('product', 'name price images discountPrice')
          .populate('artisan', 'name email');

        if (!order) {
          return new NextResponse(
            JSON.stringify({ success: false, message: 'Order not found' }),
            { status: 404, headers: { 'content-type': 'application/json' } }
          );
        }

        // Fetch artisan profile for receipt
        const artisanProfile = await ArtisanProfile.findOne({ userId: order.artisan._id });

        const orderObj = order.toObject();
        orderObj.artisanProfile = artisanProfile?.toObject() || null;

        return new NextResponse(
          JSON.stringify({ success: true, order: orderObj }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      } catch (e) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Invalid order ID' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    const query: any = { tourist: touristObjectId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('product', 'name price images discountPrice')
      .populate('artisan', 'name email')
      .sort({ createdAt: -1 });

    return new NextResponse(
      JSON.stringify({ success: true, orders }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    console.error('Error fetching orders:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const touristId = payload.userId as string;

    if (!touristId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Tourist ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { 
      productId, 
      quantity, 
      contactInfo, 
      shippingAddress,
      totalPrice,
      currency
    } = body;

    if (!productId || !quantity || !contactInfo || !totalPrice) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Product not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    if (!product.artisanId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Product does not have an artisan assigned. Please contact support.' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    if (product.stock < quantity) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Insufficient stock' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const orderData: any = {
      tourist: new mongoose.Types.ObjectId(touristId),
      product: new mongoose.Types.ObjectId(productId),
      artisan: product.artisanId,
      quantity,
      totalPrice,
      currency: currency || 'ETB',
      status: 'pending',
      paymentStatus: 'pending',
      contactInfo: {
        fullName: contactInfo.fullName,
        email: contactInfo.email,
        phone: contactInfo.phone || '',
      },
    };

    if (shippingAddress) {
      orderData.shippingAddress = shippingAddress;
    }

    const order = new Order(orderData);
    await order.save();

    // Reduce stock
    product.stock -= quantity;
    await product.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('product', 'name price images')
      .populate('artisan', 'name');

    return new NextResponse(
      JSON.stringify({ success: true, order: populatedOrder }),
      { status: 201, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    if (error.name === 'CastError') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid ID format' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
    console.error('Error creating order:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
