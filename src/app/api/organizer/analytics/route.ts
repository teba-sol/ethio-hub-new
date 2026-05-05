import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Festival from '../../../../models/festival.model';
import Booking from '../../../../models/booking.model';
import Review from '../../../../models/review.model';
import User from '../../../../models/User';
import * as jose from 'jose';

// Define types for better TypeScript support
interface Alert {
  id: string;
  type: 'booking' | 'review';
  message: string;
  time: Date;
}

interface MostBookedEvent {
  id: any;
  name: string;
  coverImage: any;
  bookings: number;
}

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

    // Fetch all bookings related to the organizer's festivals OR explicitly assigned to the organizer
    const bookings = await Booking.find({ 
      $or: [
        { organizer: organizerId },
        { festival: { $in: festivalIds } }
      ]
    }).populate('tourist', 'touristProfile name email');
    
    const reviews = await Review.find({ organizer: organizerId });

    const totalFestivals = festivals.length;
    const publishedFestivals = festivals.filter(f => f.status === 'Published').length;
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    
    // Calculate revenue with split payment breakdown
    const paidBookings = bookings.filter(b => b.paymentStatus === 'paid');
    const grossRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const platformFeeTotal = paidBookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);
    const organizerEarnings = paidBookings.reduce((sum, b) => sum + (b.organizerAmount || b.totalPrice), 0);

    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    const recentBookings = await Booking.find({ 
      $or: [
        { organizer: organizerId },
        { festival: { $in: festivalIds } }
      ]
    })
      .populate('tourist', 'name email touristProfile')
      .populate('festival', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Latest Alerts: Recent Bookings + Recent Reviews
    const latestAlerts: Alert[] = [];
    
    // Add bookings to alerts
    recentBookings.forEach(b => {
      const festivalName = (b.festival as any)?.name || 'your event';
      const touristName = (b.tourist as any)?.name || 'a tourist';
      latestAlerts.push({
        id: `booking-${b._id}`,
        type: 'booking',
        message: `New booking for ${festivalName} from ${touristName}`,
        time: b.createdAt,
      });
    });

    // Add reviews to alerts
    const recentReviews = await Review.find({ organizer: organizerId })
      .populate('tourist', 'name')
      .populate('festival', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    recentReviews.forEach(r => {
      const festivalName = (r.festival as any)?.name || 'your event';
      latestAlerts.push({
        id: `review-${r._id}`,
        type: 'review',
        message: `${r.rating}-star review on ${festivalName}`,
        time: r.createdAt,
      });
    });

    // Sort alerts by time
    latestAlerts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // 7-Day Booking Trend
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().slice(0, 10));
    }

    const bookingsByDay: Record<string, number> = {};
    last7Days.forEach(day => {
      bookingsByDay[day] = 0;
    });

    bookings.forEach(b => {
      const day = new Date(b.createdAt).toISOString().slice(0, 10);
      if (bookingsByDay[day] !== undefined) {
        bookingsByDay[day]++;
      }
    });

    // Top Visitor Locations
    const locationCounts: Record<string, number> = {};
    let totalLocationBookings = 0;
 
    for (const b of bookings) {
      const country = (b.tourist as any)?.touristProfile?.country || 'Unknown';
      locationCounts[country] = (locationCounts[country] || 0) + 1;
      totalLocationBookings++;
    }

    const visitorLocations = Object.entries(locationCounts)
      .map(([country, count]) => ({
        country,
        percentage: totalLocationBookings > 0 ? Math.round((count / totalLocationBookings) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4);

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

    // Most Booked Event
    const bookingCountsByFestival: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.festival) {
        const festivalId = b.festival.toString();
        // Count total tickets sold (quantity) instead of just booking count
        bookingCountsByFestival[festivalId] = (bookingCountsByFestival[festivalId] || 0) + (b.quantity || 1);
      }
    });

    let mostBookedFestivalId = '';
    let maxTickets = 0;
    Object.entries(bookingCountsByFestival).forEach(([id, count]) => {
      if (count > maxTickets) {
        maxTickets = count;
        mostBookedFestivalId = id;
      }
    });

    let mostBookedEvent: MostBookedEvent | null = null;
    if (mostBookedFestivalId) {
      // Find the festival from our already fetched list or from DB
      const festival = festivals.find(f => f._id.toString() === mostBookedFestivalId) || 
                       await Festival.findById(mostBookedFestivalId);
      
      if (festival) {
        mostBookedEvent = {
          id: festival._id,
          name: festival.name || festival.name_en || 'Unnamed Festival',
          coverImage: festival.coverImage,
          bookings: maxTickets,
        };
      }
    }

    // Format recentBookings for response
    const formattedRecentBookings = recentBookings.map(booking => ({
      _id: booking._id,
      tourist: booking.tourist,
      festival: booking.festival,
      status: booking.status,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt,
    }));

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
            gross: grossRevenue,
            platformFee: platformFeeTotal,
            net: organizerEarnings,
            currency: 'ETB',
          },
          reviews: {
            total: reviews.length,
            avgRating: Math.round(avgRating * 10) / 10,
            approved: reviews.filter(r => r.isApproved).length,
            pending: reviews.filter(r => !r.isApproved).length,
          },
          recentBookings: formattedRecentBookings,
          latestAlerts: latestAlerts.slice(0, 5),
          visitorLocations,
          mostBookedEvent,
          charts: {
            bookingsByMonth,
            revenueByMonth,
            bookingsByDay,
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