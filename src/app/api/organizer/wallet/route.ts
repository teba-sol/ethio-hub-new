import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
import { verifyToken } from '@/services/auth.service';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const tokenResult = await verifyToken(token);
    if (!tokenResult.valid || !tokenResult.payload?.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = tokenResult.payload.userId as string;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const wallet = await Wallet.findOne({ userId: userObjectId, userRole: 'organizer' }).lean();
    
    if (!wallet) {
      return NextResponse.json({
        success: true,
        data: {
          wallet: {
            pendingBalance: 0,
            availableBalance: 0,
            lifetimeEarned: 0,
            lifetimePaidOut: 0,
            lifetimeRefunded: 0,
            currency: 'ETB',
          },
          transactions: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        },
      });
    }

    const [transactions, total] = await Promise.all([
      Transaction.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'orderId',
          select: 'tourist product artisan quantity unitPrice totalPrice adminCommission artisanEarnings commissionRate currency status paymentStatus paymentRef paymentReference paymentMethod paymentDate contactInfo shippingAddress createdAt',
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
      Transaction.countDocuments({ userId: userObjectId }),
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
          pendingBalance: wallet.pendingBalance || 0,
          availableBalance: wallet.availableBalance || 0,
          lifetimeEarned: wallet.lifetimeEarned || 0,
          lifetimePaidOut: wallet.lifetimePaidOut || 0,
          lifetimeRefunded: wallet.lifetimeRefunded || 0,
          currency: wallet.currency || 'ETB',
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
    console.error('Error fetching organizer wallet:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}