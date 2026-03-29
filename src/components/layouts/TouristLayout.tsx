"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShoppingBag, CreditCard, 
  Heart, Settings, HelpCircle, Ticket
} from 'lucide-react';
import { Header, Footer } from '../Layout';

export const TouristLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  const menuItems = [
    { path: '/dashboard/tourist/orders', name: 'My Orders', icon: ShoppingBag },
    { path: '/dashboard/tourist/bookings', name: 'My Bookings', icon: Ticket },
    { path: '/dashboard/tourist/payments', name: 'Payments', icon: CreditCard },
    { path: '/dashboard/tourist/wishlist', name: 'Wish List', icon: Heart },
    { path: '/dashboard/tourist/settings', name: 'Settings', icon: Settings },
    { path: '/dashboard/tourist/help', name: 'Help Center', icon: HelpCircle },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-64 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                <div className="p-4 bg-ethio-dark text-white">
                  <h2 className="font-serif font-bold text-lg">My Dashboard</h2>
                  <p className="text-xs text-gray-400">Manage your account</p>
                </div>
                <nav className="p-2 space-y-1">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive 
                            ? 'bg-primary/5 text-primary font-bold' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
