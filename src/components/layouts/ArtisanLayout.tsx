"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, Package, ShoppingCart, LogOut, Bell, Search, DollarSign, MessageSquare, PieChart, Settings, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ArtisanLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard/artisan/overview', name: 'Dashboard', icon: BarChart3 },
    { path: '/dashboard/artisan/products', name: 'Products', icon: Package },
    { path: '/dashboard/artisan/orders', name: 'Orders', icon: ShoppingCart },
    { path: '/dashboard/artisan/revenue', name: 'Revenue', icon: DollarSign },
    { path: '/dashboard/artisan/reviews', name: 'Reviews', icon: MessageSquare },
    { path: '/dashboard/artisan/analytics', name: 'Analytics', icon: PieChart },
    { path: '/dashboard/artisan/settings', name: 'Settings', icon: Settings },
  ];

  const notifications = [
    { id: 1, type: 'order', message: 'New order #ORD-7782 received', time: '2m ago' },
    { id: 2, type: 'review', message: '5-star review on "Woven Basket"', time: '1h ago' },
    { id: 3, type: 'stock', message: 'Low stock alert: Coffee Set (2 left)', time: '3h ago' },
    { id: 4, type: 'payout', message: 'Weekly payout of ETB 12,500 processed', time: '1d ago' },
  ];

  const isOnboarding = pathname === '/dashboard/artisan/onboarding';

  return (
    <div className="h-screen flex overflow-hidden bg-ethio-bg">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && !isOnboarding && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      {!isOnboarding && (
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 flex justify-between items-center">
            <span className="text-xl font-bold font-serif">Artisan Hub</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map(item => (
              <Link 
                key={item.path} 
                href={item.path} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${pathname === item.path ? 'bg-primary text-white' : 'text-gray-500 hover:bg-ethio-bg'}`}
              >
                <item.icon className="w-4 h-4" /><span>{item.name}</span>
              </Link>
            ))}
          </div>
          <div className="p-4 border-t border-gray-50">
            <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-red-500 font-semibold text-sm transition-colors">
              <LogOut className="w-4 h-4" /><span>Logout</span>
            </button>
          </div>
        </aside>
      )}
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!isOnboarding && (
          <nav className="h-16 bg-white border-b border-gray-100 shrink-0 z-40 px-4 md:px-8 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-4 md:space-x-8">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden text-gray-500 hover:text-primary"
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="text-xl font-bold font-serif text-primary tracking-tight">
                Ethio<span className="text-secondary">-Craft</span>
              </span>
              <div className="relative w-96 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search..." className="w-full bg-ethio-bg border-none rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary/20 transition-all" />
              </div>
            </div>
            <div className="flex items-center space-x-4 md:space-x-6">
              <div className="relative group">
                <button className="p-2 text-gray-400 hover:text-primary relative transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                {/* Notification Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-primary text-sm">Notifications</h4>
                    <button className="text-[10px] font-bold text-secondary hover:underline">Mark all as read</button>
                  </div>
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <div key={n.id} className="flex gap-3 items-start p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${n.type === 'order' ? 'bg-blue-500' : n.type === 'review' ? 'bg-amber-500' : n.type === 'stock' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                        <div>
                          <p className="text-xs font-bold text-primary">{n.message}</p>
                          <p className="text-[10px] text-gray-400">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 pl-6 border-l border-gray-100">
                <div className="text-right"><p className="text-xs font-bold text-primary">{user?.name}</p><p className="text-[10px] text-gray-400 uppercase font-bold">{user?.role}</p></div>
                <img src={user?.profileImage} className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-sm" alt="" />
              </div>
            </div>
          </nav>
        )}
        <main className={`flex-1 overflow-y-auto bg-ethio-bg ${isOnboarding ? '' : 'p-8'}`}>
          <div className={`${isOnboarding ? 'h-full' : 'max-w-[1600px] mx-auto'} animate-in fade-in duration-500`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
