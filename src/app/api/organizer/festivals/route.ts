// src/api/organizer/festivals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Festival from '../../../../models/festival.model';
import * as jose from 'jose';

const isMissing = (value: any) => value === undefined || value === null || value === '';

const validateCreateAvailability = (hotels: any, transportation: any) => {
  const issues: string[] = [];

  if (!Array.isArray(hotels) || hotels.length === 0) {
    issues.push('At least one hotel with at least one room is required.');
  }

  let roomCount = 0;
  if (Array.isArray(hotels)) {
    hotels.forEach((hotel: any, hotelIndex: number) => {
      const hotelLabel = String(hotel?.name || '').trim() || `Hotel ${hotelIndex + 1}`;
      const rooms = Array.isArray(hotel?.rooms) ? hotel.rooms : [];
      roomCount += rooms.length;

      rooms.forEach((room: any, roomIndex: number) => {
        const roomLabel = String(room?.name || '').trim() || `Room ${roomIndex + 1}`;
        const availability = Number(room?.availability);

        if (isMissing(room?.availability) || Number.isNaN(availability)) {
          issues.push(`${hotelLabel} - ${roomLabel}: room availability must be numeric.`);
        } else if (availability <= 0) {
          issues.push(`${hotelLabel} - ${roomLabel}: room availability must be greater than 0.`);
        }
      });
    });
  }

  if (roomCount === 0) {
    issues.push('At least one hotel room is required.');
  }

  if (!Array.isArray(transportation) || transportation.length === 0) {
    issues.push('At least one transportation option is required.');
  } else {
    transportation.forEach((transport: any, transportIndex: number) => {
      const transportLabel = String(transport?.type || '').trim() || `Transport ${transportIndex + 1}`;
      const availability = Number(transport?.availability);

      if (isMissing(transport?.availability) || Number.isNaN(availability)) {
        issues.push(`${transportLabel}: car availability must be numeric.`);
      } else if (availability <= 0) {
        issues.push(`${transportLabel}: car availability must be greater than 0.`);
      }
    });
  }

  return issues;
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
      shortDescription, 
      fullDescription, 
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
      pricing
    } = body;

    if (!name || !shortDescription || !fullDescription || !startDate || !endDate || !location || !location.name) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const availabilityIssues = validateCreateAvailability(hotels, transportation);
    if (availabilityIssues.length > 0) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: `Validation failed: ${availabilityIssues.join(' ')}`,
          issues: availabilityIssues,
        }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const newFestival = new Festival({
      name,
      shortDescription,
      fullDescription,
      startDate,
      endDate,
      location,
      organizer: organizerId,
      coverImage,
      gallery,
      schedule,
      hotels,
      transportation,
      services,
      policies,
      pricing,
      verificationStatus: 'Draft',
      status: 'Draft',
    });

    await newFestival.save();

    return new NextResponse(
      JSON.stringify({ success: true, festival: newFestival }),
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
