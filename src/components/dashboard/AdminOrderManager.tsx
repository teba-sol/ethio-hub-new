"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, MapPin, Phone, User, CheckCircle, 
  Clock, DollarSign, RefreshCw, AlertCircle, Truck
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
  phone: string;
  deliveryProfile?: {
    phone?: string;
    vehicleType?: string;
    totalDeliveries?: number;
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
    </div>
  );
};
