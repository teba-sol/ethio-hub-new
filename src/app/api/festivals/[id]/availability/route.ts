import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import Festival from '../../../../../models/festival.model';
import Booking from '../../../../../models/booking.model';
import { attachAvailabilityToFestival } from '../../../../../lib/festivalAvailability';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    const festival = await Festival.findById(id);
    if (!festival) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Festival not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const confirmedBookings = await Booking.find({
      festival: id,
      status: { $in: ['confirmed', 'completed'] },
    }).lean();

    const festivalWithAvailability = attachAvailabilityToFestival(festival, confirmedBookings);

    return new NextResponse(
      JSON.stringify({
        success: true,
        hotels: festivalWithAvailability.hotels || [],
        transportation: festivalWithAvailability.transportation || [],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error calculating availability:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
