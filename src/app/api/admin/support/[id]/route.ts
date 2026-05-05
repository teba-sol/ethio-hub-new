import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SupportTicket from "@/models/supportTicket.model";
import User from "@/models/User";
import * as jose from "jose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const token = req.cookies.get("sessionToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "ethio-hub-secret-key-2025");
    const { payload } = await jose.jwtVerify(token, secret);
    const user = await User.findById(payload.userId);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await SupportTicket.findById(id).populate(
      "user",
      "name email"
    );

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (!ticket.isRead) {
      ticket.isRead = true;
      await ticket.save();
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const token = req.cookies.get("sessionToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "ethio-hub-secret-key-2025");
    const { payload } = await jose.jwtVerify(token, secret);
    const user = await User.findById(payload.userId);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, internalNote } = body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (status) ticket.status = status;
    if (internalNote !== undefined) ticket.internalNote = internalNote;

    await ticket.save();

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
