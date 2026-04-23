import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Booking from '../../../../models/booking.model';
import Festival from '../../../../models/festival.model';
import { jwtVerify } from 'jose';

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
    const { payload } = await jwtVerify(token, secret);
    const organizerId = payload.userId as string;

    const festivals = await Festival.find({ organizer: organizerId });
    const festivalIds = festivals.map(f => f._id);

    const bookings = await Booking.find({ 
      organizer: organizerId,
      festival: { $in: festivalIds }
    });

    const paidBookings = bookings.filter(b => b.paymentStatus === 'paid');
    
    const grossSales = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const commission = paidBookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);
    const commissionRate = 0.10;

    const refunds = bookings
      .filter(b => b.paymentStatus === 'refunded')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const pendingRevenue = bookings
      .filter(b => b.paymentStatus === 'pending')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const paidOut = grossSales - commission - refunds;
    const netRevenue = grossSales - commission - refunds;

    const eventRevenue: any[] = await Promise.all(
      festivals.map(async (festival) => {
        const eventBookings = await Booking.find({ 
          festival: festival._id,
          organizer: organizerId 
        });

        const eventPaidBookings = eventBookings.filter(b => b.paymentStatus === 'paid');
        const eventGross = eventPaidBookings.reduce((sum, b) => sum + b.totalPrice, 0);
        const eventCommission = eventPaidBookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);
        
        const eventRefunds = eventBookings
          .filter(b => b.paymentStatus === 'refunded')
          .reduce((sum, b) => sum + b.totalPrice, 0);
        const eventNet = eventGross - eventCommission - eventRefunds;

        let status = 'Upcoming';
        const now = new Date();
        const startDate = new Date(festival.startDate);
        const endDate = new Date(festival.endDate);

        if (endDate < now) {
          status = 'Completed';
        } else if (startDate <= now) {
          status = 'Live';
        }

        return {
          id: festival._id,
          name: festival.name,
          status,
          gross: eventGross,
          commission: eventCommission,
          refunds: eventRefunds,
          net: eventNet,
          startDate: festival.startDate,
          endDate: festival.endDate,
        };
      })
    );

    const revenueByMonth: Record<string, { gross: number; net: number }> = {};
    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    allMonths.forEach(month => {
      revenueByMonth[month] = { gross: 0, net: 0 };
    });

    paidBookings.forEach(b => {
      const monthIndex = new Date(b.createdAt).getMonth();
      const monthName = allMonths[monthIndex];
      if (revenueByMonth[monthName]) {
        revenueByMonth[monthName].gross += b.totalPrice;
        const fee = b.platformFee || (b.totalPrice * commissionRate);
        revenueByMonth[monthName].net += b.totalPrice - fee;
      }
    });

    const revenueData = Object.entries(revenueByMonth).map(([name, data]) => ({
      name,
      gross: data.gross,
      net: data.net,
    }));

    const totalBookings = bookings.length;

    return new NextResponse(
      JSON.stringify({
        success: true,
        revenue: {
          grossSales,
          commissionRate,
          commission,
          refunds,
          pendingRevenue,
          paidOut: Math.max(0, paidOut),
          netRevenue: Math.max(0, netRevenue),
          totalBookings,
        },
        eventRevenue,
        revenueData,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching revenue:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}