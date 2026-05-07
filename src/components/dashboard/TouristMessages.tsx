"use client";

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Package, Truck, User, Phone, Mail, 
  MapPin, Clock, CheckCircle, RefreshCw, ShieldCheck
} from 'lucide-react';
import { Button, Badge } from '../UI';

interface DeliveryOrder {
  _id: string;
  status: string;
  verificationCode?: string;
  deliveryGuyInfo?: {
    name: string;
    phone: string;
  };
  product: {
    name: string;
    images: string[];
  };
  shippingFee: number;
  shippingAddress?: {
    street: string;
    city: string;
  };
  createdAt: string;
}

interface TourMessage {
  _id: string;
  type: 'order_update' | 'verification_code' | 'delivery_assigned';
  title: string;
  message: string;
  orderId?: string;
  createdAt: string;
  read: boolean;
}

export const TouristMessages: React.FC = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [messages, setMessages] = useState<TourMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);

  useEffect(() => {
    fetchDeliveryOrders();
  }, []);

  const fetchDeliveryOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tourist/orders');
      const data = await res.json();
      if (data.success) {
        const deliveryOrders = (data.orders || []).filter((o: DeliveryOrder) => 
          ['Paid', 'Ready for Pickup', 'Shipped', 'Delivered'].includes(o.status)
        );
        setOrders(deliveryOrders);

        const generatedMessages: TourMessage[] = [];
        deliveryOrders.forEach((order: DeliveryOrder) => {
          if (order.status === 'Ready for Pickup' && order.verificationCode) {
            generatedMessages.push({
              _id: `msg-vc-${order._id}`,
              type: 'verification_code',
              title: 'Verification Code',
              message: `Your verification code for order #${order._id?.slice(-6).toUpperCase()} is ${order.verificationCode}`,
              orderId: order._id,
              createdAt: order.createdAt,
              read: false,
            });
          }

          if (order.status === 'Shipped' && order.deliveryGuyInfo) {
            generatedMessages.push({
              _id: `msg-dg-${order._id}`,
              type: 'delivery_assigned',
              title: 'Delivery Person Assigned',
              message: `Your delivery person ${order.deliveryGuyInfo.name} is on the way! Phone: ${order.deliveryGuyInfo.phone}`,
              orderId: order._id,
              createdAt: order.createdAt,
              read: false,
            });
          }

          if (order.status === 'Delivered') {
            generatedMessages.push({
              _id: `msg-dl-${order._id}`,
              type: 'order_update',
              title: 'Order Delivered',
              message: `Your order #${order._id?.slice(-6).toUpperCase()} has been delivered successfully!`,
              orderId: order._id,
              createdAt: order.createdAt,
              read: false,
            });
          }
        });

        setMessages(generatedMessages.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = messages.filter(m => !m.read).length;
  const deliveryOrders = orders.filter(o => ['Paid', 'Ready for Pickup', 'Shipped'].includes(o.status));

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
          <h1 className="text-3xl font-serif font-bold text-primary">Message Center</h1>
          <p className="text-gray-500">Delivery updates and verification codes</p>
        </div>
        <Button onClick={fetchDeliveryOrders} leftIcon={RefreshCw} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {unreadCount > 0 && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-bold text-blue-800">{unreadCount} new message{unreadCount > 1 ? 's' : ''}</p>
            <p className="text-xs text-blue-600">Check your verification code for delivery confirmation</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-primary">Active Deliveries</h3>
          {deliveryOrders.length > 0 && (
            <Badge variant="info">{deliveryOrders.length} active</Badge>
          )}
        </div>

        {deliveryOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No active deliveries</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {deliveryOrders.map((order) => (
              <div 
                key={order._id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {order.product?.images?.[0] ? (
                      <img src={order.product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-gray-800 truncate">{order.product?.name}</p>
                      <Badge variant={
                        order.status === 'Shipped' ? 'info' : 
                        order.status === 'Ready for Pickup' ? 'warning' : 
                        'secondary'
                      }>
                        {order.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-500 font-mono mb-2">
                      Order #{order._id?.slice(-6).toUpperCase()}
                    </p>

                    {order.verificationCode && (
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <p className="text-xs font-bold text-emerald-600 uppercase">Your Verification Code</p>
                        </div>
                        <p className="text-2xl font-mono font-bold text-emerald-800 tracking-[0.3em]">
                          {order.verificationCode}
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">Share this code with the delivery person</p>
                      </div>
                    )}

                    {order.deliveryGuyInfo && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <p className="text-xs font-bold text-blue-600 uppercase">Delivery Person</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-800">{order.deliveryGuyInfo.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-blue-800">{order.deliveryGuyInfo.phone}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-primary">Message History</h3>
        </div>

        {messages.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No messages yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {messages.map((msg) => (
              <div key={msg._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    msg.type === 'verification_code' ? 'bg-emerald-100' :
                    msg.type === 'delivery_assigned' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {msg.type === 'verification_code' && <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                    {msg.type === 'delivery_assigned' && <Truck className="w-5 h-5 text-blue-600" />}
                    {msg.type === 'order_update' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-gray-800">{msg.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">{msg.message}</p>
                    {msg.orderId && (
                      <p className="text-xs text-gray-400 mt-1">Order: #{msg.orderId.slice(-6).toUpperCase()}</p>
                    )}
                  </div>
                  {!msg.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
