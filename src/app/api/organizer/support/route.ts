import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SupportTicket from "@/models/supportTicket.model";
import * as jose from "jose";

export async function POST(req: NextRequest) {
  await connectDB();

  const token = req.cookies.get("sessionToken")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "ethio-hub-secret-key-2025");
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.userId as string;

    const body = await req.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.create({
      user: userId,
      subject,
      message,
    });

    await ticket.populate("user", "name email");

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error: any) {
    console.error("Support ticket creation error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}