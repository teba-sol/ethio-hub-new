import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/artisan/product.model';
import User from '@/models/User';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET as string;

async function getAuthenticatedUser(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sessionToken')?.value;
    
    if (!token) {
      return null;
    }
    
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
    const verificationStatus = searchParams.get('verificationStatus');
    const search = searchParams.get('search');

    const query: any = {};
    
    if (verificationStatus && ['Pending', 'Approved', 'Rejected'].includes(verificationStatus)) {
      query.verificationStatus = verificationStatus;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('artisanId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
