import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { jwtVerify } from 'jose';

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
    if (!user || user.role !== 'organizer') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Organizer not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizerStatus: user.organizerStatus,
          organizerProfile: user.organizerProfile || {},
        }
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching organizer profile:', error);
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
      organizerName,
      phoneNumber,
      description,
      website,
      country,
      region,
      city,
      address,
      paymentMethod,
      bankName,
      accountName,
      accountNumber,
      avatar,
    } = body;

    const errors: string[] = [];
    if (!organizerName || !organizerName.trim()) errors.push('Organizer name is required');
    if (!phoneNumber || !phoneNumber.trim()) errors.push('Phone number is required');
    if (!description || !description.trim()) errors.push('Description is required');
    if (!address || !address.trim()) errors.push('Address is required');
    if (!paymentMethod) errors.push('Payment method is required');
    if (!bankName || !bankName.trim()) errors.push('Bank/Wallet name is required');
    if (!accountName || !accountName.trim()) errors.push('Account name is required');
    if (!accountNumber || !accountNumber.trim()) errors.push('Account number is required');

    if (errors.length > 0) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing required fields', errors }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'organizer') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Organizer not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const fullAddress = [address, city, region, country].filter(Boolean).join(', ');
    const payout = paymentMethod === 'Bank Account' ? 'bank' : paymentMethod === 'Mobile Wallet' ? 'telebirr' : paymentMethod;

    const updateOps: any = {
      $set: {
        'organizerProfile.companyName': organizerName.trim(),
        'organizerProfile.phone': phoneNumber.trim(),
        'organizerProfile.bio': description.trim(),
        'organizerProfile.address': fullAddress,
        'organizerProfile.payoutMethod': payout,
        'organizerProfile.bankName': bankName.trim(),
        'organizerProfile.accountHolderName': accountName.trim(),
        'organizerProfile.accountNumber': accountNumber.trim(),
        'organizerProfile.isVerified': false,
        organizerStatus: 'Approved',
      },
      $setOnInsert: {
        'organizerProfile.notifications.newBooking': true,
        'organizerProfile.notifications.newReview': true,
        'organizerProfile.notifications.payoutProcessed': true,
        'organizerProfile.notifications.eventReminders': false,
        'organizerProfile.notifications.emailFrequency': 'instant',
        'organizerProfile.notifications.smsNotifications': false,
        'organizerProfile.notifications.pushNotifications': true,
        'organizerProfile.preferences.language': 'English',
        'organizerProfile.preferences.currency': 'ETB',
        'organizerProfile.preferences.timezone': 'Africa/Addis_Ababa',
        'organizerProfile.preferences.dateFormat': 'DD/MM/YYYY',
        'organizerProfile.preferences.defaultLandingPage': 'Overview',
        'organizerProfile.preferences.darkMode': false,
      },
    };

    if (website?.trim()) {
      updateOps.$set['organizerProfile.website'] = website.trim();
    }

    if (avatar) {
      updateOps.$set['organizerProfile.avatar'] = avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateOps, {
      new: true,
      runValidators: true,
    }).select('-password');

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Profile completed successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          organizerStatus: updatedUser.organizerStatus,
          organizerProfile: updatedUser.organizerProfile,
        }
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in onboarding:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
