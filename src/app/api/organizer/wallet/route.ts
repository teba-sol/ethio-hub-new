import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
import { verifyToken } from '@/services/auth.service';
import mongoose from 'mongoose';
import Booking from '@/models/booking.model';
import Festival from '@/models/festival.model';
import User from '@/models/User';

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
    if (!tokenResult || !tokenResult.valid || !tokenResult.payload?.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = tokenResult.payload.userId as string;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Process pending balances that should be cleared (Lazy Update)
    const now = new Date();

    // Find festivals that have ended
    const endedFestivals = await Festival.find({
      organizer: userObjectId,
      endDate: { $lt: now }
    }).select('_id');

    const endedFestivalIds = endedFestivals.map(f => f._id);

    if (endedFestivalIds.length > 0) {
      // Find uncleared bookings for these festivals
      const unclearedBookings = await Booking.find({
        festival: { $in: endedFestivalIds },
        paymentStatus: 'paid',
        isEarningsCleared: { $ne: true }
      });

      if (unclearedBookings.length > 0) {
        let totalTicketEarningsToClear = 0;
        let totalAdminToClear = 0;
        const bookingIdsToUpdate: any[] = [];

        for (const booking of unclearedBookings) {
          // Only move the ticket portion (90% of ticket price)
          // The provider funds (85%) and organizer service commission (5%) were already moved to available at booking time
          const ticketPortion = (booking.ticketPrice || 0) * 0.90;
          totalTicketEarningsToClear += ticketPortion;
          totalAdminToClear += booking.platformFee || 0;
          bookingIdsToUpdate.push(booking._id);
        }

        // Update Organizer Wallet
        await Wallet.findOneAndUpdate(
          { userId: userObjectId, userRole: 'organizer' },
          {
            $inc: {
              pendingBalance: -totalTicketEarningsToClear,
              availableBalance: totalTicketEarningsToClear
              // lifetimeEarned was already updated at booking time
            }
          },
          { upsert: true }
        );

        // Update Admin Wallet (Find Admin)
        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
          await Wallet.findOneAndUpdate(
            { userId: adminUser._id, userRole: 'admin' },
            {
              $inc: {
                pendingBalance: -totalAdminToClear,
                availableBalance: totalAdminToClear,
                lifetimeEarned: totalAdminToClear
              }
            },
            { upsert: true }
          );
        }

        // Mark bookings as cleared
        await Booking.updateMany(
          { _id: { $in: bookingIdsToUpdate } },
          { $set: { isEarningsCleared: true } }
        );
      }
    }

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
          select: 'tourist festival organizer quantity totalPrice adminCommission organizerEarnings commissionRate currency status paymentStatus paymentRef paymentMethod paymentDate contactInfo bookingDetails providerAmount hotelFee transportFee createdAt',
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
          thirdPartyAvailableBalance: wallet.thirdPartyAvailableBalance || 0,
          thirdPartyPaidOut: wallet.thirdPartyPaidOut || 0,
          hotelAvailableBalance: wallet.hotelAvailableBalance || 0,
          hotelPaidOut: wallet.hotelPaidOut || 0,
          transportAvailableBalance: wallet.transportAvailableBalance || 0,
          transportPaidOut: wallet.transportPaidOut || 0,
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
            providerAmount: booking?.providerAmount || 0,
            hotelFee: booking?.hotelFee || 0,
            transportFee: booking?.transportFee || 0,
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
              providerAmount: booking?.providerAmount || 0,
              hotelFee: booking?.hotelFee || 0,
              transportFee: booking?.transportFee || 0,
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