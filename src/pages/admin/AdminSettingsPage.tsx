import React, { useState } from 'react';
import { 
  Settings, Save, Shield, CreditCard, Globe, 
  AlertTriangle, UserPlus, Lock, User, Bell, 
  FileText, LogOut, Smartphone, Mail, Eye, 
  CheckCircle2, XCircle, Clock, Database, Download
} from 'lucide-react';
import { Button, Input, Badge } from '../../components/UI';

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
  const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'security' | 'roles' | 'notifications'>('general');
  
  // General Settings State
  const [commissionRate, setCommissionRate] = useState('15');
  const [minWithdrawal, setMinWithdrawal] = useState('1000');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [currency, setCurrency] = useState('ETB');
  const [language, setLanguage] = useState('en');

  // Profile State
  const [adminName, setAdminName] = useState('Admin User');
  const [adminEmail, setAdminEmail] = useState('admin@example.com');

  // Security State
  const [twoFactor, setTwoFactor] = useState(false);

  // Notification State
  const [notifSettings, setNotifSettings] = useState({
    email_new_event: true,
    email_fraud: true,
    email_system: true,
    sms_fraud: false,
    sms_downtime: true
  });

  const handleSave = () => {
    console.log('Saving settings...');
    // API call would go here
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800">Platform Settings</h1>
          <p className="text-gray-500 text-sm">Configure global platform rules, security, and admin access.</p>
        </div>
        <Button leftIcon={Save} onClick={handleSave}>Save Changes</Button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-8 pt-6 flex gap-8 overflow-x-auto">
          {[
            { id: 'general', label: 'Platform Config', icon: Globe },
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'roles', label: 'Roles & Permissions', icon: Shield },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-primary border-primary' 
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* 1. GENERAL / PLATFORM CONFIG */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Financial */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> Financial Configuration
                </h3>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Platform Commission (%)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full pl-4 pr-8 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 font-bold text-gray-800"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Minimum Withdrawal</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{currency}</span>
                      <input 
                        type="number" 
                        className="w-full pl-14 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 font-bold text-gray-800"
                        value={minWithdrawal}
                        onChange={(e) => setMinWithdrawal(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* System & Localization */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" /> System & Localization
                </h3>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Default Currency</label>
                      <select 
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      >
                        <option value="ETB">ETB (Birr)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">System Language</label>
                      <select 
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <option value="en">English</option>
                        <option value="am">Amharic</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${maintenanceMode ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">Maintenance Mode</h4>
                        <p className="text-xs text-gray-500">Only admins can access</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={maintenanceMode} onChange={() => setMaintenanceMode(!maintenanceMode)} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                {/* Audit & Compliance */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Audit & Compliance
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Log Retention</span>
                      <select className="bg-white border border-gray-200 rounded-lg text-xs p-1">
                        <option>90 Days</option>
                        <option>1 Year</option>
                        <option>Forever</option>
                      </select>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" leftIcon={Download}>Export System Logs (CSV)</Button>
                    <Button variant="outline" size="sm" className="w-full" leftIcon={FileText}>Manage Privacy Policy</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ADMIN PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="flex items-center gap-6">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg">
                    {adminName.charAt(0)}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{adminName}</h2>
                  <p className="text-gray-500">Super Admin • Last login: Just now</p>
                </div>
              </div>

              <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} type="email" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                    <Input placeholder="+251 911 234 567" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                    <Input value="Super Admin" disabled className="bg-gray-100 text-gray-500" />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Change Password
                  </h3>
                  <div className="space-y-4">
                    <Input type="password" placeholder="Current Password" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="password" placeholder="New Password" />
                      <Input type="password" placeholder="Confirm New Password" />
                    </div>
                    <Button variant="outline" size="sm">Update Password</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. SECURITY */}
          {activeTab === 'security' && (
            <div className="max-w-3xl mx-auto space-y-8">
              {/* 2FA */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Two-Factor Authentication (2FA)</h3>
                    <p className="text-sm text-gray-500">Secure your account with an extra layer of protection.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Login History */}
              <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Login History
                  </h3>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" leftIcon={LogOut}>
                    Log Out All Other Devices
                  </Button>
                </div>
                <div className="space-y-4">
                  {LOGIN_HISTORY.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${log.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {log.status === 'Success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{log.device}</p>
                          <p className="text-xs text-gray-500">{log.location} • {log.ip}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-400">{log.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Role Management</h3>
                  <p className="text-sm text-gray-500">Define who can access what.</p>
                </div>
                <Button leftIcon={UserPlus}>Add New Role</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ROLES.map((role) => (
                  <div key={role.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <Shield className="w-6 h-6" />
                      </div>
                      <Badge variant="secondary">{role.users} Users</Badge>
                    </div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">{role.name}</h4>
                    <div className="space-y-2 mb-6">
                      {role.permissions.map((perm, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {perm}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="w-full">Edit</Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-6">Admin Users</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">A</div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Admin User (You)</p>
                        <p className="text-xs text-gray-500">admin@example.com</p>
                      </div>
                    </div>
                    <Badge variant="success">Super Admin</Badge>
                  </div>
                  {/* More users would go here */}
                </div>
                <Button variant="outline" className="w-full mt-4" leftIcon={UserPlus}>Invite New Admin</Button>
              </div>
            </div>
          )}

          {/* 5. NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" /> Notification Preferences
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Email Alerts</h4>
                  <div className="space-y-4">
                    {[
                      { key: 'email_new_event', label: 'New Event Pending Approval' },
                      { key: 'email_fraud', label: 'Fraud Report Received' },
                      { key: 'email_system', label: 'System Errors / Downtime' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">{item.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={(notifSettings as any)[item.key]} 
                            onChange={() => setNotifSettings({...notifSettings, [item.key]: !(notifSettings as any)[item.key]})} 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-100"></div>

                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">SMS Alerts (Urgent)</h4>
                  <div className="space-y-4">
                    {[
                      { key: 'sms_fraud', label: 'High Priority Fraud Alerts' },
                      { key: 'sms_downtime', label: 'Critical System Downtime' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">{item.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={(notifSettings as any)[item.key]} 
                            onChange={() => setNotifSettings({...notifSettings, [item.key]: !(notifSettings as any)[item.key]})} 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
