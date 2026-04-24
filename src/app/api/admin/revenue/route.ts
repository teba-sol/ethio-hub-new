import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/order.model";
import { verifyToken } from "@/services/auth.service";
import { JWTPayload } from "jose";

async function getUserFromToken(token: string) {
  const result = await verifyToken(token);
  if (!result.valid || !result.payload) return null;
  return result.payload as JWTPayload & { userId: string; role: string };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.cookies.get("sessionToken")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type"); // 'all', 'product', 'event'
    const status = searchParams.get("status"); // 'all', 'completed', 'pending', 'refunded'

    const query: any = { paymentStatus: "Paid" };
    
    if (status && status !== "all") {
      query.paymentStatus = status.charAt(0).toUpperCase() + status.slice(1);
    }

    const orders = await Order.find(query)
      .populate("touristId", "name email phone")
      .populate("artisanId", "name")
      .sort({ orderDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments(query);
    const totalOrders = await Order.countDocuments({ paymentStatus: "Paid" });
    
    // Calculate totals
    const grossResult = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    const grossTotal = grossResult[0]?.total || 0;

    const commissionResult = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$platformCommission" } } }
    ]);
    const platformCommissionTotal = commissionResult[0]?.total || 0;

    const artisanEarningsResult = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$artisanEarnings" } } }
    ]);
    const artisanEarningsTotal = artisanEarningsResult[0]?.total || 0;

    // Group by payment method
    const paymentMethodStats = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 }, total: { $sum: "$total" } } }
    ]);

    const mappedOrders = orders.map(o => ({
      _id: o._id,
      orderId: o.orderId,
      date: o.orderDate,
      type: "Product Sale",
      sellerType: "Artisan",
      sellerName: (o.artisanId as any)?.name || "Unknown",
      sellerVerified: true,
      buyerName: o.customer?.name || (o.touristId as any)?.name || "Unknown",
      buyerEmail: o.customer?.email || (o.touristId as any)?.email || "",
      buyerPhone: o.customer?.phone || (o.touristId as any)?.phone || "",
      item: o.items?.[0]?.productName || "Product",
      itemImage: o.items?.[0]?.productImage || "",
      paymentMethod: o.paymentMethod,
      paymentRef: o.paymentReference || o.orderId,
      gross: o.total,
      commissionRate: o.commissionRate,
      commission: o.platformCommission,
      net: o.artisanEarnings,
      status: o.paymentStatus,
      isSuspicious: false,
      timeline: o.timeline,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({
      transactions: mappedOrders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        grossTotal,
        platformCommissionTotal,
        artisanEarningsTotal,
        totalOrders,
        paymentMethodStats: paymentMethodStats.map(p => ({
          method: p._id,
          count: p.count,
          total: p.total,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin revenue:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}