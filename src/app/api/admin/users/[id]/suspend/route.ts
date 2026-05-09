import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { sendAccountStatusEmail } from '@/lib/email';

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
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const suspensionReason = String(body?.reason || '').trim();

    if (!suspensionReason) {
      return NextResponse.json({ message: 'Suspension reason is required' }, { status: 400 });
    }

    if (id === admin._id.toString()) {
      return NextResponse.json({ message: 'Cannot suspend your own account' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    user.status = 'Suspended';
    user.suspensionReason = suspensionReason;
    user.suspendedAt = new Date();
    await user.save();

    // Send email notification
    try {
      await sendAccountStatusEmail({
        to: user.email,
        name: user.name,
        status: 'Suspended',
        reason: suspensionReason
      });
    } catch (emailErr) {
      console.error('Failed to send suspension email:', emailErr);
    }

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return NextResponse.json({ message: 'User suspended successfully', user: userResponse });
  } catch (error) {
    console.error('Error suspending user:', error);
    return NextResponse.json({ message: 'Failed to suspend user' }, { status: 500 });
  }
}
