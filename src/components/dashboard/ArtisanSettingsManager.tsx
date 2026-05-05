import React, { useState } from 'react';
import { 
  Store, Building2, CreditCard, Truck, Bell, Shield, UserCog, FileText,
  Save, Upload, Eye, CheckCircle2, AlertCircle, Smartphone, Globe, Mail,
  LogOut, Trash2, Download, RefreshCw, ChevronRight, Lock, MapPin,
  Facebook, Instagram, Twitter
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
  
  // Mock State for forms
  const [shopProfile, setShopProfile] = useState({
    name: "Ethio-Craft Treasures",
    description: "Authentic handmade Ethiopian artifacts crafted with care and tradition.",
    city: "Addis Ababa",
    region: "Addis Ababa",
    country: "Ethiopia",
    experience: "5",
    email: "contact@ethiocraft.com"
  });

  const [notifications, setNotifications] = useState({
    newOrder: true,
    lowStock: true,
    newReview: true,
    payout: true,
    promos: false,
    sms: true
  });

  const tabs = [
    { id: 'profile', label: 'Shop Profile', icon: Store },
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'payment', label: 'Payment & Payout', icon: CreditCard },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: UserCog },
    { id: 'policies', label: 'Policies', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader title="Shop Profile" description="Manage how your shop appears to tourists and customers." />
            
            {/* Banner & Logo */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="relative h-32 bg-gray-100">
                <img src="https://picsum.photos/seed/banner/1200/400" className="w-full h-full object-cover" alt="Banner" />
                <div className="absolute inset-0 bg-black/10 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer">
                  <Button variant="outline" size="sm" className="text-white border-white bg-black/20" leftIcon={Upload}>Change Banner</Button>
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="relative -mt-12 mb-4">
                  <div className="w-24 h-24 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden relative group/logo">
                    <img src="https://ui-avatars.com/api/?name=Ethio+Craft&background=random" className="w-full h-full object-cover" alt="Logo" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 cursor-pointer transition-opacity">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{shopProfile.name}</h3>
                    <p className="text-sm text-gray-500">{shopProfile.city}, {shopProfile.country}</p>
                  </div>
                  <Button variant="outline" size="sm" leftIcon={Eye}>View Public Shop</Button>
                </div>
              </div>
            </div>

            {/* Basic Info Form */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Shop Name</label>
                  <Input value={shopProfile.name} onChange={(e) => setShopProfile({...shopProfile, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Contact Email (Public)</label>
                  <Input value={shopProfile.email} onChange={(e) => setShopProfile({...shopProfile, email: e.target.value})} />
                </div>
                <div className="col-span-full space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Shop Description</label>
                  <textarea 
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/10 min-h-[100px] outline-none transition-all"
                    value={shopProfile.description}
                    onChange={(e) => setShopProfile({...shopProfile, description: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Years of Experience</label>
                  <Input type="number" value={shopProfile.experience} onChange={(e) => setShopProfile({...shopProfile, experience: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Location & Socials */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-gray-900">Location & Social Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <Input value={shopProfile.city} onChange={(e) => setShopProfile({...shopProfile, city: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Region</label>
                  <Input value={shopProfile.region} onChange={(e) => setShopProfile({...shopProfile, region: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <Input value={shopProfile.country} onChange={(e) => setShopProfile({...shopProfile, country: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <Input placeholder="Facebook URL" className="flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <Input placeholder="Instagram URL" className="flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-sky-500" />
                  <Input placeholder="Twitter URL" className="flex-1" />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button leftIcon={Save}>Save Changes</Button>
            </div>
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
                  <Input defaultValue="Abebe Kebede" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Business Type</label>
                  <select className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/10 outline-none">
                    <option>Individual / Sole Proprietor</option>
                    <option>Company / PLC</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <Input defaultValue="+251 911 234 567" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Tax ID (TIN)</label>
                  <Input defaultValue="0012345678" />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <label className="text-sm font-medium text-gray-700 mb-3 block">Business Documents</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                    <p className="text-sm font-bold text-gray-600">Upload Business License</p>
                    <p className="text-xs text-gray-400">PDF or JPG up to 5MB</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-bold text-gray-700">license_2024.pdf</p>
                        <p className="text-xs text-gray-400">Uploaded on Jan 15, 2024</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
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
                    <select className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm">
                      <option>Commercial Bank of Ethiopia</option>
                      <option>Dashen Bank</option>
                      <option>Awash Bank</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Account Number</label>
                    <Input defaultValue="1000123456789" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Account Holder Name</label>
                    <Input defaultValue="Abebe Kebede" />
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

      case 'shipping':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader title="Shipping & Delivery" description="Configure your shipping preferences and policies." />
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Processing Time</label>
                  <select className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none">
                    <option>1-2 Business Days</option>
                    <option>3-5 Business Days</option>
                    <option>1 Week</option>
                  </select>
                  <p className="text-[10px] text-gray-400">How long it takes you to prepare an order.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Default Return Window</label>
                  <select className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none">
                    <option>No Returns</option>
                    <option>7 Days</option>
                    <option>14 Days</option>
                    <option>30 Days</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <Toggle 
                  label="Offer Free Shipping" 
                  description="Apply free shipping to all products by default." 
                  checked={false} 
                  onChange={() => {}} 
                />
                <Toggle 
                  label="International Shipping" 
                  description="Enable shipping to countries outside Ethiopia." 
                  checked={true} 
                  onChange={() => {}} 
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-gray-900">Standard Shipping Rates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Local (Addis Ababa)</label>
                  <Input defaultValue="150" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Regional</label>
                  <Input defaultValue="300" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">International</label>
                  <Input defaultValue="2500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button leftIcon={Save}>Save Settings</Button>
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
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader title="Security" description="Protect your account and data." />
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-gray-900">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Current Password</label>
                  <Input type="password" />
                </div>
                <div className="col-span-1"></div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <Input type="password" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                  <Input type="password" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Update Password</Button>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionHeader title="Account Management" description="Manage your account status and data." />
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Export Data</h3>
                  <p className="text-xs text-gray-500">Download a copy of your products, orders, and customer data.</p>
                </div>
                <Button variant="outline" size="sm" leftIcon={Download}>Export CSV</Button>
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Deactivate Shop</h3>
                  <p className="text-xs text-gray-500">Temporarily hide your shop and products from the marketplace.</p>
                </div>
                <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50">Deactivate</Button>
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="text-sm font-bold text-red-600">Delete Account</h3>
                  <p className="text-xs text-gray-500">Permanently delete your account and all associated data.</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" leftIcon={Trash2}>Delete Account</Button>
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
