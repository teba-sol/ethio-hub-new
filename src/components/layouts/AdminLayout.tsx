"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, CalendarCheck, PackageCheck, Ticket, 
  DollarSign, Flag, LayoutTemplate, FileText, Settings, LogOut, 
  Bell, Search, ShieldAlert, ShieldCheck, UserPlus, Info,
  ChevronDown, ChevronUp, Briefcase, ShoppingBag, Calendar, Menu, X, TrendingUp,
  Package, RotateCcw, Truck
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/admin/notifications');
        const data = await res.json();
        if (data.success) {
          // Map types to icons
          const mapped = data.notifications.map((n: any) => {
            let icon = Info;
            if (n.type === 'registration') icon = UserPlus;
            if (n.type === 'system') icon = ShieldAlert;
            if (n.type === 'festival') icon = Calendar;
            
            return { ...n, icon };
          });
          setNotifications(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const menuItems: MenuItem[] = [
    { path: '/dashboard/admin/overview', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/dashboard/admin/users', name: 'User Management', icon: Users },
    { path: '/dashboard/admin/verification-moderation', name: 'Verification & Moderation', icon: ShieldCheck },
    { path: '/dashboard/admin/management', name: 'Management', icon: Briefcase },
    { path: '/dashboard/admin/wallet', name: 'Wallet', icon: DollarSign },
    { path: '/dashboard/admin/reports', name: 'Reports & Moderation', icon: Flag },
    { path: '/dashboard/admin/support', name: 'Support', icon: Info },
    { path: '/dashboard/admin/orders', name: 'Delivery Orders', icon: Truck },
    { path: '/dashboard/admin/refund-requests', name: 'Refund Requests', icon: RotateCcw },
    { path: '/dashboard/admin/settings', name: 'Settings', icon: Settings },
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
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#1a1c23] text-white border-r border-gray-800 flex flex-col shadow-xl shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
            <Link 
              key={item.path} 
              href={item.path!} 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${pathname === item.path ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className={`w-4 h-4 ${pathname === item.path ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
              <span>{item.name}</span>
            </Link>
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
          <button onClick={logout} className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold text-xs transition-all">
            <LogOut className="w-4 h-4" /><span>{t('admin.signOut')}</span>
          </button>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <nav className="h-16 bg-white border-b border-gray-200 shrink-0 z-40 px-4 md:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-gray-500 hover:text-primary">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">{getCurrentPageName()}</h2>
          </div>

          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder={t('admin.searchPlaceholder')} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>

            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2 relative bg-gray-50 rounded-xl transition-colors ${showNotifications ? 'text-primary bg-primary/5' : 'text-gray-500 hover:text-primary hover:bg-primary/5'}`}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-bold text-gray-800 text-sm">{t('admin.notifications')}</h3>
                      <button className="text-[10px] font-bold text-primary hover:underline">{t('admin.markAllRead') || 'Mark all as read'}</button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-xs">No new notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} onClick={() => setShowNotifications(false)} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 flex gap-3">
                            <div className={`w-10 h-10 rounded-full ${n.bg} flex items-center justify-center shrink-0`}>
                              <n.icon className={`w-5 h-5 ${n.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800">{n.title}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1 font-medium">{formatTime(n.time)}</p>
                            </div>
                          </div>
                        ))
                      )}
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
