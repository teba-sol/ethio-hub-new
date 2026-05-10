import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import Booking from '../../../../../models/booking.model';
import mongoose from 'mongoose';
import * as jose from 'jose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'ethio-hub-secret-key-2025';
    const { payload, valid } = await jose
      .jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
      .then((res) => ({ valid: true, payload: res.payload }))
      .catch(() => ({ valid: false, payload: null }));

    if (!valid || !payload?.userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const touristId = payload.userId as string;
    const { bookingId } = await params;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ success: false, message: 'Invalid booking ID' }, { status: 400 });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      tourist: new mongoose.Types.ObjectId(touristId),
    })
      .populate('festival', 'name name_en name_am startDate endDate coverImage locationName')
      .populate('organizer', 'name email')
      .lean();

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
