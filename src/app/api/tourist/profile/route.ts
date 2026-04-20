import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
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
    const touristId = payload.userId as string;

    const user = await User.findById(touristId);
    if (!user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'User not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        profile: {
          name: user.name,
          email: user.email,
          phone: user.touristProfile?.phone || '',
          country: user.touristProfile?.country || '',
          nationality: user.touristProfile?.nationality || '',
          dateOfBirth: user.touristProfile?.dateOfBirth || '',
          profileImage: user.touristProfile?.profileImage || '',
          isComplete: !!(user.touristProfile?.phone && user.touristProfile?.country && user.touristProfile?.nationality)
        }
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching profile:', error);
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
    const touristId = payload.userId as string;

    if (!touristId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Tourist ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { name, phone, country, nationality, dateOfBirth, profileImage } = body;

    console.log('PUT profile body:', body);

    const updateData: any = {};
    if (name) updateData.name = name;
    if (!updateData.touristProfile) updateData.touristProfile = {};
    if (phone !== undefined) updateData.touristProfile.phone = phone || null;
    if (country !== undefined) updateData.touristProfile.country = country || null;
    if (nationality !== undefined) updateData.touristProfile.nationality = nationality || null;
    if (dateOfBirth !== undefined) updateData.touristProfile.dateOfBirth = dateOfBirth || null;
    if (profileImage !== undefined) updateData.touristProfile.profileImage = profileImage || null;

    console.log('Update data:', updateData);

    const user = await User.findByIdAndUpdate(
      touristId,
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'User not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const isComplete = !!(user.touristProfile?.phone && user.touristProfile?.country && user.touristProfile?.nationality);

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Profile updated successfully',
        profile: {
          name: user.name,
          email: user.email,
          phone: user.touristProfile?.phone || '',
          country: user.touristProfile?.country || '',
          nationality: user.touristProfile?.nationality || '',
          dateOfBirth: user.touristProfile?.dateOfBirth || '',
          profileImage: user.touristProfile?.profileImage || '',
          isComplete
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
    console.error('Error updating profile:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}