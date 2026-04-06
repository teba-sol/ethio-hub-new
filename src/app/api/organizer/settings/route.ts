import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import * as jose from 'jose';
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
    console.log('=== PUT REQUEST START ===');
    console.log('Token exists:', !!token);
    
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jose.jwtVerify(token, secret);
    const organizerId = payload.userId as string;
    console.log('Organizer ID from token:', organizerId);

    if (!organizerId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Organizer ID not found in token' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const body = await request.json();
    console.log('Request body keys:', Object.keys(body));

    const {
      name, email, currentPassword, newPassword, resetPassword,
      organizerProfile, twoFactorEnabled, loginAlerts
    } = body;

    const user = await User.findById(organizerId);
    console.log('User found:', !!user);
    console.log('User role:', user?.role);
    console.log('User password (first 15 chars):', user?.password?.substring(0, 15));

    if (!user || user.role !== 'organizer') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Organizer not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    console.log('User retrieved for password update:', { 
      id: user._id, 
      email: user.email, 
      role: user.role,
      passwordStartsWith: user.password?.substring(0, 10),
      passwordLength: user.password?.length
    });

    const $set: any = {};

    if (name) $set.name = name;

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

    if (resetPassword && newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      $set.password = hashedPassword;
    } else if (currentPassword && newPassword) {
      console.log('=== PASSWORD VERIFICATION DEBUG ===');
      console.log('User ID:', user._id);
      console.log('User email:', user.email);
      console.log('Stored password (first 10 chars):', user.password.substring(0, 10));
      console.log('Stored password length:', user.password.length);
      console.log('Current password typed:', currentPassword);
      console.log('Current password length:', currentPassword.length);
      
      // Check if stored password is a bcrypt hash
      const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$');
      console.log('Is bcrypt hash:', isBcryptHash);
      
      let isValid = false;
      if (isBcryptHash) {
        console.log('Using bcrypt.compare...');
        isValid = await bcrypt.compare(currentPassword, user.password);
        console.log('bcrypt.compare result:', isValid);
      } else {
        console.log('Comparing plain text...');
        isValid = currentPassword === user.password;
        console.log('Plain text compare result:', isValid);
      }
      console.log('=== END PASSWORD DEBUG ===');
      
      if (!isValid) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Current password is incorrect' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      $set.password = hashedPassword;
    }

    if (twoFactorEnabled !== undefined) {
      $set['organizerProfile.twoFactorEnabled'] = twoFactorEnabled;
    }
    if (loginAlerts !== undefined) {
      $set['organizerProfile.loginAlerts'] = loginAlerts;
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
