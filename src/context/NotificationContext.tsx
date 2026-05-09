"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, X, Info, Copy } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  password?: string;
  email?: string;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, options?: { password?: string, email?: string }) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (
    message: string, 
    type: NotificationType = 'success', 
    options?: { password?: string, email?: string }
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { id, message, type, ...options };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto-hide non-password notifications
    if (!options?.password) {
      setTimeout(() => {
        hideNotification(id);
      }, 5000);
    }
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      
      {/* Global Notification Container - Positioned Top Right */}
      <div className="fixed top-24 right-6 z-[9999] w-full max-w-sm pointer-events-none space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
              layout
              className="pointer-events-auto"
            >
              {n.password ? (
                /* Password Card - Special Centered Display */
                <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-4">
                  <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-8 text-center border border-emerald-100 relative overflow-hidden pointer-events-auto">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                    <button 
                      onClick={() => hideNotification(n.id)} 
                      className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors group"
                    >
                      <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                    </button>
                    
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    
                    <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">{n.message}</h2>
                    <p className="text-sm text-gray-500 mb-8">
                      The account has been created for <strong>{n.email}</strong>.<br/>
                      A welcome email with these credentials has been sent.
                    </p>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-emerald-50 p-6 rounded-2xl border border-emerald-100 mb-8 shadow-inner relative">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Temporary Password</p>
                      <div className="relative group">
                        <div className="text-3xl font-mono font-bold text-primary tracking-wider bg-white py-4 rounded-xl border border-gray-100 shadow-sm select-all">
                          {n.password}
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(n.password!);
                            showNotification('Password copied to clipboard', 'success');
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 italic">Click the X to close</p>
                  </div>
                </div>
              ) : (
                /* Standard Toast Notification */
                <div className={`
                  p-5 rounded-[24px] shadow-2xl backdrop-blur-xl border flex items-center gap-4
                  ${n.type === 'success' ? 'bg-emerald-50/90 border-emerald-100 text-emerald-800' : 
                    n.type === 'error' ? 'bg-red-50/90 border-red-100 text-red-800' : 
                    n.type === 'warning' ? 'bg-amber-50/90 border-amber-100 text-amber-800' :
                    'bg-white/90 border-gray-100 text-gray-800'}
                `}>
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                    ${n.type === 'success' ? 'bg-emerald-100' : 
                      n.type === 'error' ? 'bg-red-100' : 
                      n.type === 'warning' ? 'bg-amber-100' :
                      'bg-gray-100'}
                  `}>
                    {n.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
                     n.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
                     n.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                     <Info className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight line-clamp-3">{n.message}</p>
                  </div>

                  <button 
                    onClick={() => hideNotification(n.id)}
                    className="p-1 hover:bg-black/5 rounded-lg transition-colors shrink-0"
                  >
                    <X className="w-4 h-4 opacity-40" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
