import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/booking.model';
import Festival from '@/models/festival.model';
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
      status: 'confirmed',
    };

    if (serviceType === 'hotel') {
      query.hasHotelBooking = true;
    } else if (serviceType === 'transport') {
      query.hasTransportBooking = true;
    }

    const bookings = await Booking.find(query)
      .populate('festival', 'name name_en name_am')
      .populate('tourist', 'name email')
      .lean();

    const settlements = bookings.map((booking: any) => {
      const isHotel = booking.bookingDetails?.room?.hotelName;
      const isTransport = booking.bookingDetails?.transport?.transportId;

      if (serviceType === 'hotel' && !isHotel) return null;
      if (serviceType === 'transport' && !isTransport) return null;

      const totalServicePrice = (isHotel 
        ? booking.bookingDetails?.room?.roomPrice * (booking.bookingDetails?.room?.nights || 1)
        : booking.bookingDetails?.transport?.price * (booking.bookingDetails?.transport?.days || 1)
      ) || 0;

      const organizerFee = Math.round(totalServicePrice * 0.05 * 100) / 100;
      const providerDue = totalServicePrice - organizerFee;

      return {
        _id: booking._id,
        festivalId: booking.festival?._id,
        festivalName: booking.festival?.name_en || booking.festival?.name || booking.festival?.name_am || 'Event',
        serviceType: isHotel ? 'hotel' : 'transport',
        providerId: isHotel ? booking.bookingDetails?.room?.hotelId : booking.bookingDetails?.transport?.transportId,
        providerName: isHotel ? booking.bookingDetails?.room?.hotelName : booking.bookingDetails?.transport?.type || 'Provider',
        userId: booking.tourist?._id,
        userName: booking.tourist?.name || 'Guest',
        userEmail: booking.tourist?.email || 'guest@email.com',
        price: totalServicePrice,
        organizerFee,
        providerDue,
        status: (booking as any).settlementStatus || 'pending',
        bookedAt: booking.bookedAt,
        paidAt: (booking as any).paidAt,
        details: isHotel ? {
          hotelName: booking.bookingDetails?.room?.hotelName,
          roomType: booking.bookingDetails?.room?.roomName,
          checkIn: booking.checkInDate,
          checkOut: booking.checkOutDate,
        } : {
          transportType: booking.bookingDetails?.transport?.type,
          pickupLocation: '',
          dropoffLocation: '',
        },
      };
    }).filter(Boolean);

    let filteredSettlements = settlements;
    if (status === 'pending') {
      filteredSettlements = settlements.filter((s: any) => s.status === 'pending');
    } else if (status === 'paid') {
      filteredSettlements = settlements.filter((s: any) => s.status === 'paid');
    }

    return NextResponse.json({ success: true, settlements: filteredSettlements });
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

    const { pathname } = new URL(request.url);
    const parts = pathname.split('/');
    const bookingId = parts[parts.length - 2];

    if (!bookingId) {
      return NextResponse.json({ success: false, message: 'Booking ID required' }, { status: 400 });
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, organizer: new mongoose.Types.ObjectId(organizerId) },
      { 
        settlementStatus: 'paid',
        paidAt: new Date() 
      },
      { new: true }
    );

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Error marking settlement as paid:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}