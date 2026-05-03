import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wallet from '@/models/wallet.model';
import User from '@/models/User';
import '@/models/artisan/product.model';
import '@/models/order.model';
import Transaction from '@/models/transaction.model';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Get admin wallet by userId
    let adminWallet = await Wallet.findOne({ userId: adminUser._id, userRole: 'admin' }).lean();
    
    if (!adminWallet) {
      // Create default admin wallet if not exists
      const newWallet = new Wallet({ userId: adminUser._id, userRole: 'admin' });
      await newWallet.save();
      adminWallet = newWallet.toObject();
    }

    // Get transactions (all admin commission transactions)
    const [transactions, total] = await Promise.all([
      Transaction.find({ type: 'ADMIN_COMMISSION' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'orderId',
          select: 'tourist artisan product quantity unitPrice totalPrice adminCommission artisanEarnings commissionRate currency status paymentStatus paymentRef paymentReference paymentMethod paymentDate contactInfo shippingAddress createdAt',
          populate: [
            {
              path: 'tourist',
              select: 'name email phone touristProfile',
            },
            {
              path: 'artisan',
              select: 'name email phone',
            },
          ],
        })
        .populate({
          path: 'productId',
          select: 'name sku category artisanId',
          populate: {
            path: 'artisanId',
            select: 'name email phone',
          },
        })
        .populate('userId', 'name email')
        .lean(),
      Transaction.countDocuments({ type: 'ADMIN_COMMISSION' }),
    ]);

    const getOrder = (tx: any) => {
      if (tx.orderId && typeof tx.orderId === 'object') return tx.orderId;
      return null;
    };

    const getProduct = (tx: any) => {
      if (tx.productId && typeof tx.productId === 'object') return tx.productId;
      return null;
    };

    return NextResponse.json({
      success: true,
      data: {
        wallet: {
          pendingBalance: adminWallet.pendingBalance || 0,
          availableBalance: adminWallet.availableBalance || 0,
          lifetimeEarned: adminWallet.lifetimeEarned || 0,
          lifetimePaidOut: adminWallet.lifetimePaidOut || 0,
          lifetimeRefunded: adminWallet.lifetimeRefunded || 0,
          currency: adminWallet.currency || 'ETB',
        },
        transactions: transactions.map((tx: any) => {
          const order = getOrder(tx);
          const product = getProduct(tx);
          const tourist = order?.tourist && typeof order.tourist === 'object' ? order.tourist : null;
          const artisanFromOrder = order?.artisan && typeof order.artisan === 'object' ? order.artisan : null;
          const artisanFromProduct = product?.artisanId && typeof product.artisanId === 'object' ? product.artisanId : null;
          const artisan = artisanFromOrder || artisanFromProduct;
          const contactInfo = order?.contactInfo || {};
          const paymentGatewayId = tx.metadata?.paymentGatewayId || order?.paymentReference || null;

          return {
            id: tx._id,
            type: tx.type,
            amount: tx.amount,
            currency: tx.currency,
            status: tx.status,
            paymentRef: tx.paymentRef,
            createdAt: tx.createdAt,
            orderId: order?._id || tx.orderId,
            productId: product?._id || tx.productId || tx.metadata?.productId || order?.product || null,
            productName: product?.name || null,
            artisanName: artisan?.name || tx.metadata?.artisanId || null,
            quantity: tx.quantity || order?.quantity || tx.metadata?.quantity || null,
            unitPrice: tx.unitPrice || order?.unitPrice || tx.metadata?.unitPrice || null,
            details: {
              touristFullName: contactInfo.fullName || tourist?.name || tx.metadata?.touristFullName || 'N/A',
              touristEmail: contactInfo.email || tourist?.email || tx.metadata?.touristEmail || 'N/A',
              touristPhone: contactInfo.phone || tourist?.phone || tourist?.touristProfile?.phone || tx.metadata?.touristPhone || null,
              artisanFullName: artisan?.name || tx.metadata?.artisanName || tx.metadata?.artisanFullName || 'N/A',
              artisanEmail: artisan?.email || tx.metadata?.artisanEmail || 'N/A',
              artisanPhone: artisan?.phone || tx.metadata?.artisanPhone || null,
              artisanId: artisan?._id || order?.artisan || product?.artisanId || tx.metadata?.artisanId || null,
              productId: product?._id || tx.productId || tx.metadata?.productId || order?.product || null,
              productName: product?.name || null,
              productSku: product?.sku || tx.metadata?.productSku || null,
              productCategory: product?.category || tx.metadata?.productCategory || null,
              orderId: order?._id || tx.orderId || null,
              quantity: tx.quantity || order?.quantity || tx.metadata?.quantity || null,
              unitPrice: tx.unitPrice || order?.unitPrice || tx.metadata?.unitPrice || null,
              totalPrice: order?.totalPrice || tx.metadata?.totalAmount || null,
              artisanEarnings: order?.artisanEarnings || null,
              adminCommission: order?.adminCommission || tx.amount || null,
              commissionRate: order?.commissionRate || tx.metadata?.commissionRate || null,
              paymentRef: tx.paymentRef || order?.paymentRef || null,
              paymentGatewayId,
              paymentMethod: order?.paymentMethod || 'chapa',
              paymentDate: order?.paymentDate || tx.metadata?.completedAt || tx.createdAt,
              orderStatus: order?.status || tx.metadata?.orderStatus || null,
              paymentStatus: order?.paymentStatus || tx.metadata?.paymentStatus || null,
              shippingAddress: order?.shippingAddress || null,
            },
          };
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin wallet:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}