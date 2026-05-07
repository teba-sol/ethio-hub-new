"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, Truck, DollarSign, TrendingUp, MapPin, Phone, 
  User, Clock, CheckCircle, AlertCircle, Navigation, 
  History, ChevronRight, RefreshCw, Lock
} from 'lucide-react';
import { Button, Badge } from '../UI';

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
  };
  tourist: {
    name: string;
    email: string;
    phone: string;
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
  productName: string;
}

export const DeliveryDashboard: React.FC = () => {
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
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [orderStats, setOrderStats] = useState<any>(null);

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/delivery/orders');
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.orders || []);
        setStats(data.stats);
        setRecentDeliveries(data.recentDeliveries || []);
      }
    } catch (err) {
      console.error('Error fetching delivery data:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => ['Shipped', 'Ready for Pickup'].includes(o.status));
  const shippedOrders = orders.filter(o => o.status === 'Shipped');

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Delivery Dashboard</h1>
          <p className="text-gray-500">Manage your deliveries and track earnings</p>
        </div>
        <Button onClick={fetchDeliveryData} leftIcon={RefreshCw} variant="outline">
          Refresh
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase">Today&apos;s Trips</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.todayTrips}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase">Pending Pickup</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.pendingPickups}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase">Today&apos;s Earnings</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.dailyEarnings)}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase">Monthly Earnings</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.monthlyEarnings)}</p>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'active' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Active Tasks ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'history' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <History className="w-4 h-4 inline mr-2" />
          History
        </button>
      </div>

      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No active deliveries</p>
            </div>
          ) : (
            activeOrders.map((order) => (
              <div 
                key={order._id}
                className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ${
                  order.isLocked ? 'border-red-200 bg-red-50' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {order.product?.images?.[0] ? (
                      <img src={order.product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-primary">{order.product?.name || 'Product'}</h3>
                        <p className="text-xs text-gray-400 font-mono">Order #{order._id.slice(-6).toUpperCase()}</p>
                      </div>
                      <Badge variant={order.status === 'Shipped' ? 'info' : 'warning'}>
                        {order.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary mt-1" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase">Delivery Address</p>
                          <p className="text-sm text-gray-700">
                            {order.shippingAddress?.street}, {order.shippingAddress?.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500 mt-1" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase">Shipping Fee</p>
                          <p className="text-sm font-bold text-emerald-600">{formatCurrency(order.shippingFee)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-bold">{order.tourist?.name}</p>
                          <p className="text-xs text-gray-500">{order.tourist?.phone}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          leftIcon={Phone}
                          onClick={() => window.open(`tel:${order.tourist?.phone}`)}
                        >
                          Call Customer
                        </Button>
                        {order.status === 'Shipped' && !order.isLocked && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setVerificationCode('');
                              setVerificationError('');
                            }}
                          >
                            Verify & Complete
                          </Button>
                        )}
                        {order.isLocked && (
                          <Badge variant="error">
                            <Lock className="w-3 h-3 mr-1" /> Locked
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

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-primary">Past Deliveries</h3>
            {stats && (
              <p className="text-sm text-gray-500">
                This month: {stats.monthlyTrips} trips, {formatCurrency(stats.monthlyEarnings)} earned
              </p>
            )}
          </div>

          {recentDeliveries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No delivery history yet
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentDeliveries.map((delivery) => (
                <div key={delivery._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{delivery.productName}</p>
                      <p className="text-xs text-gray-500">{delivery.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{formatCurrency(delivery.shippingFee)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(delivery.deliveredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-primary text-white text-center">
              <h3 className="text-xl font-bold">Verify Delivery</h3>
              <p className="text-sm text-white/80 mt-1">Enter the 8-digit code from customer</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Order: #{selectedOrder._id.slice(-6).toUpperCase()}</p>
                <p className="font-bold text-primary">{selectedOrder.product?.name}</p>
                <p className="text-2xl font-bold text-emerald-600 mt-2">
                  {formatCurrency(selectedOrder.shippingFee)}
                </p>
              </div>

              {verificationSuccess ? (
                <div className="text-center py-8 bg-emerald-50 rounded-2xl">
                  <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                  <p className="text-xl font-bold text-emerald-800">Delivery Confirmed!</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2 text-center">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                      placeholder="________"
                      maxLength={8}
                      className="w-full text-center text-2xl font-mono tracking-[0.5em] py-4 px-6 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  {verificationError && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm">{verificationError}</p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleVerifyDelivery(selectedOrder._id)}
                    disabled={verificationCode.length !== 8 || verifying}
                    isLoading={verifying}
                  >
                    Confirm Delivery
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
