import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/artisan/product.model';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET as string;

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  const decoded: any = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.userId).select('-password');
  return user;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const product = await Product.findOne({
      _id: params.id,
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
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const product = await Product.findOne({
      _id: params.id,
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

    if (name) product.name = name;
    if (images) product.images = images;
    if (description) product.description = description;
    if (material !== undefined) product.material = material;
    if (handmadeBy !== undefined) product.handmadeBy = handmadeBy;
    if (region !== undefined) product.region = region;
    if (careInstructions !== undefined) product.careInstructions = careInstructions;
    if (price) product.price = Number(price);
    if (discountPrice !== undefined) product.discountPrice = discountPrice ? Number(discountPrice) : undefined;
    if (stock) product.stock = Number(stock);
    if (sku !== undefined) product.sku = sku;
    if (category) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (tags) {
      product.tags = typeof tags === 'string' 
        ? tags.split(',').map((t: string) => t.trim()) 
        : tags;
    }
    if (weight !== undefined) product.weight = weight;
    if (deliveryTime) product.deliveryTime = deliveryTime;
    if (shippingFee) product.shippingFee = shippingFee;
    if (status) {
      product.status = status === 'Publish' ? 'Published' : 'Draft';
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
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const product = await Product.findOneAndDelete({
      _id: params.id,
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
