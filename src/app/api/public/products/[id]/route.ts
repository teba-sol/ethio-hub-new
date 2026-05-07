import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/artisan/product.model';
import mongoose from 'mongoose';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid product ID' }, { status: 400 });
    }

    const product = await Product.findOne({ _id: id, status: 'Published' })
      .populate('artisanId', 'name email profilePicture')
      .lean();

    if (!product) {
      return NextResponse.json({ message: 'Product not found or not published' }, { status: 404 });
    }

    const formattedProduct = {
      ...product,
      _id: product._id.toString(),
      artisanId: product.artisanId ? {
        ...(product.artisanId as any),
        _id: (product.artisanId as any)._id?.toString()
      } : null
    };

    return NextResponse.json({ product: formattedProduct });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'Failed to fetch product', error: String(error) },
      { status: 500 }
    );
  }
}