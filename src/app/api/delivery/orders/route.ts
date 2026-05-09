import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';
import User from '@/models/User';
import Wallet from '@/models/wallet.model';
import DeliveryLog from '@/models/DeliveryLog';
import Transaction from '@/models/transaction.model';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET as string;

async function getAuthenticatedUser(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sessionToken')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const user = await User.findById((payload as any).userId).select('-password');
    return user;
  } catch (error) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    
    const deliveryGuy = await getAuthenticatedUser(req);
    if (!deliveryGuy || deliveryGuy.role !== 'delivery' || deliveryGuy.deliveryStatus !== 'Approved') {
      return NextResponse.json({ message: 'Unauthorized or verification pending' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    const query: any = { assignedDeliveryGuy: deliveryGuy._id };
    if (status) {
      query.status = status;
    }

    const ordersRaw = await Order.find(query)
      .populate('tourist', 'name email phone')
      .populate('product', 'name images price description')
      .populate('artisan', 'name phone')
      .sort({ createdAt: -1 })
      .lean();

    const orders = await Promise.all(ordersRaw.map(async (order: any) => {
      const ArtisanProfile = (await import('@/models/artisan/artisanProfile.model')).default;
      const artisanProfile = await ArtisanProfile.findOne({ userId: order.artisan._id });
      return {
        ...order,
        artisan: {
          ...order.artisan,
          businessName: artisanProfile?.businessName || order.artisan.name,
          address: artisanProfile?.address || 'Address not provided',
          city: artisanProfile?.city || '',
          latitude: artisanProfile?.latitude,
          longitude: artisanProfile?.longitude,
        }
      };
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTrips = await Order.countDocuments({
      assignedDeliveryGuy: deliveryGuy._id,
      status: 'Delivered',
      updatedAt: { $gte: today },
    });

    const pendingPickups = await Order.countDocuments({
      assignedDeliveryGuy: deliveryGuy._id,
      status: { $in: ['Assigned', 'Shipped'] },
    });

    const wallet = await Wallet.findOne({ userId: deliveryGuy._id });

    const deliveryLogs = await DeliveryLog.find({
      deliveryGuyId: deliveryGuy._id,
    })
      .sort({ deliveredAt: -1 })
      .limit(10)
      .lean();

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyTrips = await DeliveryLog.countDocuments({
      deliveryGuyId: deliveryGuy._id,
      deliveredAt: { $gte: thisMonth },
    });

    const monthlyEarningsAgg = await DeliveryLog.aggregate([
      {
        $match: {
          deliveryGuyId: deliveryGuy._id,
          deliveredAt: { $gte: thisMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalShippingFees: { $sum: '$shippingFee' },
        },
      },
    ]);
    const monthlyEarnings = (monthlyEarningsAgg[0]?.totalShippingFees || 0) * 0.8;

    const dailyEarningsAgg = await DeliveryLog.aggregate([
      {
        $match: {
          deliveryGuyId: deliveryGuy._id,
          deliveredAt: { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          totalShippingFees: { $sum: '$shippingFee' },
        },
      },
    ]);
    const dailyEarnings = (dailyEarningsAgg[0]?.totalShippingFees || 0) * 0.8;

    // Get recent withdrawal transactions (payment receipts)
    const recentWithdrawals = await Transaction.find({
      userId: deliveryGuy._id,
      type: 'WITHDRAWAL',
      status: 'COMPLETED'
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      success: true,
      orders,
      stats: {
        todayTrips,
        pendingPickups,
        totalDeliveries: wallet?.deliveryTripsCompleted || deliveryGuy.deliveryProfile?.totalDeliveries || 0,
        dailyEarnings,
        monthlyTrips,
        monthlyEarnings,
        totalEarnings: wallet?.deliveryEarnings || 0,
      },
      recentDeliveries: deliveryLogs,
      recentWithdrawals: recentWithdrawals.map(tw => ({
        _id: tw._id,
        amount: tw.amount,
        date: tw.createdAt,
        reference: tw.paymentRef,
        method: tw.metadata?.withdrawalMethod || 'Transfer',
        phone: tw.metadata?.phoneNumber
      }))
    });
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
