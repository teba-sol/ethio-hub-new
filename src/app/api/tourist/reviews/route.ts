import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MarketplaceReview from "@/models/review.model";
import Product from "@/models/artisan/product.model";
import Festival from "@/models/festival.model";
import Order from "@/models/order.model";
import Booking from "@/models/booking.model";
import * as jose from "jose";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("sessionToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "ethio-hub-secret-key-2025");
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.userId as string;

    const body = await req.json();
    const { targetId, targetType, rating, comment } = body;

    if (!targetId || !targetType || !rating || !comment) {
      return NextResponse.json(
        { error: "Target ID, type, rating, and comment are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Check if user has already reviewed this item
    const existingReview = await MarketplaceReview.findOne({
      user: userId,
      targetId: new mongoose.Types.ObjectId(targetId),
      targetType
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this item" },
        { status: 400 }
      );
    }

    // Check for verified purchase
    let isVerifiedPurchase = false;
    if (targetType === 'Product') {
      const order = await Order.findOne({
        tourist: userId,
        product: new mongoose.Types.ObjectId(targetId),
        status: 'completed'
      });
      if (order) isVerifiedPurchase = true;
    } else if (targetType === 'Festival') {
      const booking = await Booking.findOne({
        user: userId,
        festival: new mongoose.Types.ObjectId(targetId),
        status: 'confirmed'
      });
      if (booking) isVerifiedPurchase = true;
    }

    const review = await MarketplaceReview.create({
      user: userId,
      targetId: new mongoose.Types.ObjectId(targetId),
      targetType,
      rating,
      comment,
      isVerifiedPurchase
    });

    // Update target's average rating
    if (targetType === 'Product') {
      await updateProductRating(targetId);
    } else if (targetType === 'Festival') {
      // Add festival rating logic if needed
    }

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error: any) {
    console.error("Review creation error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

async function updateProductRating(productId: string) {
  try {
    const stats = await MarketplaceReview.aggregate([
      { 
        $match: { 
          targetId: new mongoose.Types.ObjectId(productId), 
          targetType: 'Product', 
          isApproved: true 
        } 
      },
      {
        $group: {
          _id: '$targetId',
          numReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    if (stats.length > 0) {
      const { avgRating, numReviews } = stats[0];
      const roundedRating = Math.round(avgRating * 10) / 10;
      
      // Update the product in the artisan product model
      await Product.findByIdAndUpdate(productId, {
        rating: roundedRating,
        numReviews: numReviews
      });
      
      console.log(`Updated product ${productId}: rating=${roundedRating}, reviews=${numReviews}`);
    } else {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        numReviews: 0
      });
      console.log(`Reset product ${productId} rating to 0 (no approved reviews found)`);
    }
  } catch (error) {
    console.error(`Error updating product rating for ${productId}:`, error);
  }
}
