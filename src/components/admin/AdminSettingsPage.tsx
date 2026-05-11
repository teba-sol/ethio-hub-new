import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Database, Download, Camera, Loader2, Key,
  User, Shield, AlertCircle, Lock, Save
} from 'lucide-react';
import { Button, Input, Badge } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';

// --- Types ---
interface AdminRole {
  id: string;
  name: string;
  users: number;
  permissions: string[];
}

interface LoginLog {
  device: string;
  location: string;
  ip: string;
  date: string;
  status: 'Success' | 'Failed';
}

// --- Mock Data ---
const ROLES: AdminRole[] = [
  { id: '1', name: 'Super Admin', users: 2, permissions: ['All Access'] },
  { id: '2', name: 'Moderator', users: 5, permissions: ['Approve Content', 'Manage Users', 'View Reports'] },
  { id: '3', name: 'Finance Admin', users: 1, permissions: ['View Revenue', 'Manage Payouts', 'Export Financials'] },
  { id: '4', name: 'Support Agent', users: 3, permissions: ['View Users', 'Manage Tickets'] },
];

const LOGIN_HISTORY: LoginLog[] = [
  { device: 'Chrome / Windows', location: 'Addis Ababa, ET', ip: '197.156.x.x', date: 'Just now', status: 'Success' },
  { device: 'Safari / iPhone', location: 'Addis Ababa, ET', ip: '197.156.x.x', date: '2 hours ago', status: 'Success' },
  { device: 'Firefox / Mac', location: 'Nairobi, KE', ip: '102.140.x.x', date: 'Yesterday', status: 'Failed' },
];

export const AdminSettingsPage: React.FC = () => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    profileImage: '',
    role: '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/admin/profile');
      const data = await res.json();
      if (data.success) {
        setProfile({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          profileImage: data.user.profileImage || '',
          role: data.user.role || 'Admin',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) {
        setProfile(prev => ({ ...prev, profileImage: data.url }));
        updateUser({ profileImage: data.url });
        setMessage({ type: 'success', text: 'Photo uploaded! Click "Save Profile" to apply changes permanently.' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to upload photo' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload photo' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          profileImage: profile.profileImage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        updateUser({
          name: profile.name,
          phone: profile.phone,
          profileImage: profile.profileImage,
        });
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-3xl font-serif font-bold text-primary">Admin Profile</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your personal information and security.</p>
      </header>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 md:p-12">
        <div className="max-w-3xl mx-auto space-y-12">
          
          {/* PROFILE HEADER */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarUpload}
              />
              <div className="w-32 h-32 rounded-full bg-primary/10 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-primary">{profile.name.charAt(0)}</span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-serif font-bold text-gray-900">{profile.name}</h3>
              <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2 mt-1">
                <Shield className="w-4 h-4" /> {profile.role || 'Super Admin'} • Last login: Just now
              </p>
            </div>
          </div>

          {/* PERSONAL INFORMATION */}
          <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 space-y-8">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Full Name</label>
                <Input 
                  value={profile.name} 
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                  className="bg-white border-none rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Email Address</label>
                <Input 
                  value={profile.email} 
                  disabled 
                  className="bg-gray-100 border-none rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Phone Number</label>
                <Input 
                  value={profile.phone} 
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                  placeholder="+251 911 234 567" 
                  className="bg-white border-none rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Role</label>
                <Input 
                  value={profile.role || 'Super Admin'} 
                  disabled 
                  className="bg-gray-100 border-none rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Profile
              </Button>
            </div>
          </div>

          {/* PASSWORD UPDATE */}
          <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 space-y-8">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-4 h-4" /> Change Password
            </h4>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Current Password</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="bg-white border-none rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">New Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="bg-white border-none rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Confirm New Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="bg-white border-none rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={savePassword} disabled={saving || !passwords.currentPassword || !passwords.newPassword} variant="primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                Update Password
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
