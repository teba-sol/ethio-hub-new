import nodemailer from "nodemailer";
import net from "net";

type RegistrationOtpEmailInput = {
  to: string;
  name: string;
  otp: string;
};

type VerificationLinkEmailInput = {
  to: string;
  name: string;
  verificationUrl: string;
};

type AdminActionableReviewEmailInput = {
  to: string;
  subjectType: "user" | "event" | "product";
  subjectLabel: string;
  submittedByEmail: string;
  submittedByName: string;
  approveUrl: string;
  rejectUrl: string;
};

type ApprovalDecisionEmailInput = {
  to: string;
  name: string;
  approved: boolean;
  targetType: "account" | "event" | "product";
  targetLabel: string;
  reason?: string;
};

type AccountStatusEmailInput = {
  to: string;
  name: string;
  status: "Active" | "Suspended" | "Deleted" | "Banned";
  reason?: string;
};

export type EmailProviderErrorCode =
  | "EMAIL_PROVIDER_NOT_READY"
  | "EMAIL_PROVIDER_AUTH"
  | "EMAIL_PROVIDER_RATE_LIMIT"
  | "EMAIL_PROVIDER_ERROR";

export class EmailProviderError extends Error {
  code: EmailProviderErrorCode;
  statusCode: number;

  constructor(code: EmailProviderErrorCode, message: string, statusCode = 500) {
    super(message);
    this.name = "EmailProviderError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export type RecipientProbeStatus = "valid" | "invalid" | "unknown";

type RecipientProbeResult = {
  status: RecipientProbeStatus;
};

const SENDER_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getRequiredSenderConfig = () => {
  const fromEmail = (process.env.EMAIL_FROM || process.env.SMTP_USER || "").trim().toLowerCase();
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "Ethio Craft Hub";

  if (!fromEmail) {
    throw new EmailProviderError(
      "EMAIL_PROVIDER_NOT_READY",
      "Email sender is not configured. Add EMAIL_FROM (or SMTP_USER) in .env.",
      503
    );
  }

  if (!SENDER_EMAIL_REGEX.test(fromEmail)) {
    throw new EmailProviderError(
      "EMAIL_PROVIDER_NOT_READY",
      "Email sender configuration is invalid.",
      503
    );
  }

  return { fromEmail, fromName };
};

const getRequiredSmtpConfig = () => {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !portRaw || !user || !pass) {
    throw new EmailProviderError(
      "EMAIL_PROVIDER_NOT_READY",
      "Email service is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS (app password) in .env.",
      503
    );
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port)) {
    throw new EmailProviderError(
      "EMAIL_PROVIDER_NOT_READY",
      "SMTP_PORT is invalid.",
      503
    );
  }

  return { host, port, user, pass };
};

let cachedTransporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;
  const smtp = getRequiredSmtpConfig();
  cachedTransporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    requireTLS: smtp.port !== 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
  return cachedTransporter;
};

const buildOtpHtml = (name: string, otp: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin-bottom: 16px; color: #0f172a;">Verify your email</h2>
    <p style="margin-bottom: 16px;">Hello ${name},</p>
    <p style="margin-bottom: 16px;">Use the OTP below to complete your Ethio Craft Hub registration.</p>
    <div style="margin: 24px 0; padding: 18px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; text-align: center;">
      <div style="font-size: 30px; letter-spacing: 8px; font-weight: 700; color: #0f172a;">${otp}</div>
    </div>
    <p style="margin-bottom: 8px;">This code expires in <strong>2 minutes</strong>.</p>
    <p style="margin: 0; color: #64748b;">If you did not request this, you can ignore this email.</p>
  </div>
`;

const buildVerificationHtml = (name: string, verificationUrl: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin-bottom: 16px; color: #0f172a;">Verify your email</h2>
    <p style="margin-bottom: 16px;">Hello ${name},</p>
    <p style="margin-bottom: 16px;">Please confirm your email address by clicking the button below.</p>
    <div style="margin: 24px 0;">
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 20px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700;">
        Verify My Email
      </a>
    </div>
    <p style="margin-bottom: 8px;">This link expires in <strong>24 hours</strong>.</p>
    <p style="margin: 0; color: #64748b;">If you did not create this account, you can ignore this email.</p>
  </div>
`;

const buildAdminActionableHtml = ({
  subjectType,
  subjectLabel,
  submittedByEmail,
  submittedByName,
  approveUrl,
  rejectUrl,
}: AdminActionableReviewEmailInput) => `
  <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin-bottom: 16px; color: #0f172a;">Admin review required</h2>
    <p style="margin-bottom: 8px;">A new <strong>${subjectType}</strong> is waiting for review.</p>
    <p style="margin-bottom: 8px;"><strong>Item:</strong> ${subjectLabel}</p>
    <p style="margin-bottom: 18px;"><strong>Submitted by:</strong> ${submittedByName} (${submittedByEmail})</p>
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin: 20px 0;">
      <a href="${approveUrl}" style="display: inline-block; padding: 10px 16px; background: #15803d; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;">Approve</a>
      <a href="${rejectUrl}" style="display: inline-block; padding: 10px 16px; background: #b91c1c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;">Reject</a>
    </div>
    <p style="margin: 0; color: #64748b;">For security, each link is one-time use and expires in 24 hours.</p>
  </div>
`;

const buildDecisionHtml = ({
  name,
  approved,
  targetType,
  targetLabel,
  reason,
}: ApprovalDecisionEmailInput) => `
  <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin-bottom: 16px; color: #0f172a;">${approved ? "Approved" : "Update required"}</h2>
    <p style="margin-bottom: 8px;">Hello ${name},</p>
    <p style="margin-bottom: 8px;">Your ${targetType} <strong>${targetLabel}</strong> has been ${approved ? "approved" : "rejected"}.</p>
    ${
      !approved && reason
        ? `<p style="margin-bottom: 8px;"><strong>Reason:</strong> ${reason}</p>`
        : ""
    }
    <p style="margin: 0; color: #64748b;">Thank you for using Ethio Craft Hub.</p>
  </div>
`;

const buildAccountStatusHtml = ({
  name,
  status,
  reason,
}: AccountStatusEmailInput) => {
  let statusColor = "#0f766e"; // Active
  let title = "Account Activated";
  let message = "Your account has been successfully activated. You now have full access to the Ethio Craft Hub platform.";

  if (status === "Suspended") {
    statusColor = "#b45309";
    title = "Account Suspended";
    message = "Your account has been suspended by an administrator.";
  } else if (status === "Deleted") {
    statusColor = "#b91c1c";
    title = "Account Deleted";
    message = "Your account has been removed from our platform.";
  } else if (status === "Banned") {
    statusColor = "#7f1d1d";
    title = "Account Banned";
    message = "Your account has been permanently banned due to policy violations.";
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="margin-bottom: 16px; color: ${statusColor};">${title}</h2>
      <p style="margin-bottom: 16px;">Hello ${name},</p>
      <p style="margin-bottom: 16px;">${message}</p>
      ${
        reason
          ? `<div style="margin: 24px 0; padding: 16px 20px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>
            </div>`
          : ""
      }
      <p style="margin-top: 24px; color: #64748b; font-size: 13px;">If you have any questions regarding this action, please contact our support team.</p>
      <hr style="margin: 32px 0; border: 0; border-top: 1px solid #f1f5f9;" />
      <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">Ethio Craft Hub Team</p>
    </div>
  `;
};

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const transporter = getTransporter();
    const { fromEmail, fromName } = getRequiredSenderConfig();

    console.log(`[EmailService] Sending email to: ${to} with subject: ${subject}`);
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    console.log(`[EmailService] Email sent! Message ID: ${info.messageId}`);
  } catch (error: any) {
    console.error('SMTP Full Error:', error);
    const message = String(error?.message || "");
    const code = String(error?.code || "").toUpperCase();
    const responseCode = Number(error?.responseCode || 0);
    const lowerMessage = message.toLowerCase();

    if (code === "EAUTH" || lowerMessage.includes("auth") || responseCode === 535) {
      throw new EmailProviderError(
        "EMAIL_PROVIDER_AUTH",
        "SMTP authentication failed. Check SMTP_USER and SMTP_PASS (app password).",
        503
      );
    }

    if (
      code === "ECONNRESET" ||
      code === "ECONNREFUSED" ||
      code === "ETIMEDOUT" ||
      lowerMessage.includes("econnreset") ||
      lowerMessage.includes("connection")
    ) {
      throw new EmailProviderError(
        "EMAIL_PROVIDER_ERROR",
        "We could not reach the email server. Please try again in a moment.",
        503
      );
    }

    if (
      responseCode === 550 ||
      responseCode === 553 ||
      lowerMessage.includes("user unknown") ||
      lowerMessage.includes("invalid recipient") ||
      lowerMessage.includes("recipient rejected")
    ) {
      throw new EmailProviderError(
        "EMAIL_PROVIDER_ERROR",
        "The email address appears invalid. Please check and try again.",
        400
      );
    }

    if (
      lowerMessage.includes("timed out") ||
      lowerMessage.includes("timeout") ||
      lowerMessage.includes("greeting") ||
      lowerMessage.includes("helo") ||
      lowerMessage.includes("tls")
    ) {
      throw new EmailProviderError(
        "EMAIL_PROVIDER_ERROR",
        "Connection to email server timed out or TLS error. Check SMTP_HOST/PORT and network.",
        503
      );
    }

    throw new EmailProviderError(
      "EMAIL_PROVIDER_ERROR",
      "Unable to send verification email right now. Please try again shortly.",
      503
    );
  }
};

const parseSmtpCode = (line: string) => {
  const match = line.match(/^(\d{3})[ -]/);
  return match ? Number(match[1]) : null;
};

const readSmtpResponse = (socket: net.Socket, timeoutMs: number = 3000) =>
  new Promise<string>((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("SMTP probe timeout"));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
    };

    const tryResolve = () => {
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      if (!lines.length) return;
      const lastLine = lines[lines.length - 1];
      if (/^\d{3}\s/.test(lastLine)) {
        cleanup();
        resolve(lines.join("\n"));
      }
    };

    const onData = (data: Buffer) => {
      buffer += data.toString("utf8");
      tryResolve();
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onClose = () => {
      cleanup();
      reject(new Error("SMTP probe connection closed"));
    };

    socket.on("data", onData);
    socket.on("error", onError);
    socket.on("close", onClose);
  });

const sendSmtpCommand = async (socket: net.Socket, command: string, timeoutMs = 3000) => {
  socket.write(`${command}\r\n`);
  const response = await readSmtpResponse(socket, timeoutMs);
  const firstLine = response.split(/\r?\n/)[0] || "";
  const code = parseSmtpCode(firstLine);
  return { code, response };
};

export const probeGmailRecipient = async (email: string): Promise<RecipientProbeResult> => {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@gmail\.com$/.test(normalized)) {
    return { status: "invalid" };
  }

  // Skip probe if configured
  if (process.env.SKIP_EMAIL_PROBE === 'true') {
    return { status: "valid" };
  }

  let socket: net.Socket | null = null;
  try {
    socket = await new Promise<net.Socket>((resolve, reject) => {
      const client = net.createConnection({ host: "gmail-smtp-in.l.google.com", port: 25 });
      const timer = setTimeout(() => {
        client.destroy();
        reject(new Error("SMTP probe connect timeout"));
      }, 3000);
      client.once("connect", () => {
        clearTimeout(timer);
        resolve(client);
      });
      client.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });

    const banner = await readSmtpResponse(socket, 3000);
    const bannerCode = parseSmtpCode(banner.split(/\r?\n/)[0] || "");
    if (bannerCode !== 220) return { status: "unknown" };

    const ehlo = await sendSmtpCommand(socket, "EHLO ethio-craft-hub.local");
    if (!ehlo.code || ehlo.code >= 400) return { status: "unknown" };

    const mailFrom = await sendSmtpCommand(socket, "MAIL FROM:<probe@ethiocrafthub.local>");
    if (!mailFrom.code || mailFrom.code >= 400) return { status: "unknown" };

    const rcpt = await sendSmtpCommand(socket, `RCPT TO:<${normalized}>`);
    await sendSmtpCommand(socket, "QUIT").catch(() => null);

    if (!rcpt.code) return { status: "unknown" };
    if (rcpt.code === 250 || rcpt.code === 251) return { status: "valid" };
    if ([550, 551, 552, 553, 554].includes(rcpt.code)) return { status: "invalid" };
    return { status: "unknown" };
  } catch {
    return { status: "unknown" };
  } finally {
    if (socket && !socket.destroyed) socket.destroy();
  }
};

export const sendRegistrationOtpEmail = async ({
  to,
  name,
  otp,
}: RegistrationOtpEmailInput) => {
  await sendMail(to, "Your Ethio Craft Hub verification code", buildOtpHtml(name, otp));
};

export const sendEmailVerificationLink = async ({
  to,
  name,
  verificationUrl,
}: VerificationLinkEmailInput) => {
  await sendMail(to, "Verify your Ethio Craft Hub email", buildVerificationHtml(name, verificationUrl));
};

export const sendAdminActionableReviewEmail = async (
  input: AdminActionableReviewEmailInput
) => {
  await sendMail(
    input.to,
    `Review required: ${input.subjectType} pending`,
    buildAdminActionableHtml(input)
  );
};

export const sendApprovalDecisionEmail = async (input: ApprovalDecisionEmailInput) => {
  await sendMail(
    input.to,
    input.approved ? "Your submission was approved" : "Action required on your submission",
    buildDecisionHtml(input)
  );
};

type DeliveryCodeEmailInput = {
  to: string;
  name: string;
  orderId: string;
  verificationCode: string;
  productName: string;
  deliveryGuyName?: string;
  deliveryGuyPhone?: string;
  expectedTime?: string;
};

const buildDeliveryCodeHtml = (input: DeliveryCodeEmailInput) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin-bottom: 16px; color: #0f172a;">Your Order is Ready for Delivery!</h2>
    <p style="margin-bottom: 16px;">Hello ${input.name},</p>
    <p style="margin-bottom: 16px;">Great news! Your order <strong>#${input.orderId.slice(-6).toUpperCase()}</strong> for <strong>${input.productName}</strong> is ready and will be delivered soon.</p>
    ${input.deliveryGuyName ? `
    <div style="margin: 20px 0; padding: 16px 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
      <p style="margin-bottom: 8px;"><strong>Delivery Person:</strong> ${input.deliveryGuyName}</p>
      <p style="margin-bottom: 8px;"><strong>Contact:</strong> ${input.deliveryGuyPhone || 'N/A'}</p>
      ${input.expectedTime ? `<p style="margin: 0;"><strong>Expected Arrival:</strong> ${input.expectedTime}</p>` : ''}
    </div>
    ` : ''}
    <div style="margin: 24px 0; padding: 20px 24px; background: #f8fafc; border: 2px dashed #0f766e; border-radius: 14px; text-align: center;">
      <p style="margin-bottom: 8px; color: #64748b; font-size: 14px;">Your Verification Code</p>
      <div style="font-size: 32px; letter-spacing: 12px; font-weight: 700; color: #0f172a; font-family: monospace;">${input.verificationCode}</div>
    </div>
    <p style="margin-bottom: 16px; color: #64748b;">Share this code with the delivery person when they arrive to confirm your delivery.</p>
    <p style="margin: 0; color: #64748b; font-size: 13px;">If you did not order this product, please ignore this email.</p>
  </div>
`;

export const sendDeliveryCodeEmail = async (input: DeliveryCodeEmailInput) => {
  await sendMail(
    input.to,
    `Your Delivery Verification Code - Order #${input.orderId.slice(-6).toUpperCase()}`,
    buildDeliveryCodeHtml(input)
  );
};

type UserWelcomeEmailInput = {
  to: string;
  name: string;
  role: string;
  password?: string;
};

const buildUserWelcomeHtml = (input: UserWelcomeEmailInput) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin-bottom: 16px; color: #0f766e;">Welcome to Ethio Craft Hub!</h2>
    <p style="margin-bottom: 16px;">Hello Mr/Ms ${input.name},</p>
    <p style="margin-bottom: 16px;">An account has been created for you as a <strong>${input.role}</strong> on our platform.</p>
    
    ${input.password ? `
    <div style="margin: 24px 0; padding: 20px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;">
      <p style="margin-bottom: 12px; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase;">Your Login Credentials</p>
      <div style="margin-bottom: 8px;">
        <span style="color: #64748b; font-size: 14px;">Email:</span>
        <span style="font-weight: 600; color: #0f172a; margin-left: 8px;">${input.to}</span>
      </div>
      <div>
        <span style="color: #64748b; font-size: 14px;">Temporary Password:</span>
        <span style="font-weight: 600; color: #0f172a; margin-left: 8px; font-family: monospace; font-size: 16px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${input.password}</span>
      </div>
    </div>
    <p style="margin-bottom: 16px;">Use this password to access our service. For your security, please change it after your first login.</p>
    ` : ''}

    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" style="display: inline-block; padding: 14px 28px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">
        Login to Your Account
      </a>
    </div>

    <hr style="margin: 32px 0; border: 0; border-top: 1px solid #f1f5f9;" />
    <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">This is an automated message. Thank you for using our service.</p>
  </div>
`;

export const sendUserWelcomeEmail = async (input: UserWelcomeEmailInput) => {
  await sendMail(
    input.to,
    "Welcome to Ethio Craft Hub - Account Created",
    buildUserWelcomeHtml(input)
  );
};

export const sendAccountStatusEmail = async (input: AccountStatusEmailInput) => {
  const subject = input.status === "Active" ? "Account Activated - Ethio Craft Hub" : 
                  input.status === "Suspended" ? "Account Suspension Notice - Ethio Craft Hub" :
                  input.status === "Deleted" ? "Account Deletion Notice - Ethio Craft Hub" :
                  "Account Status Update - Ethio Craft Hub";

  await sendMail(
    input.to,
    subject,
    buildAccountStatusHtml(input)
  );
};

// ============================================================
// Admin Report Action Emails
// ============================================================

type AdminReportEmailInput = {
  to: string;
  name: string;
  targetType: string;
  reportReason?: string;
  reportDescription?: string;
  adminNote?: string;
};

const buildWarningEmailHtml = (input: AdminReportEmailInput) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin-bottom: 16px; color: #b45309;">Warning Notice - Ethio Craft Hub</h2>
    <p style="margin-bottom: 16px;">Hello ${input.name},</p>
    <p style="margin-bottom: 16px;">We have received a report regarding your ${input.targetType.toLowerCase()} on Ethio Craft Hub. Our team has reviewed the report and found it necessary to issue you a formal warning.</p>
    ${input.reportReason ? `
    <div style="margin: 20px 0; padding: 16px 20px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;">
      <p style="margin-bottom: 8px; color: #92400e; font-size: 14px;"><strong>Report Reason:</strong> ${input.reportReason}</p>
      ${input.reportDescription ? `<p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Details:</strong> ${input.reportDescription}</p>` : ''}
    </div>
    ` : ''}
    ${input.adminNote ? `
    <div style="margin: 20px 0; padding: 16px 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
      <p style="margin-bottom: 8px; color: #166534; font-size: 14px;"><strong>Admin Note:</strong></p>
      <p style="margin: 0; color: #166534; font-size: 14px;">${input.adminNote}</p>
    </div>
    ` : ''}
    <p style="margin-bottom: 16px; font-weight: 500;">Please review your content and ensure it complies with our community guidelines and terms of service. Further violations may result in account suspension or permanent removal.</p>
    <p style="margin-bottom: 16px;">If you believe this warning was issued in error, please contact our support team at <a href="mailto:support@ethiohub.com" style="color: #0f766e;">support@ethiohub.com</a>.</p>
    <hr style="margin: 32px 0; border: 0; border-top: 1px solid #f1f5f9;" />
    <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">Ethio Craft Hub Team</p>
  </div>
`;

const buildBanEmailHtml = (input: AdminReportEmailInput) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin-bottom: 16px; color: #991b1b;">Account Permanently Banned - Ethio Craft Hub</h2>
    <p style="margin-bottom: 16px;">Hello ${input.name},</p>
    <p style="margin-bottom: 16px;">After a thorough review, your account on Ethio Craft Hub has been <strong>permanently banned</strong> due to serious violations of our community guidelines and terms of service.</p>
    ${input.reportReason ? `
    <div style="margin: 20px 0; padding: 16px 20px; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 12px;">
      <p style="margin-bottom: 8px; color: #991b1b; font-size: 14px;"><strong>Reason for Ban:</strong> ${input.reportReason}</p>
      ${input.reportDescription ? `<p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Details:</strong> ${input.reportDescription}</p>` : ''}
    </div>
    ` : ''}
    ${input.adminNote ? `
    <div style="margin: 20px 0; padding: 16px 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
      <p style="margin-bottom: 8px; color: #166534; font-size: 14px;"><strong>Admin Note:</strong></p>
      <p style="margin: 0; color: #166534; font-size: 14px;">${input.adminNote}</p>
    </div>
    ` : ''}
    <p style="margin-bottom: 16px; color: #dc2626; font-weight: 500;">This action is permanent and cannot be reversed. Your account has been permanently removed from the platform.</p>
    <p style="margin-bottom: 16px;">If you have questions or believe this decision was made in error, you may contact our support team at <a href="mailto:support@ethiohub.com" style="color: #0f766e;">support@ethiohub.com</a>. Note that appeals are reviewed at our discretion.</p>
    <hr style="margin: 32px 0; border: 0; border-top: 1px solid #f1f5f9;" />
    <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">Ethio Craft Hub Team</p>
  </div>
`;

const buildContentTakenDownEmailHtml = (input: AdminReportEmailInput) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin-bottom: 16px; color: #991b1b;">Content Taken Down - Ethio Craft Hub</h2>
    <p style="margin-bottom: 16px;">Hello ${input.name},</p>
    <p style="margin-bottom: 16px;">Following a community report and review, your <strong>${input.targetType.toLowerCase()}</strong> has been <strong>taken down</strong> from Ethio Craft Hub.</p>
    ${input.reportReason ? `
    <div style="margin: 20px 0; padding: 16px 20px; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 12px;">
      <p style="margin-bottom: 8px; color: #991b1b; font-size: 14px;"><strong>Reason:</strong> ${input.reportReason}</p>
      ${input.reportDescription ? `<p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Details:</strong> ${input.reportDescription}</p>` : ''}
    </div>
    ` : ''}
    ${input.adminNote ? `
    <div style="margin: 20px 0; padding: 16px 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
      <p style="margin-bottom: 8px; color: #166534; font-size: 14px;"><strong>Admin Note:</strong></p>
      <p style="margin: 0; color: #166534; font-size: 14px;">${input.adminNote}</p>
    </div>
    ` : ''}
    <p style="margin-bottom: 16px;">This does not necessarily mean your account is suspended. However, repeated violations may lead to further action including account suspension or ban.</p>
    <p style="margin-bottom: 16px;">If you believe this action was taken in error, please contact our support team at <a href="mailto:support@ethiohub.com" style="color: #0f766e;">support@ethiohub.com</a>.</p>
    <hr style="margin: 32px 0; border: 0; border-top: 1px solid #f1f5f9;" />
    <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">Ethio Craft Hub Team</p>
  </div>
`;

export const sendWarningEmail = async (input: AdminReportEmailInput) => {
  await sendMail(
    input.to,
    `⚠️ Warning Notice - Your ${input.targetType} on Ethio Craft Hub`,
    buildWarningEmailHtml(input)
  );
};

export const sendBanEmail = async (input: AdminReportEmailInput) => {
  await sendMail(
    input.to,
    `🚫 Account Permanently Banned - Ethio Craft Hub`,
    buildBanEmailHtml(input)
  );
};

export const sendContentTakenDownEmail = async (input: AdminReportEmailInput) => {
  await sendMail(
    input.to,
    `⚠️ Your Content Has Been Taken Down - Ethio Craft Hub`,
    buildContentTakenDownEmailHtml(input)
  );
};
