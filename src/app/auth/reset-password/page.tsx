"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Key, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/UI';
import { useLanguage } from '../../../context/LanguageContext';

function ResetPasswordContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('password');
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: data.message || 'Invalid or expired code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setMessage({ type: 'success', text: 'Password reset successfully!' });
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to reset password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
        <div className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] text-center border border-gray-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-[28px] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-serif font-black text-primary mb-3">Password Reset!</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">Your password has been successfully updated. You can now log in with your new credentials.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 font-medium">
             <Loader2 className="w-4 h-4 animate-spin" />
             <span>Redirecting to login...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/5 rounded-[28px] flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-serif font-black text-primary tracking-tight">
            {step === 'otp' ? 'Verify Identity' : 'New Password'}
          </h2>
          <p className="text-gray-400 mt-3 text-sm leading-relaxed">
            {step === 'otp' 
              ? `We've sent a code to ${email.split('@')[0]?.slice(0,3)}***@${email.split('@')[1]}` 
              : 'Secure your account with a new strong password'}
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 mb-8 animate-in slide-in-from-top-2 duration-300 ${
            message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="text-xs font-bold uppercase tracking-wider">{message.text}</span>
          </div>
        )}

        {step === 'otp' ? (
          <form onSubmit={handleVerifyOtp} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center block">
                Enter 6-Digit Code
              </label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="000000"
                className="w-full px-6 py-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary/20 focus:bg-white focus:ring-0 outline-none transition-all text-center text-3xl font-serif font-bold tracking-[0.5em] placeholder:tracking-normal placeholder:text-gray-200"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-7 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all"
              disabled={otp.length !== 6 || loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : null}
              {loading ? "Verifying..." : "Verify Code"}
              {!loading && <ArrowRight className="w-4 h-4 ml-3" />}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary/20 focus:bg-white focus:ring-0 outline-none transition-all text-sm font-medium" 
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary/20 focus:bg-white focus:ring-0 outline-none transition-all text-sm font-medium" 
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-7 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all" 
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Key className="w-4 h-4 mr-3" />}
              {loading ? "Updating..." : "Reset Password"}
            </Button>
          </form>
        )}

        <div className="mt-10 pt-6 border-t border-gray-50 text-center">
          <p className="text-xs text-gray-400 font-medium">
            Remembered your password?{" "}
            <a href="/login" className="text-primary font-black uppercase tracking-widest text-[10px] hover:underline ml-1">
              Back to Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50/50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
