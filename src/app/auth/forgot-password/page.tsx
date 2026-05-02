"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Input } from "../../../../components/UI";
import { useLanguage } from "../../../../context/LanguageContext";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: "error", text: t("auth.loginRequired") || "Email is required" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await res.json();

      if (data.success) {
        setEmailSent(true);
        setMessage({ 
          type: "success", 
          text: t("auth.resetSuccessMessage") || "If an account exists with this email, a password reset code has been sent." 
        });
        
        // In development, show the OTP
        if (data.devOtp) {
          console.log("Dev OTP:", data.devOtp);
        }
        
        // Redirect to reset password page after a delay
        setTimeout(() => {
          router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
        }, 3000);
      } else {
        setMessage({ type: "error", text: data.message || t("auth.unexpectedError") });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("auth.unexpectedError") || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-primary mb-2">
            {t("auth.resetSuccessMessage") || "Check Your Email"}
          </h2>
          <p className="text-gray-500 mb-4">
            {t("auth.passwordResetConfirmation") || "If an account exists with this email, a password reset code has been sent."}
          </p>
          <p className="text-sm text-gray-400">
            {t("auth.redirectingToLogin") || "Redirecting to reset password page..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-primary">
            {t("auth.resetPasswordTitle") || "Forgot Password?"}
          </h2>
          <p className="text-gray-500 mt-2">
            {t("auth.resetPasswordSubtitle") || "Enter your email to receive a password reset code."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-xl flex items-center gap-2 ${
              message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {t("auth.email") || "Email Address"}
            </label>
            <Input 
              type="email"
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !email}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
            {loading ? "Sending..." : t("auth.resetPasswordButton") || "Send Reset Code"}
          </Button>
        </form>

        <p className="text-xs text-gray-400 mt-4 text-center">
          {t("auth.rememberPassword") || "Remember your password?"}{" "}
          <a href="/login" className="text-primary font-bold hover:underline">
            {t("auth.loginLink") || "Login"}
          </a>
        </p>
      </div>
    </div>
  );
}
