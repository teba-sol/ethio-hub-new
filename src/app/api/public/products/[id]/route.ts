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

    const product = await Product.findById(id).populate('artisanId', 'name email profilePicture');

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    const formattedProduct = {
      ...product.toObject(),
      _id: product._id.toString(),
      artisanId: product.artisanId ? {
        ...product.artisanId.toObject(),
        _id: product.artisanId._id.toString()
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