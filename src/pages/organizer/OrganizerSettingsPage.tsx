import React, { useState, useEffect } from 'react';
import { 
  User, Shield, CreditCard, Bell, Sliders, Link as LinkIcon,
  Camera, CheckCircle2, AlertCircle, Smartphone, Monitor,
  LogOut, Download, Plus, Mail, MessageSquare, Globe,
  Calendar, Video, Key, Loader2, Save
} from 'lucide-react';
import { Button, Badge } from '../../components/UI';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'preferences', label: 'Preferences', icon: Sliders },
  { id: 'integrations', label: 'Integrations', icon: LinkIcon },
];

interface OrganizerProfile {
  companyName?: string;
  phone?: string;
  website?: string;
  address?: string;
  bio?: string;
  avatar?: string;
  payoutMethod?: string;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
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
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    companyName: '',
    phone: '',
    website: '',
    address: '',
    bio: '',
    avatar: '',
    isVerified: false,
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [payments, setPayments] = useState({
    payoutMethod: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
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
          address: orgProfile.address || '',
          bio: orgProfile.bio || '',
          avatar: orgProfile.avatar || '',
          isVerified: orgProfile.isVerified || false,
        });

        setPayments({
          payoutMethod: orgProfile.payoutMethod || '',
          bankName: orgProfile.bankName || '',
          accountHolderName: orgProfile.accountHolderName || '',
          accountNumber: orgProfile.accountNumber || '',
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
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
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
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
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
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password' });
    } finally {
      setSaving(false);
    }
  };

  const savePayments = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/organizer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerProfile: {
            payoutMethod: payments.payoutMethod,
            bankName: payments.bankName,
            accountHolderName: payments.accountHolderName,
            accountNumber: payments.accountNumber,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Payment details updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update payment details' });
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
              <div className="relative group cursor-pointer shrink-0">
                <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-lg">
                  <img src={profile.avatar || `https://i.pravatar.cc/150?u=${profile.email}`} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
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
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                />
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
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Business Address</label>
                <input 
                  type="text" 
                  value={profile.address} 
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                />
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
                  <input 
                    type="password" 
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    placeholder="••••••••" 
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                  />
                </div>
                <div className="hidden md:block"></div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">New Password</label>
                  <input 
                    type="password" 
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="••••••••" 
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="••••••••" 
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={savePassword} disabled={saving || !passwords.currentPassword || !passwords.newPassword}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-xl font-serif font-bold text-primary mb-6">Security Preferences</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-primary text-sm">Two-Factor Authentication (2FA)</h4>
                    <p className="text-xs text-gray-500 mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" disabled />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-primary text-sm">Login Alerts</h4>
                    <p className="text-xs text-gray-500 mt-1">Get notified when someone logs into your account from a new device.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" disabled />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-xl font-serif font-bold text-primary mb-6">Active Sessions</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-emerald-100 bg-emerald-50/30 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm"><Monitor className="w-5 h-5" /></div>
                    <div>
                      <h4 className="font-bold text-primary text-sm">Current Device</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Active Now</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-none">Current Session</Badge>
                </div>
              </div>
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

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-ethio-dark text-white rounded-3xl shadow-xl">
              <div>
                <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-1">Payout Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-xl font-serif font-bold">{payments.payoutMethod ? 'Active & Verified' : 'Not Configured'}</h3>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-1">Next Scheduled Payout</p>
                <p className="text-lg font-bold">1st of each month</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-serif font-bold text-primary mb-6">Payout Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payout Method</label>
                  <select 
                    value={payments.payoutMethod} 
                    onChange={(e) => setPayments({ ...payments, payoutMethod: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 font-medium"
                  >
                    <option value="">Select method</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="telebirr">Telebirr</option>
                    <option value="chapa">Chapa</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bank Name</label>
                  <input 
                    type="text" 
                    value={payments.bankName} 
                    onChange={(e) => setPayments({ ...payments, bankName: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Account Holder Name</label>
                  <input 
                    type="text" 
                    value={payments.accountHolderName} 
                    onChange={(e) => setPayments({ ...payments, accountHolderName: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Account Number</label>
                  <input 
                    type="text" 
                    value={payments.accountNumber} 
                    onChange={(e) => setPayments({ ...payments, accountNumber: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10" 
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={savePayments} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Update Payout Details
                </Button>
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

            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-xl font-serif font-bold text-primary mb-6">Delivery Methods</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Frequency</label>
                  <select 
                    value={notifications.emailFrequency}
                    onChange={(e) => setNotifications({ ...notifications, emailFrequency: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 font-medium"
                  >
                    <option value="instant">Instant (As they happen)</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Summary</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Other Channels</label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary flex items-center gap-2"><Smartphone className="w-4 h-4 text-gray-400" /> SMS Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.smsNotifications}
                        onChange={(e) => setNotifications({ ...notifications, smsNotifications: e.target.checked })} 
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary flex items-center gap-2"><Bell className="w-4 h-4 text-gray-400" /> Push Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.pushNotifications}
                        onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })} 
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
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

        {/* PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <h3 className="text-xl font-serif font-bold text-primary mb-6">Dashboard Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dashboard Language</label>
                <select 
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 font-medium"
                >
                  <option>English</option>
                  <option>Amharic</option>
                  <option>Oromiffa</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Currency Preference</label>
                <select 
                  value={preferences.currency}
                  onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 font-medium"
                >
                  <option>ETB (Ethiopian Birr)</option>
                  <option>USD (US Dollar)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Timezone</label>
                <select 
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 font-medium"
                >
                  <option>Africa/Addis_Ababa (EAT)</option>
                  <option>UTC</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Date Format</label>
                <select 
                  value={preferences.dateFormat}
                  onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 font-medium"
                >
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Default Landing Page</label>
                <select 
                  value={preferences.defaultLandingPage}
                  onChange={(e) => setPreferences({ ...preferences, defaultLandingPage: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10 font-medium"
                >
                  <option>Overview</option>
                  <option>My Events</option>
                  <option>Analytics</option>
                  <option>Revenue</option>
                </select>
              </div>
              <div className="space-y-2 flex flex-col justify-center">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Appearance</label>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                  <span className="text-sm font-medium text-primary">Dark Mode</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={preferences.darkMode}
                      onChange={(e) => setPreferences({ ...preferences, darkMode: e.target.checked })} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <Button onClick={savePreferences} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Preferences
              </Button>
            </div>
          </div>
        )}

        {/* INTEGRATIONS TAB */}
        {activeTab === 'integrations' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-serif font-bold text-primary mb-2">Connected Apps</h3>
              <p className="text-sm text-gray-500 mb-6">Connect external tools to streamline your workflow.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 border border-gray-100 rounded-2xl flex items-start gap-4 hover:border-primary/20 transition-colors">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0"><Calendar className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-primary text-sm">Google Calendar</h4>
                    <p className="text-xs text-gray-500 mt-1 mb-3">Sync your events directly to your calendar.</p>
                    <Button variant="outline" size="sm" className="text-xs py-1.5 h-auto">Connect</Button>
                  </div>
                </div>
                <div className="p-5 border border-gray-100 rounded-2xl flex items-start gap-4 hover:border-primary/20 transition-colors">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0"><Video className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-primary text-sm">Zoom</h4>
                    <p className="text-xs text-gray-500 mt-1 mb-3">Automatically create meetings for virtual events.</p>
                    <Button variant="outline" size="sm" className="text-xs py-1.5 h-auto">Connect</Button>
                  </div>
                </div>
                <div className="p-5 border border-gray-100 rounded-2xl flex items-start gap-4 hover:border-primary/20 transition-colors">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl shrink-0"><MessageSquare className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-primary text-sm">WhatsApp Business</h4>
                    <p className="text-xs text-gray-500 mt-1 mb-3">Send tickets and updates via WhatsApp.</p>
                    <Button variant="outline" size="sm" className="text-xs py-1.5 h-auto">Connect</Button>
                  </div>
                </div>
                <div className="p-5 border border-gray-100 rounded-2xl flex items-start gap-4 hover:border-primary/20 transition-colors">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0"><Mail className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-primary text-sm">Mailchimp</h4>
                    <p className="text-xs text-gray-500 mt-1 mb-3">Sync attendees to your marketing lists.</p>
                    <Button variant="outline" size="sm" className="text-xs py-1.5 h-auto">Connect</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-serif font-bold text-primary">API & Webhooks</h3>
                  <p className="text-sm text-gray-500 mt-1">For advanced integrations and custom development.</p>
                </div>
                <Button variant="outline" size="sm" leftIcon={Plus}>Generate Key</Button>
              </div>
              
              <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-bold text-primary text-sm">Production API Key</h4>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">sk_live_••••••••••••••••••••••••8f92</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs py-1.5 h-auto">Reveal</Button>
                  <Button variant="outline" size="sm" className="text-xs py-1.5 h-auto text-red-600 border-red-200 hover:bg-red-50">Revoke</Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
