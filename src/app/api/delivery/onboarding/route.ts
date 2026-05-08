import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET as string;

async function getAuthenticatedUser(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('sessionToken')?.value;
  if (!token) return null;
  const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
  return (payload as any).userId;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = await getAuthenticatedUser(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'delivery') {
      return NextResponse.json({ success: false, message: 'Delivery guy not found' }, { status: 404 });
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        data: {
          deliveryStatus: user.deliveryStatus,
          deliveryProfile: user.deliveryProfile || {},
          profileImage: user.profileImage,
          rejectionReason: user.rejectionReason || '',
        }
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Delivery onboarding GET error:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Failed to fetch data' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const userId = (payload as any).userId;

    const user = await User.findById(userId);
    if (!user || user.role !== 'delivery') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Delivery guy not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }

    if (user.deliveryStatus === 'Pending' || user.deliveryStatus === 'Under Review' || user.deliveryStatus === 'Approved') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Application already submitted and is under review' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { bankName, accountNumber, telebirrNumber, profileImage, idDocument } = body;

    const errors: string[] = [];
    if (!bankName || !bankName.trim()) errors.push('Bank name is required');
    if (!accountNumber || !accountNumber.trim()) errors.push('Account number is required');
    if (!profileImage) errors.push('Profile image is required');
    if (!idDocument) errors.push('National ID document is required');

    if (errors.length > 0) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing required fields', errors }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    user.profileImage = profileImage;
    user.deliveryStatus = 'Pending';
    user.rejectionReason = undefined;
    user.deliveryProfile = {
      ...user.deliveryProfile,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      telebirrNumber: telebirrNumber || '',
      idDocument,
    };

    await user.save();

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Onboarding application submitted successfully' }),
      { status: 201, headers: { 'content-type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Delivery onboarding error:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Failed to submit onboarding' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
