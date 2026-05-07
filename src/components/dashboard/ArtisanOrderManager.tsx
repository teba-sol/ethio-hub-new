import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Download, ChevronLeft, ChevronRight, 
  Eye, CheckCircle2, XCircle, Clock, Truck, Package, 
  AlertCircle, DollarSign, Calendar, User, MapPin, 
  MessageSquare, FileText, MoreVertical, Printer, 
  ArrowUpRight, RefreshCw, ShieldCheck, Mail, CreditCard
} from 'lucide-react';
import { Button, Badge, Input } from '../UI';
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
  status: 'Awaiting Payment' | 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  createdAt: string;
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
  const styles: Record<string, string> = {
    'Awaiting Payment': 'bg-amber-50 text-amber-600 border-amber-100',
    'Pending': 'bg-amber-50 text-amber-600 border-amber-100',
    'Shipped': 'bg-purple-50 text-purple-600 border-purple-100',
    'Delivered': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Cancelled': 'bg-red-50 text-red-600 border-red-100',
    'Returned': 'bg-gray-50 text-gray-600 border-gray-100',
    'paid': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'pending': 'bg-amber-50 text-amber-600 border-amber-100',
    'refunded': 'bg-red-50 text-red-600 border-red-100'
  };

  const label = status === 'paid' ? 'Paid' : status === 'pending' || status === 'Awaiting Payment' ? 'Pending' : status === 'refunded' ? 'Refunded' : status;

  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[status] || 'bg-gray-50 text-gray-500'}`}>
      {label}
    </span>
  );
};

export const ArtisanOrderManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, pending: 0, delivered: 0, returns: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
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
        alert('Order status updated successfully');
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
      result = result.filter(o => o.status === statusFilter);
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
    }

    return result;
  }, [orders, searchQuery, statusFilter, paymentFilter, dateFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Handlers ---
  const toggleSelection = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = (action: string) => {
    alert(`${action} ${selectedItems.length} orders`);
    setSelectedItems([]);
  };

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
                <OrderStatusBadge status={order.status} />
                <OrderStatusBadge status={order.paymentStatus} />
                {order.isVerified && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </Badge>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Placed on {new Date(order.createdAt).toLocaleString()} via {order.paymentMethod || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select 
                className="appearance-none bg-white border border-gray-200 rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10"
                value={order.status}
                onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Delivered">Delivered</option>
                <option value="Returned">Returned</option>
              </select>
              <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
            <Button variant="outline" leftIcon={Printer}>Print Invoice</Button>
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
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>ETB {(order.totalPrice - 150).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span>ETB 150</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-primary pt-3 border-t border-gray-200">
                    <span>Total Price (Paid by Tourist)</span>
                    <span>ETB {order.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-red-500 pt-2">
                    <span>Platform Fee (Admin Commission)</span>
                    <span>- ETB {(order.adminCommission || (order.totalPrice * 0.2)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-emerald-600 pt-3 border-t border-dashed border-gray-300">
                    <span>Artisan Earning (After Cut)</span>
                    <span>ETB {(order.artisanEarnings || (order.totalPrice * 0.8)).toLocaleString()}</span>
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
                         event.status === 'Shipped' ? <Truck className="w-4 h-4" /> :
                         event.status === 'Delivered' ? <CheckCircle2 className="w-4 h-4" /> :
                         <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-primary">{event.status}</p>
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

            {/* Communication Log */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-primary">Communication Log</h3>
                <Button size="sm" variant="outline" leftIcon={MessageSquare}>Send Message</Button>
              </div>
              <div className="space-y-4">
                {order.notes && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl rounded-tl-none">
                      <p className="text-xs font-bold text-amber-800 mb-1">Order Note</p>
                      <p className="text-sm text-amber-900">{order.notes}</p>
                    </div>
                  </div>
                )}
                <div className="text-center py-4 text-gray-400 text-sm italic">No other messages yet.</div>
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
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Billing Info</p>
                    <p className="text-sm text-primary mt-1">Same as shipping</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Management Actions */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-primary mb-2">Actions</h3>
              <Button className="w-full justify-start" variant="outline" leftIcon={Truck}>Add Tracking Number</Button>
              <Button className="w-full justify-start" variant="outline" leftIcon={RefreshCw}>Process Refund</Button>
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
          { label: 'Delivered', val: (stats.delivered || 0).toString(), icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
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
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {['All', 'Pending', 'Delivered', 'Returned'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === status ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          {/* Date Filter */}
          <div className="relative">
            <select 
              className="appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option>All Time</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-primary text-white p-4 rounded-2xl flex justify-between items-center animate-in slide-in-from-top-2">
          <span className="text-sm font-bold">{selectedItems.length} orders selected</span>
          <div className="flex gap-3">
            <button onClick={() => handleBulkAction('Mark Shipped')} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">Mark Shipped</button>
            <button onClick={() => setSelectedItems([])} className="px-4 py-1.5 text-white/60 hover:text-white text-xs font-bold">Cancel</button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedItems.length === paginatedOrders.length && paginatedOrders.length > 0}
                    onChange={() => setSelectedItems(selectedItems.length === paginatedOrders.length ? [] : paginatedOrders.map(o => o._id))}
                  />
                </th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Artisan Earning</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedOrders.map(order => (
                <tr key={order._id} className={`hover:bg-gray-50 transition-colors ${selectedItems.includes(order._id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedItems.includes(order._id)}
                      onChange={() => toggleSelection(order._id)}
                    />
                  </td>
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
                  <td className="px-6 py-4 font-bold text-primary">ETB {((order as any).artisanEarnings || (order.totalPrice * 0.8)).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600">Chapa</span>
                      <OrderStatusBadge status={order.paymentStatus} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <div className="relative">
                        <select 
                          className="appearance-none bg-gray-50 border-none rounded-xl py-1 pl-3 pr-8 text-[10px] font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10"
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Returned">Returned</option>
                        </select>
                        <RefreshCw className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-gray-400 pointer-events-none" />
                      </div>
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
