import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { jwtVerify } from 'jose';

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get('sessionToken')?.value;
  if (!token) return null;

  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
  const { payload } = await jwtVerify(token, secret);
  return payload.userId as string;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = await getAuthenticatedUser(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await User.findById(userId).select('-password');
    if (!user || user.role !== 'organizer') {
      return NextResponse.json(
        { success: false, message: 'Organizer not found' },
        { status: 404 }
      );
    }

    const profile = user.organizerProfile || {};
    const isProfileComplete = !!(
      profile.companyName &&
      profile.phone &&
      profile.bio &&
      profile.address &&
      profile.payoutMethod &&
      profile.bankName &&
      profile.accountHolderName &&
      profile.accountNumber
    );

    return NextResponse.json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizerStatus: user.organizerStatus,
        isProfileComplete,
        organizerProfile: profile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });

  } catch (error: any) {
    console.error('Error fetching organizer profile:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const userId = await getAuthenticatedUser(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'organizer') {
      return NextResponse.json(
        { success: false, message: 'Organizer not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      companyName,
      phone,
      website,
      address,
      bio,
      avatar,
      payoutMethod,
      bankName,
      accountHolderName,
      accountNumber,
      notifications,
      preferences,
    } = body;

    const $set: any = {};
    const $unset: any = {};

    if (name) $set.name = name;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Email already in use' },
          { status: 400 }
        );
      }
      $set.email = email;
    }

    if (companyName !== undefined) $set['organizerProfile.companyName'] = companyName;
    if (phone !== undefined) $set['organizerProfile.phone'] = phone;
    if (website !== undefined) $set['organizerProfile.website'] = website;
    if (address !== undefined) $set['organizerProfile.address'] = address;
    if (bio !== undefined) $set['organizerProfile.bio'] = bio;
    if (avatar !== undefined) $set['organizerProfile.avatar'] = avatar;
    if (payoutMethod !== undefined) $set['organizerProfile.payoutMethod'] = payoutMethod;
    if (bankName !== undefined) $set['organizerProfile.bankName'] = bankName;
    if (accountHolderName !== undefined) $set['organizerProfile.accountHolderName'] = accountHolderName;
    if (accountNumber !== undefined) $set['organizerProfile.accountNumber'] = accountNumber;

    if (notifications) {
      for (const [key, value] of Object.entries(notifications)) {
        $set[`organizerProfile.notifications.${key}`] = value;
      }
    }

    if (preferences) {
      for (const [key, value] of Object.entries(preferences)) {
        $set[`organizerProfile.preferences.${key}`] = value;
      }
    }

    const updateOps: any = {};
    if (Object.keys($set).length > 0) updateOps.$set = $set;
    if (Object.keys($unset).length > 0) updateOps.$unset = $unset;

    if (Object.keys(updateOps).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields to update' },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateOps, {
      new: true,
      runValidators: true,
    }).select('-password');

    const profile = updatedUser.organizerProfile || {};
    const isProfileComplete = !!(
      profile.companyName &&
      profile.phone &&
      profile.bio &&
      profile.address &&
      profile.payoutMethod &&
      profile.bankName &&
      profile.accountHolderName &&
      profile.accountNumber
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        organizerStatus: updatedUser.organizerStatus,
        isProfileComplete,
        organizerProfile: profile,
      }
    });

  } catch (error: any) {
    console.error('Error updating organizer profile:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
