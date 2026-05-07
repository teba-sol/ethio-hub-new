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
    avatar?: string;
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

  useEffect(() => {
    fetchOrders();
  }, []);

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
      alert('Please select a delivery person');
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
        alert('Delivery guy assigned successfully');
        setSelectedOrder(null);
        setAssigningTo('');
        fetchOrders();
      } else {
        alert(result.message || 'Failed to assign delivery guy');
      }
    } catch (err) {
      alert('Error assigning delivery guy');
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
      }
    } catch (err) {
      console.error('Error fetching delivery person details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const readyOrders = data?.orders?.filter(o => o.status === 'Ready for Pickup') || [];
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
    <div className="space-y-6 animate-in fade-in duration-500">
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
                <div>
                  <h3 className="text-xl font-bold">{deliveryPersonDetails.deliveryGuy?.name || 'Delivery Person'}</h3>
                  <p className="text-sm text-white/80">Performance & Earnings</p>
                </div>
                <button 
                  onClick={() => { setSelectedDeliveryGuy(null); setDeliveryPersonDetails(null); }} 
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
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
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-bold text-primary mb-3">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Name:</span> <span className="font-medium">{deliveryPersonDetails.deliveryGuy?.name}</span></div>
                      <div><span className="text-gray-500">Email:</span> <span className="font-medium">{deliveryPersonDetails.deliveryGuy?.email}</span></div>
                      <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{deliveryPersonDetails.deliveryGuy?.phone}</span></div>
                      <div><span className="text-gray-500">Vehicle:</span> <span className="font-medium capitalize">{deliveryPersonDetails.deliveryGuy?.deliveryProfile?.vehicleType || 'N/A'}</span></div>
                    </div>
                  </div>

                  {/* Wallet Summary */}
                  {deliveryPersonDetails.wallet && (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <h4 className="font-bold text-emerald-800 mb-3">Earnings Summary</h4>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-emerald-600 uppercase">Available Balance</p>
                          <p className="text-lg font-bold text-emerald-800">{formatCurrency(deliveryPersonDetails.wallet.availableBalance)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600 uppercase">Lifetime Earned</p>
                          <p className="text-lg font-bold text-emerald-800">{formatCurrency(deliveryPersonDetails.wallet.lifetimeEarned)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600 uppercase">Delivery Earnings</p>
                          <p className="text-lg font-bold text-emerald-800">{formatCurrency(deliveryPersonDetails.wallet.deliveryEarnings)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600 uppercase">Trips Completed</p>
                          <p className="text-lg font-bold text-emerald-800">{deliveryPersonDetails.wallet.deliveryTripsCompleted}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery History */}
                  <div>
                    <h4 className="font-bold text-primary mb-3">Delivery History ({deliveryPersonDetails.deliveryLogs?.length || 0} trips)</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {deliveryPersonDetails.deliveryLogs?.map((log: any) => (
                        <div key={log._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">{log.productName || 'Product'}</p>
                              <p className="text-xs text-gray-500">{new Date(log.deliveredAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-600">{formatCurrency(log.driverShare)}</p>
                              <p className="text-xs text-gray-500">Driver Share (80%)</p>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>Customer: {log.customerName}</span>
                            <span>Shipping Fee: {formatCurrency(log.shippingFee)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mock Pay Button */}
                  <div className="pt-4 border-t border-gray-100">
                    <Button 
                      className="w-full"
                      onClick={async () => {
                        if (!deliveryPersonDetails.deliveryGuy?.phone) {
                          alert('No phone number available');
                          return;
                        }
                        const amount = deliveryPersonDetails.wallet?.deliveryEarnings || 0;
                        if (amount <= 0) {
                          alert('No earnings to pay');
                          return;
                        }
                        if (confirm(`Mock payment: Send ${formatCurrency(amount)} to ${deliveryPersonDetails.deliveryGuy.phone}?`)) {
                          try {
                            const res = await fetch(`/api/admin/delivery-person/${selectedDeliveryGuy}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ phone: deliveryPersonDetails.deliveryGuy.phone, amount }),
                            });
                            const result = await res.json();
                            if (result.success) {
                              alert(`Mock payment of ${formatCurrency(amount)} sent to ${deliveryPersonDetails.deliveryGuy.phone}`);
                              fetchDeliveryPersonDetails(selectedDeliveryGuy);
                            }
                          } catch (err) {
                            alert('Payment failed');
                          }
                        }
                      }}
                    >
                      Pay {formatCurrency(deliveryPersonDetails.wallet?.deliveryEarnings || 0)} (Mock)
                    </Button>
                    <p className="text-xs text-gray-500 text-center mt-2">This is a mock payment that will deduct from delivery earnings</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
