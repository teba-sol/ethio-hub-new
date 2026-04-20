import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Festival from '@/models/festival.model';
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

    const festival = await Festival.findById(id);
    if (!festival) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Event not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const updateFields: any = {
      verificationStatus: 'Approved',
      isVerified: true,
      status: 'Published',
      reviewedAt: new Date(),
      reviewedBy: adminId,
      isEditedAfterApproval: false,
      changesVersion: 0
    };

    await Festival.updateOne({ _id: id }, { $set: updateFields } as any);

    const updatedFestival = await Festival.findById(id);

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Event approved and published successfully',
        event: {
          id: updatedFestival?._id,
          name: updatedFestival?.name,
          verificationStatus: updatedFestival?.verificationStatus,
          status: updatedFestival?.status,
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error approving event:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}