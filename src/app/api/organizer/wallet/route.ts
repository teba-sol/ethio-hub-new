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

    const tokenResult: any = await verifyToken(token);
    if (!tokenResult || !tokenResult.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = tokenResult.userId as string;
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
          path: 'bookingId',
          select: 'tourist festival organizer quantity totalPrice adminCommission organizerEarnings commissionRate currency status paymentStatus paymentRef paymentMethod paymentDate contactInfo bookingDetails createdAt',
          populate: [
            {
              path: 'tourist',
              select: 'name email phone',
            },
            {
              path: 'festival',
              select: 'name locationName',
            },
            {
              path: 'organizer',
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

    const getBooking = (tx: any) => {
      if (tx.bookingId && typeof tx.bookingId === 'object') return tx.bookingId;
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
          const booking = getBooking(tx);
          const product = getProduct(tx);

          const tourist = (order?.tourist || booking?.tourist) && typeof (order?.tourist || booking?.tourist) === 'object' ? (order?.tourist || booking?.tourist) : null;

          const artisanFromOrder = order?.artisan && typeof order.artisan === 'object' ? order.artisan : null;
          const artisanFromProduct = product?.artisanId && typeof product.artisanId === 'object' ? product.artisanId : null;
          const artisan = artisanFromOrder || artisanFromProduct;

          const organizer = booking?.organizer && typeof booking.organizer === 'object' ? booking.organizer : null;

          const contactInfo = order?.contactInfo || booking?.contactInfo || {};
          const paymentGatewayId = tx.metadata?.paymentGatewayId || order?.paymentReference || booking?.paymentReference || null;

          return {
            id: tx._id,
            type: tx.type,
            amount: tx.amount,
            currency: tx.currency,
            status: tx.status,
            paymentRef: tx.paymentRef,
            createdAt: tx.createdAt,
            orderId: order?._id || tx.orderId,
            bookingId: booking?._id || tx.bookingId,
            productId: product?._id || tx.productId || tx.metadata?.productId || order?.product || null,
            productName: product?.name || (booking?.festival ? `Festival: ${booking.festival.name}` : null),
            artisanName: artisan?.name || organizer?.name || tx.metadata?.artisanId || tx.metadata?.organizerId || null,
            quantity: tx.quantity || order?.quantity || booking?.quantity || tx.metadata?.quantity || null,
            unitPrice: tx.unitPrice || order?.unitPrice || (booking ? booking.totalPrice / booking.quantity : null) || tx.metadata?.unitPrice || null,
            details: {
              touristFullName: contactInfo.fullName || tourist?.name || tx.metadata?.touristFullName || 'N/A',
              touristEmail: contactInfo.email || tourist?.email || tx.metadata?.touristEmail || 'N/A',
              touristPhone: contactInfo.phone || tourist?.phone || tourist?.touristProfile?.phone || tx.metadata?.touristPhone || null,
              artisanFullName: artisan?.name || organizer?.name || tx.metadata?.artisanName || tx.metadata?.artisanFullName || 'N/A',
              artisanEmail: artisan?.email || organizer?.email || tx.metadata?.artisanEmail || 'N/A',
              artisanPhone: artisan?.phone || organizer?.phone || tx.metadata?.artisanPhone || null,
              artisanId: artisan?._id || organizer?._id || order?.artisan || booking?.organizer || product?.artisanId || tx.metadata?.artisanId || null,
              productId: product?._id || tx.productId || tx.metadata?.productId || order?.product || null,
              productName: product?.name || (booking?.festival ? booking.festival.name : null),
              productSku: product?.sku || tx.metadata?.productSku || null,
              productCategory: product?.category || (booking ? 'Festival' : null) || tx.metadata?.productCategory || null,
              orderId: order?._id || tx.orderId || null,
              bookingId: booking?._id || tx.bookingId || null,
              quantity: tx.quantity || order?.quantity || booking?.quantity || tx.metadata?.quantity || null,
              unitPrice: tx.unitPrice || order?.unitPrice || (booking ? booking.totalPrice / booking.quantity : null) || tx.metadata?.unitPrice || null,
              totalPrice: order?.totalPrice || booking?.totalPrice || tx.metadata?.totalAmount || null,
              artisanEarnings: order?.artisanEarnings || booking?.organizerEarnings || tx.amount || null,
              adminCommission: order?.adminCommission || booking?.adminCommission || (booking?.totalPrice ? (booking.totalPrice - tx.amount) : (order?.totalPrice ? (order.totalPrice - tx.amount) : 0)),
              commissionRate: order?.commissionRate || booking?.commissionRate || tx.metadata?.commissionRate || null,
              paymentRef: tx.paymentRef || order?.paymentRef || booking?.paymentRef || null,
              paymentGatewayId,
              paymentMethod: order?.paymentMethod || booking?.paymentMethod || 'chapa',
              paymentDate: order?.paymentDate || booking?.paymentDate || tx.metadata?.completedAt || tx.createdAt,
              orderStatus: order?.status || booking?.status || tx.metadata?.orderStatus || null,
              paymentStatus: order?.paymentStatus || booking?.paymentStatus || tx.metadata?.paymentStatus || null,
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