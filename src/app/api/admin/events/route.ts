import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Festival from '@/models/festival.model';
import Booking from '@/models/booking.model';
import User from '@/models/User';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    if (!db) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Database not connected' }),
        { status: 503, headers: { 'content-type': 'application/json' } }
      );
    }

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jwtVerify(token, secret);
    const adminRole = payload.role as string;

    if (adminRole !== 'admin') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Admin access required' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let statusFilter: string[] = ['Pending Approval', 'Under Review', 'Approved', 'Rejected'];

    if (status && status !== 'All') {
      const statusMap: Record<string, string> = {
        'Pending Approval': 'Pending Approval',
        'Under Review': 'Under Review',
        'Approved': 'Approved',
        'Rejected': 'Rejected',
      };
      if (statusMap[status]) {
        statusFilter = [statusMap[status]];
      }
    }

    const query: any = {};

    if (status && status !== 'All') {
      const statusMap: Record<string, string> = {
        'Pending Approval': 'Pending Approval',
        'Under Review': 'Under Review',
        'Approved': 'Approved',
        'Rejected': 'Rejected',
      };
      if (statusMap[status]) {
        query.verificationStatus = statusMap[status];
      }
    } else {
      // Default: Fetch everything that might be relevant for management or verification
      query.verificationStatus = { $in: ['Pending Approval', 'Under Review', 'Approved', 'Rejected'] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    // Ensure we also include Published/Completed events even if they don't match the verificationStatus filter
    // (though they should normally be 'Approved')
    const festivals = await Festival.find({
      $or: [
        query,
        { status: { $in: ['Published', 'Completed'] } }
      ]
    })
      .populate('organizer', 'name email')
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();

    // Fetch ALL bookings for the found festivals
    const festivalIds = festivals.map(f => f._id);
    const festivalIdsStrings = festivals.map(f => f._id.toString());
    
    const bookings = await Booking.find({ 
      $or: [
        { festival: { $in: festivalIds } },
        { festival: { $in: festivalIdsStrings } }
      ]
    })
      .populate('tourist', 'name email avatar image')
      .sort({ createdAt: -1 })
      .lean();

    // Group bookings by festival ID
    const bookingsByFestival = bookings.reduce((acc, booking) => {
      if (!booking.festival) return acc;
      
      const festivalId = booking.festival.toString();
      if (!acc[festivalId]) {
        acc[festivalId] = {
          booked: 0,
          revenue: 0,
          bookings: []
        };
      }
      
      const quantity = Number(booking.quantity || 0);
      const totalPrice = Number(booking.totalPrice || 0);
      
      acc[festivalId].booked += quantity;
      if (booking.paymentStatus === 'paid') {
        acc[festivalId].revenue += totalPrice;
      }
      
      acc[festivalId].bookings.push({
        id: booking._id.toString(),
        user: (booking.tourist as any)?.name || booking.contactInfo?.fullName || 'Guest User',
        userImage: (booking.tourist as any)?.avatar || (booking.tourist as any)?.image || undefined,
        email: (booking.tourist as any)?.email || booking.contactInfo?.email || 'N/A',
        date: booking.createdAt ? new Date(booking.createdAt).toISOString().split('T')[0] : 'N/A',
        quantity: quantity,
        totalPaid: totalPrice,
        paymentMethod: booking.paymentMethod || 'Other',
        paymentStatus: booking.paymentStatus === 'paid' ? 'Paid' : (booking.paymentStatus === 'refunded' ? 'Refunded' : 'Paid'),
        transactionId: booking.paymentRef || booking._id.toString().slice(-8),
        accommodation: booking.bookingDetails?.room ? {
          hotel: booking.bookingDetails.room.hotelName,
          roomType: booking.bookingDetails.room.roomName
        } : undefined
      });
      
      return acc;
    }, {} as Record<string, any>);

    const requests = festivals.map((festival: any) => {
      const festivalId = festival._id.toString();
      const stats = bookingsByFestival[festivalId] || { booked: 0, revenue: 0, bookings: [] };

      // Helper to handle bilingual fields that might come as {en, am} objects
      const getText = (field: any, fallback: string = ''): string => {
        if (!field) return fallback;
        if (typeof field === 'string') return field;
        if (typeof field === 'object') {
          return field.en || field.am || fallback;
        }
        return String(field);
      };

      return {
        id: festivalId,
        eventId: festivalId,
        title: getText(festival.name) || getText(festival.name_en) || 'Untitled Event',
        description: getText(festival.shortDescription) || getText(festival.fullDescription) || '',
        bannerImage: festival.coverImage,
        images: festival.gallery || [],
        location: {
          venue: getText(festival.location?.name) || getText(festival.location?.name_en) || '',
          city: getText(festival.location?.address) || getText(festival.location?.name_am) || '',
        },
        date: festival.startDate,
        time: '09:00',
        ticketTypes: (festival.ticketTypes || []).map((t: any) => ({
          ...t,
          name: getText(t.name) || getText(t.name_en) || 'Ticket'
        })),
        vipTicketPrice: festival.pricing?.vipPrice || 0,
        ticketPrice: festival.pricing?.basePrice || 0,
        capacity: festival.totalCapacity || festival.capacity || 0,
        booked: stats.booked,
        revenue: stats.revenue,
        bookings: stats.bookings,
        schedule: (festival.schedule || []).map((s: any) => ({
          time: `Day ${s.day}`,
          activity: getText(s.title_en) || getText(s.title) || 'Activity'
        })),
        hotels: (festival.hotels || []).map((h: any) => ({
          name: getText(h.name_en) || getText(h.name) || 'Hotel',
          distance: getText(h.address) || 'N/A',
          price: `ETB ${h.rooms?.[0]?.pricePerNight || 0}/night`
        })),
        transportation: (festival.transportation || []).map((t: any) => ({
          type: getText(t.type_en) || getText(t.type) || 'Transport',
          provider: t.provider || 'Provider',
          details: getText(t.description_en) || getText(t.description) || 'No details'
        })),
        services: [
          ...(festival.services?.foodPackages || []).map((fp: any) => getText(fp.name_en) || getText(fp.name) || 'Food Package'),
          ...(festival.services?.culturalServices || []),
          ...(festival.services?.specialAssistance || []),
          ...(festival.services?.extras || [])
        ],
        policies: [
          getText(festival.policies?.cancellation),
          getText(festival.policies?.terms),
          getText(festival.policies?.safety),
          getText(festival.policies?.ageRestriction)
        ].filter(Boolean),
        commissionRate: festival.pricing?.commissionRate || 10,
        submittedAt: festival.submittedAt || festival.createdAt,
        reviewedAt: festival.reviewedAt,
        status: festival.status || 'Draft', // Operational status: Draft, Published, Completed, Cancelled
        verificationStatus: mapVerificationStatus(festival.verificationStatus),
        organizer: {
          id: festival.organizer?._id?.toString() || '',
          name: festival.organizer?.name || 'Unknown',
          email: festival.organizer?.email || '',
          role: 'Organizer',
        },
        organizerName: festival.organizer?.name || 'Unknown',
        organizerEmail: festival.organizer?.email || '',
        createdAt: festival.createdAt,
        updatedAt: festival.updatedAt,
      };
    });

    return new NextResponse(
      JSON.stringify({ success: true, requests }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching event verification requests:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

function mapVerificationStatus(status: string): string {
  const map: Record<string, string> = {
    'Draft': 'draft',
    'Pending Approval': 'pending_approval',
    'Under Review': 'under_review',
    'Approved': 'approved',
    'Rejected': 'rejected',
  };
  return map[status] || 'draft';
}