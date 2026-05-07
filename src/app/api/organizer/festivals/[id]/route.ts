import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import Festival from '../../../../../models/festival.model';
import Booking from '../../../../../models/booking.model';
import * as jose from 'jose';
import { attachAvailabilityToFestival } from '../../../../../lib/festivalAvailability';
import { isFestivalCompleteForReview } from '../../../../../lib/reviewAutomation';
import { queueAdminReviewEmail } from '../../../../../lib/adminApproval';
import User from '../../../../../models/User';

import { 
  normalizeSchedule, 
  normalizeHotels, 
  normalizeTransportation, 
  normalizeServices, 
  normalizePolicies,
  normalizeTicketTypes
} from '../../../../../lib/festivalNormalization';

export async function GET(request: NextRequest) {
  let id: string | undefined;
  try {
    const { pathname } = new URL(request.url);
    id = pathname.split('/').pop();

    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Authentication required' }), { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const organizerId = payload.userId as string;

    if (!id) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Festival ID is required' }), { status: 400 });
    }

    const festival = await Festival.findOne({ _id: id, organizer: organizerId });

    if (!festival) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Festival not found or you do not have permission to view it.' }), { status: 404 });
    }

    const confirmedBookings = await Booking.find({
      festival: id,
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const festivalWithAvailability = attachAvailabilityToFestival(festival, confirmedBookings);

    return new NextResponse(JSON.stringify({ success: true, festival: festivalWithAvailability }), { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching festival by ID: ${id}`, error);
    if (error.name === 'CastError') {
        return new NextResponse(JSON.stringify({ success: false, message: 'Invalid Festival ID format.' }), { status: 400 });
    }
    return new NextResponse(JSON.stringify({ success: false, message: 'Internal Server Error' }), { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let id: string | undefined;
  try {
    const { pathname } = new URL(request.url);
    id = pathname.split('/').pop();
    const body = await request.json();

    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Authentication required' }), { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const organizerId = payload.userId as string;

    if (!id) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Festival ID is required' }), { status: 400 });
    }

    const existingFestival = await Festival.findOne({ _id: id, organizer: organizerId });
    if (!existingFestival) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Festival not found or you do not have permission to edit it.' }), { status: 404 });
    }

    const isApprovedEvent = existingFestival.verificationStatus === 'Approved';
    
    // Normalize data before update
    const isDraft = body.verificationStatus === 'Draft' || !body.verificationStatus;
    const normalizedHotels = normalizeHotels(body.hotels, isDraft);
    const normalizedTransportation = normalizeTransportation(body.transportation, isDraft);
    const normalizedSchedule = normalizeSchedule(body.schedule, isDraft);
    const normalizedServices = normalizeServices(body.services, isDraft);
    const normalizedPolicies = normalizePolicies(body.policies);

    let normalUpdate = { 
      ...body,
      hotels: normalizedHotels,
      transportation: normalizedTransportation,
      schedule: normalizedSchedule,
      services: normalizedServices,
      policies: normalizedPolicies,
      ticketTypes: normalizeTicketTypes(body.ticketTypes, isDraft)
    };

    // Use Object.assign to update existing festival and then save it.
    // This is much safer than findByIdAndUpdate for nested arrays/objects.
    Object.assign(existingFestival, normalUpdate);

    if (isApprovedEvent) {
      existingFestival.lastEditedAt = new Date();
      existingFestival.changesVersion = (existingFestival.changesVersion || 0) + 1;
      existingFestival.verificationStatus = 'Draft';
      existingFestival.status = 'Draft';
      existingFestival.isVerified = false;
      existingFestival.isEditedAfterApproval = true;
    }

    if (
      existingFestival.verificationStatus === 'Draft' &&
      isFestivalCompleteForReview(existingFestival)
    ) {
      existingFestival.verificationStatus = 'Pending Approval';
      existingFestival.submittedAt = new Date();

      const organizer = await User.findById(organizerId).select('name email');
      await queueAdminReviewEmail({
        subjectType: 'event',
        subjectId: existingFestival._id.toString(),
        subjectLabel: existingFestival.name || 'Festival',
        submittedByEmail: organizer?.email || 'unknown@unknown.local',
        submittedByName: organizer?.name || 'Organizer',
      }).catch(() => null);
    }

    const updatedFestival = await existingFestival.save();

    return new NextResponse(JSON.stringify({ success: true, festival: updatedFestival }), { status: 200 });

  } catch (error: any) {
    console.error(`Error updating festival by ID: ${id}`, error);
    return new NextResponse(JSON.stringify({ success: false, message: 'Internal Server Error: ' + error.message }), { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let id: string | undefined;
  try {
    const { pathname } = new URL(request.url);
    id = pathname.split('/').pop();

    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Authentication required' }), { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const organizerId = payload.userId as string;

    if (!id) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Festival ID is required' }), { status: 400 });
    }

    const deletedFestival = await Festival.findOneAndDelete({ _id: id, organizer: organizerId });

    if (!deletedFestival) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Festival not found or you do not have permission to delete it.' }), { status: 404 });
    }

    return new NextResponse(JSON.stringify({ success: true, message: 'Festival deleted successfully' }), { status: 200 });

  } catch (error: any) {
    console.error(`Error deleting festival by ID: ${id}`, error);
    if (error.name === 'CastError') {
      return new NextResponse(JSON.stringify({ success: false, message: 'Invalid Festival ID format.' }), { status: 400 });
    }
    return new NextResponse(JSON.stringify({ success: false, message: 'Internal Server Error' }), { status: 500 });
  }
}
