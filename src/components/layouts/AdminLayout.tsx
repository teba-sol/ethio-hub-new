"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, CalendarCheck, PackageCheck, Ticket, 
  DollarSign, Flag, LayoutTemplate, FileText, Settings, LogOut, 
  Bell, Search, ShieldAlert, ShieldCheck, UserPlus, Info,
  ChevronDown, ChevronUp, Briefcase, ShoppingBag, Calendar, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface MenuItem {
  path?: string;
  name: string;
  icon: any;
  isExpandable?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  subItems?: { path: string; name: string; icon: any }[];
}

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notifications = [
    { id: 1, title: t('admin.newRegistration'), message: 'John Doe registered as Organizer', time: '2 mins ago', type: 'registration', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 2, title: t('admin.newRegistration'), message: 'Sara Crafts registered as Artisan', time: '1 hour ago', type: 'registration', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 3, title: t('admin.systemAlert'), message: 'Server load is high (85%)', time: '3 hours ago', type: 'system', icon: Info, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const menuItems: MenuItem[] = [
    { path: '/dashboard/admin/overview', name: t('admin.dashboard'), icon: LayoutDashboard },
    { path: '/dashboard/admin/users', name: t('admin.userManagement'), icon: Users },
    { path: '/dashboard/admin/verification-moderation', name: t('admin.verificationAndModeration'), icon: ShieldCheck },
    { path: '/dashboard/admin/management', name: t('admin.management'), icon: Briefcase },
    { path: '/dashboard/admin/revenue', name: t('admin.revenueAndCommission'), icon: DollarSign },
    { path: '/dashboard/admin/reports', name: t('admin.reportsAndModeration'), icon: Flag },
    { path: '/dashboard/admin/logs', name: t('admin.systemLogs'), icon: FileText },
    { path: '/dashboard/admin/settings', name: t('admin.settings'), icon: Settings },
  ];

  const getCurrentPageName = () => {
    for (const item of menuItems) {
      if (item.path === pathname) return item.name;
      if (item.subItems) {
        const sub = item.subItems.find(s => s.path === pathname);
        if (sub) return sub.name;
      }
    }
    return 'Dashboard';
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#F4F4F9]">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-[#1a1c23] text-white border-r border-gray-800 flex flex-col shadow-xl shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold font-serif tracking-wide">{t('admin.adminPanel')}</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('admin.mainMenu')}</p>
          {menuItems.map(item => (
            <div key={item.name || item.path}>
              {item.isExpandable ? (
                <div className="space-y-1">
                  <button 
                    onClick={item.onToggle}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-sm text-gray-400 hover:bg-white/5 hover:text-white`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4 text-gray-500" />
                      <span>{item.name}</span>
                    </div>
                    {item.isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {item.isOpen && (
                    <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {item.subItems?.map(sub => (
                        <Link 
                          key={sub.path} 
                          href={sub.path} 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all font-medium text-xs ${
                            pathname === sub.path 
                              ? 'bg-primary/10 text-primary' 
                              : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <sub.icon className={`w-3.5 h-3.5 ${pathname === sub.path ? 'text-primary' : 'text-gray-600'}`} />
                          <span>{sub.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href={item.path!} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                    pathname === item.path 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${pathname === item.path ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 bg-[#15171c]">
          <div className="flex items-center gap-3 px-2 mb-4">
            <img src={user?.profileImage || "https://ui-avatars.com/api/?name=Admin&background=random"} className="w-10 h-10 rounded-full border-2 border-primary" alt="" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@ethiocraft.com'}</p>
            </div>
          </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold text-xs transition-all"
            >
              <LogOut className="w-4 h-4" /><span>{t('admin.signOut')}</span>
            </button>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <nav className="h-16 bg-white border-b border-gray-200 shrink-0 z-40 px-4 md:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-gray-500 hover:text-primary"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              {getCurrentPageName()}
            </h2>
          </div>

          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('admin.searchPlaceholder')}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 relative bg-gray-50 rounded-xl transition-colors ${showNotifications ? 'text-primary bg-primary/5' : 'text-gray-500 hover:text-primary hover:bg-primary/5'}`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-bold text-gray-800 text-sm">{t('admin.notifications')}</h3>
                      <button className="text-[10px] font-bold text-primary hover:underline">{t('admin.markAllRead')}</button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.type === 'registration') router.push('/dashboard/admin/verification');
                            setShowNotifications(false);
                          }}
                          className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 flex gap-3"
                        >
                          <div className={`w-10 h-10 rounded-full ${n.bg} flex items-center justify-center shrink-0`}>
                            <n.icon className={`w-5 h-5 ${n.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800">{n.title}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1 font-medium">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t border-gray-50">
                      <button className="text-xs font-bold text-gray-500 hover:text-primary transition-colors">{t('admin.viewAllNotifications')}</button>
                    </div>
                  </div>
                </>
              )}
            </div>

           </div>
         </nav>
        
        <main className="flex-1 p-8 overflow-y-auto bg-[#F4F4F9]">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
