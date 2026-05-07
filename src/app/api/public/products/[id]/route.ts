import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/artisan/product.model';
import MarketplaceReview from '@/models/review.model';
import User from '@/models/User';
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
      .populate('artisanId', 'name email profilePicture status')
      .lean();

    if (!product) {
      return NextResponse.json({ message: 'Product not found or not published' }, { status: 404 });
    }

    // Self-healing: Recalculate rating if it's 0 but there are reviews
    if (product.rating === 0) {
      const stats = await MarketplaceReview.aggregate([
        { $match: { targetId: new mongoose.Types.ObjectId(id), targetType: 'Product', isApproved: true } },
        {
          $group: {
            _id: '$targetId',
            numReviews: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        }
      ]);

      if (stats.length > 0) {
        product.rating = Math.round(stats[0].avgRating * 10) / 10;
        product.numReviews = stats[0].numReviews;
        await Product.findByIdAndUpdate(id, {
          rating: product.rating,
          numReviews: product.numReviews
        });
      }
    }

    if (product.artisanId && (product.artisanId as any).status === 'Suspended') {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
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