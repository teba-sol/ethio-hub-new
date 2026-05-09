import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Download, ChevronLeft, ChevronRight, 
  Eye, CheckCircle2, XCircle, Clock, Truck, Package, 
  AlertCircle, DollarSign, Calendar, User, MapPin, 
  MessageSquare, FileText, MoreVertical, Printer, 
  ArrowUpRight, RefreshCw, ShieldCheck, Mail, CreditCard
} from 'lucide-react';
import { Button, Badge, Input } from '../UI';
import { useNotification } from '../../context/NotificationContext';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

// --- Types ---
interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  sku: string;
}

interface OrderTimelineEvent {
  status: string;
  date: string;
  note?: string;
}

interface Order {
  _id: string;
  tourist: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  product: {
    _id: string;
    name: string;
    images: string[];
    sku?: string;
    price: number;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  artisanEarnings?: number;
  adminCommission?: number;
  status: 'Pending' | 'Paid' | 'Ready for Pickup' | 'Assigned' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | 'Awaiting Payment';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  createdAt: string;
  verificationCode?: string;
  assignedDeliveryGuy?: {
    name: string;
    phone: string;
  };
  deliveryGuyInfo?: {
    name: string;
    phone: string;
  };
  shippingFee?: number;
  distanceKm?: number;
  contactInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  timeline?: OrderTimelineEvent[];
  notes?: string;
  trackingNumber?: string;
  isVerified?: boolean;
}

// --- Components ---

  const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const normalizedStatus = status === 'Awaiting Payment' ? 'Paid' : status;
    const styles: Record<string, string> = {
      'Pending': 'bg-amber-50 text-amber-600 border-amber-100',
      'Paid': 'bg-blue-50 text-blue-600 border-blue-100',
      'Ready for Pickup': 'bg-purple-50 text-purple-600 border-purple-100',
      'Assigned': 'bg-violet-50 text-violet-600 border-violet-100',
      'Shipped': 'bg-indigo-50 text-indigo-600 border-indigo-100',
      'Delivered': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'Returned': 'bg-gray-50 text-gray-600 border-gray-100',
      'Cancelled': 'bg-red-50 text-red-600 border-red-100',
      'paid': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'pending': 'bg-amber-50 text-amber-600 border-amber-100',
      'refunded': 'bg-red-50 text-red-600 border-red-100'
    };

    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[normalizedStatus] || 'bg-gray-50 text-gray-500'}`}>
        {normalizedStatus}
      </span>
    );
  };

export const ArtisanOrderManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, pending: 0, delivered: 0, returns: 0 });
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [tempDateRange, setTempDateRange] = useState({ start: '', end: '' });
  const [appliedDateRange, setAppliedDateRange] = useState({ start: '', end: '' });
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/artisan/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReady = async (orderId: string) => {
    const confirmReady = window.confirm("Are you sure you want to mark this order as ready for pickup?");
    if (!confirmReady) return;

    try {
      const response = await fetch(`/api/artisan/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Ready for Pickup' }),
      });
      const data = await response.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
        if (data.verificationCode) {
<<<<<<< HEAD
          alert(`Order marked as ready!\nVerification Code: ${data.verificationCode}\n\nShare this code with the customer via message center.`);
=======
          showNotification(`Order marked as ready! Verification Code: ${data.verificationCode}`, 'success');
        } else {
          showNotification('Order status updated successfully', 'success');
>>>>>>> origin/aman
        }
      } else {
        showNotification(data.message || 'Failed to update order status', 'error');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/artisan/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
        // Refresh stats
        const statsRes = await fetch('/api/artisan/orders');
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.stats);
        showNotification('Order status updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // --- Derived State ---
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o._id.toLowerCase().includes(q) || 
        o.tourist.name.toLowerCase().includes(q) ||
        o.product.name.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'All') {
      if (statusFilter === 'Pending') {
        result = result.filter(o => ['Pending', 'Paid'].includes(o.status));
      } else {
        result = result.filter(o => o.status === statusFilter);
      }
    }

    if (paymentFilter !== 'All') {
      result = result.filter(o => o.paymentStatus === paymentFilter.toLowerCase());
    }

    const now = new Date();
    if (dateFilter === 'Today') {
      result = result.filter(o => new Date(o.createdAt).toDateString() === now.toDateString());
    } else if (dateFilter === 'This Week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(o => new Date(o.createdAt) >= weekAgo);
    } else if (dateFilter === 'This Month') {
      result = result.filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (dateFilter === 'This Year') {
      result = result.filter(o => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === now.getFullYear();
      });
    } else if (dateFilter === 'Custom' && appliedDateRange.start && appliedDateRange.end) {
      const start = new Date(appliedDateRange.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(appliedDateRange.end);
      end.setHours(23, 59, 59, 999);
      result = result.filter(o => {
        const d = new Date(o.createdAt);
        return d >= start && d <= end;
      });
    }

    return result;
  }, [orders, searchQuery, statusFilter, paymentFilter, dateFilter, appliedDateRange]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Handlers ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // --- Detail View ---
  if (selectedOrderId) {

    const order = orders.find(o => o._id === selectedOrderId);
    if (!order) return <div>Order not found</div>;

    return (
      <div className="space-y-8 animate-in fade-in duration-300 pb-20">
        {/* Detail Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 bg-gray-50/80 backdrop-blur-md z-20 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedOrderId(null)} className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-gray-100">
              <ChevronLeft className="w-6 h-6 text-gray-500" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-serif font-bold text-primary">{order._id.slice(-6).toUpperCase()}</h1>
                <OrderStatusBadge status={order.paymentStatus === 'paid' && (order.status === 'Pending' || order.status === 'Paid') ? 'Paid' : order.status} />
                {order.isVerified && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </Badge>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Placed on {new Date(order.createdAt).toLocaleString()} via Chap
              </p>
            </div>
          </div>
          <div className="flex gap-3">
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Order Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Order Items */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-primary mb-6">Order Items</h3>
              <div className="space-y-6">
                <div className="flex gap-4 items-start pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                  <img src={order.product.images[0]} className="w-20 h-20 rounded-xl object-cover bg-gray-100" alt="" />
                  <div className="flex-1">
                    <h4 className="font-bold text-primary">{order.product.name}</h4>
                    <p className="text-xs text-gray-500">SKU: {order.product.sku || 'N/A'}</p>
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Product Description</p>
                      <p className="text-sm text-gray-600 line-clamp-3">{(order.product as any).description || 'No description available.'}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <Badge variant="secondary">Qty: {order.quantity}</Badge>
                      <span className="font-bold text-primary">ETB {order.unitPrice.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">ETB {(order.unitPrice * order.quantity).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-2xl space-y-3">
                  <div className="flex justify-between text-lg font-bold text-primary pt-3">
                    <span>Total Price (Paid by Tourist)</span>
                    <span>ETB {order.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-red-500 pt-2">
                    <span>Platform Fee (Admin Commission)</span>
                    <span>- ETB {(order.adminCommission || (order.totalPrice * 0.1)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-emerald-600 pt-3 border-t border-dashed border-gray-300">
                    <span>Artisan Earning (After Cut)</span>
                    <span>ETB {(order.artisanEarnings || (order.totalPrice * 0.9)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-primary mb-6">Order Timeline</h3>
              <div className="space-y-8 relative pl-4">
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100"></div>
                {order.timeline && order.timeline.length > 0 ? (
                  order.timeline.map((event, idx) => (
                    <div key={idx} className="relative flex gap-6 items-start">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white ${idx === order.timeline!.length - 1 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {idx === 0 ? <FileText className="w-4 h-4" /> : 
                         event.status === 'Delivered' ? <CheckCircle2 className="w-4 h-4" /> :
                         <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-primary">
                          {event.status}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(event.date).toLocaleString()}</p>
                        {event.note && <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded-lg">{event.note}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm italic">No timeline events yet.</div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Customer & Actions */}
          <div className="space-y-8">
            {/* Customer Info */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-primary mb-6">Customer</h3>
              <div className="flex items-center gap-4 mb-6">
                <img src={order.tourist.profilePicture || `https://ui-avatars.com/api/?name=${order.tourist.name}&background=random`} className="w-16 h-16 rounded-2xl bg-gray-100 object-cover" alt="" />
                <div>
                  <h4 className="font-bold text-primary">{order.tourist.name}</h4>
                  <p className="text-xs text-gray-500">{order.tourist.email}</p>
                  <p className="text-xs text-gray-500">{order.contactInfo.phone}</p>
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-gray-50">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Shipping Address</p>
                    {order.shippingAddress ? (
                      <p className="text-sm text-primary mt-1">
                        {order.shippingAddress.street}<br />
                        {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                        {order.shippingAddress.country}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1 italic">No address provided</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Management Actions */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-primary mb-2">Actions</h3>
              {!['Ready for Pickup', 'Assigned', 'Shipped', 'Delivered'].includes(order.status) ? (
                <Button 
                  className="w-full justify-start" 
                  variant="primary"
                  leftIcon={Truck}
                  onClick={() => handleMarkAsReady(order._id)}
                >
                  Mark as Ready
                </Button>
              ) : (
                <Button 
                  className="w-full justify-start" 
                  variant="primary"
                  leftIcon={Truck}
                  disabled
                >
                  Marked as Ready
                </Button>
              )}
              {order.status === 'Ready for Pickup' && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm font-bold text-emerald-800">Waiting for delivery assignment</p>
                  <p className="text-xs text-emerald-600 mt-1">Admin will assign a delivery driver</p>
                </div>
              )}
              {order.verificationCode && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">Verification Code</p>
                  <p className="text-2xl font-mono font-bold text-blue-800 tracking-widest">{order.verificationCode}</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  // --- List View ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Orders</h1>
          <p className="text-gray-500 text-sm">Manage and fulfill your customer orders.</p>
        </div>
      </div>

      {/* Analytics Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', val: (stats.totalOrders || 0).toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', val: (stats.pending || 0).toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Delivered', val: (stats.delivered || 0).toString(), icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Returns', val: (stats.returns || 0).toString(), icon: RefreshCw, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 ${stat.bg} rounded-xl`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
            <div>
              <p className="text-2xl font-bold text-primary">{stat.val}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Toolbar */}
      <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search orders, customers..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="h-8 w-[1px] bg-gray-100 hidden md:block"></div>
          <div className="relative">
                <select 
                  className="appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Ready for Pickup">Ready for Pickup</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Returned">Returned</option>
                </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          {/* Date Filter */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative">
                <select 
                  className="appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    if (e.target.value === 'Custom') {
                      setIsDateFilterOpen(true);
                    } else {
                      setIsDateFilterOpen(false);
                      setAppliedDateRange({ start: '', end: '' });
                    }
                  }}
                >
                  <option>All Time</option>
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>This Year</option>
                  <option>Custom</option>
                </select>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>

              {isDateFilterOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white p-4 rounded-2xl border border-gray-100 shadow-xl z-50 w-72 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-gray-50 border-none rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-primary/10"
                        value={tempDateRange.start}
                        onChange={(e) => setTempDateRange(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">End Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-gray-50 border-none rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-primary/10"
                        value={tempDateRange.end}
                        onChange={(e) => setTempDateRange(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-9 text-xs"
                        onClick={() => {
                          setIsDateFilterOpen(false);
                          setDateFilter('All Time');
                          setTempDateRange({ start: '', end: '' });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 h-9 text-xs"
                        onClick={() => {
                          if (tempDateRange.start && tempDateRange.end) {
                            setAppliedDateRange(tempDateRange);
                            setIsDateFilterOpen(false);
                          } else {
                            showNotification('Please select both start and end dates', 'warning');
                          }
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Payout</th>
                <th className="px-6 py-4">Fulfillment</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedOrders.map(order => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-primary">{order._id.slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">{order.tourist.name.charAt(0)}</div>
                      <span className="font-bold text-gray-700">{order.tourist.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {order.product.name}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">ETB {((order as any).artisanEarnings || (order.totalPrice * 0.9)).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {['Ready for Pickup', 'Assigned', 'Shipped', 'Delivered'].includes(order.status) ? (
                      <Badge variant="success" className="flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" /> Preparing
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600">Chap</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <OrderStatusBadge status={order.paymentStatus === 'paid' && (order.status === 'Pending' || order.status === 'Paid') ? 'Paid' : order.status} />
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setSelectedOrderId(order._id)}>View</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-4">
        <p className="text-xs text-gray-400 font-medium">Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders</p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            leftIcon={ChevronLeft}
          >
            Prev
          </Button>
          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            rightIcon={ChevronRight}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);
