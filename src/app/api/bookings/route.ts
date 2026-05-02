import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/booking.model';
import Festival from '@/models/festival.model';
import * as jose from 'jose';

const EARLY_BIRD_WINDOW_HOURS = Number(process.env.EARLY_BIRD_WINDOW_HOURS || 5);

const getEarlyBirdExpiry = (festival: any) => {
  const postedAtRaw = festival?.createdAt || festival?.submittedAt;
  if (!postedAtRaw) return null;

  const postedAt = new Date(postedAtRaw);
  if (Number.isNaN(postedAt.getTime())) return null;

  return new Date(postedAt.getTime() + EARLY_BIRD_WINDOW_HOURS * 60 * 60 * 1000);
};

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
    const { festivalId, ticketType, quantity, contactInfo, specialRequests, selectedRoom, selectedTransport } = body;

    if (!festivalId || !ticketType || !quantity || !contactInfo) {
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

    // ATOMIC INVENTORY CHECK & DECREMENT
    let unitPrice = festival.pricing?.basePrice || 0;
    let ticketDecrementResult;

    // 1. Decrement ticket type availability (atomic)
    if (ticketType && quantity > 0) {
      ticketDecrementResult = await Festival.updateOne(
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
      }
    }

    // 2. Decrement room availability (atomic)
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
    if (ticketType === 'vip') {
      unitPrice = festival.pricing?.vipPrice || festival.pricing?.basePrice * 2 || 0;
    } else if (ticketType === 'earlyBird') {
      unitPrice = (festival.pricing?.basePrice || 0) * (1 - (festival.pricing?.earlyBird || 0) / 100);
    }

    let totalPrice = unitPrice * quantity;

    if (selectedRoom && selectedRoom.roomPrice) {
      totalPrice += selectedRoom.roomPrice;
    }

    if (selectedTransport && selectedTransport.price) {
      totalPrice += selectedTransport.price;
    }

    // Create booking
    const booking = await Booking.create([{
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
    }], { session });

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
