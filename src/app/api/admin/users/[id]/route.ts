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

export async function GET(
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
    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(
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
    const body = await req.json();
    const { name, email, role, phone, artisanStatus, organizerStatus } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) {
      const existing = await User.findOne({ email, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
      }
      user.email = email;
    }
    if (role !== undefined) user.role = role.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (artisanStatus !== undefined) user.artisanStatus = artisanStatus;
    if (organizerStatus !== undefined) user.organizerStatus = organizerStatus;

    await user.save();

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return NextResponse.json({ message: 'User updated successfully', user: userResponse });
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === 11000) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
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

    if (id === admin._id.toString()) {
      return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    user.status = 'Deleted';
    await user.save();

    // Send email notification
    try {
      await sendAccountStatusEmail({
        to: user.email,
        name: user.name,
        status: 'Deleted',
        reason: 'Account has been deleted by an administrator.'
      });
    } catch (emailErr) {
      console.error('Failed to send deletion email:', emailErr);
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'Failed to delete user' }, { status: 500 });
  }
}
