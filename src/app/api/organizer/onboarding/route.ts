import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import OrganizerProfile from '../../../../models/organizer/organizerProfile.model';
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

    const organizerProfile = await OrganizerProfile.findOne({ userId });

    return new NextResponse(
      JSON.stringify({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizerStatus: user.organizerStatus,
          organizerProfile: organizerProfile || {},
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
      contactPersonName,
      phoneNumber,
      organizerType,
      description,
      experienceYears,
      website,
      socialMedia,
      country,
      region,
      city,
      address,
      latitude,
      longitude,
      paymentMethod,
      bankName,
      accountName,
      bankAccountNumber,
      walletPhoneNumber,
      logo,
      documents
    } = body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'organizer') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Organizer not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const organizerProfileData = {
      userId: new (await import('mongoose')).default.Types.ObjectId(userId),
      companyName: organizerName?.trim(),
      contactPersonName: contactPersonName?.trim(),
      phone: phoneNumber?.trim(),
      organizerType,
      website: website?.trim() || undefined,
      socialMedia: socialMedia?.trim() || undefined,
      bio: description?.trim(),
      experienceYears,
      country: country || 'Ethiopia',
      region: region?.trim(),
      city: city?.trim(),
      address: address?.trim(),
      latitude,
      longitude,
      payoutMethod: paymentMethod,
      bankName: paymentMethod === 'Bank Account' ? bankName?.trim() : bankName?.trim(), // Sometimes bankName is used for wallet provider
      accountHolderName: accountName?.trim(),
      accountNumber: paymentMethod === 'Bank Account' ? bankAccountNumber?.trim() : undefined,
      telebirrNumber: paymentMethod === 'Mobile Wallet' ? walletPhoneNumber?.trim() : undefined,
      logo: logo || undefined,
      businessLicense: documents?.businessLicense || undefined,
      tourismLicense: documents?.tourismLicense || undefined,
      taxCert: documents?.taxCert || undefined,
      eventPhotos: documents?.eventPhotos || undefined,
      eventPoster: documents?.eventPoster || undefined,
      eventVideos: documents?.eventVideos || undefined,
    };

    const organizerProfile = await OrganizerProfile.findOneAndUpdate(
      { userId },
      organizerProfileData,
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(userId, {
      organizerStatus: 'Pending',
      profileImage: logo || undefined
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Profile submitted for verification',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizerStatus: 'Pending',
          organizerProfile,
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