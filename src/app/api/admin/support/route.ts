import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SupportTicket from "@/models/supportTicket.model";
import User from "@/models/User";
import * as jose from "jose";

export async function GET(req: NextRequest) {
  await connectDB();

  const token = req.cookies.get("sessionToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "ethio-hub-secret-key-2025");
    const { payload } = await jose.jwtVerify(token, secret);
    const user = await User.findById(payload.userId);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const match: any = {};

    if (status && status !== "all") {
      match.status = status;
    }

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }

    let tickets = await SupportTicket.find(match)
      .populate("user", "name email")
      .sort({ isRead: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (email) {
      tickets = tickets.filter(
        (t: any) =>
          t.user?.email?.toLowerCase().includes(email.toLowerCase())
      );
    }

    const total = await SupportTicket.countDocuments(match);

    return NextResponse.json({
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Admin support tickets fetch error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
