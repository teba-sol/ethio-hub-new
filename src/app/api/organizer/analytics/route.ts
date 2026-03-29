import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Festival from '../../../../models/festival.model';
import Booking from '../../../../models/booking.model';
import Review from '../../../../models/review.model';
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
    const organizerId = payload.userId as string;

    if (!organizerId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Organizer ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const festivals = await Festival.find({ organizer: organizerId });
    const festivalIds = festivals.map(f => f._id);

    const bookings = await Booking.find({ organizer: organizerId });
    const reviews = await Review.find({ organizer: organizerId });

    const totalFestivals = festivals.length;
    const publishedFestivals = festivals.filter(f => f.status === 'Published').length;
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    const recentBookings = await Booking.find({ organizer: organizerId })
      .populate('tourist', 'name email')
      .populate('festival', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const bookingsByMonth: Record<string, number> = {};
    bookings.forEach(b => {
      const month = new Date(b.createdAt).toISOString().slice(0, 7);
      bookingsByMonth[month] = (bookingsByMonth[month] || 0) + 1;
    });

    const revenueByMonth: Record<string, number> = {};
    bookings
      .filter(b => b.paymentStatus === 'paid')
      .forEach(b => {
        const month = new Date(b.createdAt).toISOString().slice(0, 7);
        revenueByMonth[month] = (revenueByMonth[month] || 0) + b.totalPrice;
      });

    return new NextResponse(
      JSON.stringify({
        success: true,
        analytics: {
          festivals: {
            total: totalFestivals,
            published: publishedFestivals,
            draft: totalFestivals - publishedFestivals,
          },
          bookings: {
            total: totalBookings,
            confirmed: confirmedBookings,
            pending: bookings.filter(b => b.status === 'pending').length,
            cancelled: bookings.filter(b => b.status === 'cancelled').length,
          },
          revenue: {
            total: totalRevenue,
            currency: 'ETB',
          },
          reviews: {
            total: reviews.length,
            avgRating: Math.round(avgRating * 10) / 10,
            approved: reviews.filter(r => r.isApproved).length,
            pending: reviews.filter(r => !r.isApproved).length,
          },
          recentBookings,
          charts: {
            bookingsByMonth,
            revenueByMonth,
          },
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    console.error('Error fetching analytics:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}