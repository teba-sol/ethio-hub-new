"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, Ticket, LogOut, Bell, Search, 
  Calendar, CreditCard, Star, PieChart, Settings, CheckCircle, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const OrganizerLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isOnboarding = pathname === '/dashboard/organizer/onboarding';

  const menuItems = [
    { path: '/dashboard/organizer/overview', name: 'Dashboard', icon: BarChart3 },
    { path: '/dashboard/organizer/festivals', name: 'My Events', icon: Calendar },
    { path: '/dashboard/organizer/bookings', name: 'Bookings', icon: Ticket },
    { path: '/dashboard/organizer/revenue', name: 'Revenue', icon: CreditCard },
    { path: '/dashboard/organizer/reviews', name: 'Reviews', icon: Star },
    { path: '/dashboard/organizer/analytics', name: 'Analytics', icon: PieChart },
    { path: '/dashboard/organizer/settings', name: 'Settings', icon: Settings },
  ];

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-ethio-bg font-sans">
        <main className="p-4 md:p-10">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex bg-ethio-bg font-sans">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-gray-100 min-h-screen flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex justify-between items-center">
          <span className="text-2xl font-bold font-serif text-primary tracking-tight">
            Ethio<span className="text-secondary">-Craft</span>
          </span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => (
            <Link 
              key={item.path} 
              href={item.path} 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all font-semibold text-sm ${
                pathname === item.path 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:bg-ethio-bg'
              }`}
            >
              <item.icon className={`w-5 h-5 ${pathname === item.path ? 'text-white' : 'text-gray-400'}`} />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        <div className="p-6 border-t border-gray-50">
          <button onClick={logout} className="w-full flex items-center space-x-4 px-6 py-4 text-gray-400 hover:text-red-500 font-semibold text-sm transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col min-w-0">
        <nav className="h-20 bg-white border-b border-gray-100 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4 md:space-x-8">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-gray-500 hover:text-primary"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold font-serif text-primary">Ethio-Craft</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">Organizer</span>
            </div>
            <div className="relative w-96 hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search artifacts, trips..." 
                className="w-full bg-ethio-bg border-none rounded-2xl py-3 pl-12 pr-4 text-xs focus:ring-2 focus:ring-primary/10 transition-all" 
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
              <CheckCircle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Official Partner</span>
            </div>
            
            <div className="relative group">
              <button className="p-2.5 text-gray-400 hover:text-primary bg-ethio-bg rounded-full transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-white"></span>
              </button>
              
              {/* Notification Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-primary text-sm">Notifications</h4>
                  <button className="text-[10px] font-bold text-secondary hover:underline">Mark all as read</button>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 1, type: 'booking', message: 'New booking from Sarah J.', time: '2m ago' },
                    { id: 2, type: 'review', message: '5-star review on Timket 2025', time: '1h ago' },
                    { id: 3, type: 'payout', message: 'Payout of ETB 45,000 processed', time: '1d ago' },
                  ].map(n => (
                    <div key={n.id} className="flex gap-3 items-start p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                      <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${n.type === 'booking' ? 'bg-blue-500' : n.type === 'review' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                      <div>
                        <p className="text-xs font-bold text-primary">{n.message}</p>
                        <p className="text-[10px] text-gray-400">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 pl-6 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-primary">{user?.name}</p>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">Organizer</p>
              </div>
              <img 
                src={user?.profileImage || 'https://picsum.photos/seed/user/100/100'} 
                className="w-10 h-10 rounded-2xl object-cover ring-2 ring-ethio-bg" 
                alt="Profile" 
              />
            </div>
          </div>
        </nav>
        
        <main className="flex-1 p-10 overflow-y-auto bg-ethio-bg/50">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
