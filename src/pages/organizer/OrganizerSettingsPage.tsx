import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Shield, Bell, Sliders, Link as LinkIcon,
  Camera, CheckCircle2, AlertCircle, Smartphone, Monitor,
  LogOut, Download, Plus, MessageSquare, Globe,
  Calendar, Video, Key, Loader2, Save, Eye, EyeOff
} from 'lucide-react';
import { Button, Badge } from '../../components/UI';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

interface OrganizerProfile {
  companyName?: string;
  phone?: string;
  website?: string;
  address?: string;
  bio?: string;
  avatar?: string;
  isVerified?: boolean;
  notifications?: {
    newBooking?: boolean;
    newReview?: boolean;
    payoutProcessed?: boolean;
    eventReminders?: boolean;
    emailFrequency?: string;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
  };
  preferences?: {
    language?: string;
    currency?: string;
    timezone?: string;
    dateFormat?: string;
    defaultLandingPage?: string;
    darkMode?: boolean;
  };
}

export const OrganizerSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    companyName: '',
    phone: '',
    website: '',
    country: '',
    region: '',
    city: '',
    address: '',
    bio: '',
    avatar: '',
    isVerified: false,
    organizerStatus: 'Not Submitted',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [notifications, setNotifications] = useState({
    newBooking: true,
    newReview: true,
    payoutProcessed: true,
    eventReminders: false,
    emailFrequency: 'instant',
    smsNotifications: false,
    pushNotifications: true,
  });

  const [preferences, setPreferences] = useState({
    language: 'English',
    currency: 'ETB',
    timezone: 'Africa/Addis_Ababa',
    dateFormat: 'DD/MM/YYYY',
    defaultLandingPage: 'Overview',
    darkMode: false,
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/organizer/settings');
      const data = await res.json();
      if (data.success) {
        const settings = data.settings;
        const orgProfile = settings.organizerProfile || {};
        
        setProfile({
          name: settings.name || '',
          email: settings.email || '',
          companyName: orgProfile.companyName || '',
          phone: orgProfile.phone || '',
          website: orgProfile.website || '',
          country: orgProfile.country || '',
          region: orgProfile.region || '',
          city: orgProfile.city || '',
          address: orgProfile.address || '',
          bio: orgProfile.bio || '',
          avatar: orgProfile.avatar || '',
          isVerified: orgProfile.isVerified || false,
          organizerStatus: settings.organizerStatus || 'Not Submitted',
        });

        setNotifications({
          newBooking: orgProfile.notifications?.newBooking ?? true,
          newReview: orgProfile.notifications?.newReview ?? true,
          payoutProcessed: orgProfile.notifications?.payoutProcessed ?? true,
          eventReminders: orgProfile.notifications?.eventReminders ?? false,
          emailFrequency: orgProfile.notifications?.emailFrequency || 'instant',
          smsNotifications: orgProfile.notifications?.smsNotifications ?? false,
          pushNotifications: orgProfile.notifications?.pushNotifications ?? true,
        });

        setPreferences({
          language: orgProfile.preferences?.language || 'English',
          currency: orgProfile.preferences?.currency || 'ETB',
          timezone: orgProfile.preferences?.timezone || 'Africa/Addis_Ababa',
          dateFormat: orgProfile.preferences?.dateFormat || 'DD/MM/YYYY',
          defaultLandingPage: orgProfile.preferences?.defaultLandingPage || 'Overview',
          darkMode: orgProfile.preferences?.darkMode ?? false,
        });

        setTwoFactorEnabled(orgProfile.twoFactorEnabled ?? false);
        setLoginAlerts(orgProfile.loginAlerts ?? false);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
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
        setProfile(prev => ({ ...prev, avatar: data.url }));
        setMessage({ type: 'success', text: 'Photo uploaded! Click "Save Changes" to apply.' });
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
    // Phone number validation: must be exactly 10 digits
    const phoneDigits = profile.phone.replace(/\D/g, '');
    if (phoneDigits && phoneDigits.length !== 10) {
      setMessage({ type: 'error', text: 'Contact Phone must be exactly 10 digits.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/organizer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          organizerProfile: {
            companyName: profile.companyName,
            phone: profile.phone,
            website: profile.website,
            address: profile.address,
            bio: profile.bio,
            avatar: profile.avatar,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
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
    if (!passwords.currentPassword) {
      setMessage({ type: 'error', text: 'Please enter your current password' });
      return;
    }
    if (passwords.currentPassword === passwords.newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from the current one' });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/organizer/settings', {
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

  const saveNotifications = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/organizer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerProfile: {
            notifications: notifications,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Notification preferences saved!' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/organizer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerProfile: {
            preferences: preferences,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Dashboard preferences saved!' });
        if (preferences.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const saveSecurity = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/organizer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twoFactorEnabled,
          loginAlerts,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Security preferences saved!' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save security preferences' });
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
        <h2 className="text-3xl font-serif font-bold text-primary">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your account, preferences, and integrations.</p>
      </header>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Horizontal Tabs */}
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 w-full overflow-x-auto no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setMessage(null); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-primary hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 md:p-12">
        
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group cursor-pointer shrink-0" onClick={() => avatarInputRef.current?.click()}>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-lg">
                  <img src={profile.avatar || `https://i.pravatar.cc/150?u=${profile.email}`} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-serif font-bold text-primary">{profile.companyName || profile.name}</h3>
                  {profile.isVerified && (
                    <Badge className="bg-emerald-50 text-emerald-600 border-none flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified by Admin
                    </Badge>
                  )}
                </div>
                <p className="text-gray-500 text-sm">Update your company photo and personal details here.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Organizer / Company Name</label>
                <input 
                  type="text" 
                  value={profile.companyName} 
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Email</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Phone</label>
                <input 
                  type="tel" 
                  value={profile.phone} 
                  maxLength={10}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setProfile({ ...profile, phone: value });
                  }}
                  placeholder="e.g. 0912345678"
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                />
                <p className="text-[10px] text-gray-400">Must be exactly 10 digits (e.g., 0912345678)</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Website (Optional)</label>
                <input 
                  type="url" 
                  value={profile.website} 
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Business Address</label>
                <input 
                  type="text" 
                  value={profile.address} 
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Country</label>
                  <input 
                    type="text" 
                    readOnly
                    value={profile.country} 
                    className="w-full bg-gray-100 border-none rounded-xl py-2 px-3 text-xs cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Region</label>
                  <input 
                    type="text" 
                    readOnly
                    value={profile.region} 
                    className="w-full bg-gray-100 border-none rounded-xl py-2 px-3 text-xs cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">City</label>
                  <input 
                    type="text" 
                    readOnly
                    value={profile.city} 
                    className="w-full bg-gray-100 border-none rounded-xl py-2 px-3 text-xs cursor-not-allowed" 
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bio / About Organizer</label>
                <textarea 
                  rows={4} 
                  value={profile.bio} 
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 resize-none" 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-serif font-bold text-primary mb-6">Password & Authentication</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Current Password</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.current ? 'text' : 'password'} 
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      placeholder="••••••••" 
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 pr-12 text-sm focus:ring-2 focus:ring-primary/10" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="hidden md:block"></div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.new ? 'text' : 'password'} 
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      placeholder="••••••••" 
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 pr-12 text-sm focus:ring-2 focus:ring-primary/10" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.confirm ? 'text' : 'password'} 
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      placeholder="••••••••" 
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 pr-12 text-sm focus:ring-2 focus:ring-primary/10" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button variant="primary" onClick={savePassword} disabled={saving || !passwords.currentPassword || !passwords.newPassword}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                  Update Password
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Use your current password to update to a new one.</p>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <div className="p-6 bg-red-50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-red-700">Deactivate Account</h4>
                  <p className="text-xs text-red-600/80 mt-1">Once you deactivate your account, your events will be unpublished.</p>
                </div>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-100">Deactivate Account</Button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-serif font-bold text-primary mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-primary text-sm">New Booking Received</h4>
                    <p className="text-xs text-gray-500 mt-1">Get notified when someone buys a ticket.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.newBooking}
                      onChange={(e) => setNotifications({ ...notifications, newBooking: e.target.checked })} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-primary text-sm">New Review Posted</h4>
                    <p className="text-xs text-gray-500 mt-1">Get notified when an attendee leaves a review.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.newReview}
                      onChange={(e) => setNotifications({ ...notifications, newReview: e.target.checked })} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-primary text-sm">Payout Processed</h4>
                    <p className="text-xs text-gray-500 mt-1">Get notified when funds are transferred to your bank.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.payoutProcessed}
                      onChange={(e) => setNotifications({ ...notifications, payoutProcessed: e.target.checked })} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-primary text-sm">Event Reminders</h4>
                    <p className="text-xs text-gray-500 mt-1">Get tips and reminders before your event starts.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.eventReminders}
                      onChange={(e) => setNotifications({ ...notifications, eventReminders: e.target.checked })} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <Button onClick={saveNotifications} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Preferences
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
