import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, 
  Package, Truck, AlertTriangle, BarChart2, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, MapPin, Calendar, Clock,
  RefreshCw, MousePointer, ShoppingCart, Eye, Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, BarChart, Bar, Legend, PieChart as RePieChart, 
  Pie, Cell, LineChart, Line
} from 'recharts';

// --- Components ---

const MetricCard: React.FC<{
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: any;
  color: string;
  subtext?: string;
  loading?: boolean;
}> = ({ title, value, trend, trendUp, icon: Icon, color, subtext, loading }) => (
  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow relative overflow-hidden">
    {loading && (
      <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )}
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
        {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trend}
      </div>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-primary mb-1">{value}</h3>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      {subtext && <p className="text-[10px] text-gray-400 mt-2">{subtext}</p>}
    </div>
  </div>
);

// --- Types ---
interface AnalyticsData {
  stats: {
    revenue: string;
    net: string;
    commission: string;
    refundRate: string;
    revenueTrend: string;
    netTrend: string;
    commTrend: string;
    refundTrend: string;
  };
  salesData: any[];
  bestSeller: {
    name: string;
    sold: number;
    revenue: number;
  } | null;
  categoryData: any[];
  customerInsights: {
    avgRating: string;
    totalReviews: number;
    returningRate: string;
  };
}

export const ArtisanAnalyticsManager: React.FC = () => {
  const [timeRange, setTimeRange] = useState('This Year');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/artisan/analytics?range=${encodeURIComponent(timeRange)}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [timeRange]);

  if (!data && loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-500 font-medium animate-pulse">Generating your business insights...</p>
      </div>
    );
  }

  const currentData = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Analytics & Insights</h1>
          <p className="text-gray-500 text-sm">Deep dive into your business performance and growth.</p>
        </div>
        <div className="relative">
          <select 
            className="appearance-none bg-white border border-gray-200 rounded-xl py-2.5 pl-4 pr-10 text-sm font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10 hover:border-primary/30 transition-colors"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="This Month">This Month</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Quarter">This Quarter</option>
            <option value="This Year">This Year</option>
            <option value="All Time">All Time</option>
          </select>
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* 1. Sales Analytics (Profit Insight) */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-500" /> Sales & Profitability
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Total Revenue" 
            value={currentData?.stats.revenue || 'ETB 0'} 
            trend={currentData?.stats.revenueTrend || '0%'} 
            trendUp={true} 
            icon={TrendingUp} 
            color="bg-emerald-500" 
            subtext="Gross sales before deductions"
            loading={loading}
          />
          <MetricCard 
            title="Net Earnings" 
            value={currentData?.stats.net || 'ETB 0'} 
            trend={currentData?.stats.netTrend || '0%'} 
            trendUp={true} 
            icon={DollarSign} 
            color="bg-blue-500" 
            subtext="After platform commission"
            loading={loading}
          />
          <MetricCard 
            title="Commission Paid" 
            value={currentData?.stats.commission || 'ETB 0'} 
            trend={currentData?.stats.commTrend || '0%'} 
            trendUp={false} 
            icon={PieChart} 
            color="bg-purple-500" 
            subtext="Platform fees & processing"
            loading={loading}
          />
          <MetricCard 
            title="Refund Rate" 
            value={currentData?.stats.refundRate || '0%'} 
            trend={currentData?.stats.refundTrend || '0%'} 
            trendUp={true} 
            icon={RefreshCw} 
            color="bg-amber-500" 
            subtext="Percentage of refunded orders"
            loading={loading}
          />
        </div>

        {/* Revenue vs Net Earnings Chart */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative">
          {loading && (
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-10 rounded-[32px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary">Revenue vs Net Earnings</h3>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Revenue</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Net Earnings</div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData?.salesData || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} tickFormatter={(value) => `ETB ${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`ETB ${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="netEarnings" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. Product Performance */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-500" /> Product Performance
          </h2>
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-10 rounded-[32px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            {currentData?.bestSeller ? (
              <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="p-3 bg-white rounded-xl shadow-sm"><TrendingUp className="w-6 h-6 text-emerald-500" /></div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Best Seller</p>
                  <h4 className="text-lg font-bold text-primary">{currentData.bestSeller.name}</h4>
                  <p className="text-sm text-gray-500">{currentData.bestSeller.sold} sold • ETB {currentData.bestSeller.revenue.toLocaleString()} revenue</p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No sales data for products in this period.</p>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-4">Inventory by Category</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={currentData?.categoryData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(currentData?.categoryData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Operational Performance & Customer Insights */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Customer Insights
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden">
                {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10" />}
                <p className="text-3xl font-bold text-primary">{currentData?.customerInsights.avgRating || '0.0'}</p>
                <p className="text-xs text-gray-400 font-bold uppercase">Avg Rating</p>
                <p className="text-[10px] text-gray-400 mt-1">From {currentData?.customerInsights.totalReviews || 0} reviews</p>
              </div>
              <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden">
                {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10" />}
                <p className="text-3xl font-bold text-primary">{currentData?.customerInsights.returningRate || '0%'}</p>
                <p className="text-xs text-gray-400 font-bold uppercase">Returning Rate</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative">
            {loading && (
              <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-10 rounded-[32px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" /> Business Health
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-bold text-gray-600">Total Orders</span>
                </div>
                <span className="text-lg font-bold text-primary">{(currentData?.salesData || []).reduce((acc, curr) => acc + (curr.orders || 0), 0)}</span>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-800 uppercase mb-2">Growth Tip</p>
                <p className="text-sm text-indigo-900 leading-relaxed">
                  You have <span className="font-bold">{currentData?.customerInsights.totalReviews} total reviews</span>. High-rated products with more reviews tend to sell 40% better. Encourage your buyers to leave feedback!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
