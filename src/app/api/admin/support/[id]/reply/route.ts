import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SupportTicket from "@/models/supportTicket.model";
import { sendMail } from "@/lib/email";
import User from "@/models/User";
import * as jose from "jose";

export async function POST(
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
    const adminUser = await User.findById(payload.userId);
    
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reply } = body;

    if (!reply || !reply.trim()) {
      return NextResponse.json(
        { error: "Reply message is required" },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.findById(id).populate(
      "user",
      "name email"
    );

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const user = ticket.user as any;

    const html = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Hello ${user.name},</p>
        <div style="margin: 20px 0; white-space: pre-wrap; line-height: 1.6;">${reply.replace(
          /</g,
          "&lt;"
        )}</div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #6b7280; font-size: 14px;">Ethio Hub Support Team</p>
      </div>
    `;

    try {
      await sendMail(user.email, `Re: ${ticket.subject}`, html);
    } catch (error: any) {
      console.error("Email send error:", error);
      return NextResponse.json(
        { error: "Failed to send email reply" },
        { status: 500 }
      );
    }

    ticket.adminReply = reply;
    ticket.adminReplyAt = new Date();
    ticket.status = "Resolved";
    ticket.isRead = true;
    await ticket.save();

    return NextResponse.json({ ticket, message: "Reply sent successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
