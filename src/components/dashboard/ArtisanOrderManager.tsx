import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, ChevronLeft, ChevronRight, 
  Eye, CheckCircle2, XCircle, Clock, Truck, Package, 
  AlertCircle, DollarSign, Calendar, User, MapPin, 
  MessageSquare, FileText, MoreVertical, Printer, 
  ArrowUpRight, RefreshCw, ShieldCheck, Mail
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
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    avatar: string;
    totalSpent: number;
    lastOrderDate: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  fulfillmentStatus: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
  orderDate: string;
  timeline: OrderTimelineEvent[];
  notes?: string;
  trackingNumber?: string;
  isVerified: boolean;
}

// --- Mock Data ---
const MOCK_ORDERS_DATA: Order[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `#ORD-${7800 + i}`,
  customer: {
    name: i % 2 === 0 ? 'Abebe Kebede' : 'Sara Tesfaye',
    email: i % 2 === 0 ? 'abebe@example.com' : 'sara@example.com',
    phone: '+251 911 234 567',
    avatar: `https://ui-avatars.com/api/?name=${i % 2 === 0 ? 'Abebe+Kebede' : 'Sara+Tesfaye'}&background=random`,
    totalSpent: 15000 + (i * 1000),
    lastOrderDate: new Date(Date.now() - (i + 5) * 86400000).toISOString()
  },
  shippingAddress: {
    street: 'Bole Road, House 123',
    city: 'Addis Ababa',
    region: 'Addis Ababa',
    postalCode: '1000',
    country: 'Ethiopia'
  },
  items: [
    {
      id: `item-${i}-1`,
      productName: i % 2 === 0 ? 'Handwoven Gabi' : 'Traditional Coffee Set',
      productImage: i % 2 === 0 ? 'https://picsum.photos/seed/gabi/100/100' : 'https://picsum.photos/seed/coffee/100/100',
      quantity: i % 3 === 0 ? 2 : 1,
      price: i % 2 === 0 ? 2500 : 1800,
      sku: `ETH-${2024000 + i}`
    }
  ],
  total: (i % 3 === 0 ? 2 : 1) * (i % 2 === 0 ? 2500 : 1800) + 150, // + shipping
  paymentMethod: i % 3 === 0 ? 'Credit Card' : 'Mobile Money',
  paymentStatus: i === 0 ? 'Pending' : i === 4 ? 'Refunded' : 'Paid',
  fulfillmentStatus: i === 0 ? 'Pending' : i === 1 ? 'Processing' : i === 2 ? 'Shipped' : i === 4 ? 'Returned' : 'Delivered',
  orderDate: new Date(Date.now() - i * 86400000 * 0.5).toISOString(),
  timeline: [
    { status: 'Order Placed', date: new Date(Date.now() - i * 86400000 * 0.5).toISOString() },
    ...(i > 0 ? [{ status: 'Payment Confirmed', date: new Date(Date.now() - i * 86400000 * 0.5 + 3600000).toISOString() }] : []),
    ...(i > 1 ? [{ status: 'Shipped', date: new Date(Date.now() - i * 86400000 * 0.5 + 86400000).toISOString(), note: 'Via DHL Express' }] : []),
    ...(i > 2 && i !== 4 ? [{ status: 'Delivered', date: new Date(Date.now() - i * 86400000 * 0.5 + 172800000).toISOString() }] : [])
  ],
  notes: i === 2 ? 'Customer requested gift wrapping.' : undefined,
  trackingNumber: i > 1 ? 'TRK-883920192' : undefined,
  isVerified: i % 3 !== 0
}));

// --- Components ---

const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'Pending': 'bg-amber-50 text-amber-600 border-amber-100',
    'Processing': 'bg-blue-50 text-blue-600 border-blue-100',
    'Shipped': 'bg-purple-50 text-purple-600 border-purple-100',
    'Delivered': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Cancelled': 'bg-red-50 text-red-600 border-red-100',
    'Returned': 'bg-gray-50 text-gray-600 border-gray-100',
    'Paid': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Refunded': 'bg-red-50 text-red-600 border-red-100'
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[status] || 'bg-gray-50 text-gray-500'}`}>
      {status}
    </span>
  );
};

export const ArtisanOrderManager: React.FC = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- Derived State ---
  const filteredOrders = useMemo(() => {
    let result = [...MOCK_ORDERS_DATA];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.customer.name.toLowerCase().includes(q) ||
        o.items.some(i => i.productName.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(o => o.fulfillmentStatus === statusFilter);
    }

    if (paymentFilter !== 'All') {
      result = result.filter(o => o.paymentStatus === paymentFilter);
    }

    const now = new Date();
    if (dateFilter === 'Today') {
      result = result.filter(o => new Date(o.orderDate).toDateString() === now.toDateString());
    } else if (dateFilter === 'This Week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(o => new Date(o.orderDate) >= weekAgo);
    } else if (dateFilter === 'This Month') {
      result = result.filter(o => {
        const d = new Date(o.orderDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }

    return result;
  }, [searchQuery, statusFilter, paymentFilter, dateFilter]);

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
    const order = MOCK_ORDERS_DATA.find(o => o.id === selectedOrderId);
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
                <h1 className="text-3xl font-serif font-bold text-primary">{order.id}</h1>
                <OrderStatusBadge status={order.fulfillmentStatus} />
                <OrderStatusBadge status={order.paymentStatus} />
                {order.isVerified && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </Badge>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Placed on {new Date(order.orderDate).toLocaleString()} via {order.paymentMethod}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" leftIcon={Printer}>Print Invoice</Button>
            <Button leftIcon={Truck}>Mark as Shipped</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Order Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Order Items */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-primary mb-6">Order Items</h3>
              <div className="space-y-6">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                    <img src={item.productImage} className="w-20 h-20 rounded-xl object-cover bg-gray-100" alt="" />
                    <div className="flex-1">
                      <h4 className="font-bold text-primary">{item.productName}</h4>
                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary">Qty: {item.quantity}</Badge>
                        <span className="font-bold text-primary">ETB {item.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">ETB {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                <div className="bg-gray-50 p-6 rounded-2xl space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>ETB {(order.total - 150).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span>ETB 150</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-primary pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span>ETB {order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-primary mb-6">Order Timeline</h3>
              <div className="space-y-8 relative pl-4">
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100"></div>
                {order.timeline.map((event, idx) => (
                  <div key={idx} className="relative flex gap-6 items-start">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white ${idx === order.timeline.length - 1 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
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
                ))}
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
                <img src={order.customer.avatar} className="w-16 h-16 rounded-2xl bg-gray-100" alt="" />
                <div>
                  <h4 className="font-bold text-primary">{order.customer.name}</h4>
                  <p className="text-xs text-gray-500">{order.customer.email}</p>
                  <p className="text-xs text-gray-500">{order.customer.phone}</p>
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-gray-50">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Shipping Address</p>
                    <p className="text-sm text-primary mt-1">
                      {order.shippingAddress.street}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.region}<br />
                      {order.shippingAddress.country}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCardIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Billing Info</p>
                    <p className="text-sm text-primary mt-1">Same as shipping</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-50">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-500">Total Spent</span>
                  <span className="font-bold text-primary">ETB {order.customer.totalSpent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Last Order</span>
                  <span className="font-bold text-primary">{new Date(order.customer.lastOrderDate).toLocaleDateString()}</span>
                </div>
              </div>
            </section>

            {/* Management Actions */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-primary mb-2">Actions</h3>
              <Button className="w-full justify-start" variant="outline" leftIcon={Truck}>Add Tracking Number</Button>
              <Button className="w-full justify-start" variant="outline" leftIcon={RefreshCw}>Process Refund</Button>
              <Button className="w-full justify-start text-red-500 hover:bg-red-50 hover:border-red-100" variant="outline" leftIcon={XCircle}>Cancel Order</Button>
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
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={Download}>Export CSV</Button>
        </div>
      </div>

      {/* Analytics Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', val: '156', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', val: '5', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'To Ship', val: '12', icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Returns', val: '2', icon: RefreshCw, color: 'text-red-600', bg: 'bg-red-50' },
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
            {['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled', 'Returned'].map(status => (
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
          {/* Payment Filter */}
          <div className="relative">
            <select 
              className="appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
            </select>
            <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>

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
            <button onClick={() => handleBulkAction('Export')} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">Export</button>
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
                    onChange={() => setSelectedItems(selectedItems.length === paginatedOrders.length ? [] : paginatedOrders.map(o => o.id))}
                  />
                </th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Fulfillment</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedOrders.map(order => (
                <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${selectedItems.includes(order.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedItems.includes(order.id)}
                      onChange={() => toggleSelection(order.id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-primary">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">{order.customer.name.charAt(0)}</div>
                      <span className="font-bold text-gray-700">{order.customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {order.items.length} items
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">ETB {order.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600">{order.paymentMethod}</span>
                      <OrderStatusBadge status={order.paymentStatus} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <OrderStatusBadge status={order.fulfillmentStatus} />
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setSelectedOrderId(order.id)}>Manage</Button>
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
