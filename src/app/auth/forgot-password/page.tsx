"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Input } from '../../../components/UI';
import { useLanguage } from '../../../context/LanguageContext';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: "error", text: "Email is required" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: "error", text: "this email is invalid" });
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
        // Redirect to reset password page immediately
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        setMessage({ type: "error", text: data.message || t("auth.unexpectedError") });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("auth.unexpectedError") || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/5 rounded-[28px] flex items-center justify-center mx-auto mb-6 rotate-3 group-hover:rotate-0 transition-transform">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-serif font-black text-primary tracking-tight">
            {t("auth.resetPasswordTitle") || "Reset Password"}
          </h2>
          <p className="text-gray-400 mt-3 text-sm leading-relaxed">
            {t("auth.resetPasswordSubtitle") || "Enter your email to receive reset instructions"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
              {t("auth.email") || "Email Address"}
            </label>
            <input 
              type="email"
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary/20 focus:bg-white focus:ring-0 outline-none transition-all text-sm font-medium placeholder:text-gray-300"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
              message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
            }`}>
              {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span className="text-xs font-bold uppercase tracking-wider">{message.text}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full py-7 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all" 
            disabled={loading || !email}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Mail className="w-4 h-4 mr-3" />}
            {loading ? "Sending..." : t("auth.resetPasswordButton") || "Send Reset Instructions"}
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
