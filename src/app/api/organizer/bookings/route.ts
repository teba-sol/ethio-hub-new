import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Booking from '../../../../models/booking.model';
import Festival from '../../../../models/festival.model';
import * as jose from 'jose';
import { attachAvailabilityToFestival, findRoomAvailability, findTransportAvailability } from '../../../../lib/festivalAvailability';

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const festivalId = searchParams.get('festivalId');

    const query: any = { organizer: organizerId };
    if (status) query.status = status;
    if (festivalId) query.festival = festivalId;

    const bookings = await Booking.find(query)
      .populate('tourist', 'name email')
      .populate('festival', 'name startDate endDate')
      .sort({ createdAt: -1 });

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
    const organizerId = payload.userId as string;

    if (!organizerId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Organizer ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { bookingId, status, paymentStatus } = body;

    if (!bookingId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Booking ID is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const booking = await Booking.findOne({ _id: bookingId, organizer: organizerId });
    if (!booking) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Booking not found or you do not have permission' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const updateData: any = {};
    if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      if (status === 'confirmed' && booking.status !== 'confirmed' && booking.status !== 'completed') {
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
      }

      updateData.status = status;
    }
    if (paymentStatus && ['pending', 'paid', 'refunded'].includes(paymentStatus)) {
      updateData.paymentStatus = paymentStatus;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: updateData },
      { new: true }
    ).populate('tourist', 'name email').populate('festival', 'name');

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
