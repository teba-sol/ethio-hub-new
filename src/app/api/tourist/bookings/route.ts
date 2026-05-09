import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Booking from '../../../../models/booking.model';
import Festival from '../../../../models/festival.model';
import User from '../../../../models/User';
import Wallet from '../../../../models/wallet.model';
import Transaction from '../../../../models/transaction.model';
import Payment from '../../../../models/payment.model';
import mongoose from 'mongoose';
import * as jose from 'jose';
import { attachAvailabilityToFestival, findRoomAvailability, findTransportAvailability } from '../../../../lib/festivalAvailability';

const CHAPA_API_URL = 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

const EARLY_BIRD_WINDOW_HOURS = Number(process.env.EARLY_BIRD_WINDOW_HOURS || 5);

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'ethio-hub-secret-key-2025';
    const { payload, valid } = await import('jose').then(jose => 
      jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
        .then(res => ({ valid: true, payload: res.payload }))
        .catch(() => ({ valid: false, payload: null }))
    );
    
    if (!valid || !payload?.userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const touristId = payload.userId as string;
    
    const bookings = await Booking.find({ tourist: new mongoose.Types.ObjectId(touristId) })
      .populate('festival', 'name name_en name_am startDate endDate coverImage locationName')
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Transform bookings to include all needed details
    const transformedBookings = bookings.map((booking: any) => ({
      ...booking,
      // Ensure bookingDetails is included
      hotelName: booking.bookingDetails?.room?.hotelName,
      roomName: booking.bookingDetails?.room?.roomName,
      roomPrice: (booking.bookingDetails?.room?.roomPrice || 0) * (booking.bookingDetails?.room?.nights || 1),
      hotelRefCode: booking.bookingDetails?.room?.hotelRefCode,
      transportType: booking.bookingDetails?.transport?.type,
      transportPrice: (booking.bookingDetails?.transport?.price || 0) * (booking.bookingDetails?.transport?.days || 1),
      transportRefCode: booking.bookingDetails?.transport?.transportRefCode,
    }));

    return NextResponse.json({ success: true, bookings: transformedBookings });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

function generateTxRef(): string {
  return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generate4DigitCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const getEarlyBirdExpiry = (festival: any) => {
  // Use reviewedAt (time admin verified the event)
  const publishedAtRaw = festival?.reviewedAt || festival?.updatedAt;
  if (!publishedAtRaw) return null;

  const publishedAt = new Date(publishedAtRaw);
  if (Number.isNaN(publishedAt.getTime())) return null;

  const days = festival?.pricing?.earlyBirdDays || 0;
  if (days <= 0) return null;

  return new Date(publishedAt.getTime() + days * 24 * 60 * 60 * 1000);
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
        const ticketToRestore = booking.ticketTypeName || booking.ticketType;
        if (ticketToRestore && booking.quantity > 0) {
          await Festival.updateOne(
            { _id: booking.festival, 'ticketTypes.name': ticketToRestore },
            { $inc: { 'ticketTypes.$.available': booking.quantity } },
            { session }
          );
        }

        // Restore room availability
        if (booking.bookingDetails?.room?.roomId) {
          await Festival.updateOne(
            { _id: booking.festival, 'hotels.rooms._id': booking.bookingDetails.room.roomId },
            { $inc: { 'hotels.rooms.$.available': 1 } },
            { session }
          );
        }

        // Restore transport availability
        if (booking.bookingDetails?.transport?.transportId) {
          await Festival.updateOne(
            { _id: booking.festival, 'transportation._id': booking.bookingDetails.transport.transportId },
            { $inc: { 'transportation.$.available': 1 } },
            { session }
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

      // Calculate split payment - ticket gets 10% admin commission, hotel/transport get 5% organizer fee
      const hasHotel = booking.bookingDetails?.room?.hotelName ? true : false;
      const hasTransport = booking.bookingDetails?.transport?.transportId ? true : false;
      booking.hasHotelBooking = hasHotel;
      booking.hasTransportBooking = hasTransport;

      // Get room and transport prices
      const roomTotal = (booking.bookingDetails?.room?.roomPrice || 0) * (booking.bookingDetails?.room?.nights || 1);
      const transportTotal = (booking.bookingDetails?.transport?.price || 0) * (booking.bookingDetails?.transport?.days || 1);
      const ticketPrice = Math.max(0, booking.totalPrice - roomTotal - transportTotal);

      // Calculate hotel fee (5% of room total)
      const hotelFee = hasHotel ? Math.round(roomTotal * 0.05 * 100) / 100 : 0;
      // Calculate transport fee (5% of transport total)
      const transportFee = hasTransport ? Math.round(transportTotal * 0.05 * 100) / 100 : 0;
      // Calculate admin commission (10% of ticket total)
      const adminCommission = ticketPrice > 0 ? Math.round(ticketPrice * 0.10 * 100) / 100 : 0;
      // Calculate organizer earnings from ticket (90% of ticket)
      const ticketOrganizerAmount = ticketPrice > 0 ? Math.round(ticketPrice * 0.90 * 100) / 100 : 0;

      booking.platformFee = adminCommission;
      booking.commissionPercent = 10;
      booking.touristFeePercent = 5;
      booking.touristServiceFee = 0;
      // Organizer gets: 90% of ticket + 5% of hotel + 5% of transport
      booking.organizerAmount = ticketOrganizerAmount + hotelFee + transportFee;
      booking.hotelFee = hotelFee;
      booking.transportFee = transportFee;

      // Generate receipt
      booking.receipt = {
        eventName: festival?.name || 'Event',
        eventDate: festival?.startDate,
        ticketType: booking.ticketType,
        ticketPrice: ticketPrice,
        hotel: hasHotel ? {
          name: booking.bookingDetails?.room?.hotelName || '',
          roomType: booking.bookingDetails?.room?.roomName || '',
          roomPrice: roomTotal,
          checkIn: booking.checkInDate,
          checkOut: booking.checkOutDate,
        } : null,
        transport: hasTransport ? {
          type: booking.bookingDetails?.transport?.type || '',
          price: transportTotal,
        } : null,
        userInfo: booking.contactInfo,
        totalPaid: booking.totalPrice,
        paymentMethod: booking.paymentMethod,
      };

      // Update Wallets and Transactions
      const organizerId = booking.organizer;
      const adminUser = await User.findOne({ role: 'admin' }).session(session);

      // Update Organizer Wallet
      const organizerWallet = await Wallet.findOne({ userId: organizerId, userRole: 'organizer' }).session(session);
      if (organizerWallet) {
        organizerWallet.pendingBalance = Math.max(0, (organizerWallet.pendingBalance || 0) - (booking.organizerAmount || 0));
        organizerWallet.availableBalance = (organizerWallet.availableBalance || 0) + (booking.organizerAmount || 0);
        organizerWallet.lifetimeEarned = (organizerWallet.lifetimeEarned || 0) + (booking.organizerAmount || 0);
        await organizerWallet.save({ session });
      }

      // Update Organizer Transaction
      await Transaction.updateOne(
        { bookingId: booking._id, userId: organizerId, type: 'ORDER_PAYMENT' },
        { $set: { status: 'COMPLETED' } },
        { session }
      );

      // Update Admin Wallet
      if (adminUser) {
        const adminWallet = await Wallet.findOne({ userId: adminUser._id, userRole: 'admin' }).session(session);
        if (adminWallet) {
          adminWallet.pendingBalance = Math.max(0, (adminWallet.pendingBalance || 0) - (booking.platformFee || 0));
          adminWallet.availableBalance = (adminWallet.availableBalance || 0) + (booking.platformFee || 0);
          adminWallet.lifetimeEarned = (adminWallet.lifetimeEarned || 0) + (booking.platformFee || 0);
          await adminWallet.save({ session });
        }

        // Update Admin Transaction
        await Transaction.updateOne(
          { bookingId: booking._id, userId: adminUser._id, type: 'ADMIN_COMMISSION' },
          { $set: { status: 'COMPLETED' } },
          { session }
        );
      }

      await booking.save({ session });

      // Update organizer's wallet with earnings
      await Wallet.findOneAndUpdate(
        { userId: booking.organizer, userRole: 'organizer' },
        {
          $inc: {
            availableBalance: booking.organizerAmount,
            lifetimeEarned: booking.organizerAmount,
          }
        },
        { upsert: true, session }
      );

      // Create transaction record
      await Transaction.create([{
        userId: booking.organizer,
        type: 'earning',
        amount: booking.organizerAmount,
        currency: booking.currency || 'ETB',
        status: 'completed',
        description: `Booking payment for ${festival?.name || 'Event'}`,
        reference: booking._id,
        referenceType: 'booking',
      }], { session });
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
      // Find the actual ticket type name in the database
      const dbTicketType = festival.ticketTypes?.find((t: any) => 
        t.name === ticketType || 
        t.name.toLowerCase() === ticketType.toLowerCase() ||
        (ticketType === 'vip' && t.name.toLowerCase().includes('vip')) ||
        (ticketType === 'standard' && (t.name.toLowerCase().includes('standard') || t.name.toLowerCase().includes('regular'))) ||
        (ticketType === 'earlyBird' && t.name.toLowerCase().includes('early'))
      );

      // Robust check: if ticketTypes array exists but the requested type isn't there, or available is too low
      if (festival.ticketTypes && festival.ticketTypes.length > 0) {
        const actualTicketName = dbTicketType ? dbTicketType.name : ticketType;
        
        const ticketDecrementResult = await Festival.updateOne(
          {
            _id: festivalId,
            'ticketTypes.name': actualTicketName,
            'ticketTypes.available': { $gte: quantity }
          },
          { $inc: { 'ticketTypes.$.available': -quantity } },
          { session }
        );

        if (!ticketDecrementResult || ticketDecrementResult.matchedCount === 0) {
          console.error(`[BookingAPI] Inventory update failed for ticket "${actualTicketName}". Festival has ${festival.ticketTypes.length} ticket types.`);
          await session.abortTransaction();
          return new NextResponse(
            JSON.stringify({ success: false, message: 'Not enough tickets available or ticket type not found' }),
            { status: 409, headers: { 'content-type': 'application/json' } }
          );
        }
      } else {
        console.warn(`[BookingAPI] Festival ${festivalId} has no ticketTypes array. Skipping inventory check.`);
      }

      // Get the ticket price from the matched object
      if (dbTicketType) {
        unitPrice = dbTicketType.price || 0;
        ticketTypeName = dbTicketType.name || ticketType;
      }
    }

    // 2. Room availability check & decrement (for non-VIP)
    const selectedRoom = bookingDetails?.room;
    if (selectedRoom && selectedRoom.roomId && ticketType !== 'vip') {
      const roomUpdateResult = await Festival.updateOne(
        { _id: festivalId },
        { $inc: { "hotels.$[h].rooms.$[r].available": -1 } },
        { 
          arrayFilters: [
            { "h.rooms._id": selectedRoom.roomId },
            { "r._id": selectedRoom.roomId, "r.available": { $gt: 0 } }
          ],
          session 
        }
      );

      if (!roomUpdateResult || roomUpdateResult.modifiedCount === 0) {
        await session.abortTransaction();
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Room no longer available' }),
          { status: 409, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    // 3. Transport availability check & decrement (for non-VIP)
    const selectedTransport = bookingDetails?.transport;
    if (selectedTransport && selectedTransport.transportId && ticketType !== 'vip') {
      const transportUpdateResult = await Festival.updateOne(
        { 
          _id: festivalId, 
          'transportation._id': selectedTransport.transportId,
          'transportation.available': { $gt: 0 }
        },
        { $inc: { 'transportation.$.available': -1 } },
        { session }
      );

      if (!transportUpdateResult || transportUpdateResult.matchedCount === 0) {
        await session.abortTransaction();
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Transportation no longer available' }),
          { status: 409, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    // Calculate total price with dynamic Early Bird check
    const earlyBirdExpiry = getEarlyBirdExpiry(festival);
    const isEarlyBirdValid = earlyBirdExpiry && new Date() < earlyBirdExpiry;
    const discount = isEarlyBirdValid ? (festival.pricing?.earlyBird || 0) / 100 : 0;

    if (ticketType === 'vip') {
      const baseVipPrice = festival.pricing?.vipPrice || 0;
      unitPrice = baseVipPrice * (1 - discount);
    } else {
      const baseStandardPrice = festival.pricing?.basePrice || 0;
      unitPrice = baseStandardPrice * (1 - discount);
    }

    let calculatedTotalPrice = unitPrice * quantity;

    if (selectedRoom && selectedRoom.roomPrice) {
      calculatedTotalPrice += selectedRoom.roomPrice * (selectedRoom.nights || 1);
    }

    if (selectedTransport && selectedTransport.price) {
      calculatedTotalPrice += selectedTransport.price * (selectedTransport.days || 1);
    }

    const txRef = generateTxRef();

    // Generate ref codes for services
    const hotelRefCode = selectedRoom ? generate4DigitCode() : undefined;
    const transportRefCode = selectedTransport ? generate4DigitCode() : undefined;

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
      status: 'confirmed', // Changed from pending as per user request
      paymentStatus: 'paid', // Changed from pending as per user request
      paymentRef: txRef,
      contactInfo: {
        fullName: contactInfo.fullName,
        email: contactInfo.email,
        phone: contactInfo.phone || '',
      },
      specialRequests,
      bookingDetails: selectedRoom || selectedTransport ? {
        room: selectedRoom ? { 
          hotelId: selectedRoom.hotelId,
          roomId: selectedRoom.roomId,
          hotelName: selectedRoom.hotelName,
          roomName: selectedRoom.roomName,
          roomPrice: selectedRoom.roomPrice,
          nights: selectedRoom.nights,
          guests: selectedRoom.guests,
          hotelRefCode 
        } : undefined,
        transport: selectedTransport ? {
          transportId: selectedTransport.transportId,
          type: selectedTransport.type,
          price: selectedTransport.price,
          days: selectedTransport.days,
          transportRefCode
        } : undefined,
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

    const [booking] = await Booking.create([bookingData], { session });

    // Initialize Organizer Wallet (Pending)
    const organizerId = festival.organizer;
    let organizerWallet = await Wallet.findOne({ userId: organizerId, userRole: 'organizer' }).session(session);
    if (!organizerWallet) {
      organizerWallet = new Wallet({
        userId: organizerId,
        userRole: 'organizer',
        pendingBalance: 0,
        availableBalance: 0,
        lifetimeEarned: 0,
        lifetimePaidOut: 0,
        lifetimeRefunded: 0,
        currency: 'ETB',
      });
    }
    organizerWallet.pendingBalance = (organizerWallet.pendingBalance || 0) + bookingData.organizerAmount;
    await organizerWallet.save({ session });

    // Create Organizer Transaction (Pending)
    await Transaction.create([{
      walletId: organizerWallet._id,
      userId: organizerId,
      bookingId: booking._id,
      type: 'ORDER_PAYMENT',
      amount: bookingData.organizerAmount,
      currency: 'ETB',
      status: 'PENDING',
      paymentRef: txRef,
      metadata: {
        bookingId: booking._id.toString(),
        totalAmount: calculatedTotalPrice,
        commissionRate: bookingData.commissionPercent / 100,
        paymentMethod: 'chapa',
        payerId: touristId,
        receiverId: organizerId.toString(),
        role: 'organizer'
      },
    }], { session });

    // Initialize Admin Wallet (Pending)
    const adminUser = await User.findOne({ role: 'admin' }).session(session);
    if (adminUser) {
      let adminWallet = await Wallet.findOne({ userId: adminUser._id, userRole: 'admin' }).session(session);
      if (!adminWallet) {
        adminWallet = new Wallet({
          userId: adminUser._id,
          userRole: 'admin',
          pendingBalance: 0,
          availableBalance: 0,
          lifetimeEarned: 0,
          lifetimePaidOut: 0,
          lifetimeRefunded: 0,
          currency: 'ETB',
        });
      }
      adminWallet.pendingBalance = (adminWallet.pendingBalance || 0) + bookingData.platformFee;
      await adminWallet.save({ session });

      // Create Admin Transaction (Pending)
      await Transaction.create([{
        walletId: adminWallet._id,
        userId: adminUser._id,
        bookingId: booking._id,
        type: 'ADMIN_COMMISSION',
        amount: bookingData.platformFee,
        currency: 'ETB',
        status: 'PENDING',
        paymentRef: txRef,
        metadata: {
          bookingId: booking._id.toString(),
          totalAmount: calculatedTotalPrice,
          commissionRate: bookingData.commissionPercent / 100,
          organizerId: organizerId.toString(),
          paymentMethod: 'chapa',
          payerId: touristId,
          receiverId: adminUser._id.toString(),
          role: 'organizer'
        },
      }], { session });
    }

    // Create Payment Record (Pending)
    await Payment.create([{
      userId: new mongoose.Types.ObjectId(touristId),
      bookingId: booking._id,
      transactionRef: txRef,
      method: 'chapa',
      amount: calculatedTotalPrice,
      status: 'Pending',
    }], { session });

    // Initialize Chapa
    const chapaPayload = {
      amount: calculatedTotalPrice.toString(),
      currency: 'ETB',
      email: contactInfo.email || 'customer@example.com',
      first_name: contactInfo.fullName?.split(' ')[0] || 'Guest',
      last_name: contactInfo.fullName?.split(' ').slice(1).join(' ') || 'User',
      phone_number: contactInfo.phone || '0900000000',
      tx_ref: txRef,
      callback_url: `${FRONTEND_URL}/api/payment/chapa/callback`,
      return_url: `${FRONTEND_URL}/payment-success?bookingId=${booking._id}&status=success&tx_ref=${txRef}`,
      customization: {
        title: "EthioHub Booking",
        description: `Booking for ${festival.name}`
      },
      meta: {
        bookingId: booking._id.toString(),
        type: 'booking'
      },
    };

    if (!CHAPA_SECRET_KEY) {
      throw new Error('Chapa not configured');
    }

    const chapaResponse = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chapaPayload),
    });

    const chapaData = await chapaResponse.json();

    if (!chapaResponse.ok || !chapaData.data?.checkout_url) {
      console.error('Chapa error:', chapaData);
      throw new Error(chapaData.message || 'Failed to initialize Chapa');
    }

    // Update Payment with invoice URL
    await Payment.updateOne(
      { transactionRef: txRef },
      { $set: { invoiceUrl: chapaData.data.checkout_url } },
      { session }
    );

    await session.commitTransaction();

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        booking, 
        checkoutUrl: chapaData.data.checkout_url,
        txRef
      }),
      { status: 201, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    await session.abortTransaction();
    console.error('Error in integrated booking process:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: error.message || 'Internal Server Error' }),
      { status: error.status || 500, headers: { 'content-type': 'application/json' } }
    );
  } finally {
    session.endSession();
  }
}
