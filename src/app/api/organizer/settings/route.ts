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
    const organizerId = payload.userId as string;

    if (!organizerId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Organizer ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const user = await User.findById(organizerId).select('-password');
    if (!user || user.role !== 'organizer') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Organizer not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const settings = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizerStatus: user.organizerStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organizerProfile: user.organizerProfile || {},
    };

    return new NextResponse(
      JSON.stringify({ success: true, settings }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication failed: Invalid token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    console.error('Error fetching organizer settings:', error);
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
    const {
      name, email, currentPassword, newPassword,
      organizerProfile
    } = body;

    const user = await User.findById(organizerId);
    if (!user || user.role !== 'organizer') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Organizer not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const $set: any = {};

    if (name) $set.name = name;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Email already in use' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }
      $set.email = email;
    }

    if (currentPassword && newPassword) {
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Current password is incorrect' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      $set.password = hashedPassword;
    }

    if (organizerProfile) {
      if (organizerProfile.companyName !== undefined) $set['organizerProfile.companyName'] = organizerProfile.companyName;
      if (organizerProfile.phone !== undefined) $set['organizerProfile.phone'] = organizerProfile.phone;
      if (organizerProfile.website !== undefined) $set['organizerProfile.website'] = organizerProfile.website;
      if (organizerProfile.address !== undefined) $set['organizerProfile.address'] = organizerProfile.address;
      if (organizerProfile.bio !== undefined) $set['organizerProfile.bio'] = organizerProfile.bio;
      if (organizerProfile.avatar !== undefined) $set['organizerProfile.avatar'] = organizerProfile.avatar;
      if (organizerProfile.payoutMethod !== undefined) $set['organizerProfile.payoutMethod'] = organizerProfile.payoutMethod;
      if (organizerProfile.bankName !== undefined) $set['organizerProfile.bankName'] = organizerProfile.bankName;
      if (organizerProfile.accountHolderName !== undefined) $set['organizerProfile.accountHolderName'] = organizerProfile.accountHolderName;
      if (organizerProfile.accountNumber !== undefined) $set['organizerProfile.accountNumber'] = organizerProfile.accountNumber;

      if (organizerProfile.notifications) {
        for (const [key, value] of Object.entries(organizerProfile.notifications)) {
          $set[`organizerProfile.notifications.${key}`] = value;
        }
      }

      if (organizerProfile.preferences) {
        for (const [key, value] of Object.entries(organizerProfile.preferences)) {
          $set[`organizerProfile.preferences.${key}`] = value;
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(organizerId, { $set }, {
      new: true,
      runValidators: true,
    }).select('-password');

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Settings updated successfully',
        settings: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          organizerStatus: updatedUser.organizerStatus,
          organizerProfile: updatedUser.organizerProfile,
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
    console.error('Error updating organizer settings:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
