import nodemailer from "nodemailer";

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

const sendMail = async (to: string, subject: string, html: string) => {
  try {
    const transporter = getTransporter();
    const { fromEmail, fromName } = getRequiredSenderConfig();

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });
  } catch (error: any) {
    const message = String(error?.message || "");
    const code = String(error?.code || "").toUpperCase();
    const responseCode = Number(error?.responseCode || 0);
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("auth")) {
      throw new EmailProviderError(
        "EMAIL_PROVIDER_AUTH",
        "SMTP authentication failed. Check SMTP_USER and SMTP_PASS (app password).",
        502
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
        502
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

    throw new EmailProviderError(
      "EMAIL_PROVIDER_ERROR",
      "Unable to send verification email right now. Please try again shortly.",
      502
    );
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
