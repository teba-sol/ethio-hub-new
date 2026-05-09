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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

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
      query.verificationStatus = { $in: ['Pending Approval', 'Under Review', 'Approved', 'Rejected'] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    // Use projection to fetch only necessary fields for the list view
    const festivals = await Festival.find({
      $or: [
        query,
        { status: { $in: ['Published', 'Completed'] } }
      ]
    })
      .select('name name_en shortDescription coverImage gallery location startDate totalCapacity capacity pricing submittedAt createdAt updatedAt status verificationStatus organizer')
      .populate('organizer', 'name email')
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const requests = festivals.map((festival: any) => {
      const festivalId = festival._id.toString();

      // Helper to handle bilingual fields
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
        description: getText(festival.shortDescription) || '',
        bannerImage: festival.coverImage,
        images: festival.gallery || [],
        location: {
          venue: getText(festival.location?.name) || getText(festival.location?.name_en) || '',
          city: getText(festival.location?.address) || getText(festival.location?.name_am) || '',
        },
        date: festival.startDate,
        time: '09:00', // Default if not in schema
        ticketTypes: (festival.ticketTypes || []).map((t: any) => ({
          ...t,
          name: getText(t.name) || getText(t.name_en) || 'Ticket'
        })),
        vipTicketPrice: festival.pricing?.vipPrice || 0,
        ticketPrice: festival.pricing?.basePrice || 0,
        capacity: festival.totalCapacity || festival.capacity || 0,
        // Removed heavy bookings fetch for list view to improve performance
        booked: 0, 
        revenue: 0,
        bookings: [],
        commissionRate: festival.pricing?.commissionRate || 10,
        submittedAt: festival.submittedAt || festival.createdAt,
        status: festival.status || 'Draft',
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
      JSON.stringify({ 
        success: true, 
        requests,
        pagination: {
          page,
          limit,
          hasMore: requests.length >= limit
        }
      }),
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