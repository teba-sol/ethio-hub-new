import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET as string;

async function isAdmin(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sessionToken')?.value;
    if (!token) return false;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const user = await User.findById((payload as any).userId);
    return user && user.role === 'admin';
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    if (!await isAdmin(req)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    await connectDB();
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    return NextResponse.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Error checking email existence:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
