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
      telebirrNumber,
      chapaAccountId,
      logo,
      businessLicense,
    } = body;

    const errors: string[] = [];
    if (!organizerName || !organizerName.trim()) errors.push('Organizer name is required');
    if (!phoneNumber || !phoneNumber.trim()) errors.push('Phone number is required');
    if (!description || !description.trim()) errors.push('Description is required');
    if (!country) errors.push('Country is required');
    if (!region || !region.trim()) errors.push('Region is required');
    if (!city || !city.trim()) errors.push('City is required');
    if (!address || !address.trim()) errors.push('Address is required');
    if (!paymentMethod) errors.push('Payment method is required');

    if (paymentMethod === 'bank') {
      if (!bankName || !bankName.trim()) errors.push('Bank name is required');
      if (!accountName || !accountName.trim()) errors.push('Account name is required');
      if (!accountNumber || !accountNumber.trim()) errors.push('Account number is required');
    } else if (paymentMethod === 'telebirr') {
      if (!telebirrNumber || !telebirrNumber.trim()) errors.push('Telebirr number is required');
    } else if (paymentMethod === 'chapa') {
      if (!chapaAccountId || !chapaAccountId.trim()) errors.push('Chapa account ID is required');
    }

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

    const organizerProfileData = {
      userId: new (await import('mongoose')).default.Types.ObjectId(userId),
      companyName: organizerName.trim(),
      phone: phoneNumber.trim(),
      website: website?.trim() || undefined,
      bio: description.trim(),
      country: country || 'Ethiopia',
      region: region.trim(),
      city: city.trim(),
      address: address.trim(),
      payoutMethod: paymentMethod,
      bankName: paymentMethod === 'bank' ? bankName?.trim() : undefined,
      accountHolderName: paymentMethod === 'bank' ? accountName?.trim() : undefined,
      accountNumber: paymentMethod === 'bank' ? accountNumber?.trim() : undefined,
      telebirrNumber: paymentMethod === 'telebirr' ? telebirrNumber?.trim() : undefined,
      chapaAccountId: paymentMethod === 'chapa' ? chapaAccountId?.trim() : undefined,
      logo: logo || undefined,
      businessLicense: businessLicense || undefined,
    };

    const organizerProfile = await OrganizerProfile.findOneAndUpdate(
      { userId },
      organizerProfileData,
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(userId, {
      organizerStatus: 'Pending',
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