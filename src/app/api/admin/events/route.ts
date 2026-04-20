import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Festival from '@/models/festival.model';
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

    const query: any = {
      verificationStatus: { $in: statusFilter },
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const festivals = await Festival.find(query)
      .populate('organizer', 'name email')
      .sort({ submittedAt: -1 })
      .lean();

     const requests = festivals.map((festival: any) => ({
       id: festival._id.toString(),
       eventId: festival._id.toString(),
       title: festival.name,
       description: festival.shortDescription,
       bannerImage: festival.coverImage,
       images: festival.gallery || [],
       location: {
         venue: festival.location?.name || '',
         city: festival.location?.address || '',
       },
       date: festival.startDate,
       time: '09:00',
       ticketTypes: festival.pricing ? [
         { name: 'Regular', price: festival.pricing?.regularPrice || 500, quantity: 1000 },
         { name: 'VIP', price: festival.pricing?.vipPrice || 1500, quantity: 100 }
       ] : [],
       vipTicketPrice: festival.pricing?.vipPrice || 1500,
       capacity: festival.capacity || 1000,
       schedule: festival.schedule || [],
       hotels: Array.isArray(festival.hotels) ? festival.hotels : [],
       transportation: Array.isArray(festival.transportation) ? festival.transportation : [],
       services: festival.services || { foodPackages: [], culturalServices: [], specialAssistance: [], extras: [] },
       policies: Array.isArray(festival.policies) ? festival.policies : [],
       termsAndConditions: festival.policies?.terms || 'No refunds within 24 hours. Alcohol prohibited.',
       commissionRate: festival.pricing?.commissionRate || 10,
       bankDetails: festival.bankDetails || {
         bankName: 'Commercial Bank of Ethiopia',
         accountNumber: '1000123456789',
         accountName: festival.organizer?.name || ''
       },
       submittedAt: festival.submittedAt || festival.createdAt,
       resubmittedAt: undefined,
       reviewedAt: festival.reviewedAt,
       status: mapVerificationStatus(festival.verificationStatus),
       documents: festival.documents || [],
       riskBadges: festival.riskBadges || [],
       verificationHistory: festival.verificationHistory || [],
       decisionReason: festival.rejectionReason || '',
       organizer: {
         id: festival.organizer?._id?.toString() || '',
         name: festival.organizer?.name || 'Unknown',
         email: festival.organizer?.email || '',
         role: 'Organizer',
         isVerified: festival.isVerified || false,
         pastEvents: festival.pastEvents || 0,
         cancellationRate: festival.cancellationRate || '0%',
         totalRevenue: festival.totalRevenue || 0,
         reportHistory: festival.reportHistory || 0,
         joinedDate: festival.joinedDate || '',
         status: festival.status || 'Active',
       },
       eventName: festival.name,
       shortDescription: festival.shortDescription,
       startDate: festival.startDate,
       endDate: festival.endDate,
       locationName: festival.location?.name || '',
       organizerName: festival.organizer?.name || 'Unknown',
       organizerEmail: festival.organizer?.email || '',
       organizerId: festival.organizer?._id?.toString() || '',
       verificationStatus: mapVerificationStatus(festival.verificationStatus),
       rejectionReason: festival.rejectionReason || '',
       createdAt: festival.createdAt,
     }));

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