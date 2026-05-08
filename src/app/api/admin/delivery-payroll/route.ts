import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import DeliveryLog from '@/models/DeliveryLog';
import Wallet from '@/models/wallet.model';
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
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get all delivery guys
    const deliveryGuys = await User.find({ role: 'delivery' }).select('name email deliveryProfile').lean();

    const payrollData = await Promise.all(deliveryGuys.map(async (guy) => {
      // Get monthly logs (current month)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const logs = await DeliveryLog.find({
        deliveryGuyId: guy._id,
        deliveredAt: { $gte: firstDayOfMonth }
      }).lean();

      const totalTrips = logs.length;
      const totalFees = logs.reduce((sum, log) => sum + (log.shippingFee || 0), 0);
      const driverShare = Math.round(totalFees * 0.8 * 100) / 100;
      const adminShare = Math.round(totalFees * 0.2 * 100) / 100;

      const wallet = await Wallet.findOne({ userId: guy._id });

      return {
        _id: guy._id,
        name: guy.name,
        email: guy.email,
        tripsCompleted: totalTrips,
        totalFeesCollected: totalFees,
        driverShare,
        adminShare,
        walletBalance: wallet?.availableBalance || 0,
      };
    }));

    return NextResponse.json({
      success: true,
      payroll: payrollData,
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { deliveryGuyId } = await req.json();
    if (!deliveryGuyId) {
      return NextResponse.json({ message: 'Delivery Guy ID is required' }, { status: 400 });
    }

    const wallet = await Wallet.findOne({ userId: deliveryGuyId });
    if (!wallet || wallet.availableBalance <= 0) {
      return NextResponse.json({ message: 'No balance available for payout' }, { status: 400 });
    }

    // In a real system, you'd trigger a bank transfer here
    // For now, we'll reset the available balance and log it as paid out
    const amountToPay = wallet.availableBalance;
    wallet.availableBalance = 0;
    wallet.lifetimePaidOut += amountToPay;
    await wallet.save();

    return NextResponse.json({
      success: true,
      message: `Payout of ETB ${amountToPay.toLocaleString()} processed successfully`,
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
