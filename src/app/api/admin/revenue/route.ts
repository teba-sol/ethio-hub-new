import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/order.model";
import { verifyToken } from "@/services/auth.service";
import { JWTPayload } from "jose";

async function getUserFromToken(token: string) {
  const result = await verifyToken(token);
  if (!result || !result.valid || !result.payload) return null;
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

    const query: any = { paymentStatus: "paid" };
    
    if (status && status !== "all") {
      query.paymentStatus = status.toLowerCase();
    }

    const orders = await Order.find(query)
      .populate("tourist", "name email phone")
      .populate("artisan", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments(query);
    const totalOrders = await Order.countDocuments({ paymentStatus: "paid" });
    
    // Calculate totals
    const grossResult = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const grossTotal = grossResult[0]?.total || 0;

    // Group by payment method
    const paymentMethodStats = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 }, total: { $sum: "$totalPrice" } } }
    ]);

    const mappedOrders = orders.map(o => ({
      _id: o._id,
      orderId: o._id,
      date: o.createdAt,
      type: "Product Sale",
      sellerType: "Artisan",
      sellerName: (o.artisan as any)?.name || "Unknown",
      sellerVerified: true,
      buyerName: (o.tourist as any)?.name || "Unknown",
      buyerEmail: (o.tourist as any)?.email || "",
      buyerPhone: (o.tourist as any)?.phone || "",
      item: (o.product as any)?.name || "Product",
      itemImage: "",
      paymentMethod: o.paymentMethod,
      paymentRef: o.paymentReference || o.paymentRef,
      gross: o.totalPrice,
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