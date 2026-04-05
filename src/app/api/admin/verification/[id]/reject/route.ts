import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import VerificationRecord from '@/models/admin/verificationRecord.model';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    if (!db) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Database not connected' }),
        { status: 503, headers: { 'content-type': 'application/json' } }
      );
    }

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jwtVerify(token, secret);
    const adminId = payload.userId as string;
    const adminRole = payload.role as string;

    if (adminRole !== 'admin') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Admin access required' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Rejection reason is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const trimmedReason = reason.trim();

    // Single update - no need to fetch first
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { artisanStatus: 'Rejected', rejectionReason: trimmedReason },
      { new: true, select: 'name email artisanStatus role rejectionReason' }
    );

    if (!updatedUser) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'User not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    if (updatedUser.role !== 'artisan') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'User is not an artisan' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Fire-and-forget: log verification record without blocking response
    VerificationRecord.create({
      userId: id,
      userRole: 'artisan',
      action: 'rejected',
      adminId,
      reason: trimmedReason,
      reviewedAt: new Date(),
    }).catch(err => console.error('Failed to create verification record:', err));

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Artisan rejected successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          artisanStatus: 'Rejected',
          rejectionReason: trimmedReason,
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error rejecting artisan:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
