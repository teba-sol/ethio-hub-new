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
      console.error('No sessionToken cookie found');
      return null;
    }
    
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const userId = (payload as any).userId;
    const user = await User.findById(userId).select('-password');
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
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const query: any = { artisanId: user._id };
    
    if (status && ['Draft', 'Published', 'Archived'].includes(status)) {
      query.status = status;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const {
      name,
      images,
      description,
      material,
      handmadeBy,
      region,
      careInstructions,
      price,
      discountPrice,
      stock,
      sku,
      category,
      subcategory,
      tags,
      weight,
      deliveryTime,
      shippingFee,
      status,
    } = body;

    if (!name || !description || !price || !stock || !category || !deliveryTime || !shippingFee) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const productStatus = status === 'Publish' ? 'Published' : 'Draft';

    const tagsArray = tags
      ? (typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : tags)
      : [];

    const product = await Product.create({
      artisanId: user._id,
      name,
      images: images || [],
      description,
      material,
      handmadeBy,
      region,
      careInstructions,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      stock: Number(stock),
      sku,
      category,
      subcategory,
      tags: tagsArray,
      weight,
      deliveryTime,
      shippingFee,
      status: productStatus,
    });

    return NextResponse.json(
      {
        message: productStatus === 'Published' ? 'Product published successfully' : 'Product saved as draft',
        product,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating product:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    // If it's a validation error, send more details
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { message: 'Validation error', errors: Object.values(error.errors).map((e: any) => e.message) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create product', error: error?.message },
      { status: 500 }
    );
  }
}
