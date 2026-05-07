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
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const query = { status: { $ne: 'Deleted' } };
    const total = await User.countDocuments(query);
    const adminCount = await User.countDocuments({ ...query, role: 'admin' });
    const organizerCount = await User.countDocuments({ ...query, role: 'organizer' });
    const artisanCount = await User.countDocuments({ ...query, role: 'artisan' });
    const touristCount = await User.countDocuments({ ...query, role: 'tourist' });
    const deliveryCount = await User.countDocuments({ ...query, role: 'delivery' });
    const activeCount = await User.countDocuments({ ...query, status: 'Active' });
    const suspendedCount = await User.countDocuments({ ...query, status: 'Suspended' });
    const bannedCount = await User.countDocuments({ ...query, status: 'Banned' });

    return NextResponse.json({
      stats: {
        total,
        admin: adminCount,
        organizer: organizerCount,
        artisan: artisanCount,
        tourist: touristCount,
        delivery: deliveryCount,
        active: activeCount,
        suspended: suspendedCount,
        banned: bannedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ message: 'Failed to fetch stats' }, { status: 500 });
  }
}
