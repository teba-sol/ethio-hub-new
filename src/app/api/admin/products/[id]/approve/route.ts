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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    product.verificationStatus = 'Approved';
    product.rejectionReason = undefined;
    await product.save();

    return NextResponse.json({
      message: 'Product approved successfully',
      product,
    });
  } catch (error) {
    console.error('Error approving product:', error);
    return NextResponse.json(
      { message: 'Failed to approve product' },
      { status: 500 }
    );
  }
}
