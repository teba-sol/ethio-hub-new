import crypto from "crypto";
import AdminActionToken, {
  AdminActionDecision,
  AdminActionSubject,
} from "@/models/admin/adminActionToken.model";
import { sendAdminActionableReviewEmail } from "@/lib/email";

const ACTION_TTL_MS = 24 * 60 * 60 * 1000;

const getBaseUrl = () =>
  process.env.APP_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "http://localhost:3000";

const buildActionUrl = (token: string, action: AdminActionDecision) =>
  `${getBaseUrl()}/api/admin/verify-user?token=${encodeURIComponent(token)}&action=${action}`;

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const parseAdminRecipients = () => {
  const raw = process.env.ADMIN_APPROVAL_EMAILS || process.env.ADMIN_APPROVAL_EMAIL || "";
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
};

type QueueAdminReviewEmailInput = {
  subjectType: AdminActionSubject;
  subjectId: string;
  subjectLabel: string;
  submittedByEmail: string;
  submittedByName?: string;
};

export const queueAdminReviewEmail = async ({
  subjectType,
  subjectId,
  subjectLabel,
  submittedByEmail,
  submittedByName,
}: QueueAdminReviewEmailInput) => {
  const recipients = parseAdminRecipients();
  if (!recipients.length) return;

  const expiresAt = new Date(Date.now() + ACTION_TTL_MS);

  for (const recipient of recipients) {
    const approveRawToken = crypto.randomBytes(32).toString("hex");
    const rejectRawToken = crypto.randomBytes(32).toString("hex");

    await AdminActionToken.create([
      {
        tokenHash: hashToken(approveRawToken),
        subjectType,
        subjectId,
        action: "approve",
        emailTo: recipient,
        expiresAt,
      },
      {
        tokenHash: hashToken(rejectRawToken),
        subjectType,
        subjectId,
        action: "reject",
        emailTo: recipient,
        expiresAt,
      },
    ]);

    await sendAdminActionableReviewEmail({
      to: recipient,
      subjectType,
      subjectLabel,
      submittedByEmail,
      submittedByName: submittedByName || "User",
      approveUrl: buildActionUrl(approveRawToken, "approve"),
      rejectUrl: buildActionUrl(rejectRawToken, "reject"),
    });
  }
};

export const consumeAdminActionToken = async (
  rawToken: string,
  action: AdminActionDecision
) => {
  const tokenHash = hashToken(rawToken);
  const tokenDoc = await AdminActionToken.findOne({
    tokenHash,
    action,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenDoc) return null;

  tokenDoc.usedAt = new Date();
  await tokenDoc.save();

  return tokenDoc;
};
