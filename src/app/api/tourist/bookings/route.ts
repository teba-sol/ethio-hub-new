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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let touristObjectId;
    try {
      touristObjectId = new mongoose.Types.ObjectId(touristId);
    } catch (e) {
      touristObjectId = touristId;
    }

    const query: any = { tourist: touristObjectId };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('festival', 'name startDate endDate coverImage locationName')
      .populate('organizer', 'name')
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
  const session = await (await connectDB()).startSession();

  try {
    await session.startTransaction();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      await session.abortTransaction();
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const touristId = payload.userId as string;

    if (!touristId) {
      await session.abortTransaction();
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Tourist ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { bookingId, action } = body;

    if (!bookingId) {
      await session.abortTransaction();
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Booking ID is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const booking = await Booking.findOne({ _id: bookingId, tourist: touristId }).session(session);
    if (!booking) {
      await session.abortTransaction();
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Booking not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    if (action === 'cancel') {
      if (!['pending', 'confirmed'].includes(booking.status)) {
        await session.abortTransaction();
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Only pending or confirmed bookings can be cancelled' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

      // Restore inventory on cancellation
      if (booking.status !== 'cancelled') {
        // Restore ticket availability
        if (booking.ticketType && booking.quantity > 0) {
          await Festival.updateOne(
            { _id: booking.festival, 'ticketTypes.name': booking.ticketType },
            { $inc: { 'ticketTypes.$.available': booking.quantity } },
            { arrayFilters: [{ 'elem.name': booking.ticketType }], session }
          );
        }

        // Restore room availability
        if (booking.bookingDetails?.room?.roomId) {
          await Festival.updateOne(
            { _id: booking.festival, 'hotels.rooms._id': booking.bookingDetails.room.roomId },
            { $inc: { 'hotels.rooms.$.available': 1 } },
            { arrayFilters: [{ 'elem._id': booking.bookingDetails.room.roomId }], session }
          );
        }

        // Restore transport availability
        if (booking.bookingDetails?.transport?.transportId) {
          await Festival.updateOne(
            { _id: booking.festival, 'transportation._id': booking.bookingDetails.transport.transportId },
            { $inc: { 'transportation.$.available': 1 } },
            { arrayFilters: [{ 'elem._id': booking.bookingDetails.transport.transportId }], session }
          );
        }
      }

      booking.status = 'cancelled';
      await booking.save({ session });
    }

    if (action === 'confirm') {
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        const existingBooking = await Booking.findById(bookingId)
          .populate('festival', 'name startDate endDate')
          .populate('organizer', 'name');
        await session.commitTransaction();
        return new NextResponse(
          JSON.stringify({ success: true, booking: existingBooking }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }

      if (booking.status === 'cancelled') {
        await session.abortTransaction();
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Cancelled bookings cannot be confirmed' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

      const festival = await Festival.findById(booking.festival).session(session);
      if (!festival) {
        await session.abortTransaction();
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Festival not found for this booking' }),
          { status: 404, headers: { 'content-type': 'application/json' } }
        );
      }

      const confirmedBookings = await Booking.find({
        festival: booking.festival,
        status: { $in: ['confirmed', 'completed'] },
      }).lean().session(session);

      const festivalWithAvailability = attachAvailabilityToFestival(festival, confirmedBookings);
      const selectedRoomAvailability = findRoomAvailability(festivalWithAvailability, booking.bookingDetails?.room);
      const selectedTransportAvailability = findTransportAvailability(festivalWithAvailability, booking.bookingDetails?.transport);

      if (booking.bookingDetails?.room && (!selectedRoomAvailability || selectedRoomAvailability.available <= 0)) {
        await session.abortTransaction();
        return new NextResponse(
          JSON.stringify({ success: false, message: 'The selected room is no longer available' }),
          { status: 409, headers: { 'content-type': 'application/json' } }
        );
      }

      if (booking.bookingDetails?.transport && (!selectedTransportAvailability || selectedTransportAvailability.available <= 0)) {
        await session.abortTransaction();
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
        booking.platformFee = 0;
        booking.organizerAmount = booking.totalPrice;
        booking.commissionPercent = 0;
        booking.touristServiceFee = 0;
        booking.touristFeePercent = 0;
      } else {
        booking.touristFeePercent = 5;
        booking.touristServiceFee = Math.round(booking.totalPrice * 0.05 * 100) / 100;
        booking.commissionPercent = 10;
        booking.platformFee = Math.round(booking.totalPrice * 0.10 * 100) / 100;
        booking.organizerAmount = Math.round(booking.totalPrice * 0.90 * 100) / 100;
      }

      await booking.save({ session });
    }

    await session.commitTransaction();

    const updatedBooking = await Booking.findById(bookingId)
      .populate('festival', 'name startDate endDate')
      .populate('organizer', 'name');

    return new NextResponse(
      JSON.stringify({ success: true, booking: updatedBooking }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    await session.abortTransaction();
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
  } finally {
    session.endSession();
  }
}

export async function POST(request: NextRequest) {
  const session = await (await connectDB()).startSession();

  try {
    await session.startTransaction();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      await session.abortTransaction();
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const touristId = payload.userId as string;

    if (!touristId) {
      await session.abortTransaction();
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Tourist ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const body = await request.json();
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
      await session.abortTransaction();
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const festival = await Festival.findById(festivalId).session(session);
    if (!festival) {
      await session.abortTransaction();
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Festival not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    if (!festival.isVerified || festival.status !== 'Published') {
      await session.abortTransaction();
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Festival is not available for booking' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Check early bird window
    if (ticketType === 'earlyBird') {
      const earlyBirdExpiresAt = getEarlyBirdExpiry(festival);
      if (!earlyBirdExpiresAt || new Date() > earlyBirdExpiresAt) {
        await session.abortTransaction();
        return new NextResponse(
          JSON.stringify({
            success: false,
            message: `Early Bird tickets are no longer available. This offer expires ${EARLY_BIRD_WINDOW_HOURS} hours after event posting.`,
          }),
          { status: 409, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    let unitPrice = 0;
    let ticketTypeName = ticketType;

    // ATOMIC INVENTORY CHECK & DECREMENT
    // 1. Decrement ticket type availability (atomic)
    if (ticketType && quantity > 0) {
      const ticketDecrementResult = await Festival.updateOne(
        {
          _id: festivalId,
          'ticketTypes.name': ticketType,
          'ticketTypes.available': { $gte: quantity }
        },
        { $inc: { 'ticketTypes.$.available': -quantity } },
        { arrayFilters: [{ 'elem.name': ticketType }], session }
      );

      if (!ticketDecrementResult || ticketDecrementResult.matchedCount === 0) {
        await session.abortTransaction();
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Not enough tickets available' }),
          { status: 409, headers: { 'content-type': 'application/json' } }
        );
      }

      // Get the ticket price
      const ticketTypeObj = festival.ticketTypes?.find((t: any) => t.name === ticketType);
      if (ticketTypeObj) {
        unitPrice = ticketTypeObj.price || 0;
        ticketTypeName = ticketTypeObj.name || ticketType;
      }
    }

    // 2. Decrement room availability (atomic)
    const selectedRoom = bookingDetails?.room;
    if (selectedRoom && selectedRoom.roomId) {
      const roomDecrementResult = await Festival.updateOne(
        {
          _id: festivalId,
          'hotels.rooms._id': selectedRoom.roomId,
          'hotels.rooms.available': { $gte: 1 }
        },
        { $inc: { 'hotels.rooms.$.available': -1 } },
        { arrayFilters: [{ 'elem._id': selectedRoom.roomId }], session }
      );

      if (!roomDecrementResult || roomDecrementResult.matchedCount === 0) {
        await session.abortTransaction();
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Room no longer available' }),
          { status: 409, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    // 3. Decrement transport availability (atomic)
    const selectedTransport = bookingDetails?.transport;
    if (selectedTransport && selectedTransport.transportId) {
      const transportDecrementResult = await Festival.updateOne(
        {
          _id: festivalId,
          'transportation._id': selectedTransport.transportId,
          'transportation.available': { $gte: 1 }
        },
        { $inc: { 'transportation.$.available': -1 } },
        { arrayFilters: [{ 'elem._id': selectedTransport.transportId }], session }
      );

      if (!transportDecrementResult || transportDecrementResult.matchedCount === 0) {
        await session.abortTransaction();
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Transportation no longer available' }),
          { status: 409, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    // Calculate total price
    unitPrice = unitPrice || (festival.pricing?.basePrice || 0);

    if (ticketType === 'vip') {
      unitPrice = festival.pricing?.vipPrice || festival.pricing?.basePrice * 2 || 0;
    } else if (ticketType === 'earlyBird') {
      unitPrice = (festival.pricing?.basePrice || 0) * (1 - (festival.pricing?.earlyBird || 0) / 100);
    }

    let calculatedTotalPrice = unitPrice * quantity;

    if (selectedRoom && selectedRoom.roomPrice) {
      calculatedTotalPrice += selectedRoom.roomPrice;
    }

    if (selectedTransport && selectedTransport.price) {
      calculatedTotalPrice += selectedTransport.price;
    }

    // Create booking
    const bookingData: any = {
      tourist: touristId,
      festival: festivalId,
      organizer: festival.organizer,
      ticketType,
      ticketTypeName,
      quantity,
      totalPrice: calculatedTotalPrice,
      currency: currency || festival.pricing?.currency || 'ETB',
      status: 'pending',
      paymentStatus: 'pending',
      contactInfo: {
        fullName: contactInfo.fullName,
        email: contactInfo.email,
        phone: contactInfo.phone || '',
      },
      specialRequests,
      bookingDetails: selectedRoom || selectedTransport ? {
        room: selectedRoom,
        transport: selectedTransport,
      } : undefined,
    };

    // Calculate split payment
    const hasHotel = selectedRoom?.hotelName ? true : (hasHotelBooking || false);

    if (!hasHotel) {
      // Festival tickets & products - both fees apply
      bookingData.commissionPercent = 10;
      bookingData.platformFee = Math.round(calculatedTotalPrice * 0.10 * 100) / 100;
      bookingData.organizerAmount = Math.round(calculatedTotalPrice * 0.90 * 100) / 100;
      bookingData.touristFeePercent = 5;
      bookingData.touristServiceFee = touristServiceFee || Math.round(calculatedTotalPrice * 0.05 * 100) / 100;
    } else {
      // Hotel bookings - no fees
      bookingData.platformFee = 0;
      bookingData.organizerAmount = calculatedTotalPrice;
      bookingData.commissionPercent = 0;
      bookingData.touristServiceFee = 0;
      bookingData.touristFeePercent = 0;
    }

    bookingData.hasHotelBooking = hasHotel;

    const booking = await Booking.create([bookingData], { session });

    await session.commitTransaction();

    const populatedBooking = await Booking.findById(booking[0]._id)
      .populate('tourist', 'name email')
      .populate('festival', 'name startDate endDate')
      .populate('organizer', 'name email');

    return new NextResponse(
      JSON.stringify({ success: true, booking: populatedBooking }),
      { status: 201, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    await session.abortTransaction();
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
  } finally {
    session.endSession();
  }
}
