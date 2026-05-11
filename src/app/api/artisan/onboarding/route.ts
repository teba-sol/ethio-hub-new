import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import ArtisanProfile from '@/models/artisan/artisanProfile.model';
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
          profileImage: user.profileImage || null,
        },
        profile: profile || null,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching artisan profile:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const user = await User.findById(userId);
    if (!user || user.role !== 'artisan') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Artisan not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    const body = await request.json();
    const {
      phone,
      gender,
      businessName,
      category,
      experience,
      bio,
      country,
      region,
      city,
      address,
      latitude,
      longitude,
      bankName,
      accountName,
      accountNumber,
      profileImage,
      idDocument,
      workshopPhoto,
      craftProcessPhoto,
      productSamplePhotos,
    } = body;

    const errors: string[] = [];
    if (!phone || !phone.trim()) errors.push('Phone number is required');
    if (!gender) errors.push('Gender is required');
    if (!businessName || !businessName.trim()) errors.push('Business name is required');
    if (!category) errors.push('Category is required');
    if (!experience) errors.push('Years of experience is required');
    if (!bio || !bio.trim()) errors.push('Bio is required');
    if (!region || !region.trim()) errors.push('Region is required');
    if (!city || !city.trim()) errors.push('City is required');
    if (!address || !address.trim()) errors.push('Address is required');
    if (!bankName || !bankName.trim()) errors.push('Bank/Wallet is required');
    if (!accountName || !accountName.trim()) errors.push('Account name is required');
    if (!accountNumber || !accountNumber.trim()) errors.push('Account number is required');

    if (errors.length > 0) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing required fields', errors }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const existingProfile = await ArtisanProfile.findOne({ userId });
    if (existingProfile) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Profile already submitted' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    await ArtisanProfile.create({
      userId,
      phone: phone.trim(),
      gender,
      businessName: businessName.trim(),
      category,
      experience: Number(experience),
      bio: bio.trim(),
      country: country || 'Ethiopia',
      region: region.trim(),
      city: city.trim(),
      address: address.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      bankName: bankName.trim(),
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      profileImage: profileImage || undefined,
      idDocument: idDocument || undefined,
      workshopPhoto: workshopPhoto || undefined,
      craftProcessPhoto: craftProcessPhoto || undefined,
      productSamplePhotos: productSamplePhotos || [],
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        artisanStatus: 'Pending',
        profileImage: profileImage || undefined
      },
      { new: true }
    ).select('-password');

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Application submitted successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          artisanStatus: updatedUser.artisanStatus,
        },
      }),
      { status: 201, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in artisan onboarding:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
