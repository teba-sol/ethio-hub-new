import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ArtisanProfile from '@/models/artisan/artisanProfile.model';
import { verifyToken } from '@/services/auth.service';
import { JWTPayload } from 'jose';

const CHAPA_API_URL = 'https://api.chapa.co';

const BANK_CODE_MAP: Record<string, string> = {
  'Commercial Bank of Ethiopia': 'CBE',
  'Dashen Bank': 'DASHEN',
  'Awash Bank': 'AWASH',
  'Bank of Abyssinia': 'BOA',
  'Telebirr': 'TELEBIRR',
  'CBE Birr': 'CBE_BIRR',
};

async function getUserFromToken(token: string) {
  const result = await verifyToken(token);
  if (!result.valid || !result.payload) return null;
  return result.payload as JWTPayload & { userId: string; role: string };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user || user.role !== 'artisan') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { businessName, bankName, accountName, accountNumber } = body;

    if (!businessName || !bankName || !accountName || !accountNumber) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bankCode = BANK_CODE_MAP[bankName];
    if (!bankCode) {
      return NextResponse.json(
        { success: false, message: 'Invalid bank name' },
        { status: 400 }
      );
    }

    const existingProfile = await ArtisanProfile.findOne({ userId: user.userId });
    if (existingProfile?.chute_subaccount_id) {
      return NextResponse.json({
        success: true,
        subaccount_id: existingProfile.chute_subaccount_id,
        message: 'Subaccount already exists'
      });
    }

    const response = await fetch(`${CHAPA_API_URL}/v1/subaccount`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_name: businessName,
        bank_code: bankCode,
        account_name: accountName,
        account_number: accountNumber,
        split_type: 'percentage',
        split_value: 10,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.data?.subaccount_id) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to create subaccount' },
        { status: response.status }
      );
    }

    const subaccountId = data.data.subaccount_id;

    await ArtisanProfile.findOneAndUpdate(
      { userId: user.userId },
      { chute_subaccount_id: subaccountId },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      subaccount_id: subaccountId,
      message: 'Subaccount created successfully'
    });
  } catch (error: any) {
    console.error('Error creating subaccount:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}