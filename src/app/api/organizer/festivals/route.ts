// src/api/organizer/festivals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Festival from '../../../../models/festival.model';
import * as jose from 'jose';
import { isFestivalCompleteForReview } from '../../../../lib/reviewAutomation';
import { queueAdminReviewEmail } from '../../../../lib/adminApproval';
import User from '../../../../models/User';

const isMissing = (value: any) => value === undefined || value === null || value === '';

const validateCreateAvailability = (hotels: any, transportation: any) => {
  const issues: string[] = [];

  // Hotels and transportation are optional now
  if (Array.isArray(hotels)) {
    hotels.forEach((hotel: any, hotelIndex: number) => {
      const hotelLabel = String(hotel?.name || '').trim() || `Hotel ${hotelIndex + 1}`;
      const rooms = Array.isArray(hotel?.rooms) ? hotel.rooms : [];

      rooms.forEach((room: any, roomIndex: number) => {
        const roomLabel = String(room?.name || '').trim() || `Room ${roomIndex + 1}`;
        const availability = Number(room?.availability);

        if (isMissing(room?.availability) || Number.isNaN(availability)) {
          issues.push(`${hotelLabel} - ${roomLabel}: room availability must be numeric.`);
        } else if (availability < 0) { // Changed from <= 0 to < 0 to allow 0 if they really want
          issues.push(`${hotelLabel} - ${roomLabel}: room availability must be at least 0.`);
        }
      });
    });
  }

  if (Array.isArray(transportation)) {
    transportation.forEach((transport: any, transportIndex: number) => {
      const transportLabel = String(transport?.type || '').trim() || `Transport ${transportIndex + 1}`;
      const availability = Number(transport?.availability);

      if (isMissing(transport?.availability) || Number.isNaN(availability)) {
        issues.push(`${transportLabel}: car availability must be numeric.`);
      } else if (availability < 0) {
        issues.push(`${transportLabel}: car availability must be at least 0.`);
      }
    });
  }

  return issues;
};

const textValue = (...values: any[]) => {
  const value = values.find((item) => typeof item === 'string' && item.trim());
  return value ? value.trim() : '';
};

const normalizeSchedule = (schedule: any[] = [], isDraft: boolean) => {
  const items = Array.isArray(schedule) ? schedule : [];
  const normalized = items
    .map((item: any, index: number) => {
      const titleEn = textValue(item?.title_en, item?.title);
      const titleAm = textValue(item?.title_am, item?.title);
      if (!isDraft && (!titleEn || !titleAm)) return null;

      const fallbackTitle = `Draft day ${index + 1}`;
      return {
        ...item,
        day: Number(item?.day) || index + 1,
        title: titleEn || titleAm || fallbackTitle,
        title_en: titleEn || titleAm || fallbackTitle,
        title_am: titleAm || titleEn || fallbackTitle,
        activities: item?.activities || '',
        performers: Array.isArray(item?.performers) ? item.performers : [],
      };
    })
    .filter(Boolean);

  if (normalized.length > 0) return normalized;

  return isDraft ? [{
    day: 1,
    title: 'Draft day 1',
    title_en: 'Draft day 1',
    title_am: 'Draft day 1',
    activities: '',
    performers: [],
  }] : [];
};

const normalizeHotels = (hotels: any[] = [], isDraft: boolean) => {
  const items = Array.isArray(hotels) ? hotels : [];

  return items
    .map((hotel: any, index: number) => {
      const nameEn = textValue(hotel?.name_en, hotel?.name);
      const nameAm = textValue(hotel?.name_am, hotel?.name);
      const hasHotelDetails = nameEn || nameAm || hotel?.address || hotel?.image || (Array.isArray(hotel?.rooms) && hotel.rooms.length > 0);
      if (isDraft && !hasHotelDetails) return null;

      const fallbackName = `Draft hotel ${index + 1}`;
      const rooms = (Array.isArray(hotel?.rooms) ? hotel.rooms : [])
        .map((room: any, roomIndex: number) => {
          const roomNameEn = textValue(room?.name_en, room?.name);
          const roomNameAm = textValue(room?.name_am, room?.name);
          const hasRoomDetails = roomNameEn || roomNameAm || room?.image || room?.availability || room?.pricePerNight;
          if (isDraft && !hasRoomDetails) return null;

          const fallbackRoomName = `Draft room ${roomIndex + 1}`;
          return {
            ...room,
            name: roomNameEn || roomNameAm || fallbackRoomName,
            name_en: roomNameEn || roomNameAm || fallbackRoomName,
            name_am: roomNameAm || roomNameEn || fallbackRoomName,
            description: textValue(room?.description, room?.description_en, room?.description_am),
            description_en: room?.description_en || room?.description || '',
            description_am: room?.description_am || room?.description || '',
            availability: Number(room?.availability) || (isDraft ? 1 : 0),
          };
        })
        .filter(Boolean);

      return {
        ...hotel,
        name: nameEn || nameAm || fallbackName,
        name_en: nameEn || nameAm || fallbackName,
        name_am: nameAm || nameEn || fallbackName,
        description: textValue(hotel?.description, hotel?.description_en, hotel?.description_am),
        description_en: hotel?.description_en || hotel?.description || '',
        description_am: hotel?.description_am || hotel?.description || '',
        fullDescription: textValue(hotel?.fullDescription, hotel?.fullDescription_en, hotel?.fullDescription_am),
        fullDescription_en: hotel?.fullDescription_en || hotel?.fullDescription || '',
        fullDescription_am: hotel?.fullDescription_am || hotel?.fullDescription || '',
        rooms,
        hotelServices: (Array.isArray(hotel?.hotelServices) ? hotel.hotelServices : [])
          .filter((service: any) => service?.name?.trim())
          .map((service: any) => ({
            ...service,
            name: service.name.trim(),
            description: service.description?.trim() || '',
            price: Number(service.price) || 0
          }))
      };
    })
    .filter(Boolean);
};

const normalizeTransportation = (transportation: any[] = [], isDraft: boolean) => {
  const items = Array.isArray(transportation) ? transportation : [];

  return items
    .map((transport: any, index: number) => {
      const typeEn = textValue(transport?.type_en, transport?.type);
      const typeAm = textValue(transport?.type_am, transport?.type);
      const hasDetails = typeEn || typeAm || transport?.image || transport?.availability || transport?.price;
      if (isDraft && !hasDetails) return null;

      const fallbackType = `Draft transport ${index + 1}`;
      return {
        ...transport,
        type: typeEn || typeAm || fallbackType,
        type_en: typeEn || typeAm || fallbackType,
        type_am: typeAm || typeEn || fallbackType,
        description: textValue(transport?.description, transport?.description_en, transport?.description_am),
        description_en: transport?.description_en || transport?.description || '',
        description_am: transport?.description_am || transport?.description || '',
        availability: Number(transport?.availability) || (isDraft ? 1 : 0),
      };
    })
    .filter(Boolean);
};

const normalizeServices = (services: any = {}, isDraft: boolean) => {
  const foodPackages = Array.isArray(services?.foodPackages) ? services.foodPackages : [];

  return {
    foodPackages: foodPackages
      .map((pkg: any, index: number) => {
        const nameEn = textValue(pkg?.name_en, pkg?.name, pkg?.customName);
        const nameAm = textValue(pkg?.name_am, pkg?.nameAm, pkg?.name_amharic, pkg?.name);
        const descriptionEn = textValue(pkg?.description_en, pkg?.description);
        const descriptionAm = textValue(pkg?.description_am, pkg?.descriptionAm, pkg?.description);
        const hasDetails = nameEn || nameAm || descriptionEn || descriptionAm || Number(pkg?.pricePerPerson) > 0;
        if (isDraft && !hasDetails) return null;
        if (!isDraft && !hasDetails) return null;

        const fallbackName = `Food package ${index + 1}`;
        return {
          ...pkg,
          name: nameEn || nameAm || fallbackName,
          name_en: nameEn || nameAm || fallbackName,
          name_am: nameAm || nameEn || fallbackName,
          description: descriptionEn || descriptionAm || '',
          description_en: descriptionEn || descriptionAm || '',
          description_am: descriptionAm || descriptionEn || '',
          pricePerPerson: Number(pkg?.pricePerPerson) || 0,
          items: Array.isArray(pkg?.items) ? pkg.items : [],
        };
      })
      .filter(Boolean),
    culturalServices: Array.isArray(services?.culturalServices) ? services.culturalServices : [],
    specialAssistance: Array.isArray(services?.specialAssistance) ? services.specialAssistance : [],
    extras: Array.isArray(services?.extras) ? services.extras : [],
  };
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
      policies,
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
