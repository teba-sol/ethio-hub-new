import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Package, DollarSign, AlertCircle, 
  TrendingUp, Activity, ShieldCheck, UserCheck, CreditCard,
  Flag, MessageSquare, ShoppingCart, Ticket, ArrowUpRight,
  ArrowDownLeft, Clock, Server, CheckCircle2, XCircle,
  Download, Settings, Palette, Globe, BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { Button, Badge } from '@/components/UI';
import { useRouter } from 'next/navigation';

// --- Types ---
interface DashboardData {
  userStats: {
    total: number;
    admin: number;
    organizer: number;
    artisan: number;
    tourist: number;
  };
  eventStats: {
    total: number;
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
  };
  revenueData: {
    grossTotal: number;
    refundTotal: number;
    totalTransactions: number;
    cancellationRate: number;
  };
  verificationStats: {
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
  };
    pendingItems: {
      events: Array<{ id: string; name: string; submitter: string; date: string }>;
      products: { count: number };
      verifications: Array<{ id: string; name: string; role: string; date: string; avatar: string }>;
      reports: Array<{ id: string; type: string; message: string; time: string }>;
    };
    recentActivity: {
      users: Array<{ id: string; name: string; role: string; date: string }>;
      orders: Array<{ id: string; buyerName: string; amount: number; date: string }>;
      bookings: Array<{ id: string; touristName: string; eventName: string; amount: number; date: string }>;
    };
    charts: {
      revenue: Array<{ name: string; revenue: number; commission: number }>;
      userGrowth: Array<{ name: string; tourists: number; artisans: number; organizers: number }>;
    };
  }

// --- Components ---

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  subValue?: string;
  trend?: string; 
  trendUp?: boolean; 
  icon: any; 
  color: string;
}> = ({ title, value, subValue, trend, trendUp, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      {subValue && <p className="text-xs text-gray-500 font-medium">{subValue}</p>}
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">{title}</p>
    </div>
  </div>
);

const SectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex justify-between items-end mb-6">
    <div>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// Format date to relative time
const getRelativeTime = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
};

export const AdminOverviewPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('30days');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/dashboard/overview', {
          credentials: 'include',
        });
        const result = await res.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || 'Failed to fetch data');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Error loading dashboard</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const { userStats, eventStats, revenueData, verificationStats, pendingItems, recentActivity, charts } = data || {};

  // Chart data from API or defaults
  const REVENUE_DATA = charts?.revenue || [
    { name: 'No Data', revenue: 0, commission: 0 },
  ];

  const USER_GROWTH_DATA = charts?.userGrowth || [
    { name: 'No Data', tourists: 0, artisans: 0, organizers: 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Global Filter */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800">System Overview</h1>
          <p className="text-gray-500 text-sm">Real-time monitoring and platform control center.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={Download}
              onClick={() => router.push('/dashboard/admin/reports')}
            >
              Report
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              leftIcon={Settings}
              onClick={() => router.push('/dashboard/admin/settings')}
            >
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* 0. User Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[24px] text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <Users className="w-24 h-24" />
           </div>
           <div className="relative z-10">
             <div className="flex justify-between items-start mb-6">
               <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                 <Users className="w-6 h-6 text-white" />
               </div>
               <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/10">+12%</span>
             </div>
             <h3 className="text-4xl font-bold mb-1">{userStats?.total?.toLocaleString() || '0'}</h3>
             <p className="text-indigo-100 text-sm font-medium">Total Active Users</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-all">
           <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform"></div>
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                 <Globe className="w-5 h-5" />
               </div>
               <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tourists</span>
             </div>
             <h3 className="text-3xl font-bold text-gray-800">{userStats?.tourist?.toLocaleString() || '0'}</h3>
             <p className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
               <ArrowUpRight className="w-3 h-3" /> Active
             </p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-all">
           <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform"></div>
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                 <Palette className="w-5 h-5" />
               </div>
               <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Artisans</span>
             </div>
             <h3 className="text-3xl font-bold text-gray-800">{userStats?.artisan?.toLocaleString() || '0'}</h3>
             <p className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
               <ArrowUpRight className="w-3 h-3" /> {verificationStats?.pending || 0} pending
             </p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-all">
           <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-110 transition-transform"></div>
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                 <Calendar className="w-5 h-5" />
               </div>
               <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Organizers</span>
             </div>
             <h3 className="text-3xl font-bold text-gray-800">{userStats?.organizer?.toLocaleString() || '0'}</h3>
             <p className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
               <ArrowUpRight className="w-3 h-3" /> {eventStats?.pending || 0} pending
             </p>
           </div>
        </div>
      </div>

      {/* 1. Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Revenue Card */}
          <div className="md:col-span-2 bg-gray-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20 group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <TrendingUp className="w-48 h-48" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                    <DollarSign className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-right">
                    <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-1">+12.5%</Badge>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Growth</p>
                  </div>
                </div>
                <h3 className="text-5xl font-bold mb-2 tracking-tight">ETB {(revenueData?.grossTotal || 0).toLocaleString()}</h3>
                <p className="text-gray-400 font-medium">Total Platform Gross Revenue</p>
              </div>
              
              <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Transactions</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-emerald-400">{(revenueData as any)?.totalTransactions || 0}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Avg Transaction Value</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-blue-400">
                      ETB {revenueData?.grossTotal && (revenueData as any)?.totalTransactions ? Math.round(revenueData.grossTotal / (revenueData as any).totalTransactions).toLocaleString() : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Stats Column */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-center mb-4">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <Badge variant="warning" size="sm">Due Soon</Badge>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending Payouts</p>
              <h4 className="text-2xl font-bold text-gray-800">ETB 125,000</h4>
              <p className="text-xs text-gray-500 mt-1 font-medium">12 Requests waiting</p>
            </div>

            <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-center mb-4">
                <div className="p-3 bg-red-50 rounded-xl text-red-600 group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-red-500 font-bold">Live</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Refund Volume</p>
              <h4 className="text-2xl font-bold text-gray-800">ETB {(revenueData?.refundTotal || 0).toLocaleString()}</h4>
              <p className="text-xs text-gray-500 mt-1 font-medium">Total processed refunds</p>
            </div>
          </div>
        </div>

        {/* Verification Card */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-4 border-t-primary">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <Badge variant="warning" className="animate-pulse">Action Required</Badge>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">Verifications</h3>
            <p className="text-xs text-gray-500 mb-6">{verificationStats?.pending || 0} new users need approval</p>
            
            <div className="space-y-4 mb-6">
              {(pendingItems?.verifications || []).slice(0, 3).map((user: any) => (
                <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group" onClick={() => router.push('/dashboard/admin/verification-moderation')}>
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{user.role} • {getRelativeTime(user.date)}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </div>
          <Button size="md" className="w-full rounded-2xl shadow-lg shadow-primary/20" onClick={() => router.push('/dashboard/admin/verification-moderation')}>Go to Verification</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Revenue & Commission Analytics */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <SectionHeader 
            title="Revenue vs Commission" 
            subtitle="Financial performance breakdown"
            action={
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Revenue</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Commission</div>
              </div>
            }
          />
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`ETB ${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="commission" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCom)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Live Activity Feed */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <SectionHeader title="Live Activity" subtitle="Real-time platform updates" />
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {/* Recent Users */}
            {(recentActivity?.users || []).slice(0, 2).map((user: any) => (
              <div key={user.id} className="flex gap-4 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-gray-100 group-hover:border-primary/20 transition-colors">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="absolute top-10 bottom-[-24px] left-1/2 w-px bg-gray-100 -translate-x-1/2 last:hidden"></div>
                </div>
                <div className="pb-6">
                  <p className="text-sm font-bold text-gray-800">New {user.role}</p>
                  <p className="text-xs text-gray-500 mt-1">"{user.name}" registered</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-2">{getRelativeTime(user.date)}</p>
                </div>
              </div>
            ))}
            {/* Recent Bookings */}
            {(recentActivity?.bookings || []).slice(0, 2).map((booking: any) => (
              <div key={booking.id} className="flex gap-4 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-gray-100 group-hover:border-primary/20 transition-colors">
                    <Ticket className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="absolute top-10 bottom-[-24px] left-1/2 w-px bg-gray-100 -translate-x-1/2 last:hidden"></div>
                </div>
                <div className="pb-6">
                  <p className="text-sm font-bold text-gray-800">Booking</p>
                  <p className="text-xs text-gray-500 mt-1">"{booking.eventName}" by {booking.touristName}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-2">{getRelativeTime(booking.date)}</p>
                </div>
              </div>
            ))}
            {/* Recent Orders */}
            {(recentActivity?.orders || []).slice(0, 1).map((order: any) => (
              <div key={order.id} className="flex gap-4 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-gray-100 group-hover:border-primary/20 transition-colors">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Order</p>
                  <p className="text-xs text-gray-500 mt-1">ETB {order.amount} by {order.buyerName}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-2">{getRelativeTime(order.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Transactions & Platform Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><ShoppingCart className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-400 uppercase">Total Orders</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{(revenueData?.totalOrders || 0).toLocaleString()}</p>
          <p className="text-xs text-emerald-500 font-bold mt-1">+12% this week</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Ticket className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-400 uppercase">Events</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{eventStats?.approved || 0}</p>
          <p className="text-xs text-emerald-500 font-bold mt-1">{eventStats?.pending || 0} pending review</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Activity className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-400 uppercase">Avg Order Value</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">ETB {revenueData?.grossTotal && revenueData?.totalOrders ? Math.round(revenueData.grossTotal / revenueData.totalOrders).toLocaleString() : 0}</p>
          <p className="text-xs text-gray-500 font-bold mt-1">Per transaction</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg text-red-600"><XCircle className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-400 uppercase">Cancellation Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{(revenueData?.cancellationRate || 0).toFixed(1)}%</p>
          <p className="text-xs text-gray-500 font-bold mt-1">Based on total orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 5. User Growth */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <SectionHeader 
            title="User Growth" 
            subtitle="New registrations by user type"
          />
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={USER_GROWTH_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="tourists" name="Tourists" fill="#3b82f6" stackId="a" radius={[0, 0, 4, 4]} />
                <Bar dataKey="artisans" name="Artisans" fill="#10b981" stackId="a" />
                <Bar dataKey="organizers" name="Organizers" fill="#8b5cf6" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Approval & Moderation Panel */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <SectionHeader title="Moderation Queue" subtitle="Pending items requiring action" />
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center p-4 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer hover:bg-amber-100/50 transition-colors" onClick={() => router.push('/dashboard/admin/management')}>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-amber-900">Pending Events</span>
              </div>
              <Badge variant="warning">{eventStats?.pending || 0}</Badge>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-100/50 transition-colors" onClick={() => router.push('/dashboard/admin/products')}>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-blue-900">New Products</span>
              </div>
              <Badge variant="secondary">{pendingItems?.products?.count || 0}</Badge>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100 cursor-pointer hover:bg-red-100/50 transition-colors" onClick={() => router.push('/dashboard/admin/reports')}>
              <div className="flex items-center gap-3">
                <Flag className="w-5 h-5 text-red-600" />
                <span className="font-bold text-red-900">Active Reports</span>
              </div>
              <Badge variant="error">{pendingItems?.reports?.length || 0}</Badge>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => router.push('/dashboard/admin/verification-moderation')}>
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-gray-600" />
                <span className="font-bold text-gray-900">Verification Requests</span>
              </div>
              <Badge variant="secondary">{verificationStats?.pending || 0}</Badge>
            </div>
          </div>
          <Button className="w-full mt-6" onClick={() => router.push('/dashboard/admin/management')}>Go to Moderation Center</Button>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
