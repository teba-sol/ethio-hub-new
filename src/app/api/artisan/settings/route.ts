import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import ArtisanProfile from '../../../../models/artisan/artisanProfile.model';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

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
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const user = await User.findById(userId).select('-password');
    if (!user || user.role !== 'artisan') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Artisan not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const profile = await ArtisanProfile.findOne({ userId });

    return new NextResponse(
      JSON.stringify({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          artisanStatus: user.artisanStatus,
        },
        profile: profile || null,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching artisan settings:', error);
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
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const body = await request.json();
    const { 
      profileImage, 
      businessName, 
      bio, 
      city, 
      region, 
      country, 
      experience,
      currentPassword,
      newPassword 
    } = body;

    // Handle Password Update
    if (currentPassword && newPassword) {
      const user = await User.findById(userId);
      if (!user) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'User not found' }),
          { status: 404, headers: { 'content-type': 'application/json' } }
        );
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Incorrect current password' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

      // Prevent using the same password
      if (currentPassword === newPassword) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'New password must be different from the current one' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      return new NextResponse(
        JSON.stringify({ success: true, message: 'Password updated successfully' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    // Handle Profile Update
    const updateData: any = {};
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (businessName !== undefined) updateData.businessName = businessName;
    if (bio !== undefined) updateData.bio = bio;
    if (city !== undefined) updateData.city = city;
    if (region !== undefined) updateData.region = region;
    if (country !== undefined) updateData.country = country;
    if (experience !== undefined) updateData.experience = Number(experience);

    if (Object.keys(updateData).length === 0) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'No data provided for update' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const updatedProfile = await ArtisanProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedProfile) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Profile not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, profile: updatedProfile, message: 'Profile updated successfully' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error updating artisan settings:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
