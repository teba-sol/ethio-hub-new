import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/artisan/product.model';
import User from '@/models/User';
import Order from '@/models/order.model';
import Payment from '@/models/payment.model';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
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
  return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeChapaCustomizationText(value: string): string {
  const sanitized = value
    .replace(/[^a-zA-Z0-9._ -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return sanitized || 'Cart purchase';
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
    const { productId, quantity = 1, idempotencyKey } = body;
    const isCartCheckout = Array.isArray(body.items);
    const requestItems = isCartCheckout
      ? body.items
      : productId
        ? [{ productId, quantity }]
        : [];

    if (requestItems.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one product is required' },
        { status: 400 }
      );
    }

    const lineItems = requestItems.map((item: any) => ({
      productId: item.productId,
      quantity: Number(item.quantity) || 1,
    }));

    const invalidItem = lineItems.find((item: any) => !item.productId || item.quantity < 1);
    if (invalidItem) {
      return NextResponse.json(
        { success: false, message: 'Each cart item must include a product ID and valid quantity' },
        { status: 400 }
      );
    }

    // Check for existing order with idempotencyKey
    if (idempotencyKey) {
      const existingOrders = await Order.find({
        idempotencyKey: requestItems.length === 1
          ? idempotencyKey
          : { $regex: `^${escapeRegExp(idempotencyKey)}:cart:` },
      });

      if (existingOrders.length > 0) {
        const txRef = existingOrders[0].paymentRef;
        const existingPayment = await Payment.findOne({ transactionRef: txRef });
        return NextResponse.json({
          success: true,
          checkout_url: existingPayment?.invoiceUrl || '',
          tx_ref: txRef,
          orderId: existingOrders[0]._id,
          orderIds: existingOrders.map((order) => order._id),
        });
      }
    }

    const txRef = generateTxRef();
    const commissionRate = 0.10;
    const createdOrders: any[] = [];
    const productSummaries: string[] = [];
    const preparedItems: any[] = [];
    let grandTotal = 0;

    for (const [index, item] of lineItems.entries()) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }

      const artisan = await User.findById(product.artisanId);
      if (!artisan) {
        return NextResponse.json(
          { success: false, message: `Artisan not found for ${product.name}` },
          { status: 404 }
        );
      }

      const unitPrice = product.discountPrice || product.price;
      if (!unitPrice || unitPrice <= 0) {
        return NextResponse.json(
          { success: false, message: `Product price is not set or invalid for ${product.name}` },
          { status: 400 }
        );
      }

      const subtotal = unitPrice * item.quantity;
      const shippingCost = Number(product.shippingFee) || 0;
      const total = subtotal + shippingCost;

      if (isNaN(total) || total <= 0) {
        return NextResponse.json(
          { success: false, message: `Invalid total amount calculated for ${product.name}` },
          { status: 400 }
        );
      }

      const adminCommission = Math.round(total * commissionRate * 100) / 100;
      const artisanEarnings = Math.round((total - adminCommission) * 100) / 100;

      preparedItems.push({
        index,
        item,
        product,
        artisan,
        unitPrice,
        total,
        adminCommission,
        artisanEarnings,
      });
    }

    for (const preparedItem of preparedItems) {
      const {
        index,
        item,
        product,
        artisan,
        unitPrice,
        total,
        adminCommission,
        artisanEarnings,
      } = preparedItem;
      const orderIdempotencyKey = requestItems.length === 1
        ? idempotencyKey || undefined
        : idempotencyKey
          ? `${idempotencyKey}:cart:${index}:${product._id.toString()}`
          : undefined;

      const order = new Order({
        tourist: new mongoose.Types.ObjectId(user.userId),
        product: product._id,
        artisan: product.artisanId instanceof mongoose.Types.ObjectId
          ? product.artisanId
          : new mongoose.Types.ObjectId(product.artisanId),
        quantity: item.quantity,
        unitPrice,
        totalPrice: total,
        adminCommission,
        artisanEarnings,
        commissionRate,
        currency: 'ETB',
        status: 'pending',
        paymentStatus: 'pending',
        paymentRef: txRef,
        paymentMethod: 'chapa',
        idempotencyKey: orderIdempotencyKey,
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

      try {
        await order.save();
      } catch (error: any) {
        if (error.code === 11000 && error.keyPattern?.idempotencyKey && idempotencyKey) {
          const existingOrders = await Order.find({
            idempotencyKey: requestItems.length === 1
              ? idempotencyKey
              : { $regex: `^${escapeRegExp(idempotencyKey)}:cart:` },
          });
          if (existingOrders.length > 0) {
            const existingPayment = await Payment.findOne({ transactionRef: existingOrders[0].paymentRef });
            return NextResponse.json({
              success: true,
              checkout_url: existingPayment?.invoiceUrl || '',
              tx_ref: existingOrders[0].paymentRef,
              orderId: existingOrders[0]._id,
              orderIds: existingOrders.map((existingOrder) => existingOrder._id),
            });
          }
        }
        throw error;
      }

      createdOrders.push(order);
      productSummaries.push(`${item.quantity} x ${product.name}`);
      grandTotal += total;

      const artisanWallet = await Wallet.findOne({ userId: artisan._id }) || new Wallet({
        userId: artisan._id,
        userRole: 'artisan',
        pendingBalance: 0,
        availableBalance: 0,
        lifetimeEarned: 0,
        lifetimePaidOut: 0,
        lifetimeRefunded: 0,
        currency: 'ETB',
      });

      artisanWallet.pendingBalance = (artisanWallet.pendingBalance || 0) + artisanEarnings;
      await artisanWallet.save();

      const existingArtisanTransaction = await Transaction.findOne({
        walletId: artisanWallet._id,
        orderId: order._id,
        paymentRef: txRef,
        type: 'ORDER_PAYMENT',
        userId: artisan._id,
      });

      if (!existingArtisanTransaction) {
        await Transaction.create({
          walletId: artisanWallet._id,
          userId: artisan._id,
          orderId: order._id,
          productId: product._id,
          type: 'ORDER_PAYMENT',
          amount: artisanEarnings,
          currency: 'ETB',
          status: 'PENDING',
          paymentRef: txRef,
          metadata: {
            orderId: order._id.toString(),
            productId: product._id.toString(),
            totalAmount: total,
            commissionRate,
            paymentMethod: 'chapa',
            payerId: user.userId,
            receiverId: artisan._id.toString(),
          },
        });
      }

      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        const adminWallet = await Wallet.findOne({ userId: adminUser._id, userRole: 'admin' }) || new Wallet({
          userId: adminUser._id,
          userRole: 'admin',
          pendingBalance: 0,
          availableBalance: 0,
          lifetimeEarned: 0,
          lifetimePaidOut: 0,
          lifetimeRefunded: 0,
          currency: 'ETB',
        });

        adminWallet.pendingBalance = (adminWallet.pendingBalance || 0) + adminCommission;
        await adminWallet.save();

        const existingAdminTransaction = await Transaction.findOne({
          walletId: adminWallet._id,
          orderId: order._id,
          paymentRef: txRef,
          type: 'ADMIN_COMMISSION',
          userId: adminUser._id,
        });

        if (!existingAdminTransaction) {
          await Transaction.create({
            walletId: adminWallet._id,
            userId: adminUser._id,
            orderId: order._id,
            productId: product._id,
            type: 'ADMIN_COMMISSION',
            amount: adminCommission,
            currency: 'ETB',
            status: 'PENDING',
            paymentRef: txRef,
            metadata: {
              orderId: order._id.toString(),
              productId: product._id.toString(),
              totalAmount: total,
              commissionRate,
              paymentMethod: 'chapa',
              payerId: user.userId,
              receiverId: adminUser._id.toString(),
            },
          });
        }
      }
    }

    // Create a payment record
    await Payment.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      orderId: createdOrders.length === 1 ? createdOrders[0]._id : undefined,
      transactionRef: txRef,
      method: 'chapa',
      amount: grandTotal,
      status: 'Pending',
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const chapaTitle = sanitizeChapaCustomizationText(
      isCartCheckout ? 'Cart purchase' : `Purchase ${productSummaries[0].replace(/^\d+ x /, '')}`
    );
    const chapaDescription = sanitizeChapaCustomizationText(productSummaries.join(' '));

    const chapaPayload: any = {
      amount: grandTotal,
      currency: 'ETB',
      email: user.email,
      first_name: user.name?.split(' ')[0] || 'Tourist',
      last_name: user.name?.split(' ').slice(1).join(' ') || 'User',
      phone: user.phone || '',
      tx_ref: txRef,
      // callback_url removed - Chapa callbacks ignored (localhost blocked)
      return_url: `${baseUrl}/payment-success?orderId=${createdOrders[0]._id}&status=success&tx_ref=${txRef}${isCartCheckout ? '&cart=true' : ''}`,
      metadata: {
        orderId: createdOrders[0]._id.toString(),
        orderIds: createdOrders.map((order) => order._id.toString()),
        type: isCartCheckout ? 'cart' : 'order',
      },
      customization: {
        title: chapaTitle,
        description: chapaDescription,
      },
    };

    console.log('Chapa payload:', JSON.stringify(chapaPayload, null, 2));

    if (!process.env.CHAPA_SECRET_KEY) {
      console.error('CHAPA_SECRET_KEY is not configured');
      return NextResponse.json(
        { success: false, message: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${CHAPA_API_URL}/v1/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chapaPayload),
    });

    const data = await response.json();

     if (!response.ok || !data.data?.checkout_url) {
       console.error('Chapa API error:', JSON.stringify(data, null, 2));
       const errorMessage = typeof data.message === 'object' ? JSON.stringify(data.message) : (data.message || 'Failed to initialize payment');
       return NextResponse.json(
         { success: false, message: errorMessage },
         { status: response.status }
       );
     }

     // Update Payment with Chapa checkout URL
     await Payment.updateOne(
       { transactionRef: txRef },
       { $set: { invoiceUrl: data.data.checkout_url } }
     );

     return NextResponse.json({
      success: true,
      checkout_url: data.data.checkout_url,
      tx_ref: txRef,
      orderId: createdOrders[0]._id,
      orderIds: createdOrders.map((order) => order._id),
    });
  } catch (error: any) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
