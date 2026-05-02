import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Festival from '../../../../models/festival.model';
import Booking from '../../../../models/booking.model';
import mongoose from 'mongoose';
import { attachAvailabilityToFestival } from '../../../../lib/festivalAvailability';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('Fetching festival with ID:', id);
    console.log('Is valid ObjectId:', mongoose.Types.ObjectId.isValid(id));

    await connectDB();

    const festival = await Festival.findById(id).populate('organizer', 'name email');
    console.log('Festival found:', festival ? 'yes' : 'no');
    console.log('Festival _id:', festival?._id);
    console.log('Festival status:', festival?.status);
    console.log('Festival isVerified:', festival?.isVerified);

    if (!festival) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Festival not found', debug: { id } }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const now = new Date();
    const startDate = new Date(festival.startDate);
    const endDate = new Date(festival.endDate);
    
    let displayStatus: 'upcoming' | 'live' | 'ended' = 'upcoming';
    if (now >= startDate && now <= endDate) {
      displayStatus = 'live';
    } else if (now > endDate) {
      displayStatus = 'ended';
    }

    const confirmedBookings = await Booking.find({
      festival: id,
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const festivalWithDisplay = {
      ...attachAvailabilityToFestival(festival, confirmedBookings),
      displayStatus
    };

    return new NextResponse(
      JSON.stringify({ success: true, festival: festivalWithDisplay }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching festival:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
