"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, MapPin, Phone, User, CheckCircle, 
  Clock, DollarSign, RefreshCw, AlertCircle, Truck, X
} from 'lucide-react';
import { Button, Badge } from '../UI';

interface Order {
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
  artisan: {
    name: string;
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
  createdAt: string;
}

interface DeliveryGuy {
  _id: string;
  name: string;
  email: string;
  phone: string;
  deliveryProfile?: {
    phone?: string;
    vehicleType?: string;
    totalDeliveries?: number;
    profileImage?: string;
  };
  wallet?: {
    availableBalance: number;
    lifetimeEarned: number;
    deliveryEarnings: number;
    deliveryTripsCompleted: number;
  };
}

interface AdminOrdersData {
  orders: Order[];
  deliveryGuys: DeliveryGuy[];
}

export const AdminOrderManager: React.FC = () => {
  const [data, setData] = useState<AdminOrdersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assigningTo, setAssigningTo] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  // New state for delivery person details
  const [selectedDeliveryGuy, setSelectedDeliveryGuy] = useState<string | null>(null);
  const [deliveryPersonDetails, setDeliveryPersonDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Payment modal states
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payPhone, setPayPhone] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    // Auto-hide after 5 seconds if it's a success or info
    if (type !== 'error') {
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/orders/assign');
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDelivery = async (orderId: string) => {
    if (!assigningTo) {
      showNotification('Please select a delivery person', 'error');
      return;
    }

    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/orders/assign?orderId=${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryGuyId: assigningTo }),
      });

      const result = await res.json();
      if (result.success) {
        showNotification('Delivery guy assigned successfully', 'success');
        setSelectedOrder(null);
        setAssigningTo('');
        fetchOrders();
      } else {
        showNotification(result.message || 'Failed to assign delivery guy', 'error');
      }
    } catch (err) {
      showNotification('Error assigning delivery guy', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const fetchDeliveryPersonDetails = async (guyId: string) => {
    try {
      setLoadingDetails(true);
      setSelectedDeliveryGuy(guyId);
      const res = await fetch(`/api/admin/delivery-person/${guyId}`);
      const result = await res.json();
      if (result.success) {
        setDeliveryPersonDetails(result);
        setPayPhone(result.deliveryGuy?.phone || '');
      }
    } catch (err) {
      console.error('Error fetching delivery person details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }
    if (!payPhone) {
      showNotification('Please enter a phone number', 'error');
      return;
    }

    const amount = parseFloat(payAmount);
    if (amount > (deliveryPersonDetails?.wallet?.availableBalance || 0)) {
      showNotification('Insufficient available balance', 'error');
      return;
    }

    setProcessingPayment(true);
    try {
      const res = await fetch(`/api/admin/delivery-person/${selectedDeliveryGuy}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: payPhone, amount }),
      });
      const result = await res.json();
      if (result.success) {
        showNotification(`Payment of ${formatCurrency(amount)} processed successfully`, 'success');
        setIsPayModalOpen(false);
        setPayAmount('');
        fetchDeliveryPersonDetails(selectedDeliveryGuy!);
        fetchOrders(); // Refresh to update balances in the table
      } else {
        showNotification(result.message || 'Payment failed', 'error');
      }
    } catch (err) {
      showNotification('Error processing payment', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const readyOrders = data?.orders?.filter(o => o.status === 'Ready for Pickup') || [];
  const assignedOrders = data?.orders?.filter(o => o.status === 'Assigned') || [];
  const shippedOrders = data?.orders?.filter(o => o.status === 'Shipped') || [];
  const deliveredOrders = data?.orders?.filter(o => o.status === 'Delivered') || [];

  const formatCurrency = (amount: number) => `ETB ${(amount || 0).toLocaleString()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Order Management</h1>
          <p className="text-gray-500">Assign delivery persons to ready orders</p>
        </div>
        <Button onClick={fetchOrders} leftIcon={RefreshCw} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Ready for Pickup</p>
          <p className="text-2xl font-bold text-primary mt-1">{readyOrders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Shipped</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{shippedOrders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Delivered</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{deliveredOrders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Delivery Guys</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{data?.deliveryGuys?.length || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-primary">Ready for Pickup Orders</h3>
          <p className="text-sm text-gray-500">These orders need to be assigned to a delivery person</p>
        </div>

        {readyOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No orders ready for pickup</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {readyOrders.map((order) => (
              <div key={order._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                      {order.product?.images?.[0] ? (
                        <img src={order.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{order.product?.name}</p>
                      <p className="text-xs text-gray-500 font-mono">#{order._id.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">{formatCurrency(order.shippingFee)}</p>
                      <p className="text-xs text-gray-400">{order.distanceKm} km</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{order.tourist?.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{order.shippingAddress?.city}</span>
                      </div>
                    </div>

                    <Button 
                      size="sm"
                      leftIcon={Truck}
                      onClick={() => {
                        setSelectedOrder(order);
                        setAssigningTo('');
                      }}
                    >
                      Assign Driver
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-amber-50/30">
          <div>
            <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Assigned (Pending Acceptance)
            </h3>
            <p className="text-sm text-amber-700/70">Wait for delivery persons to accept these assignments</p>
          </div>
          <Badge variant="warning">{assignedOrders.length} Pending</Badge>
        </div>

        {assignedOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 italic">
            <p>No pending assignments</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {assignedOrders.map((order) => (
              <div key={order._id} className="p-4 hover:bg-amber-50/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden grayscale">
                      {order.product?.images?.[0] ? (
                        <img src={order.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{order.product?.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="warning" size="sm">Waiting for Driver</Badge>
                        <span className="text-xs text-gray-400 font-mono">#{order._id.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl border border-amber-100 shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                        {(order as any).deliveryGuyInfo?.name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Assigned Driver</p>
                        <p className="text-sm font-bold text-amber-900">{(order as any).deliveryGuyInfo?.name}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">{formatCurrency(order.shippingFee)}</p>
                      <p className="text-xs text-gray-400">{order.tourist?.name}</p>
                    </div>

                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOrder(order);
                        setAssigningTo((order as any).assignedDeliveryGuy?._id || (order as any).assignedDeliveryGuy || '');
                      }}
                    >
                      Reassign
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-primary">Active Shipments</h3>
        </div>

        {shippedOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No active shipments</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {shippedOrders.map((order) => (
              <div key={order._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{order.product?.name}</p>
                    <p className="text-xs text-gray-500 font-mono">#{order._id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600 mr-4">
                      <span className="font-bold">Driver:</span> {(order as any).deliveryGuyInfo?.name || 'Assigned'}
                    </div>
                    <Badge variant="info">In Transit</Badge>
                    <div className="text-right text-sm">
                      <p className="font-medium">{order.tourist?.name}</p>
                      <p className="text-gray-500">{order.shippingAddress?.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-primary">Delivery Personnel Tracking</h3>
            <p className="text-sm text-gray-500">Monitor driver performance and earnings</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Total Trips</th>
                <th className="px-6 py-4">Total Earned</th>
                <th className="px-6 py-4">Available Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.deliveryGuys?.map((guy) => (
                <tr key={guy._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {guy.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{guy.name}</p>
                        <p className="text-xs text-gray-500">{guy.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary">{guy.deliveryProfile?.vehicleType || 'N/A'}</Badge>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700">
                    {guy.wallet?.deliveryTripsCompleted || 0}
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    {formatCurrency(guy.wallet?.lifetimeEarned || 0)}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">
                    {formatCurrency(guy.wallet?.availableBalance || 0)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedDeliveryGuy(guy._id);
                        fetchDeliveryPersonDetails(guy._id);
                      }}
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-primary text-white">
              <h3 className="text-xl font-bold">Assign Delivery Person</h3>
              <p className="text-sm text-white/80">Select a driver for this order</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="font-bold text-primary">{selectedOrder.product?.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedOrder.tourist?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    {formatCurrency(selectedOrder.shippingFee)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Select Delivery Person</label>
                <select
                  value={assigningTo}
                  onChange={(e) => setAssigningTo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  <option value="">-- Select Driver --</option>
                  {data?.deliveryGuys?.map((guy) => (
                    <option key={guy._id} value={guy._id}>
                      {guy.name} - {guy.deliveryProfile?.totalDeliveries || 0} deliveries
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedOrder(null)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleAssignDelivery(selectedOrder._id)}
                  disabled={!assigningTo || assigning}
                  isLoading={assigning}
                >
                  Assign
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDeliveryGuy && deliveryPersonDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" 
          onClick={() => { setSelectedDeliveryGuy(null); setDeliveryPersonDetails(null); }}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-primary text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 overflow-hidden shadow-xl">
                    {deliveryPersonDetails.deliveryGuy?.deliveryProfile?.profileImage ? (
                      <img src={deliveryPersonDetails.deliveryGuy.deliveryProfile.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold">{deliveryPersonDetails.deliveryGuy?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{deliveryPersonDetails.deliveryGuy?.name || 'Delivery Person'}</h3>
                    <p className="text-sm text-white/80 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> {deliveryPersonDetails.deliveryGuy?.phone || 'No phone'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedDeliveryGuy(null); setDeliveryPersonDetails(null); }} 
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {loadingDetails ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <>
                  {/* Personal Info */}
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-inner">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Partner Profile</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-primary">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Full Name</p>
                          <p className="font-bold text-gray-800">{deliveryPersonDetails.deliveryGuy?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-primary">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Partner ID</p>
                          <p className="font-mono text-xs font-bold text-gray-800">{deliveryPersonDetails.deliveryGuy?._id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-primary">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Vehicle Type</p>
                          <Badge variant="secondary" className="capitalize">{deliveryPersonDetails.deliveryGuy?.deliveryProfile?.vehicleType || 'N/A'}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-primary">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Contact Phone</p>
                          <p className="font-bold text-gray-800">{deliveryPersonDetails.deliveryGuy?.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Summary */}
                  {deliveryPersonDetails.wallet && (
                    <div className="bg-white p-6 rounded-[32px] border border-emerald-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                      <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-6 relative z-10">Financial Overview</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Available</p>
                          <p className="text-2xl font-black text-emerald-800">{formatCurrency(deliveryPersonDetails.wallet.availableBalance)}</p>
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Lifetime</p>
                          <p className="text-xl font-bold text-gray-700">{formatCurrency(deliveryPersonDetails.wallet.lifetimeEarned)}</p>
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Trips</p>
                          <p className="text-xl font-bold text-gray-700">{deliveryPersonDetails.wallet.deliveryTripsCompleted}</p>
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Paid Out</p>
                          <p className="text-xl font-bold text-gray-700">{formatCurrency(deliveryPersonDetails.wallet.lifetimePaidOut || 0)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery History */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Recent Trips ({deliveryPersonDetails.deliveryLogs?.length || 0})
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {deliveryPersonDetails.deliveryLogs?.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          No trip history found
                        </div>
                      ) : (
                        deliveryPersonDetails.deliveryLogs?.map((log: any) => (
                          <div key={log._id} className="p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                                  <Package className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800">{log.productName || 'Product'}</p>
                                  <p className="text-[10px] text-gray-500 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> {new Date(log.deliveredAt).toLocaleDateString()} • {log.customerName}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-emerald-600">{formatCurrency(log.driverShare)}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Earnings</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pay Now Button */}
                  <div className="pt-8 border-t border-gray-100 flex flex-col items-center">
                    <div className="w-full flex justify-between items-center mb-6 px-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800">Available Balance</p>
                        <p className="text-2xl font-black text-emerald-600">{formatCurrency(deliveryPersonDetails.wallet?.availableBalance || 0)}</p>
                      </div>
                      <Button 
                        size="lg"
                        className="rounded-2xl shadow-xl shadow-primary/20"
                        onClick={() => {
                          setPayAmount('');
                          setPayPhone(deliveryPersonDetails.deliveryGuy?.phone || '');
                          setIsPayModalOpen(true);
                        }}
                        disabled={!deliveryPersonDetails.wallet?.availableBalance || deliveryPersonDetails.wallet.availableBalance <= 0}
                      >
                        Pay Driver Now
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 text-center italic bg-gray-50 px-6 py-2 rounded-full border border-gray-100">
                      Processing payment will deduct the amount from the driver&apos;s available balance.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPayModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setIsPayModalOpen(false)}
        >
          <div 
            className="bg-white rounded-[40px] w-full max-w-md shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 bg-emerald-600 text-white text-center relative">
              <button 
                onClick={() => setIsPayModalOpen(false)} 
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Process Payment</h3>
              <p className="text-emerald-100 text-sm mt-1">Transfer funds to driver wallet</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Available for Payout</p>
                <p className="text-2xl font-black text-emerald-700">{formatCurrency(deliveryPersonDetails?.wallet?.availableBalance || 0)}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Payout Amount (ETB)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Enter amount to pay"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-bold text-lg"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Recipient Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={payPhone}
                      onChange={(e) => setPayPhone(e.target.value)}
                      placeholder="Driver phone number"
                      className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-2xl border-gray-200 text-gray-500 hover:bg-gray-50"
                  onClick={() => setIsPayModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20"
                  onClick={handleProcessPayment}
                  disabled={!payAmount || !payPhone || processingPayment}
                  isLoading={processingPayment}
                >
                  Confirm Pay
                </Button>
              </div>
              <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
                Funds will be deducted from Available Balance
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
