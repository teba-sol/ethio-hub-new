import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/booking.model';
import Festival from '@/models/festival.model';
import * as jose from 'jose';

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
    const touristId = payload.userId as string;

    if (!touristId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Tourist ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { festivalId, ticketType, quantity, contactInfo, specialRequests, selectedRoom, selectedTransport } = body;

    if (!festivalId || !ticketType || !quantity || !contactInfo) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const festival = await Festival.findById(festivalId);
    if (!festival) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Festival not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    if (!festival.isVerified || festival.status !== 'Published') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Festival is not available for booking' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    let unitPrice = festival.pricing?.basePrice || 0;
    if (ticketType === 'vip') {
      unitPrice = festival.pricing?.vipPrice || festival.pricing?.basePrice * 2 || 0;
    } else if (ticketType === 'earlyBird') {
      unitPrice = (festival.pricing?.basePrice || 0) * (1 - (festival.pricing?.earlyBird || 0) / 100);
    }

    let totalPrice = unitPrice * quantity;

    if (selectedRoom && selectedRoom.roomPrice) {
      totalPrice += selectedRoom.roomPrice * quantity;
    }

    if (selectedTransport && selectedTransport.price) {
      totalPrice += selectedTransport.price;
    }

    const booking = await Booking.create({
      tourist: touristId,
      festival: festivalId,
      organizer: festival.organizer,
      ticketType,
      quantity,
      totalPrice,
      currency: festival.pricing?.currency || 'ETB',
      status: 'pending',
      paymentStatus: 'pending',
      contactInfo: {
        fullName: contactInfo.fullName,
        email: contactInfo.email,
        phone: contactInfo.phone,
      },
      specialRequests,
      bookingDetails: selectedRoom || selectedTransport ? {
        room: selectedRoom,
        transport: selectedTransport,
      } : undefined,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('tourist', 'name email')
      .populate('festival', 'name startDate endDate')
      .populate('organizer', 'name email');

    return new NextResponse(
      JSON.stringify({ success: true, booking: populatedBooking }),
      { status: 201, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error creating booking:', error);
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    if (error.name === 'CastError') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid ID format' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}