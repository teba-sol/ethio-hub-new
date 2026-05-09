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

function generateTxRef(): string {
  return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

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

    const txRef = generateTxRef();

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
      paymentRef: txRef,
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
