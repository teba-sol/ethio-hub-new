import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MarketplaceReview from "@/models/review.model";
import Product from "@/models/artisan/product.model";
import * as jose from "jose";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("sessionToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "ethio-hub-secret-key-2025");
    const { payload } = await jose.jwtVerify(token, secret);
    const artisanId = payload.userId as string;

    // 1. Get all products belonging to this artisan
    const artisanProducts = await Product.find({ artisanId }).select('_id name images');
    const productIds = artisanProducts.map(p => p._id);

    // 2. Fetch reviews for these products
    const reviews = await MarketplaceReview.find({
      targetId: { $in: productIds },
      targetType: 'Product',
      isApproved: true
    })
      .populate('user', 'name profilePicture profileImage')
      .sort({ createdAt: -1 });

    // 3. Calculate artisan-wide stats
    const stats = await MarketplaceReview.aggregate([
      { 
        $match: { 
          targetId: { $in: productIds }, 
          targetType: 'Product', 
          isApproved: true 
        } 
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // 4. Calculate distribution
    const distribution = await MarketplaceReview.aggregate([
      { 
        $match: { 
          targetId: { $in: productIds }, 
          targetType: 'Product', 
          isApproved: true 
        } 
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCount = stats[0]?.totalReviews || 0;
    const formattedDistribution = [5, 4, 3, 2, 1].map(star => {
      const found = distribution.find(d => d._id === star);
      const count = found ? found.count : 0;
      return {
        star: `${star} Star`,
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
        color: star >= 4 ? '#10b981' : star === 3 ? '#f59e0b' : '#ef4444'
      };
    });

    // 5. Enhance reviews with product info
    const enhancedReviews = reviews.map(r => {
      const product = artisanProducts.find(p => p._id.toString() === r.targetId.toString());
      return {
        ...r.toObject(),
        productName: product?.name || 'Unknown Product',
        productImage: product?.images?.[0] || ''
      };
    });

    return NextResponse.json({
      reviews: enhancedReviews,
      stats: {
        avgRating: stats[0]?.avgRating ? Math.round(stats[0].avgRating * 10) / 10 : 0,
        totalReviews: totalCount,
        distribution: formattedDistribution
      },
      products: artisanProducts
    });

  } catch (error: any) {
    console.error("Artisan reviews fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
