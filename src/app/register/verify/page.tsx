"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "../../../components/UI";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";

type PendingRegistrationPayload = {
  name: string;
  email: string;
  password: string;
  role: string;
};

const OTP_TTL_SECONDS = 120;

const readJsonSafely = async (response: Response) => {
  const rawBody = await response.text();
  if (!rawBody) {
    return { rawText: "" };
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return { rawText: rawBody };
  }
};

const redirectByRole = (role: string, router: ReturnType<typeof useRouter>) => {
  const userRole = role?.toLowerCase();
  if (userRole === "organizer") {
    router.push("/dashboard/organizer/onboarding");
  } else if (userRole === "artisan") {
    router.push("/dashboard/artisan/onboarding");
  } else if (userRole === "admin") {
    router.push("/dashboard/admin/overview");
  } else {
    router.push("/");
  }
};

export default function RegisterVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthenticatedUser } = useAuth();

  const queryEmail = searchParams?.get("email") || "";
  const queryName = searchParams?.get("name") || "";
  const queryRole = searchParams?.get("role") || "tourist";

  const [otp, setOtp] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(OTP_TTL_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    "We sent your verification code. Check your Gmail inbox."
  );
  const [pendingRegistration, setPendingRegistration] =
    useState<PendingRegistrationPayload | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingRegistration");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PendingRegistrationPayload;
      setPendingRegistration(parsed);
    } catch {
      sessionStorage.removeItem("pendingRegistration");
    }
  }, []);

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsRemaining]);

  const resolvedEmail = useMemo(
    () => queryEmail || pendingRegistration?.email || "",
    [queryEmail, pendingRegistration?.email]
  );
  const resolvedName = useMemo(
    () => queryName || pendingRegistration?.name || "there",
    [queryName, pendingRegistration?.name]
  );
  const resolvedRole = useMemo(
    () => queryRole || pendingRegistration?.role || "tourist",
    [queryRole, pendingRegistration?.role]
  );

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedEmail) {
      setError("Missing registration email. Please restart signup.");
      return;
    }
    if (otp.trim().length !== 6) {
      setError("Please enter your 6-digit OTP.");
      return;
    }

    try {
      setIsVerifying(true);
      setError("");
      setInfo("");

      const response = await fetch("/api/auth/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resolvedEmail, otp: otp.trim() }),
      });
      const data = await readJsonSafely(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.rawText ||
            `OTP verification failed (HTTP ${response.status}).`
        );
      }

      if (data.user) {
        setAuthenticatedUser(data.user);
      }

      sessionStorage.removeItem("pendingRegistration");
      redirectByRole(data.user?.role || resolvedRole, router);
    } catch (verifyError: any) {
      setError(verifyError.message || "Failed to verify OTP.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (secondsRemaining > 0 || isResending) return;

    if (!pendingRegistration) {
      setError("Session expired. Please restart registration to request a new OTP.");
      return;
    }

    try {
      setIsResending(true);
      setError("");
      setInfo("");

      const response = await fetch("/api/auth/register/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingRegistration),
      });
      const data = await readJsonSafely(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.rawText ||
            `Unable to resend OTP (HTTP ${response.status}).`
        );
      }

      setOtp("");
      setSecondsRemaining(data.expiresInSeconds || OTP_TTL_SECONDS);
      setInfo("A new OTP was sent to your Gmail inbox.");
    } catch (resendError: any) {
      setError(resendError.message || "Unable to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen py-20 bg-ethio-bg flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-primary mb-2">
            Verify Your Gmail
          </h1>
          <p className="text-gray-600 text-sm">
            Hi {resolvedName}, enter the 6-digit code sent to:
          </p>
          <p className="font-semibold text-primary mt-1 break-all">{resolvedEmail || "your email"}</p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <Input
            label="OTP Code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />

          {info && <p className="text-sm text-green-700 bg-green-50 p-3 rounded-xl">{info}</p>}
          {error && <p className="text-sm text-red-700 bg-red-50 p-3 rounded-xl">{error}</p>}

          <Button type="submit" className="w-full" size="lg" isLoading={isVerifying}>
            Verify and create account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
          <p>
            {secondsRemaining > 0
              ? `Resend available in ${secondsRemaining}s`
              : "Did not get the code?"}
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={secondsRemaining > 0}
            isLoading={isResending}
          >
            Resend OTP
          </Button>
          <p>
            Wrong email?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Start over
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
