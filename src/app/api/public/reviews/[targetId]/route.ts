import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MarketplaceReview from "@/models/review.model";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ targetId: string }> }
) {
  try {
    await connectDB();

    const { targetId } = await params;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const reviews = await MarketplaceReview.find({
      targetId: new mongoose.Types.ObjectId(targetId),
      isApproved: true
    })
      .populate("user", "name profileImage profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MarketplaceReview.countDocuments({
      targetId: new mongoose.Types.ObjectId(targetId),
      isApproved: true
    });

    // Get rating distribution
    const distribution = await MarketplaceReview.aggregate([
      { $match: { targetId: new mongoose.Types.ObjectId(targetId), isApproved: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedDistribution = [1, 2, 3, 4, 5].map(star => {
      const found = distribution.find(d => d._id === star);
      return { star, count: found ? found.count : 0 };
    }).reverse();

    return NextResponse.json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      distribution: formattedDistribution
    });
  } catch (error: any) {
    console.error("Fetch reviews error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
