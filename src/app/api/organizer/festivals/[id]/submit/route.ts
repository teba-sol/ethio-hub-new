import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Festival from '@/models/festival.model';
import { jwtVerify } from 'jose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { payload } = await jwtVerify(token, secret);
    const organizerId = payload.userId as string;

    const { id } = await params;

    const festival = await Festival.findOne({ _id: id, organizer: organizerId });
    if (!festival) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Festival not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    if (festival.verificationStatus === 'Pending Approval' || festival.verificationStatus === 'Under Review') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Festival already submitted for review' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    if (festival.verificationStatus === 'Approved') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Festival already approved' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const updateFields: any = {};

    if (festival.verificationStatus === 'Approved') {
      const newVersion = (festival.changesVersion || 0) + 1;
      Object.assign(updateFields, {
        verificationStatus: 'Pending Approval',
        submittedAt: new Date(),
        changesVersion: newVersion,
        isEditedAfterApproval: false,
        isVerified: false,
        status: 'Draft'
      });
    } else if (festival.verificationStatus === 'Rejected') {
      const newVersion = (festival.changesVersion || 0) + 1;
      Object.assign(updateFields, {
        verificationStatus: 'Pending Approval',
        submittedAt: new Date(),
        changesVersion: newVersion,
        rejectionReason: null,
        status: 'Draft'
      });
    } else {
      Object.assign(updateFields, {
        verificationStatus: 'Pending Approval',
        submittedAt: new Date()
      });
    }

    await Festival.updateOne({ _id: festival._id }, { $set: updateFields } as any);

    const updatedFestival = await Festival.findById(id);

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: updatedFestival?.changesVersion 
          ? `Changes Pending Review v${updatedFestival.changesVersion}`
          : 'Festival submitted for review',
        festival: {
          id: updatedFestival?._id,
          name: updatedFestival?.name,
          verificationStatus: updatedFestival?.verificationStatus,
          changesVersion: updatedFestival?.changesVersion,
          submittedAt: updatedFestival?.submittedAt,
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error submitting festival:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}