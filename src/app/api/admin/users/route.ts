import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';

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
    const { name, email, role } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ message: 'Name, email, and role are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const defaultPassword = 'TempPass123!';
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role.toLowerCase(),
      status: 'Active',
    });

    const userResponse = newUser.toObject();
    delete (userResponse as any).password;

    return NextResponse.json({
      message: 'User created successfully. Default password: TempPass123!',
      user: userResponse,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 11000) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
  }
}
