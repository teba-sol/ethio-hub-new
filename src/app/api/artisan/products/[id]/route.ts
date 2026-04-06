import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/artisan/product.model';
import User from '@/models/User';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET as string;

async function getAuthenticatedUser() {
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const product = await Product.findOne({
      _id: id,
      artisanId: user._id,
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const product = await Product.findOne({
      _id: id,
      artisanId: user._id,
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
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

    if (name !== undefined) product.name = name;
    if (images !== undefined) product.images = images;
    if (description !== undefined) product.description = description;
    if (material !== undefined) product.material = material;
    if (handmadeBy !== undefined) product.handmadeBy = handmadeBy;
    if (region !== undefined) product.region = region;
    if (careInstructions !== undefined) product.careInstructions = careInstructions;
    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined) product.discountPrice = discountPrice ? Number(discountPrice) : undefined;
    if (stock !== undefined) product.stock = Number(stock);
    if (sku !== undefined) product.sku = sku;
    if (category !== undefined) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (tags !== undefined) {
      product.tags = typeof tags === 'string' 
        ? tags.split(',').map((t: string) => t.trim()) 
        : tags;
    }
    if (weight !== undefined) product.weight = weight;
    if (deliveryTime !== undefined) product.deliveryTime = deliveryTime;
    if (shippingFee !== undefined) product.shippingFee = shippingFee;
    if (status !== undefined) {
      product.status = status === 'Publish' ? 'Published' : status;
    }

    await product.save();

    return NextResponse.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const product = await Product.findOneAndDelete({
      _id: id,
      artisanId: user._id,
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
