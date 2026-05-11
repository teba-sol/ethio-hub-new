import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import * as jose from 'jose';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

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
    const userId = payload.userId as string;

    const user = await User.findById(userId).select('-password');
    if (!user || user.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Admin access required' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, user }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching admin profile:', error);
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
    const userId = payload.userId as string;

    const body = await request.json();
    const { name, phone, profileImage, currentPassword, newPassword } = body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Admin not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const updateData: any = {};

    // Profile Updates
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    // Password Updates
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Current password is incorrect' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

      if (currentPassword === newPassword) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'New password must be different' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'No changes provided' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select('-password');

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Profile updated successfully', user: updatedUser }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error updating admin profile:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
