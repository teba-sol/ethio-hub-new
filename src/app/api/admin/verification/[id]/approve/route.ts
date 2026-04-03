import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import VerificationRecord from '@/models/admin/verificationRecord.model';
import { jwtVerify } from 'jose';

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

    const user = await User.findById(id);
    if (!user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'User not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    if (user.role !== 'artisan') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'User is not an artisan' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    await User.findByIdAndUpdate(id, { artisanStatus: 'Approved' });

    await VerificationRecord.create({
      userId: id,
      userRole: 'artisan',
      action: 'approved',
      adminId,
      reviewedAt: new Date(),
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Artisan approved successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          artisanStatus: 'Approved',
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error approving artisan:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
