import React, { useState } from 'react';
import { 
  Calendar, ShoppingBag, TrendingUp, 
  Package, Users, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminEventManagementPage } from './AdminEventManagementPage';
import { AdminProductManagementPage } from './AdminProductManagementPage';

export const AdminManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'products'>('events');
  
  const tabs = [
    { id: 'events', name: 'Event Management', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'products', name: 'Product Management', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
  ];
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Management Hub</h1>
        <p className="text-gray-500">
          Monitor real-time performance, financial summaries, and detailed transaction logs for Events and Products.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white p-2 rounded-[24px] border border-gray-100 shadow-sm inline-flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
              activeTab === tab.id 
                ? `${tab.bg} ${tab.color} shadow-sm` 
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : 'text-gray-400'}`} />
            {tab.name}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="ml-1">
                <div className={`w-1.5 h-1.5 rounded-full ${tab.color.replace('text', 'bg')}`}></div>
              </motion.div>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="relative min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'events' ? (
              <AdminEventManagementPage />
            ) : (
              <AdminProductManagementPage />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
