import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/booking.model';
import Festival from '@/models/festival.model';
import Wallet from '@/models/wallet.model';
import Transaction from '@/models/transaction.model';
import * as jose from 'jose';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const organizerId = payload.userId as string;

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('serviceType');
    const status = searchParams.get('status');

    const query: any = {
      organizer: new mongoose.Types.ObjectId(organizerId),
    };

    if (serviceType === 'hotel') {
      query.hasHotelBooking = true;
    } else if (serviceType === 'transport') {
      query.hasTransportBooking = true;
    } else {
      // Default: only show bookings with at least one service
      query.$or = [{ hasHotelBooking: true }, { hasTransportBooking: true }];
    }

    const bookings = await Booking.find(query)
      .populate('festival', 'name name_en name_am')
      .populate('tourist', 'name email')
      .lean();

    const settlements: any[] = [];

    bookings.forEach((booking: any) => {
      const festivalName = booking.festival?.name_en || booking.festival?.name || booking.festival?.name_am || 'Event';
      const userName = booking.tourist?.name || 'Guest';
      const userEmail = booking.tourist?.email || 'guest@email.com';

      if (booking.hasHotelBooking) {
        const hotelPrice = booking.hotelFee || (booking.bookingDetails?.room?.roomPrice || 0);
        const organizerFee = Math.round(hotelPrice * 0.05 * 100) / 100;
        const providerDue = Math.round(hotelPrice * 0.85 * 100) / 100;
        
        const status = (booking as any).hotelSettlementStatus || 'pending';
        const paidAt = (booking as any).hotelSettlementPaidAt || undefined;
        const payoutDetails = (booking as any).hotelPayoutDetails || undefined;

        settlements.push({
          _id: booking._id.toString() + '_hotel',
          realBookingId: booking._id.toString(),
          festivalId: booking.festival?._id,
          festivalName,
          serviceType: 'hotel',
          providerId: booking.bookingDetails?.room?.hotelId,
          providerName: booking.bookingDetails?.room?.hotelName || 'Hotel Provider',
          userId: booking.tourist?._id,
          userName,
          userEmail,
          price: hotelPrice,
          organizerFee,
          providerDue,
          status,
          paidAt,
          payoutDetails,
          details: {
            roomType: booking.bookingDetails?.room?.roomName || 'Standard Room',
            checkIn: booking.bookingDetails?.room?.checkIn,
            checkOut: booking.bookingDetails?.room?.checkOut,
          }
        });
      }

      if (booking.hasTransportBooking) {
        const transportPrice = booking.transportFee || (booking.bookingDetails?.transport?.price || 0);
        const organizerFee = Math.round(transportPrice * 0.05 * 100) / 100;
        const providerDue = Math.round(transportPrice * 0.85 * 100) / 100;

        const status = (booking as any).transportSettlementStatus || 'pending';
        const paidAt = (booking as any).transportSettlementPaidAt || undefined;
        const payoutDetails = (booking as any).transportPayoutDetails || undefined;

        settlements.push({
          _id: booking._id.toString() + '_transport',
          realBookingId: booking._id.toString(),
          festivalId: booking.festival?._id,
          festivalName,
          serviceType: 'transport',
          providerId: booking.bookingDetails?.transport?.transportId,
          providerName: booking.bookingDetails?.transport?.type || 'Transport Provider',
          userId: booking.tourist?._id,
          userName,
          userEmail,
          price: transportPrice,
          organizerFee,
          providerDue,
          status,
          paidAt,
          payoutDetails,
          details: {
            transportType: booking.bookingDetails?.transport?.type || 'Standard Car',
            pickupTime: booking.bookingDetails?.transport?.pickupTime,
          }
        });
      }
    });

    let filteredSettlements = settlements;
    if (status === 'pending') {
      filteredSettlements = settlements.filter((s: any) => s.status === 'pending');
    } else if (status === 'paid') {
      filteredSettlements = settlements.filter((s: any) => s.status === 'paid');
    }

    const totalOrganizerFee = settlements.reduce((sum: number, s: any) => sum + s.organizerFee, 0);

    return NextResponse.json({ 
      success: true, 
      settlements: filteredSettlements,
      totalOrganizerFee
    });
  } catch (error: any) {
    console.error('Error fetching settlements:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const organizerId = payload.userId as string;
    const userObjectId = new mongoose.Types.ObjectId(organizerId);

    const body = await request.json();
    const { amount, phoneNumber, bookingId, serviceType } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, message: 'Booking ID required' }, { status: 400 });
    }

    const booking = await Booking.findOne({ _id: bookingId, organizer: userObjectId });

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const payoutAmount = amount || booking.providerAmount;

    // 0. Verify Wallet Funds
    const wallet = await Wallet.findOne({ userId: userObjectId });
    if (!wallet) {
      return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    }

    if (serviceType === 'hotel' && (wallet.hotelAvailableBalance || 0) < payoutAmount) {
      return NextResponse.json({ success: false, message: 'Insufficient Hotel balance! This provider was likely already paid.' }, { status: 400 });
    }
    if (serviceType === 'transport' && (wallet.transportAvailableBalance || 0) < payoutAmount) {
      return NextResponse.json({ success: false, message: 'Insufficient Transport balance! This provider was likely already paid.' }, { status: 400 });
    }

    // 1. Update Wallet
    const incQuery: any = {
      thirdPartyAvailableBalance: -payoutAmount,
      thirdPartyPaidOut: payoutAmount
    };

    if (serviceType === 'hotel') {
      incQuery.hotelAvailableBalance = -payoutAmount;
      incQuery.hotelPaidOut = payoutAmount;
    } else if (serviceType === 'transport') {
      incQuery.transportAvailableBalance = -payoutAmount;
      incQuery.transportPaidOut = payoutAmount;
    }

    await Wallet.findOneAndUpdate(
      { userId: userObjectId },
      { $inc: incQuery },
      { upsert: true }
    );

    // 2. Create Transaction Record
    await Transaction.create({
      userId: userObjectId,
      bookingId: booking._id,
      type: 'THIRD_PARTY_SETTLEMENT',
      amount: payoutAmount,
      status: 'COMPLETED',
      paymentRef: `SETTLE-${Date.now()}`,
      metadata: {
        phoneNumber,
        payoutAmount,
        serviceType,
        bookingId: booking._id
      }
    });

    // 3. Update Booking
    const updateField = serviceType === 'hotel' ? 'hotelSettlementStatus' : 'transportSettlementStatus';
    const paidAtField = serviceType === 'hotel' ? 'hotelSettlementPaidAt' : 'transportSettlementPaidAt';
    const payoutDetailsField = serviceType === 'hotel' ? 'hotelPayoutDetails' : 'transportPayoutDetails';
    
    await Booking.updateOne(
      { _id: booking._id },
      { 
        $set: { 
          [updateField]: 'paid',
          [paidAtField]: new Date(),
          [payoutDetailsField]: {
            amount: payoutAmount,
            phoneNumber,
            paidAt: new Date()
          }
        } 
      },
      { strict: false }
    );

    return NextResponse.json({ success: true, message: 'Settlement processed successfully' });
  } catch (error: any) {
    console.error('Error marking settlement as paid:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}