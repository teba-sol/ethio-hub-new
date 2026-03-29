import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, 
  Package, Truck, AlertTriangle, BarChart2, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, MapPin, Calendar, Clock,
  RefreshCw, MousePointer, ShoppingCart, Eye
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
}> = ({ title, value, trend, trendUp, icon: Icon, color, subtext }) => (
  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
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

// --- Mock Data ---

const ANALYTICS_DATA_MAP = {
  'This Month': {
    revenue: 'ETB 145,200',
    net: 'ETB 123,420',
    commission: 'ETB 21,780',
    refundRate: '1.1%',
    revenueTrend: '+12.5%',
    netTrend: '+11.2%',
    commTrend: '+8.4%',
    refundTrend: '-0.2%',
    salesData: Array.from({ length: 30 }).map((_, i) => ({
      month: `Day ${i + 1}`,
      revenue: Math.floor(Math.random() * 6000) + 3000,
      orders: Math.floor(Math.random() * 15) + 5,
      netEarnings: Math.floor(Math.random() * 5000) + 2500,
    }))
  },
  'This Year': {
    revenue: 'ETB 1,850,000',
    net: 'ETB 1,572,500',
    commission: 'ETB 277,500',
    refundRate: '1.4%',
    revenueTrend: '+15.8%',
    netTrend: '+14.2%',
    commTrend: '+12.4%',
    refundTrend: '+0.1%',
    salesData: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => ({
      month: m,
      revenue: Math.floor(Math.random() * 200000) + 100000,
      orders: Math.floor(Math.random() * 500) + 200,
      netEarnings: Math.floor(Math.random() * 170000) + 80000,
    }))
  },
  'Last 30 Days': {
    revenue: 'ETB 138,500',
    net: 'ETB 117,725',
    commission: 'ETB 20,775',
    refundRate: '1.2%',
    revenueTrend: '+10.2%',
    netTrend: '+9.5%',
    commTrend: '+7.2%',
    refundTrend: '-0.1%',
    salesData: Array.from({ length: 30 }).map((_, i) => ({
      month: `Day ${i + 1}`,
      revenue: Math.floor(Math.random() * 5500) + 2800,
      orders: Math.floor(Math.random() * 12) + 4,
      netEarnings: Math.floor(Math.random() * 4800) + 2400,
    }))
  },
  'This Quarter': {
    revenue: 'ETB 450,000',
    net: 'ETB 382,500',
    commission: 'ETB 67,500',
    refundRate: '1.3%',
    revenueTrend: '+8.5%',
    netTrend: '+7.2%',
    commTrend: '+6.4%',
    refundTrend: '+0.2%',
    salesData: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'].map(w => ({
      month: w,
      revenue: Math.floor(Math.random() * 50000) + 30000,
      orders: Math.floor(Math.random() * 100) + 50,
      netEarnings: Math.floor(Math.random() * 42000) + 25000,
    }))
  },
  'All Time': {
    revenue: 'ETB 4,250,000',
    net: 'ETB 3,612,500',
    commission: 'ETB 637,500',
    refundRate: '1.5%',
    revenueTrend: '+24.2%',
    netTrend: '+22.5%',
    commTrend: '+20.4%',
    refundTrend: '+0.3%',
    salesData: ['2022', '2023', '2024', '2025', '2026'].map(y => ({
      month: y,
      revenue: Math.floor(Math.random() * 1200000) + 800000,
      orders: Math.floor(Math.random() * 3000) + 1500,
      netEarnings: Math.floor(Math.random() * 1000000) + 700000,
    }))
  }
};

const CATEGORY_DATA = [
  { name: 'Textiles', value: 45000, color: '#8b5cf6' },
  { name: 'Pottery', value: 28000, color: '#ec4899' },
  { name: 'Jewelry', value: 15000, color: '#f59e0b' },
  { name: 'Leather', value: 12000, color: '#10b981' },
];

const CUSTOMER_LOCATION_DATA = [
  { name: 'Addis Ababa', value: 45 },
  { name: 'USA', value: 25 },
  { name: 'Europe', value: 20 },
  { name: 'Other', value: 10 },
];

const DAY_OF_WEEK_DATA = [
  { day: 'Mon', sales: 12000 },
  { day: 'Tue', sales: 9000 },
  { day: 'Wed', sales: 15000 },
  { day: 'Thu', sales: 18000 },
  { day: 'Fri', sales: 25000 },
  { day: 'Sat', sales: 32000 },
  { day: 'Sun', sales: 28000 },
];

export const ArtisanAnalyticsManager: React.FC = () => {
  const [timeRange, setTimeRange] = useState('This Year');

  const currentData = useMemo(() => {
    return ANALYTICS_DATA_MAP[timeRange as keyof typeof ANALYTICS_DATA_MAP] || ANALYTICS_DATA_MAP['This Year'];
  }, [timeRange]);

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
            value={currentData.revenue} 
            trend={currentData.revenueTrend} 
            trendUp={true} 
            icon={TrendingUp} 
            color="bg-emerald-500" 
            subtext="Gross sales before deductions"
          />
          <MetricCard 
            title="Net Earnings" 
            value={currentData.net} 
            trend={currentData.netTrend} 
            trendUp={true} 
            icon={DollarSign} 
            color="bg-blue-500" 
            subtext="After 15% platform commission"
          />
          <MetricCard 
            title="Commission Paid" 
            value={currentData.commission} 
            trend={currentData.commTrend} 
            trendUp={false} 
            icon={PieChart} 
            color="bg-purple-500" 
            subtext="Platform fees & processing"
          />
          <MetricCard 
            title="Refund Rate" 
            value={currentData.refundRate} 
            trend={currentData.refundTrend} 
            trendUp={true} 
            icon={RefreshCw} 
            color="bg-amber-500" 
            subtext="Below industry average (2.5%)"
          />
        </div>

        {/* Revenue vs Net Earnings Chart */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary">Revenue vs Net Earnings</h3>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Revenue</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Net Earnings</div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData.salesData}>
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
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} tickFormatter={(value) => `${value/1000}k`} />
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
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="p-3 bg-white rounded-xl shadow-sm"><TrendingUp className="w-6 h-6 text-emerald-500" /></div>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Best Seller</p>
                <h4 className="text-lg font-bold text-primary">Handwoven Gabi Scarf</h4>
                <p className="text-sm text-gray-500">142 sold • ETB 355,000 revenue</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
              <div className="p-3 bg-white rounded-xl shadow-sm"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
              <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Needs Attention</p>
                <h4 className="text-lg font-bold text-primary">Clay Coffee Pot (Large)</h4>
                <p className="text-sm text-gray-500">High return rate (8%) • 12 sold</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-4">Revenue by Category</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={CATEGORY_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {CATEGORY_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `ETB ${value.toLocaleString()}`} />
                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Low Stock Forecast</p>
                <p className="text-xs text-amber-700 mt-1">Based on current sales velocity, <span className="font-bold">Silver Cross Pendant</span> will run out in 5 days.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Operational Performance */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" /> Operational Health
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
              <Clock className="w-8 h-8 text-blue-500 mb-3" />
              <p className="text-2xl font-bold text-primary">1.2 Days</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Avg Fulfillment</p>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
              <Truck className="w-8 h-8 text-purple-500 mb-3" />
              <p className="text-2xl font-bold text-primary">3.5 Days</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Avg Delivery</p>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
              <RefreshCw className="w-8 h-8 text-amber-500 mb-3" />
              <p className="text-2xl font-bold text-primary">1.2%</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Return Rate</p>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
              <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
              <p className="text-2xl font-bold text-primary">0.5%</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Cancellation</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-6">Sales by Day of Week</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DAY_OF_WEEK_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Customer & Traffic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Customer Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-3xl font-bold text-primary">24%</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Returning Customers</p>
              <p className="text-[10px] text-emerald-500 font-bold mt-1">+4% vs last month</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">ETB 2,450</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Avg Order Value</p>
              <p className="text-[10px] text-emerald-500 font-bold mt-1">+12% vs last month</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">4.8</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Avg Customer Rating</p>
              <p className="text-[10px] text-gray-400 mt-1">Based on 156 reviews</p>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-gray-700 mb-4">Top Customer Locations</h4>
            <div className="space-y-4">
              {CUSTOMER_LOCATION_DATA.map((loc, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span className="text-gray-700">{loc.name}</span>
                      <span className="text-primary">{loc.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${loc.value}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-orange-500" /> Traffic & Conversion
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-bold text-gray-600">Product Views</span>
              </div>
              <span className="text-lg font-bold text-primary">12,450</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-bold text-gray-600">Add to Cart</span>
              </div>
              <span className="text-lg font-bold text-primary">8.5%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-bold text-gray-600">Conversion Rate</span>
              </div>
              <span className="text-lg font-bold text-primary">3.2%</span>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 mt-4">
              <p className="text-xs font-bold text-orange-800 uppercase mb-2">Insight</p>
              <p className="text-sm text-orange-900 leading-relaxed">
                Your conversion rate is <span className="font-bold">above average</span> (2.5%). Consider running a promotion on Tuesday to boost low-traffic days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
