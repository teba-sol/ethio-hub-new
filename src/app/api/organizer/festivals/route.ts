// src/api/organizer/festivals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Festival from '../../../../models/festival.model';
import * as jose from 'jose';
import { isFestivalCompleteForReview } from '../../../../lib/reviewAutomation';
import { queueAdminReviewEmail } from '../../../../lib/adminApproval';
import User from '../../../../models/User';

import { 
  normalizeSchedule, 
  normalizeHotels, 
  normalizeTransportation, 
  normalizeServices, 
  normalizePolicies,
  validateCreateAvailability 
} from '../../../../lib/festivalNormalization';

const textValue = (...values: any[]) => {
  const value = values.find((item) => typeof item === 'string' && item.trim());
  return value ? value.trim() : '';
};

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

    return new NextResponse(
      JSON.stringify({ success: true, festivals }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
        );
    }
    
    console.error('Error fetching festivals:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}


export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { 
      name,
      name_en,
      name_am,
      type,
      shortDescription,
      shortDescription_en,
      shortDescription_am,
      fullDescription,
      fullDescription_en,
      fullDescription_am,
      startDate, 
      endDate, 
      location, 
      coverImage, 
      gallery,
      schedule,
      hotels,
      transportation,
      services,
      policies,
      pricing,
      verificationStatus,
      totalCapacity
    } = body;

    const requestedStatus = verificationStatus === 'Pending Approval' ? 'Pending Approval' : 'Draft';
    const isDraft = requestedStatus === 'Draft';
    const normalizedNameEn = textValue(name_en, name);
    const normalizedNameAm = textValue(name_am, name);
    const normalizedShortEn = textValue(shortDescription_en, shortDescription);
    const normalizedShortAm = textValue(shortDescription_am, shortDescription);
    const normalizedFullEn = textValue(fullDescription_en, fullDescription);
    const normalizedFullAm = textValue(fullDescription_am, fullDescription);
    const normalizedLocationNameEn = textValue(location?.name_en, location?.name);
    const normalizedLocationNameAm = textValue(location?.name_am, location?.name);

    if (!isDraft && (
      (!normalizedNameEn && !normalizedNameAm) ||
      (!normalizedShortEn && !normalizedShortAm) ||
      (!normalizedFullEn && !normalizedFullAm) ||
      !startDate ||
      !endDate ||
      !location ||
      (!normalizedLocationNameEn && !normalizedLocationNameAm)
    )) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const normalizedHotels = normalizeHotels(hotels, isDraft);
    const normalizedTransportation = normalizeTransportation(transportation, isDraft);
    const normalizedServices = normalizeServices(services, isDraft);
    const availabilityIssues = isDraft ? [] : validateCreateAvailability(normalizedHotels, normalizedTransportation);
    if (!isDraft && availabilityIssues.length > 0) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: `Validation failed: ${availabilityIssues.join(' ')}`,
          issues: availabilityIssues,
        }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const organizer = await User.findById(organizerId).select('name email');
    const computedPendingStatus =
      isFestivalCompleteForReview({
        name_en: normalizedNameEn || normalizedNameAm,
        name_am: normalizedNameAm || normalizedNameEn,
        shortDescription_en: normalizedShortEn || normalizedShortAm,
        shortDescription_am: normalizedShortAm || normalizedShortEn,
        fullDescription_en: normalizedFullEn || normalizedFullAm,
        fullDescription_am: normalizedFullAm || normalizedFullEn,
        startDate,
        endDate,
        location: { name_en: normalizedLocationNameEn, name_am: normalizedLocationNameAm },
        hotels: normalizedHotels,
        transportation: normalizedTransportation,
      }) && requestedStatus === 'Draft'
        ? 'Pending Approval'
        : requestedStatus;

    const newFestival = new Festival({
      name: normalizedNameEn || normalizedNameAm || 'Untitled draft festival',
      name_en: normalizedNameEn || normalizedNameAm || 'Untitled draft festival',
      name_am: normalizedNameAm || normalizedNameEn || 'Untitled draft festival',
      type: type || 'CulturalTraditional',
      shortDescription: normalizedShortEn || normalizedShortAm || 'Draft festival description',
      shortDescription_en: normalizedShortEn || normalizedShortAm || 'Draft festival description',
      shortDescription_am: normalizedShortAm || normalizedShortEn || 'Draft festival description',
      fullDescription: normalizedFullEn || normalizedFullAm || 'Draft festival description',
      fullDescription_en: normalizedFullEn || normalizedFullAm || 'Draft festival description',
      fullDescription_am: normalizedFullAm || normalizedFullEn || 'Draft festival description',
      startDate: startDate || new Date(),
      endDate: endDate || startDate || new Date(),
      totalCapacity: Number(totalCapacity) || 0,
      location: {
        ...(location || {}),
        name: normalizedLocationNameEn || normalizedLocationNameAm || 'Draft location',
        name_en: normalizedLocationNameEn || normalizedLocationNameAm || 'Draft location',
        name_am: normalizedLocationNameAm || normalizedLocationNameEn || 'Draft location',
      },
      organizer: organizerId,
      coverImage,
      gallery,
      schedule: normalizeSchedule(schedule, isDraft),
      hotels: normalizedHotels,
      transportation: normalizedTransportation,
      services: normalizedServices,
      policies: normalizePolicies(policies),
      pricing,
      verificationStatus: computedPendingStatus,
      status: 'Draft',
      submittedAt: computedPendingStatus === 'Pending Approval' ? new Date() : undefined,
    });

    await newFestival.save();

    if (computedPendingStatus === 'Pending Approval') {
      await queueAdminReviewEmail({
        subjectType: 'event',
        subjectId: newFestival._id.toString(),
        subjectLabel: newFestival.name || 'Festival',
        submittedByEmail: organizer?.email || 'unknown@unknown.local',
        submittedByName: organizer?.name || 'Organizer',
      }).catch(() => null);
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: computedPendingStatus === 'Pending Approval'
          ? 'Festival submitted for admin approval'
          : 'Festival saved as draft',
        festival: newFestival,
      }),
      { status: 201, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    // Handle token verification errors (e.g., expired, invalid)
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
        );
    }
    
    console.error('Error creating festival:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
