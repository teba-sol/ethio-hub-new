"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Button, Input } from "../../../components/UI";

const COOLDOWN_SECONDS = 60;

const readJsonSafely = async (response: Response) => {
  const rawBody = await response.text();
  if (!rawBody) return { rawText: "" };
  try {
    return JSON.parse(rawBody);
  } catch {
    return { rawText: rawBody };
  }
};

export default function RegisterVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams?.get("email") || "";
  const storedEmail =
    typeof window !== "undefined"
      ? sessionStorage.getItem("pendingVerificationEmail") || ""
      : "";
  const email = useMemo(() => queryEmail || storedEmail, [queryEmail, storedEmail]);
  const storedMeta =
    typeof window !== "undefined"
      ? sessionStorage.getItem("pendingRegistrationMeta") || ""
      : "";
  const pendingMeta = useMemo(() => {
    if (!storedMeta) return { name: "", role: "" };
    try {
      const parsed = JSON.parse(storedMeta);
      return {
        name: String(parsed?.name || ""),
        role: String(parsed?.role || ""),
      };
    } catch {
      return { name: "", role: "" };
    }
  }, [storedMeta]);

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(COOLDOWN_SECONDS);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsRemaining]);

  const handleVerify = async () => {
    if (!email || otp.trim().length !== 6 || isVerifying) return;
    try {
      setIsVerifying(true);
      setError("");
      setMessage("");
      const response = await fetch("/api/auth/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      const data = await readJsonSafely(response);
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.rawText || "Invalid OTP. Please try again.");
      }
      setMessage("Verification successful. Redirecting...");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pendingVerificationEmail");
        sessionStorage.removeItem("pendingRegistrationMeta");
      }
      window.setTimeout(() => {
        router.push("/login");
      }, 700);
    } catch (verifyError: any) {
      setError(verifyError.message || "Unable to verify OTP right now.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || isResending || secondsRemaining > 0) return;
    try {
      setIsResending(true);
      setError("");
      setMessage("");
      const response = await fetch("/api/auth/register/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: pendingMeta.name,
          role: pendingMeta.role,
        }),
      });
      const data = await readJsonSafely(response);
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.rawText || "Unable to resend OTP.");
      }
      setMessage("A new OTP has been sent to your Gmail address.");
      setSecondsRemaining(COOLDOWN_SECONDS);
    } catch (resendError: any) {
      setError(resendError.message || "Unable to resend OTP right now.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen py-20 bg-ethio-bg flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-primary mb-2">Verify with OTP</h1>
          <p className="text-gray-600 text-sm">
            Enter the 6-digit code sent to:
          </p>
          <p className="font-semibold text-primary mt-1 break-all">{email || "your email"}</p>
        </div>

        {message && <p className="text-sm text-green-700 bg-green-50 p-3 rounded-xl mb-4">{message}</p>}
        {error && <p className="text-sm text-red-700 bg-red-50 p-3 rounded-xl mb-4">{error}</p>}

        <div className="space-y-4">
          <Input
            label="One-time password (OTP)"
            type="text"
            inputMode="numeric"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <Button
            type="button"
            className="w-full"
            onClick={handleVerify}
            isLoading={isVerifying}
            disabled={!email || otp.length !== 6}
          >
            Verify and continue
          </Button>
        </div>

        <Button
          type="button"
          className="w-full mt-3"
          onClick={handleResend}
          isLoading={isResending}
          disabled={!email || secondsRemaining > 0}
        >
          {secondsRemaining > 0 ? `Resend OTP in ${secondsRemaining}s` : "Resend OTP"}
        </Button>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Use only your valid Gmail address during registration.</p>
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Back to register
          </Link>
        </div>
      </div>
    </div>
  );
}
