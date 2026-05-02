import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CalendarCheck, PackageCheck, 
  AlertCircle, CheckCircle2, Clock, Filter,
  ChevronRight, LayoutGrid, ListFilter
} from 'lucide-react';
import { AdminUserVerificationPage } from './AdminUserVerificationPage';
import { AdminEventsPage } from './AdminEventsPage';
import { AdminProductsPage } from './AdminProductsPage';
import { useLanguage } from '@/context/LanguageContext';

type TabType = 'users' | 'events' | 'products';

interface VerificationStats {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
}

export const AdminVerificationModerationPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [stats, setStats] = useState<VerificationStats>({ pending: 0, underReview: 0, approved: 0, rejected: 0 });

  const tabs = [
    { id: 'users', name: t("admin.userVerifications"), icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'events', name: t("admin.eventVerifications"), icon: CalendarCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'products', name: t("admin.productVerifications"), icon: PackageCheck, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800">{t("admin.verificationModeration")}</h1>
          <p className="text-gray-500 text-sm">Centralized hub for approving users, events, and products.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("admin.pendingUsers")}</p>
            <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
          </div>
          <div className="ml-auto">
            <Badge variant="warning">{t("messages.actionRequired")}</Badge>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("admin.pendingEvents")}</p>
            <p className="text-2xl font-bold text-gray-800">8</p>
          </div>
          <div className="ml-auto">
            <Badge variant="warning">{t("messages.actionRequired")}</Badge>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("admin.pendingProducts")}</p>
            <p className="text-2xl font-bold text-gray-800">15</p>
          </div>
          <div className="ml-auto">
            <Badge variant="warning">{t("messages.actionRequired")}</Badge>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden min-h-[600px]">
        <div className="p-1">
          {activeTab === 'users' && <AdminUserVerificationPage />}
          {activeTab === 'events' && <AdminEventsPage />}
          {activeTab === 'products' && <AdminProductsPage />}
        </div>
      </div>
    </div>
  );
};

// Helper component for badges if not already available in this scope
const Badge: React.FC<{ children: React.ReactNode; variant?: 'warning' | 'success' | 'danger' | 'info' }> = ({ children, variant = 'info' }) => {
  const styles = {
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    danger: 'bg-red-50 text-red-600 border-red-100',
    info: 'bg-blue-50 text-blue-600 border-blue-100',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${styles[variant]}`}>
      {children}
    </span>
  );
};
