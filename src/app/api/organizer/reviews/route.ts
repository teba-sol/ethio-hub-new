import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Review from '../../../../models/review.model';
import * as jose from 'jose';

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
    const organizerId = payload.userId as string;

    if (!organizerId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Organizer ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const isApproved = searchParams.get('isApproved');
    const festivalId = searchParams.get('festivalId');

    const query: any = { organizer: organizerId };
    if (isApproved !== null) query.isApproved = isApproved === 'true';
    if (festivalId) query.festival = festivalId;

    const reviews = await Review.find(query)
      .populate('tourist', 'name email')
      .populate('festival', 'name')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length 
      : 0;

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        reviews,
        stats: {
          totalReviews,
          avgRating: Math.round(avgRating * 10) / 10,
        }
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    console.error('Error fetching reviews:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const organizerId = payload.userId as string;

    if (!organizerId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Organizer ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { reviewId, isApproved } = body;

    if (!reviewId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Review ID is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const review = await Review.findOne({ _id: reviewId, organizer: organizerId });
    if (!review) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Review not found or you do not have permission' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: { isApproved } },
      { new: true }
    ).populate('tourist', 'name email').populate('festival', 'name');

    return new NextResponse(
      JSON.stringify({ success: true, review: updatedReview }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    if (error.name === 'CastError') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid Review ID format' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
    console.error('Error updating review:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}