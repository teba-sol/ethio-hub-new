type RegistrationOtpEmailInput = {
  to: string;
  name: string;
  otp: string;
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

const getEmailProvider = () =>
  (process.env.EMAIL_PROVIDER || "brevo").trim().toLowerCase();

const getRequiredCommonSenderConfig = () => {
  const fromEmail = process.env.EMAIL_FROM?.trim().toLowerCase();
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "Ethio Craft Hub";

  if (!fromEmail) {
    throw new EmailProviderError(
      "EMAIL_PROVIDER_NOT_READY",
      "Email sender is not configured. Please contact support.",
      503
    );
  }

  if (!SENDER_EMAIL_REGEX.test(fromEmail)) {
    throw new EmailProviderError(
      "EMAIL_PROVIDER_NOT_READY",
      "Email sender configuration is invalid. Please contact support.",
      503
    );
  }

  return { fromEmail, fromName };
};

const getRequiredResendConfig = () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new EmailProviderError(
      "EMAIL_PROVIDER_NOT_READY",
      "Email service is not configured. Please try again later.",
      503
    );
  }
  return apiKey;
};

const getRequiredBrevoConfig = () => {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    throw new EmailProviderError(
      "EMAIL_PROVIDER_NOT_READY",
      "Email service is not configured. Please add BREVO_API_KEY in .env (Brevo dashboard -> SMTP & API -> API Keys).",
      503
    );
  }
  return apiKey;
};

const buildOtpHtml = (name: string, otp: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin-bottom: 16px; color: #0f172a;">Verify your email</h2>
    <p style="margin-bottom: 16px;">Hello ${name},</p>
    <p style="margin-bottom: 16px;">
      Use the OTP below to complete your Ethio Craft Hub registration.
    </p>
    <div style="margin: 24px 0; padding: 18px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; text-align: center;">
      <div style="font-size: 30px; letter-spacing: 8px; font-weight: 700; color: #0f172a;">${otp}</div>
    </div>
    <p style="margin-bottom: 8px;">This code expires in <strong>2 minutes</strong>.</p>
    <p style="margin: 0; color: #64748b;">If you did not request this, you can ignore this email.</p>
  </div>
`;

const parseOptionalJsonResponse = async (response: Response) => {
  const rawBody = await response.text();
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
};

const sendViaResend = async (input: RegistrationOtpEmailInput) => {
  const apiKey = getRequiredResendConfig();
  const { fromEmail, fromName } = getRequiredCommonSenderConfig();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `"${fromName}" <${fromEmail}>`,
      to: input.to,
      subject: "Your Ethio Craft Hub verification code",
      html: buildOtpHtml(input.name, input.otp),
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new EmailProviderError(
        "EMAIL_PROVIDER_AUTH",
        "Email service authentication failed. Please try again later.",
        502
      );
    }

    if (response.status === 429) {
      throw new EmailProviderError(
        "EMAIL_PROVIDER_RATE_LIMIT",
        "Too many OTP requests right now. Please wait a moment and try again.",
        429
      );
    }

    if (response.status === 403) {
      throw new EmailProviderError(
        "EMAIL_PROVIDER_NOT_READY",
        "Email delivery is not ready. Resend requires a verified domain to email other users.",
        503
      );
    }

    throw new EmailProviderError(
      "EMAIL_PROVIDER_ERROR",
      "Unable to send verification email right now. Please try again shortly.",
      502
    );
  }

  return parseOptionalJsonResponse(response);
};

const sendViaBrevo = async (input: RegistrationOtpEmailInput) => {
  const apiKey = getRequiredBrevoConfig();
  const { fromEmail, fromName } = getRequiredCommonSenderConfig();

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: input.to, name: input.name }],
      subject: "Your Ethio Craft Hub verification code",
      htmlContent: buildOtpHtml(input.name, input.otp),
    }),
  });

  if (!response.ok) {
    // Keep messages user-safe; map by status for a professional UX.
    if (response.status === 401 || response.status === 403) {
      throw new EmailProviderError(
        "EMAIL_PROVIDER_AUTH",
        "Email service authentication failed. Please check your Brevo API key.",
        502
      );
    }

    if (response.status === 429) {
      throw new EmailProviderError(
        "EMAIL_PROVIDER_RATE_LIMIT",
        "Daily email limit reached. Please try again tomorrow.",
        429
      );
    }

    if (response.status === 400 || response.status === 422) {
      throw new EmailProviderError(
        "EMAIL_PROVIDER_NOT_READY",
        "Email sender is not verified in Brevo. Please verify the sender email in your Brevo dashboard.",
        503
      );
    }

    throw new EmailProviderError(
      "EMAIL_PROVIDER_ERROR",
      "Unable to send verification email right now. Please try again shortly.",
      502
    );
  }

  return parseOptionalJsonResponse(response);
};

export const sendRegistrationOtpEmail = async ({
  to,
  name,
  otp,
}: RegistrationOtpEmailInput) => {
  const provider = getEmailProvider();

  if (provider === "resend") {
    return sendViaResend({ to, name, otp });
  }

  if (provider === "brevo") {
    return sendViaBrevo({ to, name, otp });
  }

  throw new EmailProviderError(
    "EMAIL_PROVIDER_NOT_READY",
    "Email service is not configured. Please set EMAIL_PROVIDER to 'brevo' or 'resend'.",
    503
  );
};
