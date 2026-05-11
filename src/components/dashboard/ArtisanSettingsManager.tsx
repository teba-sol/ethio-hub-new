import React, { useState, useEffect } from 'react';
import { 
  Store, Building2, CreditCard, Truck, Bell, Shield, UserCog, FileText,
  Save, Upload, Eye, CheckCircle2, AlertCircle, Smartphone, Globe, Mail,
  LogOut, Trash2, Download, RefreshCw, ChevronRight, Lock, MapPin, Camera,
  EyeOff, Key, Loader2
} from 'lucide-react';
import { Button, Badge, Input } from '../UI';

// --- Components ---

const Toggle: React.FC<{ label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
    <div>
      <p className="font-bold text-primary text-sm">{label}</p>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
    <button 
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-gray-200'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${checked ? 'left-7' : 'left-1'}`}></div>
    </button>
  </div>
);

const SectionHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="mb-6 pb-4 border-b border-gray-100">
    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    <p className="text-sm text-gray-500">{description}</p>
  </div>
);

export const ArtisanSettingsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Real State for forms
  const [shopProfile, setShopProfile] = useState({
    name: "",
    description: "",
    city: "",
    region: "",
    country: "",
    experience: "",
    email: "",
    profileImage: ""
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [businessInfo, setBusinessInfo] = useState({
    businessName: "",
    category: "",
    phone: "",
    address: "",
    idDocument: "",
    workshopPhoto: "",
    craftProcessPhoto: "",
  });

  const [paymentInfo, setPaymentInfo] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/artisan/settings');
        const data = await res.json();
        if (data.success) {
          const profile = data.profile;
          const user = data.user;
          
          if (profile) {
            setShopProfile({
              name: profile.businessName || user.name,
              description: profile.bio || "",
              city: profile.city || "",
              region: profile.region || "",
              country: profile.country || "Ethiopia",
              experience: String(profile.experience || ""),
              email: user.email || "",
              profileImage: profile.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.businessName || user.name)}&background=random`
            });

            setBusinessInfo({
              businessName: profile.businessName || "",
              category: profile.category || "",
              phone: profile.phone || "",
              address: profile.address || "",
              idDocument: profile.idDocument || "",
              workshopPhoto: profile.workshopPhoto || "",
              craftProcessPhoto: profile.craftProcessPhoto || "",
            });

            setPaymentInfo({
              bankName: profile.bankName || "",
              accountName: profile.accountName || "",
              accountNumber: profile.accountNumber || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching artisan settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ethio-hub');

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.secure_url) {
        // Update local state
        setShopProfile(prev => ({ ...prev, profileImage: data.secure_url }));
        
        // Update backend
        await fetch('/api/artisan/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileImage: data.secure_url }),
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/artisan/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: shopProfile.name,
          bio: shopProfile.description,
          city: shopProfile.city,
          region: shopProfile.region,
          country: shopProfile.country,
          experience: shopProfile.experience
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (passwords.currentPassword === passwords.newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from the current one' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/artisan/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
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
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const StatusMessage = () => {
    if (!message) return null;
    return (
      <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
        message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
      }`}>
        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        <p className="text-sm font-medium">{message.text}</p>
        <button onClick={() => setMessage(null)} className="ml-auto hover:opacity-70">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const [notifications, setNotifications] = useState({
    newOrder: true,
    lowStock: true,
    newReview: true,
    payout: true,
    promos: false,
    sms: true
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const tabs = [
    { id: 'profile', label: 'Shop Profile', icon: Store },
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'policies', label: 'Policies', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader title="Shop Profile" description="Manage how your shop appears to tourists and customers." />
            
            <StatusMessage />

            {/* Logo Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-6">
                <div 
                  className="w-24 h-24 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden relative group/logo cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img src={shopProfile.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(shopProfile.name)}&background=random`} className="w-full h-full object-cover" alt="Logo" />
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover/logo:opacity-100'}`}>
                    {uploading ? (
                      <RefreshCw className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{shopProfile.name}</h3>
                  <p className="text-sm text-gray-500">{shopProfile.city}, {shopProfile.country}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Shop Name</label>
                  <Input 
                    value={shopProfile.name} 
                    readOnly
                    className="bg-gray-50 cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Contact Email</label>
                  <Input 
                    value={shopProfile.email} 
                    readOnly 
                    className="bg-gray-50 cursor-not-allowed" 
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Shop Description / Bio</label>
                  <textarea 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 outline-none min-h-[120px] cursor-not-allowed"
                    value={shopProfile.description}
                    readOnly
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Years of Experience</label>
                  <Input type="number" value={shopProfile.experience} readOnly className="bg-gray-50 cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-gray-900">Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <Input value={shopProfile.city} readOnly className="bg-gray-50 cursor-not-allowed" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Region</label>
                  <Input value={shopProfile.region} readOnly className="bg-gray-50 cursor-not-allowed" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <Input value={shopProfile.country} readOnly className="bg-gray-50 cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* Save Button Removed since fields are read-only */}
          </div>
        );

      case 'business':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader title="Business Information" description="Private details for compliance and verification." />
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Verified Business</p>
                    <p className="text-xs text-emerald-600">Your business details have been verified.</p>
                  </div>
                </div>
                <Badge variant="success">Verified</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Legal Name</label>
                  <Input value={businessInfo.businessName} readOnly />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <Input value={businessInfo.category} readOnly />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <Input value={businessInfo.phone} readOnly />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Business Address</label>
                  <Input value={businessInfo.address} readOnly />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <label className="text-sm font-medium text-gray-700 mb-3 block">Business Documents (Read Only)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {businessInfo.idDocument && (
                    <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-bold text-gray-700">ID Document</p>
                          <p className="text-xs text-gray-400">Verified Identity</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-primary" onClick={() => window.open(businessInfo.idDocument, '_blank')}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                    </div>
                  )}
                  {businessInfo.workshopPhoto && (
                    <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Camera className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-bold text-gray-700">Workshop Photo</p>
                          <p className="text-xs text-gray-400">Production Space</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-primary" onClick={() => window.open(businessInfo.workshopPhoto, '_blank')}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                    </div>
                  )}
                  {businessInfo.craftProcessPhoto && (
                    <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-bold text-gray-700">Craft Process</p>
                          <p className="text-xs text-gray-400">Handmade Verification</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-primary" onClick={() => window.open(businessInfo.craftProcessPhoto, '_blank')}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                    </div>
                  )}
                  {!businessInfo.idDocument && !businessInfo.workshopPhoto && !businessInfo.craftProcessPhoto && (
                    <div className="col-span-full p-6 border-2 border-dashed border-gray-100 rounded-xl text-center text-gray-400 text-sm">
                      No documents found.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button leftIcon={Save}>Save Changes</Button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader title="Payment & Payout" description="Manage your earnings and payout methods." />

            {/* Balance Card */}
            <div className="bg-primary p-8 rounded-xl text-white shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-wider">Available Balance</p>
                  <h2 className="text-3xl font-bold mt-1">ETB 128,450.00</h2>
                </div>
                <Button className="bg-white text-primary hover:bg-gray-50 border-none">Request Payout</Button>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 flex gap-8 text-sm">
                <div>
                  <p className="text-primary-foreground/70">Last Payout</p>
                  <p className="font-bold">ETB 12,500 on Oct 24</p>
                </div>
                <div>
                  <p className="text-primary-foreground/70">Pending</p>
                  <p className="font-bold">ETB 4,200</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bank Account */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" /> Bank Account
                  </h3>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Bank Name</label>
                    <Input value={paymentInfo.bankName} readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Account Number</label>
                    <Input value={paymentInfo.accountNumber} readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Account Holder Name</label>
                    <Input value={paymentInfo.accountName} readOnly />
                  </div>
                </div>
              </div>

              {/* Mobile Wallet */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gray-400" /> Mobile Wallet
                  </h3>
                  <Badge variant="secondary">Inactive</Badge>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Provider</label>
                    <select className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm">
                      <option>Telebirr</option>
                      <option>M-Pesa</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <Input placeholder="+251..." />
                  </div>
                  <Button variant="outline" className="w-full">Set as Default</Button>
                </div>
              </div>
            </div>

            {/* Payout Settings */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 mb-2">Payout Settings</h3>
              <Toggle 
                label="Automatic Payouts" 
                description="Automatically transfer funds when threshold is reached." 
                checked={true} 
                onChange={() => {}} 
              />
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="font-bold text-gray-900 text-sm">Minimum Payout Threshold</p>
                  <p className="text-xs text-gray-400 mt-1">Minimum amount required for auto-payout.</p>
                </div>
                <div className="w-32">
                  <Input type="number" defaultValue="1000" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader title="Notifications" description="Choose what you want to be notified about." />
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              <Toggle 
                label="New Order Alerts" 
                description="Get notified when a customer places an order." 
                checked={notifications.newOrder} 
                onChange={(c) => setNotifications({...notifications, newOrder: c})} 
              />
              <Toggle 
                label="New Reviews" 
                description="Get notified when a customer leaves a review." 
                checked={notifications.newReview} 
                onChange={(c) => setNotifications({...notifications, newReview: c})} 
              />
              <Toggle 
                label="Payout Processed" 
                description="Notification when funds are transferred to your account." 
                checked={notifications.payout} 
                onChange={(c) => setNotifications({...notifications, payout: c})} 
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button leftIcon={Save}>Save Preferences</Button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col gap-2">
              <SectionHeader title="Security & Authentication" description="Manage your account security, password and protection settings." />
            </div>

            <StatusMessage />
            
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Update Your Password</h4>
                  <p className="text-xs text-gray-500">Ensure your account is using a long, random password to stay secure.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div className="max-w-md space-y-6">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Current Password</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input 
                        type={showPasswords.current ? 'text' : 'password'} 
                        placeholder="Enter current password"
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-xl py-3.5 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-gray-300"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary p-2 transition-colors"
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* New Password */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">New Password</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                          <Key className="w-4 h-4" />
                        </div>
                        <input 
                          type={showPasswords.new ? 'text' : 'password'} 
                          placeholder="••••••••"
                          value={passwords.newPassword}
                          onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-xl py-3.5 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-gray-300"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary p-2 transition-colors"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Confirm Password</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <input 
                          type={showPasswords.confirm ? 'text' : 'password'} 
                          placeholder="••••••••"
                          value={passwords.confirmPassword}
                          onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-xl py-3.5 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-gray-300"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary p-2 transition-colors"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50">
                <Button 
                  onClick={handleUpdatePassword}
                  disabled={saving || !passwords.currentPassword || !passwords.newPassword}
                  className="rounded-xl px-8 py-6 h-auto font-bold shadow-lg shadow-primary/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Update Password
                </Button>
              </div>
            </div>

            {/* Account Deletion */}
            <div className="bg-red-50/50 p-8 rounded-2xl border border-red-100 space-y-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-black uppercase tracking-wider">Danger Zone</h3>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Delete Artisan Account</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-md">Once you delete your account, all of your products, orders, and data will be permanently removed. This action cannot be undone.</p>
                </div>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-600 hover:text-white rounded-xl h-auto py-3 px-6 font-bold transition-all" leftIcon={Trash2}>Delete Account</Button>
              </div>
            </div>
          </div>
        );

      case 'policies':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader title="Shop Policies" description="Set clear rules for your customers." />
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Return Policy</label>
                <textarea 
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/10 min-h-[100px] outline-none transition-all"
                  defaultValue="We accept returns within 7 days of delivery. Items must be unused and in original packaging. Buyer pays return shipping."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Exchange Policy</label>
                <textarea 
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/10 min-h-[100px] outline-none transition-all"
                  defaultValue="Exchanges are allowed for defective items or wrong sizes. Please contact us within 3 days of delivery."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Cancellation Policy</label>
                <textarea 
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/10 min-h-[100px] outline-none transition-all"
                  defaultValue="Orders can be cancelled within 24 hours of purchase. After that, processing may have begun."
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button leftIcon={Save}>Save Policies</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Horizontal Tabs Navigation */}
      <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto no-scrollbar gap-6 py-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors pb-2 border-b-2 ${
                  activeTab === tab.id 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
    </div>
  );
};
