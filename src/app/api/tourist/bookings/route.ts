import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Booking from '../../../../models/booking.model';
import Festival from '../../../../models/festival.model';
import mongoose from 'mongoose';
import * as jose from 'jose';
import { attachAvailabilityToFestival, findRoomAvailability, findTransportAvailability } from '../../../../lib/festivalAvailability';

const EARLY_BIRD_WINDOW_HOURS = Number(process.env.EARLY_BIRD_WINDOW_HOURS || 5);

const getEarlyBirdExpiry = (festival: any) => {
  const postedAtRaw = festival?.createdAt || festival?.submittedAt;
  if (!postedAtRaw) return null;

  const postedAt = new Date(postedAtRaw);
  if (Number.isNaN(postedAt.getTime())) return null;

  return new Date(postedAt.getTime() + EARLY_BIRD_WINDOW_HOURS * 60 * 60 * 1000);
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
    const touristId = payload.userId as string;

    if (!touristId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Tourist ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    console.log('GET - TouristId from token:', touristId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let touristObjectId;
    try {
      touristObjectId = new mongoose.Types.ObjectId(touristId);
    } catch (e) {
      console.error('Invalid touristId format:', touristId);
      touristObjectId = touristId;
    }

    const query: any = { tourist: touristObjectId };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('festival', 'name startDate endDate coverImage locationName')
      .populate('organizer', 'name')
      .sort({ createdAt: -1 });

    console.log('Fetching bookings for touristId:', touristId, 'Query:', query, 'Found:', bookings.length);

    return new NextResponse(
      JSON.stringify({ success: true, bookings }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    console.error('Error fetching bookings:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { bookingId, action } = body;

    if (!bookingId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Booking ID is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const booking = await Booking.findOne({ _id: bookingId, tourist: touristId });
    if (!booking) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Booking not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    if (action === 'cancel') {
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Only pending or confirmed bookings can be cancelled' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }
      booking.status = 'cancelled';
      await booking.save();
    }

if (action === 'confirm') {
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        const existingBooking = await Booking.findById(bookingId)
          .populate('festival', 'name startDate endDate')
          .populate('organizer', 'name');

        return new NextResponse(
          JSON.stringify({ success: true, booking: existingBooking }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }

      if (booking.status === 'cancelled') {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Cancelled bookings cannot be confirmed' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

      const festival = await Festival.findById(booking.festival);
      if (!festival) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Festival not found for this booking' }),
          { status: 404, headers: { 'content-type': 'application/json' } }
        );
      }

      const confirmedBookings = await Booking.find({
        festival: booking.festival,
        status: { $in: ['confirmed', 'completed'] },
      }).lean();

      const festivalWithAvailability = attachAvailabilityToFestival(festival, confirmedBookings);
      const selectedRoomAvailability = findRoomAvailability(festivalWithAvailability, booking.bookingDetails?.room);
      const selectedTransportAvailability = findTransportAvailability(festivalWithAvailability, booking.bookingDetails?.transport);

      if (booking.bookingDetails?.room && (!selectedRoomAvailability || selectedRoomAvailability.remaining <= 0)) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'The selected room is no longer available' }),
          { status: 409, headers: { 'content-type': 'application/json' } }
        );
      }

      if (booking.bookingDetails?.transport && (!selectedTransportAvailability || selectedTransportAvailability.remaining <= 0)) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'The selected car is no longer available' }),
          { status: 409, headers: { 'content-type': 'application/json' } }
        );
      }

      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
      if (body.paymentMethod) {
        booking.paymentMethod = body.paymentMethod;
        booking.paymentDate = new Date();
      }
      
      // Calculate split payment
      const hasHotel = booking.bookingDetails?.room?.hotelName ? true : false;
      booking.hasHotelBooking = hasHotel;
      
      if (hasHotel) {
        // Hotel bookings - no fees
        booking.platformFee = 0;
        booking.organizerAmount = booking.totalPrice;
        booking.commissionPercent = 0;
        booking.touristServiceFee = 0;
        booking.touristFeePercent = 0;
      } else {
        // Festival tickets & products - both fees apply
        // Tourist pays 5% service fee on top
        booking.touristFeePercent = 5;
        booking.touristServiceFee = Math.round(booking.totalPrice * 0.05 * 100) / 100;
        
        // Organizer pays 10% commission (deducted from their share)
        booking.commissionPercent = 10;
        booking.platformFee = Math.round(booking.totalPrice * 0.10 * 100) / 100;
        booking.organizerAmount = Math.round(booking.totalPrice * 0.90 * 100) / 100;
      }
      
      await booking.save();
    }

    const updatedBooking = await Booking.findById(bookingId)
      .populate('festival', 'name startDate endDate')
      .populate('organizer', 'name');

    return new NextResponse(
      JSON.stringify({ success: true, booking: updatedBooking }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    if (error.name === 'CastError') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid Booking ID format' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
    console.error('Error updating booking:', error);
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
    const touristId = payload.userId as string;

    if (!touristId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Tourist ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    console.log('POST - TouristId from token:', touristId, 'Attempting to create booking');

    const body = await request.json();
    console.log('POST - Request body:', body);
    const { 
      festivalId, 
      ticketType, 
      quantity, 
      contactInfo, 
      specialRequests,
      bookingDetails,
      totalPrice,
      currency,
      hasHotelBooking,
      touristServiceFee
    } = body;

    if (!festivalId || !ticketType || !quantity || !contactInfo || !totalPrice) {
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

    if (ticketType === 'earlyBird') {
      const earlyBirdExpiresAt = getEarlyBirdExpiry(festival);
      if (!earlyBirdExpiresAt || new Date() > earlyBirdExpiresAt) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            message: `Early Bird tickets are no longer available. This offer expires ${EARLY_BIRD_WINDOW_HOURS} hours after event posting.`,
          }),
          { status: 409, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    const bookingData: any = {
      tourist: new mongoose.Types.ObjectId(touristId),
      festival: new mongoose.Types.ObjectId(festivalId),
      organizer: festival.organizer,
      ticketType,
      quantity,
      totalPrice,
      currency: currency || 'ETB',
      status: 'pending',
      paymentStatus: 'pending',
      contactInfo: {
        fullName: contactInfo.fullName,
        email: contactInfo.email,
        phone: contactInfo.phone || '',
      },
    };

    if (specialRequests) {
      bookingData.specialRequests = specialRequests;
    }

    if (bookingDetails && typeof bookingDetails === 'object') {
      const cleanDetails: any = {};
      if (bookingDetails.room && (bookingDetails.room.hotelName || bookingDetails.room.roomName)) {
        cleanDetails.room = {
          hotelId: bookingDetails.room.hotelId || '',
          roomId: bookingDetails.room.roomId || '',
          hotelName: bookingDetails.room.hotelName || '',
          roomName: bookingDetails.room.roomName || '',
          roomPrice: bookingDetails.room.roomPrice || 0,
        };
      }
      if (bookingDetails.transport && bookingDetails.transport.type) {
        cleanDetails.transport = {
          transportId: bookingDetails.transport.transportId || '',
          type: bookingDetails.transport.type,
          price: bookingDetails.transport.price || 0,
        };
      }
      if (cleanDetails && typeof cleanDetails === 'object' && Object.keys(cleanDetails).length > 0) {
        bookingData.bookingDetails = cleanDetails;
      }
    }

    // Calculate split payment
    // Tourist service fee: 5% on tickets only (always)
    // Platform commission: 10% on organizer amount (always, unless hotel-only with no tickets)
    const hasTickets = ticketType && quantity;
    const hasHotelRoom = bookingData.bookingDetails?.room?.hotelName ? true : (hasHotelBooking || false);
    bookingData.hasHotelBooking = hasHotelRoom;
    
    if (!hasTickets) {
      // No tickets - no fees at all
      bookingData.platformFee = 0;
      bookingData.organizerAmount = bookingData.totalPrice;
      bookingData.commissionPercent = 0;
      bookingData.touristServiceFee = 0;
      bookingData.touristFeePercent = 0;
    } else {
      // Has tickets - 10% platform fee + 5% tourist service fee
      bookingData.commissionPercent = 10;
      bookingData.platformFee = Math.round(bookingData.totalPrice * 0.10 * 100) / 100;
      bookingData.organizerAmount = Math.round(bookingData.totalPrice * 0.90 * 100) / 100;
      bookingData.touristFeePercent = 5;
      bookingData.touristServiceFee = touristServiceFee || Math.round(bookingData.totalPrice * 0.05 * 100) / 100;
    }

    const booking = new Booking(bookingData);

    await booking.save();
    console.log('Created booking with touristId:', touristId, 'festivalId:', festivalId, 'bookingId:', booking._id);

    const populatedBooking = await Booking.findById(booking._id)
      .populate('festival', 'name startDate endDate coverImage locationName')
      .populate('organizer', 'name');

    return new NextResponse(
      JSON.stringify({ success: true, booking: populatedBooking }),
      { status: 201, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
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
    console.error('Error creating booking:', error, error.stack);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
