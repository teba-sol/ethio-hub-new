import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { consumeAdminActionToken } from "@/lib/adminApproval";
import User from "@/models/User";
import Festival from "@/models/festival.model";
import Product from "@/models/artisan/product.model";
import { sendApprovalDecisionEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || "";
    const action = (searchParams.get("action") || "") as "approve" | "reject";

    if (!token || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { success: false, message: "Invalid approval action link." },
        { status: 400 }
      );
    }

    const actionToken = await consumeAdminActionToken(token, action);
    if (!actionToken) {
      return NextResponse.json(
        { success: false, message: "This action link is invalid, expired, or already used." },
        { status: 400 }
      );
    }

    if (actionToken.subjectType === "user") {
      const user = await User.findById(actionToken.subjectId);
      if (!user) {
        return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
      }
      user.adminApprovalStatus = action === "approve" ? "APPROVED" : "REJECTED";
      user.adminApprovalReviewedAt = new Date();
      user.adminApprovalReason = action === "reject" ? "Rejected by admin email action." : null;
      await user.save();

      await sendApprovalDecisionEmail({
        to: user.email,
        name: user.name || "there",
        approved: action === "approve",
        targetType: "account",
        targetLabel: user.email,
        reason: action === "reject" ? user.adminApprovalReason || "" : undefined,
      }).catch(() => null);
    } else if (actionToken.subjectType === "event") {
      const event = await Festival.findById(actionToken.subjectId).populate("organizer", "email name");
      if (!event) {
        return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
      }
      event.verificationStatus = action === "approve" ? "Approved" : "Rejected";
      event.status = action === "approve" ? "Published" : "Draft";
      event.isVerified = action === "approve";
      event.reviewedAt = new Date();
      if (action === "reject") {
        event.rejectionReason = "Rejected by admin email action.";
      }
      await event.save();

      const organizer = event.organizer as any;
      if (organizer?.email) {
        await sendApprovalDecisionEmail({
          to: organizer.email,
          name: organizer.name || "there",
          approved: action === "approve",
          targetType: "event",
          targetLabel: event.name || "your event",
          reason: action === "reject" ? event.rejectionReason || "" : undefined,
        }).catch(() => null);
      }
    } else if (actionToken.subjectType === "product") {
      const product = await Product.findById(actionToken.subjectId).populate("artisanId", "email name");
      if (!product) {
        return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
      }
      product.verificationStatus = action === "approve" ? "Approved" : "Rejected";
      product.rejectionReason = action === "reject" ? "Rejected by admin email action." : undefined;
      await product.save();

      const artisan = product.artisanId as any;
      if (artisan?.email) {
        await sendApprovalDecisionEmail({
          to: artisan.email,
          name: artisan.name || "there",
          approved: action === "approve",
          targetType: "product",
          targetLabel: product.name || "your product",
          reason: action === "reject" ? product.rejectionReason || "" : undefined,
        }).catch(() => null);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Action applied: ${action}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Unable to process admin action." },
      { status: 500 }
    );
  }
}
