"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Input } from "../../components/UI";

const readJsonSafely = async (response: Response) => {
  const rawBody = await response.text();
  if (!rawBody) return { rawText: "" };
  try {
    return JSON.parse(rawBody);
  } catch {
    return { rawText: rawBody };
  }
};

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams?.get("token") || "", [searchParams]);

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("Verifying your email...");
  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setLoading(false);
        setVerified(false);
        setMessage("Missing verification token. Please request a new verification email.");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await readJsonSafely(response);
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Invalid or expired verification link.");
        }
        setVerified(true);
        setMessage("Your email is verified! You can now log in.");
      } catch (error: any) {
        setVerified(false);
        setMessage(error.message || "Invalid or expired verification link.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    try {
      setResendMsg("");
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await readJsonSafely(response);
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to resend verification email.");
      }
      setResendMsg("Verification email resent. Check your inbox.");
    } catch (error: any) {
      setResendMsg(error.message || "Unable to resend verification email.");
    }
  };

  return (
    <div className="min-h-screen py-20 bg-ethio-bg flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
        {loading ? (
          <p className="text-center text-gray-600">{message}</p>
        ) : verified ? (
          <div className="text-center space-y-4">
            <p className="text-green-700 bg-green-50 p-3 rounded-xl">{message}</p>
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Go to login
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-red-700 bg-red-50 p-3 rounded-xl">{message}</p>
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
            />
            <Button type="button" className="w-full" onClick={handleResend} disabled={!resendEmail}>
              Request new verification email
            </Button>
            {resendMsg && <p className="text-sm text-gray-700">{resendMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
