import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Festival from '../../../../models/festival.model';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await connectDB();

    const festival = await Festival.findById(id).populate('organizer', 'name email');

    if (!festival) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Festival not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, festival }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching festival:', error);
    if (error.name === 'CastError') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid Festival ID format' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
