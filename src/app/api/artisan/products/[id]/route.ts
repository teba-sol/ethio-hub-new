import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/artisan/product.model';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { isProductCompleteForReview } from '@/lib/reviewAutomation';
import { queueAdminReviewEmail } from '@/lib/adminApproval';

const JWT_SECRET = process.env.JWT_SECRET as string;

const textValue = (...values: unknown[]) => {
  const value = values.find((item) => typeof item === 'string' && item.trim());
  return typeof value === 'string' ? value.trim() : '';
};

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
      name_en,
      name_am,
      images,
      description,
      description_en,
      description_am,
      material,
      materials,
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

    const normalizedNameEn = textValue(name_en, name);
    const normalizedNameAm = textValue(name_am);
    const normalizedDescriptionEn = textValue(description_en, description);
    const normalizedDescriptionAm = textValue(description_am);

    if (!normalizedNameEn || !normalizedNameAm || !normalizedDescriptionEn || !normalizedDescriptionAm) {
      return NextResponse.json(
        { message: 'English and Amharic name and description are required.' },
        { status: 400 }
      );
    }

    product.name = normalizedNameEn;
    product.name_en = normalizedNameEn;
    product.name_am = normalizedNameAm;
    if (images !== undefined) product.images = images;
    product.description = normalizedDescriptionEn;
    product.description_en = normalizedDescriptionEn;
    product.description_am = normalizedDescriptionAm;
    if (material !== undefined || materials !== undefined) product.material = material ?? materials;
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
      if (status === 'Publish' || status === 'Published') {
        product.status = Number(product.stock) === 0 ? 'Out of Stock' : 'Pending';
      } else {
        product.status = status;
      }
      
      if (['Published', 'Pending', 'Out of Stock'].includes(product.status) && product.verificationStatus === 'Rejected') {
        product.verificationStatus = 'Pending';
        product.rejectionReason = undefined;
      }
    }

    if (
      product.verificationStatus !== 'Pending' &&
      isProductCompleteForReview(product)
    ) {
      product.verificationStatus = 'Pending';
      product.rejectionReason = undefined;
    }

    await product.save();

    if (product.verificationStatus === 'Pending') {
      await queueAdminReviewEmail({
        subjectType: 'product',
        subjectId: product._id.toString(),
        subjectLabel: product.name || 'Product',
        submittedByEmail: user.email || 'unknown@unknown.local',
        submittedByName: user.name || 'Artisan',
      }).catch(() => null);
    }

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
