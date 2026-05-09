"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, Truck, DollarSign, TrendingUp, MapPin, Phone, 
  User, Clock, CheckCircle, AlertCircle, Navigation, 
  History, ChevronRight, RefreshCw, Lock, LogOut, Settings,
  ShieldCheck, CreditCard, Mail, ChevronDown, Bell, Search, Menu, X, Wallet
} from 'lucide-react';
import { Button, Badge } from '../UI';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderStats {
  todayTrips: number;
  pendingPickups: number;
  totalDeliveries: number;
  dailyEarnings: number;
  monthlyTrips: number;
  monthlyEarnings: number;
  totalEarnings: number;
}

interface DeliveryOrder {
  _id: string;
  status: string;
  product: {
    name: string;
    images: string[];
    price: number;
    description?: string;
  };
  tourist: {
    name: string;
    email: string;
    phone: string;
  };
  artisan: {
    name: string;
    phone: string;
    businessName: string;
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
  };
  shippingFee: number;
  distanceKm: number;
  verificationCode?: string;
  isLocked: boolean;
  createdAt: string;
}

interface DeliveryLog {
  _id: string;
  orderId: string;
  shippingFee: number;
  deliveredAt: string;
  customerName: string;
  customerPhone?: string;
  productName: string;
}

export const DeliveryDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [stats, setStats] = useState<{
    todayTrips: number;
    pendingPickups: number;
    totalDeliveries: number;
    dailyEarnings: number;
    monthlyTrips: number;
    monthlyEarnings: number;
    totalEarnings: number;
  } | null>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<DeliveryLog[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'profile'>('active');
  const [orderStats, setOrderStats] = useState<any>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    if (type !== 'error') {
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/delivery/orders');
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.orders || []);
        setStats(data.stats);
        setRecentDeliveries(data.recentDeliveries || []);
        setRecentWithdrawals(data.recentWithdrawals || []);
      }
    } catch (err) {
      console.error('Error fetching delivery data:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => ['Assigned', 'Shipped', 'Ready for Pickup'].includes(o.status));
  const shippedOrders = orders.filter(o => o.status === 'Shipped');

  const handleAcceptOrder = async (orderId: string) => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/delivery/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Order accepted successfully! Tourist has been notified.', 'success');
        fetchDeliveryData();
      } else {
        showNotification(data.message || 'Failed to accept order', 'error');
      }
    } catch (err) {
      showNotification('Error accepting order', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyDelivery = async (orderId: string) => {
    if (!verificationCode || verificationCode.length !== 8) {
      setVerificationError('Please enter all 8 digits of the verification code');
      return;
    }

    setVerifying(true);
    setVerificationError('');

    try {
      const res = await fetch(`/api/delivery/orders/${orderId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationCode }),
      });

      const data = await res.json();

      if (data.success) {
        setVerificationSuccess(true);
        setVerificationCode('');
        setTimeout(() => {
          setSelectedOrder(null);
          setVerificationSuccess(false);
          fetchDeliveryData();
        }, 2000);
      } else {
        setVerificationError(data.message);
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        if (data.locked) {
          setSelectedOrder(null);
        }
      }
    } catch (err) {
      setVerificationError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const formatCurrency = (amount: number) => `ETB ${(amount || 0).toLocaleString()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans">
      {/* Centered Notification */}
      {notification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
          <div className={`
            max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 p-6 flex items-center gap-4 animate-in zoom-in-95 duration-300 pointer-events-auto
            ${notification.type === 'success' ? 'border-emerald-500 bg-emerald-50' : notification.type === 'error' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'}
          `}>
            <div className={`p-3 rounded-full ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : notification.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              {notification.type === 'success' ? <CheckCircle className="w-6 h-6" /> : notification.type === 'error' ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className={`font-bold ${notification.type === 'success' ? 'text-emerald-800' : notification.type === 'error' ? 'text-red-800' : 'text-blue-800'}`}>
                {notification.type === 'success' ? 'Success!' : notification.type === 'error' ? 'Error' : 'Notification'}
              </p>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Modern Top Navigation */}
      <nav className="h-20 bg-white border-b border-gray-100 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4 md:space-x-8">
          <div className="flex items-center space-x-2">
            <span className="text-xl md:text-2xl font-bold font-serif text-primary tracking-tight">
              Ethio<span className="text-secondary">-Craft</span>
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">Delivery Hub</span>
          </div>
          
          <div className="hidden lg:flex items-center space-x-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button 
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'active' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Active Tasks
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              History
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={fetchDeliveryData}
            className="p-2.5 text-gray-400 hover:text-primary bg-gray-50 rounded-full transition-colors group"
            title="Sync Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>

          <div className="relative group hidden sm:block">
            <button className="p-2.5 text-gray-400 hover:text-primary bg-gray-50 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-white"></span>
            </button>
          </div>

          {/* Profile Dropdown */}
          <div className="relative pl-4 border-l border-gray-100">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 hover:bg-gray-50 p-1.5 rounded-2xl transition-all"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-primary leading-tight">{user?.name}</p>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">
                  {user?.deliveryProfile?.vehicleType || 'Delivery Partner'}
                </p>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 border border-gray-100">
                  {user?.deliveryProfile?.profileImage ? (
                    <img src={user.deliveryProfile.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                      {user?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-6 py-3 border-b border-gray-50 mb-2">
                    <p className="text-sm font-bold text-primary">{user?.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                  </div>
                  
                  <button 
                    onClick={() => { setActiveTab('profile'); setIsProfileOpen(false); }}
                    className="w-full flex items-center space-x-3 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>
                  
                  <button 
                    onClick={() => { setActiveTab('history'); setIsProfileOpen(false); }}
                    className="w-full flex items-center space-x-3 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <History className="w-4 h-4" />
                    <span>Delivery History</span>
                  </button>

                  <button 
                    onClick={() => { /* Settings logic if any */ setIsProfileOpen(false); }}
                    className="w-full flex items-center space-x-3 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>

                  <div className="mt-2 pt-2 border-t border-gray-50">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-6 py-3 text-red-500 hover:bg-red-50 transition-colors text-sm font-bold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="p-4 md:p-8 lg:p-12 max-w-[1400px] mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-primary">Dashboard Overview</h2>
            <p className="text-gray-500 text-sm mt-1">Track your deliveries and earnings in real-time.</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Online & Active</span>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
              icon={CheckCircle} 
              label="Today's Trips" 
              value={stats.todayTrips} 
              color="emerald" 
            />
            <StatCard 
              icon={Clock} 
              label="Pending Pickup" 
              value={stats.pendingPickups} 
              color="amber" 
            />
            <StatCard 
              icon={Wallet} 
              label="Total Earned" 
              value={formatCurrency(stats.totalEarnings)} 
              color="purple" 
            />
          </div>
        )}

         {/* Tab Navigation */}
         <div className="flex flex-wrap gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit">
           <button
             onClick={() => setActiveTab('active')}
             className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
               activeTab === 'active' 
                 ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                 : 'text-gray-400 hover:text-primary hover:bg-gray-50'
             }`}
           >
             <Package className="w-4 h-4" />
             Active Tasks ({activeOrders.length})
           </button>
           <button
             onClick={() => setActiveTab('history')}
             className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
               activeTab === 'history' 
                 ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                 : 'text-gray-400 hover:text-primary hover:bg-gray-50'
             }`}
           >
             <History className="w-4 h-4" />
             History
           </button>
           <button
             onClick={() => setActiveTab('profile')}
             className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
               activeTab === 'profile' 
                 ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                 : 'text-gray-400 hover:text-primary hover:bg-gray-50'
             }`}
           >
             <User className="w-4 h-4" />
             My Profile
           </button>
         </div>

         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           {activeTab === 'active' && (
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <div className="bg-white p-20 rounded-[40px] border border-dashed border-gray-200 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">You don&apos;t have any active deliveries at the moment.</p>
              <p className="text-sm text-gray-400 mt-2">New assignments will appear here.</p>
            </div>
          ) : (
            activeOrders.map((order) => (
              <div 
                key={order._id}
                className={`bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all ${
                  order.isLocked ? 'border-red-200 bg-red-50' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-50">
                    {order.product?.images?.[0] ? (
                      <img src={order.product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                         <h3 className="text-xl font-bold text-primary">{order.product?.name || 'Product'}</h3>
                         <p className="text-xs text-gray-400 font-mono mt-1 tracking-widest">ORDER #{order._id.slice(-6).toUpperCase()}</p>
                         <div className="flex items-center gap-6 mt-3">
                           <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Share</span>
                             <span className="text-lg font-bold text-emerald-600">{formatCurrency(order.shippingFee * 0.8)}</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Distance</span>
                             <span className="text-lg font-bold text-primary">{order.distanceKm} KM</span>
                           </div>
                         </div>
                      </div>
                      <Badge variant={
                        order.status === 'Assigned' ? 'warning' :
                        order.status === 'Shipped' ? 'info' : 'secondary'
                      } size="lg">
                        {order.status === 'Assigned' ? 'Action Required: Accept Order' : order.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-xl">
                            <Truck className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pickup From (Artisan)</p>
                            <p className="text-sm font-bold text-gray-800">{order.artisan?.businessName || order.artisan?.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{order.artisan?.address}, {order.artisan?.city}</p>
                            <button 
                              className="text-[10px] text-blue-600 hover:text-blue-700 font-bold mt-2 flex items-center gap-1 uppercase tracking-widest"
                              onClick={() => {
                                const lat = order.artisan?.latitude;
                                const lng = order.artisan?.longitude;
                                if (lat && lng) {
                                  window.open(`https://www.google.com/maps?q=${lat},${lng}`);
                                } else {
                                  showNotification('Searching by address on Google Maps...', 'info');
                                  window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${order.artisan?.address}, ${order.artisan?.city}`)}`);
                                }
                              }}
                            >
                              <Navigation className="w-3 h-3" /> Navigation to Pickup
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-100 rounded-xl">
                            <MapPin className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Deliver To (Tourist)</p>
                            <p className="text-sm font-bold text-gray-800">{order.tourist?.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {order.shippingAddress?.street}, {order.shippingAddress?.city}
                            </p>
                            <button 
                              className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold mt-2 flex items-center gap-1 uppercase tracking-widest"
                              onClick={() => {
                                const lat = (order as any).userLocation?.latitude;
                                const lng = (order as any).userLocation?.longitude;
                                if (lat && lng) {
                                  window.open(`https://www.google.com/maps?q=${lat},${lng}`);
                                } else {
                                  window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${order.shippingAddress?.street}, ${order.shippingAddress?.city}`)}`);
                                }
                              }}
                            >
                              <Navigation className="w-3 h-3" /> Navigation to Drop-off
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-primary/5 rounded-3xl border border-primary/10 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-primary/20 text-primary font-bold">
                          {order.tourist?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary">{order.tourist?.name}</p>
                          <p className="text-xs text-gray-500">{order.tourist?.phone}</p>
                        </div>
                      </div>

                      <div className="flex gap-3 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          size="sm"
                          leftIcon={Phone}
                          onClick={() => window.open(`tel:${order.tourist?.phone}`)}
                          className="flex-1 sm:flex-none border-primary/20 text-primary hover:bg-primary/5"
                        >
                          Call
                        </Button>
                        {order.status === 'Assigned' && (
                          <Button 
                            size="sm"
                            variant="primary"
                            leftIcon={CheckCircle}
                            onClick={() => handleAcceptOrder(order._id)}
                            isLoading={verifying}
                            className="flex-1 sm:flex-none shadow-lg shadow-primary/20"
                          >
                            Accept Job
                          </Button>
                        )}
                        {order.status === 'Shipped' && !order.isLocked && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setVerificationCode('');
                              setVerificationError('');
                            }}
                            className="flex-1 sm:flex-none"
                          >
                            Complete Delivery
                          </Button>
                        )}
                        {order.isLocked && (
                          <Badge variant="error" size="lg" className="flex-1 sm:flex-none">
                            <Lock className="w-4 h-4 mr-2" /> Security Locked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-primary p-12 text-white relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 rounded-[40px] bg-white p-1 shadow-2xl">
                  <div className="w-full h-full rounded-[38px] overflow-hidden bg-gray-100">
                    {user?.deliveryProfile?.profileImage ? (
                      <img src={user.deliveryProfile.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary text-4xl font-serif font-bold">
                        {user?.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-serif font-bold">{user?.name}</h2>
                  <p className="text-white/70 flex items-center justify-center md:justify-start gap-2 mt-2">
                    <Mail className="w-4 h-4" /> {user?.email}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                    <Badge variant="success" className="bg-white/20 text-white border-none backdrop-blur-md">
                      Verified Partner
                    </Badge>
                    <Badge variant="info" className="bg-white/20 text-white border-none backdrop-blur-md">
                      {user?.deliveryProfile?.vehicleType}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h3 className="text-xl font-bold text-primary flex items-center gap-2 border-b border-gray-100 pb-4">
                    <User className="w-5 h-5" /> Account Details
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <ProfileItem icon={Phone} label="Contact Number" value={user?.deliveryProfile?.phone || 'Not provided'} />
                    <ProfileItem icon={ShieldCheck} label="Verification Status" value="Approved & Active" />
                    <ProfileItem icon={CreditCard} label="Bank/Wallet Phone" value={user?.deliveryProfile?.phone || 'Not provided'} />
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-xl font-bold text-primary flex items-center gap-2 border-b border-gray-100 pb-4">
                    <Truck className="w-5 h-5" /> Delivery Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Trips</p>
                      <p className="text-3xl font-bold text-primary">{stats?.totalDeliveries || 0}</p>
                    </div>
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lifetime Earned</p>
                      <p className="text-2xl font-bold text-emerald-700">{formatCurrency(stats?.totalEarnings || 0)}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full rounded-2xl border-gray-200 text-gray-600 hover:bg-gray-50" leftIcon={Settings}>
                    Account Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500">
          <div className="p-8 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-primary">Delivery History</h3>
              <p className="text-sm text-gray-500 mt-1">Complete record of your past successful deliveries</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly Summary</p>
              <p className="text-lg font-bold text-primary">{stats?.monthlyTrips || 0} Trips • {formatCurrency(stats?.monthlyEarnings || 0)}</p>
            </div>
          </div>

          {recentDeliveries.length === 0 ? (
            <div className="p-20 text-center text-gray-400">
              <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium italic">No delivery history recorded yet.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                 {recentDeliveries.map((delivery) => (
                   <div key={delivery._id} className="p-6 hover:bg-gray-50/80 transition-colors group">
                     <div 
                       className="flex items-center justify-between cursor-pointer"
                       onClick={() => setExpandedLog(expandedLog === delivery._id ? null : delivery._id)}
                     >
                       <div className="flex items-center gap-6">
                         <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                           <CheckCircle className="w-6 h-6 text-emerald-600" />
                         </div>
                         <div>
                           <p className="font-bold text-gray-800 text-lg">{delivery.productName}</p>
                           <p className="text-sm text-gray-500 flex items-center gap-2">
                             <User className="w-4 h-4" /> {delivery.customerName}
                           </p>
                         </div>
                       </div>
                       <div className="text-right flex items-center gap-6">
                         <div>
                           <p className="text-xl font-bold text-emerald-600">{formatCurrency(delivery.shippingFee * 0.8)}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Earnings</p>
                         </div>
                         <ChevronRight className={`w-5 h-5 text-gray-300 transition-transform ${expandedLog === delivery._id ? 'rotate-90' : ''}`} />
                       </div>
                     </div>
                     {expandedLog === delivery._id && (
                       <div className="mt-6 p-6 bg-gray-50 rounded-3xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                             <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Reference</p>
                               <p className="font-mono text-primary font-bold">#{delivery.orderId?.slice(-6).toUpperCase()}</p>
                             </div>
                             <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivered At</p>
                               <p className="font-medium text-gray-700">{new Date(delivery.deliveredAt).toLocaleString()}</p>
                             </div>
                           </div>
                           <div className="space-y-4">
                             <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financial Breakdown</p>
                               <div className="flex justify-between items-center text-sm py-1 border-b border-gray-200">
                                 <span className="text-gray-500">Total Shipping Fee</span>
                                 <span className="font-bold text-gray-700">{formatCurrency(delivery.shippingFee)}</span>
                               </div>
                               <div className="flex justify-between items-center text-sm py-2">
                                 <span className="text-emerald-600 font-bold">Your Share (80%)</span>
                                 <span className="font-bold text-emerald-600">{formatCurrency(delivery.shippingFee * 0.8)}</span>
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                 ))}
              </div>
              <div className="p-8 bg-gray-50/50 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Monthly Performance</span>
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-bold text-gray-600">
                      Trips: <span className="text-primary">{stats?.monthlyTrips || 0}</span>
                    </span>
                    <span className="text-sm font-bold text-gray-600">
                      Earnings: <span className="text-emerald-600">{formatCurrency(stats?.monthlyEarnings || 0)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Receipts Section */}
              <div className="p-8 border-t border-gray-100 bg-gray-50/30">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Payment Receipts (Recent Payouts)
                </h4>
                
                {recentWithdrawals.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 italic bg-white rounded-3xl border border-dashed border-gray-200">
                    No payment receipts found yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentWithdrawals.map((payout) => (
                      <div key={payout._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{formatCurrency(payout.amount)}</p>
                            <p className="text-[10px] text-gray-500">{new Date(payout.date).toLocaleDateString()} at {new Date(payout.date).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Ref: {payout.reference?.slice(-8)}</p>
                          <p className="text-[9px] font-mono text-gray-400">{payout.method}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

          </div>
        </main>

      {/* Verification Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-primary text-white text-center relative">
               <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors">
                 <X className="w-5 h-5" />
               </button>
               <h3 className="text-xl font-bold">Verify Delivery</h3>
              <p className="text-sm text-white/80 mt-1">Enter the 8-digit code from customer</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2 uppercase tracking-widest font-bold">Order Verification</p>
                <p className="font-bold text-primary text-lg">{selectedOrder.product?.name}</p>
                <p className="text-2xl font-bold text-emerald-600 mt-2">
                  {formatCurrency(selectedOrder.shippingFee * 0.8)} <span className="text-[10px] text-gray-400 font-normal">(Your Share)</span>
                </p>
              </div>

              {verificationSuccess ? (
                <div className="text-center py-12 bg-emerald-50 rounded-3xl animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-800">Confirmed!</p>
                  <p className="text-sm text-emerald-600 mt-1">Earnings added to your wallet.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-2 text-center uppercase tracking-widest">
                      8-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                      placeholder="00000000"
                      maxLength={8}
                      className="w-full text-center text-3xl font-mono tracking-[0.5em] py-6 px-6 rounded-2xl border-2 border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (key === 'C') setVerificationCode('');
                          else if (key === '⌫') setVerificationCode(prev => prev.slice(0, -1));
                          else if (verificationCode.length < 8) setVerificationCode(prev => prev + key);
                        }}
                        className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-xl font-bold text-gray-700 transition-colors flex items-center justify-center border border-gray-100 shadow-sm"
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  {verificationError && (
                    <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100 animate-shake">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm font-bold">{verificationError} ({remainingAttempts} attempts left)</p>
                    </div>
                  )}

                  <Button
                    className="w-full rounded-2xl py-4 shadow-xl shadow-primary/20"
                    size="lg"
                    onClick={() => handleVerifyDelivery(selectedOrder._id)}
                    disabled={verificationCode.length !== 8 || verifying}
                    isLoading={verifying}
                  >
                    Complete Delivery
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{ icon: any; label: string; value: string | number; color: 'emerald' | 'amber' | 'blue' | 'purple' }> = ({ icon: Icon, label, value, color }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </div>
  );
};

const ProfileItem: React.FC<{ icon: any; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 group">
    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
    </div>
  </div>
);