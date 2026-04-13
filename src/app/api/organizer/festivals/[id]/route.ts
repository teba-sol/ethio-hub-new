import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import Festival from '../../../../../models/festival.model';
import * as jose from 'jose';

export async function GET(request: NextRequest) {
  let id: string | undefined;
  try {
    const { pathname } = new URL(request.url);
    id = pathname.split('/').pop();

    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Authentication required' }), { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const organizerId = payload.userId as string;

    if (!id) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Festival ID is required' }), { status: 400 });
    }

    const festival = await Festival.findOne({ _id: id, organizer: organizerId });

    if (!festival) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Festival not found or you do not have permission to view it.' }), { status: 404 });
    }

    return new NextResponse(JSON.stringify({ success: true, festival }), { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching festival by ID: ${id}`, error);
    if (error.name === 'CastError') {
        return new NextResponse(JSON.stringify({ success: false, message: 'Invalid Festival ID format.' }), { status: 400 });
    }
    return new NextResponse(JSON.stringify({ success: false, message: 'Internal Server Error' }), { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let id: string | undefined;
  try {
    const { pathname } = new URL(request.url);
    id = pathname.split('/').pop();
    const body = await request.json();

    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Authentication required' }), { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const organizerId = payload.userId as string;

    if (!id) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Festival ID is required' }), { status: 400 });
    }

    const existingFestival = await Festival.findOne({ _id: id, organizer: organizerId });
    if (!existingFestival) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Festival not found or you do not have permission to edit it.' }), { status: 404 });
    }

    const isApprovedEvent = existingFestival.verificationStatus === 'Approved';
    
    let normalUpdate = { ...body };

    if (isApprovedEvent) {
      normalUpdate.lastEditedAt = new Date();
      const newVersion = (existingFestival.changesVersion || 0) + 1;
      
      await Festival.collection.updateOne(
        { _id: existingFestival._id },
        {
          $set: {
            lastEditedAt: new Date(),
            changesVersion: newVersion,
            verificationStatus: 'Draft',
            status: 'Draft',
            isVerified: false,
            isEditedAfterApproval: true
          }
        }
      );
    }

    const updatedFestival = await Festival.findOneAndUpdate(
      { _id: id, organizer: organizerId },
      isApprovedEvent ? { $set: normalUpdate } : { $set: normalUpdate },
      { new: true }
    );

    const finalFestival = await Festival.findById(id);
    return new NextResponse(JSON.stringify({ success: true, festival: finalFestival }), { status: 200 });

  } catch (error: any) {
    console.error(`Error updating festival by ID: ${id}`, error);
    return new NextResponse(JSON.stringify({ success: false, message: 'Internal Server Error: ' + error.message }), { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let id: string | undefined;
  try {
    const { pathname } = new URL(request.url);
    id = pathname.split('/').pop();

    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Authentication required' }), { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const organizerId = payload.userId as string;

    if (!id) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Festival ID is required' }), { status: 400 });
    }

    const deletedFestival = await Festival.findOneAndDelete({ _id: id, organizer: organizerId });

    if (!deletedFestival) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Festival not found or you do not have permission to delete it.' }), { status: 404 });
    }

    return new NextResponse(JSON.stringify({ success: true, message: 'Festival deleted successfully' }), { status: 200 });

  } catch (error: any) {
    console.error(`Error deleting festival by ID: ${id}`, error);
    if (error.name === 'CastError') {
      return new NextResponse(JSON.stringify({ success: false, message: 'Invalid Festival ID format.' }), { status: 400 });
    }
    return new NextResponse(JSON.stringify({ success: false, message: 'Internal Server Error' }), { status: 500 });
  }
}