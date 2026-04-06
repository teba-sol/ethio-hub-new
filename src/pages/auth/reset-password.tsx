import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/UI';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const handleReset = async () => {
    if (!token) {
      setMessage({ type: 'error', text: 'Invalid reset token' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-primary mb-2">Password Reset!</h2>
          <p className="text-gray-500 mb-4">Your password has been reset successfully.</p>
          <p className="text-sm text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-primary">Reset Password</h2>
          <p className="text-gray-500 mt-2">Enter your new password below</p>
        </div>

        <div className="space-y-4">
          {message && (
            <div className={`p-3 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 pr-12 text-sm focus:ring-2 focus:ring-primary/10" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Confirm Password</label>
            <input 
              type={showPassword ? 'text' : 'password'} 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
            />
          </div>

          <Button 
            variant="primary" 
            className="w-full" 
            onClick={handleReset} 
            disabled={loading || !newPassword || !confirmPassword}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
            Reset Password
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Remember your password? <a href="/login" className="text-primary font-bold hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
}