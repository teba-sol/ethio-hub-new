import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wallet from '@/models/wallet.model';
import Product from '@/models/product.model';
import User from '@/models/User';
import '@/models/artisan/product.model';
import '@/models/order.model';
import '@/models/booking.model';
import '@/models/festival.model';
import Transaction from '@/models/transaction.model';
import mongoose from 'mongoose';

Product; // Ensure Product model is registered

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const role = searchParams.get('role'); // 'artisan' or 'organizer'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
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

    // Build filter (include both commissions and shipping fees)
    const filter: any = { type: { $in: ['ADMIN_COMMISSION', 'SHIPPING_FEE'] } };
    if (role && role !== 'all') {
      filter['metadata.role'] = role;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Get separate totals for artisan and organizer (COMPLETED only = Total Earned)
    const [artisanTotal, organizerTotal] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'ADMIN_COMMISSION', 'metadata.role': 'artisan', status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'ADMIN_COMMISSION', 'metadata.role': 'organizer', status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Get transactions (all admin commission transactions)
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
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
          select: 'name sku category artisan',
          populate: {
            path: 'artisan',
            select: 'name email phone',
          },
        })
        .populate('userId', 'name email')
        .lean(),
      Transaction.countDocuments(filter),
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
          pendingBalance: adminWallet.pendingBalance || 0,
          availableBalance: adminWallet.availableBalance || 0,
          lifetimeEarned: adminWallet.lifetimeEarned || 0,
          lifetimePaidOut: adminWallet.lifetimePaidOut || 0,
          lifetimeRefunded: adminWallet.lifetimeRefunded || 0,
          shippingFeesReceived: adminWallet.shippingFeesReceived || 0,
          currency: adminWallet.currency || 'ETB',
          artisanTotalEarned: artisanTotal[0]?.total || 0,
          organizerTotalEarned: organizerTotal[0]?.total || 0,
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
            role: tx.metadata?.role || (booking ? 'organizer' : 'artisan'),
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
              artisanEarnings: order?.artisanEarnings || booking?.organizerEarnings || (booking?.totalPrice ? (booking.totalPrice - tx.amount) : (order?.totalPrice ? (order.totalPrice - tx.amount) : 0)),
              adminCommission: order?.adminCommission || booking?.adminCommission || tx.amount || null,
              commissionRate: order?.commissionRate || booking?.commissionRate || tx.metadata?.commissionRate || null,
              paymentRef: tx.paymentRef || order?.paymentRef || booking?.paymentRef || null,
              paymentGatewayId,
              paymentMethod: order?.paymentMethod || booking?.paymentMethod || 'chapa',
              paymentDate: order?.paymentDate || booking?.paymentDate || tx.metadata?.completedAt || tx.createdAt,
              orderStatus: order?.status || booking?.status || tx.metadata?.orderStatus || null,
              paymentStatus: order?.paymentStatus || booking?.paymentStatus || tx.metadata?.paymentStatus || null,
              shippingAddress: order?.shippingAddress || null,
              role: tx.metadata?.role || (booking ? 'organizer' : 'artisan'),
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