import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { sendUserWelcomeEmail } from '@/lib/email';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET as string;

async function getAuthenticatedUser(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sessionToken')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const user = await User.findById((payload as any).userId).select('-password');
    return user;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    const query: any = { status: { $ne: 'Deleted' } };
    if (role && role !== 'All') query.role = role.toLowerCase();
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    return NextResponse.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, role, deliveryProfile } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ message: 'Name, email, and role are required' }, { status: 400 });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isLikelyRandom = (str: string) => {
      const consonants = str.match(/[^aeiou0-9@.]{4,}/gi);
      if (consonants) return true;
      const [name, domain] = str.split('@');
      if (!name || name.length < 3) return true;
      if (!domain || domain.length < 4) return true;
      return false;
    };

    if (!emailRegex.test(email) || isLikelyRandom(email)) {
      return NextResponse.json({ message: 'Invalid or suspicious email address' }, { status: 400 });
    }

    const validRoles = ['admin', 'tourist', 'organizer', 'artisan', 'delivery'];
    if (!validRoles.includes(role.toLowerCase())) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    if (role.toLowerCase() === 'delivery') {
      const phone = deliveryProfile?.phone || '';
      const phoneRegex = /^(09|07)\d{8}$/;
      if (!phone || !deliveryProfile?.vehicleType) {
        return NextResponse.json({ message: 'Phone and vehicle type are required for delivery personnel' }, { status: 400 });
      }
      if (!phoneRegex.test(phone)) {
        return NextResponse.json({ message: 'Delivery phone must be 10 digits starting with 09 or 07' }, { status: 400 });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // Generate a secure random temporary password
    const tempPassword = crypto.randomBytes(6).toString('hex').toUpperCase(); // 12 char readable hex
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const userData: any = {
      name,
      email,
      password: hashedPassword,
      role: role.toLowerCase(),
      status: 'Active',
      isVerified: true,
    };

    if (role.toLowerCase() === 'delivery' && deliveryProfile) {
      userData.deliveryProfile = {
        phone: deliveryProfile.phone || '',
        vehicleType: deliveryProfile.vehicleType || '',
        licensePlate: deliveryProfile.licensePlate || '',
        availabilityStatus: 'available',
        totalDeliveries: 0,
        rating: 0,
        totalEarnings: 0,
      };
    }

    const newUser = await User.create(userData);

    // Send welcome email with credentials
    try {
      console.log(`[AdminAPI] Attempting to send welcome email to: ${email}`);
      await sendUserWelcomeEmail({
        to: email,
        name: name,
        role: role,
        password: tempPassword
      });
      console.log(`[AdminAPI] Welcome email sent successfully to: ${email}`);
    } catch (emailErr: any) {
      console.error('[AdminAPI] Failed to send welcome email:', emailErr.message);
      // We still return 201 because the user was created, but we log the error
    }

    const userResponse = newUser.toObject();
    delete (userResponse as any).password;

    return NextResponse.json({
      message: 'User created successfully.',
      user: userResponse,
      tempPassword,
      success: true,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 11000) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
  }
}
