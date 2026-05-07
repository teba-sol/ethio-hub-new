import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/artisan/product.model';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const artisanId = searchParams.get('artisanId');

    const query: any = { status: 'Published' };

    if (artisanId) {
      if (mongoose.Types.ObjectId.isValid(artisanId)) {
        query.artisanId = new mongoose.Types.ObjectId(artisanId);
      }
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { name_en: { $regex: search, $options: 'i' } },
        { name_am: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { description_en: { $regex: search, $options: 'i' } },
        { description_am: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('artisanId', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .lean();

    const formattedProducts = products.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      artisanId: p.artisanId ? {
        ...p.artisanId,
        _id: p.artisanId._id?.toString()
      } : null
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { message: 'Failed to fetch products', error: String(error) },
      { status: 500 }
    );
  }
}
