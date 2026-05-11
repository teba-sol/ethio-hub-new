import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, ShoppingCart, CreditCard, Star, Plus, 
  Edit3, Trash2, TrendingUp, Sparkles, Settings,
  Users, Box, AlertTriangle, Bell, FileText, 
  HelpCircle, Lightbulb, ArrowUpRight, CheckCircle2,
  Clock, Truck, XCircle, Eye, BarChart2, Filter,
  MessageSquare, DollarSign, RefreshCw, X
} from 'lucide-react';
import { Button, Badge, Input } from '../UI';
import { MOCK_PRODUCTS } from '../../data/constants';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { useAuth } from '../../context/AuthContext';

const DAILY_REVENUE = [
  { name: '00:00', sales: 400, orders: 1 },
  { name: '04:00', sales: 300, orders: 1 },
  { name: '08:00', sales: 1200, orders: 3 },
  { name: '12:00', sales: 2780, orders: 6 },
  { name: '16:00', sales: 1890, orders: 4 },
  { name: '20:00', sales: 2390, orders: 5 },
  { name: '23:59', sales: 1490, orders: 2 },
];

const WEEKLY_REVENUE = [
  { name: 'Mon', sales: 4000, orders: 12 },
  { name: 'Tue', sales: 3000, orders: 8 },
  { name: 'Wed', sales: 2000, orders: 5 },
  { name: 'Thu', sales: 2780, orders: 10 },
  { name: 'Fri', sales: 1890, orders: 7 },
  { name: 'Sat', sales: 2390, orders: 9 },
  { name: 'Sun', sales: 3490, orders: 11 },
];

const MONTHLY_REVENUE = [
  { name: 'Week 1', sales: 15000, orders: 45 },
  { name: 'Week 2', sales: 22000, orders: 62 },
  { name: 'Week 3', sales: 18000, orders: 51 },
  { name: 'Week 4', sales: 25000, orders: 70 },
];

const ORDER_STATUS_DATA = [
  { name: 'Pending', value: 5, color: '#f59e0b' },
  { name: 'Confirmed', value: 12, color: '#3b82f6' },
  { name: 'Shipped', value: 8, color: '#8b5cf6' },
  { name: 'Delivered', value: 45, color: '#10b981' },
  { name: 'Cancelled', value: 2, color: '#ef4444' },
];

const TOP_PRODUCTS = [
  { name: 'Handwoven Gabi', sales: 120, revenue: 12000, image: 'https://picsum.photos/seed/gabi/100/100' },
  { name: 'Traditional Jebena', sales: 85, revenue: 4250, image: 'https://picsum.photos/seed/jebena/100/100' },
  { name: 'Leather Wallet', sales: 60, revenue: 3000, image: 'https://picsum.photos/seed/wallet/100/100' },
];

const RECENT_ORDERS = [
  { id: '#ORD-7782', customer: 'Abebe K.', items: 2, total: 1500, status: 'Pending', date: '2 min ago' },
  { id: '#ORD-7781', customer: 'Sara M.', items: 1, total: 850, status: 'Confirmed', date: '1 hour ago' },
  { id: '#ORD-7780', customer: 'Dawit T.', items: 3, total: 2400, status: 'Shipped', date: '3 hours ago' },
  { id: '#ORD-7779', customer: 'Hana B.', items: 1, total: 450, status: 'Delivered', date: '1 day ago' },
];

const NOTIFICATIONS = [
  { id: 1, type: 'order', message: 'New order #ORD-7782 received', time: '2m ago' },
  { id: 2, type: 'review', message: '5-star review on "Woven Basket"', time: '1h ago' },
  { id: 3, type: 'stock', message: 'Low stock alert: Coffee Set (2 left)', time: '3h ago' },
  { id: 4, type: 'payout', message: 'Weekly payout of ETB 12,500 processed', time: '1d ago' },
];
const SupportForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/artisan/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
          userId: user?.id || 'anonymous',
          userName: user?.name || 'Anonymous User',
          userEmail: user?.email || ''
        })
      });
      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
        setSubject('');
        setMessage('');
        setTimeout(() => {
          onSuccess();
          setSubmitted(false);
        }, 2000);
      } else {
        alert(data.message || 'Failed to submit support ticket');
      }
    } catch (error: any) {
      console.error('Support ticket error:', error);
      alert(`Error: ${error.message || 'An error occurred while submitting your ticket'}`);
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h4 className="text-2xl font-serif font-bold text-primary">Message Sent!</h4>
        <p className="text-gray-500">Our support team will get back to you via email shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Subject</label>
        <Input 
          placeholder="How can we help?" 
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Message</label>
        <textarea 
          className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary h-32 text-sm" 
          placeholder="Describe your issue..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        ></textarea>
      </div>
      <Button className="w-full" type="submit" disabled={sending}>
        {sending ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
};

export const ArtisanOverview: React.FC<{ onAddProduct: () => void; disableCreate?: boolean }> = ({ onAddProduct, disableCreate = false }) => {
  const router = useRouter();
  const navigate = (to: string) => router.push(to);
  const [showSupport, setShowSupport] = useState(false);
  const [showSalesTips, setShowSalesTips] = useState(false);
  const [revenueRange, setRevenueRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStock: 0,
    avgRating: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>(WEEKLY_REVENUE);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [customerInsights, setCustomerInsights] = useState({ returning: 0, new: 0 });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/artisan/dashboard/overview');
        const result = await res.json();
        if (result.success) {
          setStats(result.data.stats);
          if (result.data.chartData?.length > 0) {
            setRevenueData(result.data.chartData);
          }
          setRecentOrders(result.data.recentOrders || []);
          setOrderStatus(result.data.orderStatus || []);
          setTopProducts(result.data.topProducts || []);
          setNotifications(result.data.notifications || []);
          setTopCustomers(result.data.topCustomers || []);
          if (result.data.customerInsights) {
            setCustomerInsights(result.data.customerInsights);
          }
        }
      } catch (err) {
        console.error('Error fetching artisan stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const salesTips = [
    "High-quality photos increase sales by 40%. Use natural light!",
    "Detailed descriptions help customers find your products in search.",
    "Respond to orders within 24 hours to build trust.",
    "Offer limited-time discounts to clear old stock.",
    "Share your artisan story; customers love the human connection."
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Artisan Studio</h1>
          <p className="text-gray-500 text-sm">Manage your craft business.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button leftIcon={Plus} onClick={onAddProduct} disabled={disableCreate}>Add New Artifact</Button>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        <button onClick={() => navigate('/dashboard/artisan/products/create')} disabled={disableCreate} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all whitespace-nowrap group disabled:cursor-not-allowed disabled:opacity-60">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></div>
          <span className="text-sm font-bold text-primary">Add New Product</span>
        </button>
        <button onClick={() => navigate('/dashboard/artisan/orders')} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all whitespace-nowrap group">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><ShoppingCart className="w-4 h-4" /></div>
          <span className="text-sm font-bold text-primary">View All Orders</span>
        </button>
        <button onClick={() => navigate('/dashboard/artisan/reviews')} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all whitespace-nowrap group">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><Star className="w-4 h-4" /></div>
          <span className="text-sm font-bold text-primary">Check Reviews</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Products', val: stats.totalProducts.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Orders', val: stats.totalOrders.toString(), icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Earned', val: stats.totalRevenue >= 1000 ? `ETB ${(stats.totalRevenue / 1000).toFixed(1)}k` : `ETB ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Pending Orders', val: stats.pendingOrders.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Low Stock', val: stats.lowStock.toString(), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Avg Rating', val: stats.avgRating.toString(), icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className={`p-2 ${stat.bg} rounded-xl`}><stat.icon className={`w-4 h-4 ${stat.color}`} /></div>
              {i === 4 && stats.lowStock > 0 && <span className="flex h-2 w-2 rounded-full bg-red-500"></span>}
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stat.val}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Revenue Chart */}
          <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-600" /> Revenue Trends</h3>
              <div className="flex gap-2">
                {['Daily', 'Weekly', 'Monthly'].map((t) => (
                  <button 
                    key={t} 
                    onClick={() => setRevenueRange(t as any)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${revenueRange === t ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Order Status & Recent Orders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Status Breakdown */}
            <section className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
              <h4 className="font-bold text-primary mb-4">Order Status</h4>
              <div className="flex items-center justify-center h-48">
                {orderStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {orderStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '10px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-400 text-xs italic">No order data available</div>
                )}
              </div>
            </section>

            {/* Recent Orders List */}
            <section className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-primary">Recent Orders</h4>
                <button className="text-xs text-emerald-600 font-bold hover:underline" onClick={() => navigate('/dashboard/artisan/orders')}>View All</button>
              </div>
              <div className="space-y-3">
                {recentOrders.length > 0 ? recentOrders.map((order, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/artisan/orders?id=${order.id.replace('#','')}`)}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-gray-100"><Box className="w-4 h-4 text-primary" /></div>
                      <div>
                        <p className="text-xs font-bold text-primary">{order.id}</p>
                        <p className="text-[10px] text-gray-500">{order.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">ETB {order.total}</p>
                      <Badge variant={order.status === 'Pending' ? 'warning' : order.status === 'Delivered' ? 'success' : 'info'} size="sm">{order.status}</Badge>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center text-gray-400 text-xs">No recent orders</div>
                )}
              </div>
            </section>
          </div>

          {/* Top Selling Products */}
          <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-primary mb-6">Top Selling Artifacts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-4 rounded-l-xl">Product</th>
                    <th className="px-6 py-4">Sales</th>
                    <th className="px-6 py-4">Revenue</th>
                    <th className="px-6 py-4 rounded-r-xl text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topProducts.length > 0 ? topProducts.map((prod, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={prod.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          <span className="font-bold text-primary">{prod.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{prod.sales} sold</td>
                      <td className="px-6 py-4 font-bold text-primary">ETB {prod.revenue}</td>
                      <td className="px-6 py-4 text-right"><TrendingUp className="w-4 h-4 text-emerald-500 inline" /></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-xs italic">No product performance data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column (Sidebar) */}
        <aside className="space-y-8">
          {/* Notifications Panel */}
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-serif font-bold text-primary">Latest Alerts</h3>
              <button className="text-xs font-bold text-secondary hover:underline">Clear</button>
            </div>
            <div className="space-y-4">
              {notifications.length > 0 ? notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => {
                    switch (notif.type) {
                      case 'order': navigate('/dashboard/artisan/orders'); break;
                      case 'review': navigate('/dashboard/artisan/reviews'); break;
                      case 'stock': navigate('/dashboard/artisan/products'); break;
                      case 'payout': navigate('/dashboard/artisan/wallet'); break;
                    }
                  }}
                  className="flex gap-3 items-start p-3 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors group"
                >
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${notif.type === 'order' ? 'bg-blue-500' : notif.type === 'review' ? 'bg-amber-500' : notif.type === 'stock' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                  <div>
                    <p className="text-sm font-bold text-primary leading-tight group-hover:text-blue-600 transition-colors">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center text-gray-400 text-xs italic">No new alerts</div>
              )}
            </div>
          </div>

          {/* Customer Insights */}
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-primary mb-6">Customer Insights</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                  <span>Returning</span>
                  <span>New</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-purple-500" style={{ width: `${customerInsights.returning}%` }}></div>
                  <div className="h-full bg-emerald-500" style={{ width: `${customerInsights.new}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-bold text-primary mt-1">
                  <span>{customerInsights.returning}%</span>
                  <span>{customerInsights.new}%</span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-primary mb-3">Top Customers</h4>
                {topCustomers.length > 0 ? topCustomers.map((c, i) => (
                  <div key={i} className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-primary border border-gray-200">{c.avatar}</div>
                      <div>
                        <p className="text-xs font-bold text-gray-600">{c.name}</p>
                        <p className="text-[10px] text-gray-400">{c.orders} orders</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary">ETB {c.spent.toLocaleString()}</span>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-400 text-[10px] italic">No customer data yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Product Performance */}
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-primary mb-6">Performance</h3>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700 uppercase">Best Rated</span>
                </div>
                <p className="font-bold text-primary">Handwoven Gabi</p>
                <p className="text-xs text-gray-500">4.9 Average (120 reviews)</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-700 uppercase">Most Viewed</span>
                </div>
                <p className="font-bold text-primary">Traditional Jebena</p>
                <p className="text-xs text-gray-500">1.5k Views this week</p>
              </div>
            </div>
          </div>

          {/* Support / Help */}
          <div className="bg-gradient-to-br from-ethio-black to-gray-800 p-8 rounded-[40px] text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-serif font-bold">Need Help?</h3>
              <p className="text-sm text-white/80">Get tips to boost your sales and manage your shop effectively.</p>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowSupport(true)}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors backdrop-blur-sm"
                >
                  <HelpCircle className="w-4 h-4" /> Contact Support
                </button>
                <button 
                  onClick={() => setShowSalesTips(true)}
                  className="w-full py-3 bg-white text-primary rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                >
                  <Lightbulb className="w-4 h-4" /> Sales Tips
                </button>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
          </div>
        </aside>
      </div>

      {/* Support Modal */}
      {showSupport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSupport(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8 space-y-6 animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold text-primary">Contact Support</h3>
              <button onClick={() => setShowSupport(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-500 text-sm">Need help with your artisan studio? Send us a message and we'll get back to you shortly.</p>
            <SupportForm onSuccess={() => setShowSupport(false)} />
          </div>
        </div>
      )}

      {/* Sales Tips Modal */}
      {showSalesTips && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                <Lightbulb className="w-6 h-6" />
              </div>
              <button onClick={() => setShowSalesTips(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary mb-2">Sales Tips</h3>
            <p className="text-gray-500 mb-6">Boost your shop's performance with these expert tips.</p>
            <div className="space-y-3 mb-8">
              {salesTips.map((tip, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={() => setShowSalesTips(false)}>Got it!</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ArtisanMyProductsView: React.FC<{ onAddProduct: () => void; disableCreate?: boolean }> = ({ onAddProduct, disableCreate = false }) => (
  <div className="space-y-8">
    <div className="flex justify-between items-center"><h2 className="text-2xl font-serif font-bold text-primary">My Collections</h2><Button leftIcon={Plus} size="sm" onClick={onAddProduct} disabled={disableCreate}>Add Item</Button></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {MOCK_PRODUCTS.slice(0, 3).map(p => (
        <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm group">
          <div className="h-40 overflow-hidden"><img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" /></div>
          <div className="p-6"><h3 className="font-bold text-primary mb-1">{p.name}</h3><p className="text-xs text-gray-400 mb-4">${p.price}</p><div className="flex justify-between items-center"><Badge variant="success">Active</Badge><div className="flex space-x-2"><button className="p-2 text-gray-400 hover:text-primary"><Edit3 className="w-4 h-4" /></button><button className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div></div></div>
        </div>
      ))}
    </div>
  </div>
);



export const ArtisanOrdersView: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-serif font-bold text-primary">Customer Orders</h2>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto"><table className="w-full text-left text-sm min-w-[600px]"><thead className="bg-gray-50"><tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest"><th className="px-6 py-4">Order ID</th><th className="px-6 py-4">Item</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-gray-50">{[1, 2].map(i => (<tr key={i} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-4 font-mono text-[11px] font-bold text-gray-400">#ORD-55{i}</td><td className="px-6 py-4 font-bold text-primary">Traditional Jebena</td><td className="px-6 py-4"><Badge variant="info">Ready to Ship</Badge></td><td className="px-6 py-4 text-right"><Button size="sm" variant="outline">Print Label</Button></td></tr>))}</tbody></table></div>
  </div>
);
