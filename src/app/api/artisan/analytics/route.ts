import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/order.model";
import Product from "@/models/artisan/product.model";
import MarketplaceReview from "@/models/review.model";
import { verifyToken } from "@/services/auth.service";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get("sessionToken")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const authResult = await verifyToken(token);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const artisanId = authResult.payload.userId as string;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "This Year";

    // Date filtering logic based on range
    const now = new Date();
    let startDate = new Date(0); // Default to all time

    if (range === "This Month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === "Last 30 Days") {
      startDate = new Date(now.setDate(now.getDate() - 30));
    } else if (range === "This Quarter") {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
    } else if (range === "This Year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const artisanObjectId = new mongoose.Types.ObjectId(artisanId);

    // 1. Sales Stats
    const salesStats = await Order.aggregate([
      {
        $match: {
          artisan: artisanObjectId,
          paymentStatus: "paid",
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          netEarnings: { $sum: "$artisanEarnings" },
          totalCommission: { $sum: "$adminCommission" },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const stats = salesStats[0] || {
      totalRevenue: 0,
      netEarnings: 0,
      totalCommission: 0,
      orderCount: 0
    };

    // 2. Refund Rate (cancelled/refunded orders)
    const refundStats = await Order.aggregate([
      {
        $match: {
          artisan: artisanObjectId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          refunded: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "refunded"] }, 1, 0] }
          }
        }
      }
    ]);
    const refundRate = refundStats[0]?.total > 0 
      ? ((refundStats[0].refunded / refundStats[0].total) * 100).toFixed(1) + "%"
      : "0%";

    // 3. Sales Data for Chart
    // This part is simplified for the example - in a real app you'd group by day/month
    const salesData = await Order.aggregate([
      {
        $match: {
          artisan: artisanObjectId,
          paymentStatus: "paid",
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          netEarnings: { $sum: "$artisanEarnings" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      {
        $project: {
          month: "$_id",
          revenue: 1,
          netEarnings: 1,
          orders: 1
        }
      }
    ]);

    // 4. Product Performance
    const productPerformance = await Order.aggregate([
      {
        $match: {
          artisan: artisanObjectId,
          paymentStatus: "paid",
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$product",
          soldCount: { $sum: "$quantity" },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { soldCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" }
    ]);

    // 5. Category Distribution
    const categoryStats = await Product.aggregate([
      { $match: { artisanId: artisanObjectId } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    // 6. Customer Insights
    const reviewStats = await MarketplaceReview.aggregate([
        { 
            $match: { 
                targetId: { $in: await Product.find({ artisanId: artisanObjectId }).distinct('_id') },
                targetType: 'Product'
            } 
        },
        {
            $group: {
                _id: null,
                avgRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        revenue: `ETB ${stats.totalRevenue.toLocaleString()}`,
        net: `ETB ${stats.netEarnings.toLocaleString()}`,
        commission: `ETB ${stats.totalCommission.toLocaleString()}`,
        refundRate,
        revenueTrend: "+0%", // Needs comparison with previous period
        netTrend: "+0%",
        commTrend: "+0%",
        refundTrend: "0%",
      },
      salesData: salesData.length > 0 ? salesData : [{ month: "No Data", revenue: 0, netEarnings: 0, orders: 0 }],
      bestSeller: productPerformance[0] ? {
        name: productPerformance[0].productInfo.name,
        sold: productPerformance[0].soldCount,
        revenue: productPerformance[0].revenue
      } : null,
      categoryData: categoryStats.map(c => ({
        name: c._id,
        value: c.count,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}` // Random colors for now
      })),
      customerInsights: {
        avgRating: reviewStats[0]?.avgRating?.toFixed(1) || "0.0",
        totalReviews: reviewStats[0]?.totalReviews || 0,
        returningRate: "0%" // Needs more complex query
      }
    });

  } catch (error: any) {
    console.error("Artisan analytics error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
