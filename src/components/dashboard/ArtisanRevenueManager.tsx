import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Download, Calendar, 
  CreditCard, ArrowUpRight, ArrowDownLeft, Wallet, PieChart, 
  BarChart2, RefreshCw, FileText, AlertCircle, CheckCircle2, 
  Clock, ChevronDown, Filter
} from 'lucide-react';
import { Button, Badge } from '../UI';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, BarChart, Bar, Legend, PieChart as RePieChart, 
  Pie, Cell 
} from 'recharts';

// --- Types ---
interface Transaction {
  id: string;
  type: 'Sale' | 'Refund' | 'Payout' | 'Fee';
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed' | 'Rejected';
  date: string;
  reference: string;
  method: string;
  description: string;
  details?: {
    breakdown: { label: string; amount: number; user?: string; product?: string }[];
    commission: number;
    net: number;
    timeline: { status: string; date: string; completed: boolean }[];
    reviewer?: string;
  };
}

interface RevenueData {
  date: string;
  revenue: number;
  lastPeriod: number;
}

// --- Mock Data ---
const REVENUE_DATA_MAP = {
  'Today': {
    gross: 'ETB 4,200',
    net: 'ETB 3,570',
    pending: 'ETB 1,200',
    avg: 'ETB 1,400',
    trend: '+5.2%',
    trendUp: true,
    chart: Array.from({ length: 24 }).map((_, i) => ({
      date: `${i}:00`,
      revenue: Math.floor(Math.random() * 500) + 100,
      lastPeriod: Math.floor(Math.random() * 400) + 80,
    }))
  },
  'This Week': {
    gross: 'ETB 32,400',
    net: 'ETB 27,540',
    pending: 'ETB 8,500',
    avg: 'ETB 1,650',
    trend: '+8.1%',
    trendUp: true,
    chart: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      date: day,
      revenue: Math.floor(Math.random() * 5000) + 2000,
      lastPeriod: Math.floor(Math.random() * 4500) + 1800,
    }))
  },
  'This Month': {
    gross: 'ETB 145,200',
    net: 'ETB 128,450',
    pending: 'ETB 12,500',
    avg: 'ETB 1,850',
    trend: '+12.5%',
    trendUp: true,
    chart: Array.from({ length: 30 }).map((_, i) => ({
      date: `Day ${i + 1}`,
      revenue: Math.floor(Math.random() * 6000) + 3000,
      lastPeriod: Math.floor(Math.random() * 5500) + 2500,
    }))
  },
  'This Year': {
    gross: 'ETB 1,850,000',
    net: 'ETB 1,572,500',
    pending: 'ETB 45,000',
    avg: 'ETB 2,100',
    trend: '+15.8%',
    trendUp: true,
    chart: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => ({
      date: month,
      revenue: Math.floor(Math.random() * 150000) + 100000,
      lastPeriod: Math.floor(Math.random() * 130000) + 90000,
    }))
  },
  'All Time': {
    gross: 'ETB 4,250,000',
    net: 'ETB 3,612,500',
    pending: 'ETB 0',
    avg: 'ETB 2,450',
    trend: '+24.2%',
    trendUp: true,
    chart: ['2022', '2023', '2024', '2025', '2026'].map(year => ({
      date: year,
      revenue: Math.floor(Math.random() * 1000000) + 500000,
      lastPeriod: Math.floor(Math.random() * 800000) + 400000,
    }))
  }
};

const REVENUE_BY_PRODUCT = [
  { name: 'Handwoven Gabi', value: 45000, color: '#10b981' },
  { name: 'Clay Pot Set', value: 28000, color: '#3b82f6' },
  { name: 'Leather Bag', value: 15000, color: '#8b5cf6' },
  { name: 'Silver Cross', value: 12000, color: '#f59e0b' },
  { name: 'Others', value: 8000, color: '#9ca3af' },
];

const REVENUE_BY_EVENT = [
  { name: 'Timket Festival', value: 35000 },
  { name: 'Meskel Square Fair', value: 22000 },
  { name: 'Online Store', value: 51000 },
];

const PAYOUT_HISTORY: Transaction[] = Array.from({ length: 5 }).map((_, i) => ({
  id: `PO-${8800 + i}`,
  type: 'Payout',
  amount: 12500 + (i * 1500),
  status: i === 0 ? 'Pending' : 'Completed',
  date: new Date(Date.now() - i * 7 * 86400000).toISOString(),
  reference: `TRX-${9900 + i}`,
  method: i % 2 === 0 ? 'Bank Transfer' : 'Telebirr',
  description: 'Weekly Payout',
  details: {
    breakdown: [
      { 
        label: 'Product Sale', 
        amount: 14000 + (i * 1000), 
        user: i % 2 === 0 ? 'Abebe Kebede' : 'Sara Tadesse',
        product: i % 2 === 0 ? 'Handwoven Gabi' : 'Clay Pot Set'
      },
    ],
    commission: (16000 + (i * 1000)) * 0.1,
    net: 12500 + (i * 1500),
    timeline: [
      { status: 'Requested', date: new Date(Date.now() - (i * 7 + 2) * 86400000).toISOString(), completed: true },
      { status: 'Approved', date: new Date(Date.now() - (i * 7 + 1) * 86400000).toISOString(), completed: i !== 0 },
      { status: 'Paid', date: new Date(Date.now() - i * 7 * 86400000).toISOString(), completed: i !== 0 },
    ],
    reviewer: 'Admin Sarah'
  }
}));

// --- Components ---

const StatCard: React.FC<{ 
  label: string; 
  value: string; 
  trend?: string; 
  trendUp?: boolean; 
  icon: any; 
  color: string;
  subtext?: string;
}> = ({ label, value, trend, trendUp, icon: Icon, color, subtext }) => (
  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-primary mb-1">{value}</h3>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      {subtext && <p className="text-[10px] text-gray-400 mt-2">{subtext}</p>}
    </div>
  </div>
);

export const ArtisanRevenueManager: React.FC = () => {
  const [timeRange, setTimeRange] = useState('This Month');
  const [chartView, setChartView] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [showComparison, setShowComparison] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<Transaction | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDateRangeActive, setIsDateRangeActive] = useState(false);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('All');

  const handleDownloadStatement = (payout: Transaction) => {
    const content = `
      PAYOUT STATEMENT
      ID: ${payout.id}
      Date: ${new Date(payout.date).toLocaleDateString()}
      Amount: ETB ${payout.amount.toLocaleString()}
      Method: ${payout.method}
      Status: ${payout.status}
      Reference: ${payout.reference}
      
      BREAKDOWN:
      ${payout.details?.breakdown.map(b => `- ${b.label}: ETB ${b.amount.toLocaleString()} (User: ${b.user}, Product: ${b.product})`).join('\n      ')}
      
      Commission: - ETB ${payout.details?.commission.toLocaleString()}
      Net Earnings: ETB ${payout.details?.net.toLocaleString()}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Statement_${payout.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportReport = () => {
    const headers = ['Date', 'Gross Sales', 'Net Earnings', 'Pending Payout', 'Avg Order Value'];
    const data = Object.entries(REVENUE_DATA_MAP).map(([range, stats]) => [
      range,
      stats.gross,
      stats.net,
      stats.pending,
      stats.avg
    ]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Revenue_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPayouts = useMemo(() => {
    return PAYOUT_HISTORY.filter(p => {
      const matchesStatus = payoutStatusFilter === 'All' || p.status === payoutStatusFilter;
      // Date filtering logic would go here if implemented for real
      return matchesStatus;
    });
  }, [payoutStatusFilter]);

  const currentStats = useMemo(() => {
    return REVENUE_DATA_MAP[timeRange as keyof typeof REVENUE_DATA_MAP] || REVENUE_DATA_MAP['This Month'];
  }, [timeRange]);

  const chartData = useMemo(() => {
    if (chartView === 'Daily') return REVENUE_DATA_MAP['Today'].chart;
    if (chartView === 'Weekly') return REVENUE_DATA_MAP['This Week'].chart;
    if (chartView === 'Monthly') return REVENUE_DATA_MAP['This Month'].chart;
    return REVENUE_DATA_MAP['This Month'].chart;
  }, [chartView]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Financial Overview</h1>
          <p className="text-gray-500 text-sm">Track your earnings, payouts, and business growth.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select 
              className="appearance-none bg-white border border-gray-200 rounded-xl py-2.5 pl-4 pr-10 text-sm font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10 hover:border-primary/30 transition-colors"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
              <option value="All Time">All Time</option>
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <Button variant="outline" leftIcon={Download} onClick={handleExportReport}>Export Report</Button>
        </div>
      </div>

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Gross Sales" 
          value={currentStats.gross} 
          trend={currentStats.trend} 
          trendUp={currentStats.trendUp} 
          icon={DollarSign} 
          color="bg-emerald-500" 
          subtext="Total revenue before fees"
        />
        <StatCard 
          label="Net Earnings" 
          value={currentStats.net} 
          trend={currentStats.trend} 
          trendUp={currentStats.trendUp} 
          icon={Wallet} 
          color="bg-blue-500" 
          subtext="Available for payout"
        />
        <StatCard 
          label="Pending Payout" 
          value={currentStats.pending} 
          icon={Clock} 
          color="bg-amber-500" 
          subtext="Processing (Est. 2 days)"
        />
        <StatCard 
          label="Avg Order Value" 
          value={currentStats.avg} 
          trend="-2.1%" 
          trendUp={false} 
          icon={BarChart2} 
          color="bg-purple-500" 
          subtext="Based on recent orders"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-500 rounded-lg"><RefreshCw className="w-4 h-4" /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Refunds</p>
              <p className="font-bold text-primary">ETB 2,450 (3 orders)</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 text-gray-500 rounded-lg"><CreditCard className="w-4 h-4" /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Platform Fees</p>
              <p className="font-bold text-primary">ETB 14,300</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><CheckCircle2 className="w-4 h-4" /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Paid Out</p>
              <p className="font-bold text-primary">ETB 115,950</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Revenue Chart (Main) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Revenue Trends
              </h3>
              <p className="text-sm text-gray-500">Compare your performance over time.</p>
            </div>
            <div className="flex bg-gray-50 p-1 rounded-xl">
              {['Daily', 'Weekly', 'Monthly'].map((view) => (
                <button
                  key={view}
                  onClick={() => setChartView(view as any)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chartView === view ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-primary'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} tickFormatter={(value) => `ETB ${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string) => [`ETB ${value.toLocaleString()}`, name]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Current Period" />
                {showComparison && (
                  <Area type="monotone" dataKey="lastPeriod" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorLast)" name="Last Period" />
                )}
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center gap-2 mt-4 text-xs font-bold text-gray-500">
            <input 
              type="checkbox" 
              checked={showComparison} 
              onChange={(e) => setShowComparison(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>Compare with previous period</span>
          </div>
        </div>

        {/* 3. Breakdown Charts (Sidebar) */}
        <div className="space-y-8">
          {/* Revenue by Product */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-6">Top Products</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={REVENUE_BY_PRODUCT}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {REVENUE_BY_PRODUCT.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `ETB ${value.toLocaleString()}`} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {REVENUE_BY_PRODUCT.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-primary">ETB {item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Payout History Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-xl font-bold text-primary">Payout History</h3>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select 
                className="appearance-none bg-gray-50 border border-gray-100 rounded-xl py-2 pl-4 pr-10 text-xs font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10 transition-all"
                value={payoutStatusFilter}
                onChange={(e) => setPayoutStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              {!isDateRangeActive ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={Calendar}
                  onClick={() => setIsDateRangeActive(true)}
                >
                  Add Date Range
                </Button>
              ) : (
                <div className="absolute right-0 top-0 z-30 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 min-w-[300px] animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-primary">Select Date Range</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Start Date</label>
                        <input 
                          type="date" 
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs font-bold focus:ring-0"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">End Date</label>
                        <input 
                          type="date" 
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs font-bold focus:ring-0"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setIsDateRangeActive(false);
                          alert(`Filtering from ${startDate} to ${endDate}`);
                        }}
                      >
                        Apply
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setIsDateRangeActive(false);
                          setStartDate('');
                          setEndDate('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Payout ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayouts.map((payout) => (
                <React.Fragment key={payout.id}>
                  <tr 
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedPayout?.id === payout.id ? 'bg-primary/5' : ''}`}
                    onClick={() => setSelectedPayout(selectedPayout?.id === payout.id ? null : payout)}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-primary">{payout.id}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(payout.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-primary">ETB {payout.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-gray-100 rounded text-gray-500"><CreditCard className="w-3 h-3" /></div>
                        <span className="text-gray-600">{payout.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        payout.status === 'Completed' ? 'success' : 
                        payout.status === 'Pending' ? 'warning' : 
                        payout.status === 'Failed' ? 'error' : 'secondary'
                      } size="sm">
                        {payout.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">{payout.reference}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="p-2 text-gray-400 hover:text-primary transition-colors" 
                        title="Download Receipt"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadStatement(payout);
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  
                  {/* Detail View */}
                  {selectedPayout?.id === payout.id && payout.details && (
                    <tr className="bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <td colSpan={7} className="px-8 py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Breakdown */}
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction Breakdown</h4>
                            <div className="space-y-3">
                              {payout.details.breakdown.map((item, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="font-bold text-primary">{item.label}</span>
                                    <span className="font-bold text-emerald-600">ETB {item.amount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex flex-col text-[10px] text-gray-500">
                                    <span>Customer: <span className="font-bold text-gray-700">{item.user}</span></span>
                                    <span>Product: <span className="font-bold text-gray-700">{item.product}</span></span>
                                  </div>
                                </div>
                              ))}
                              <div className="h-px bg-gray-200 my-2"></div>
                              <div className="flex justify-between text-sm text-red-500">
                                <span>Commission Deducted</span>
                                <span className="font-bold">- ETB {payout.details.commission.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-base font-bold text-primary pt-2">
                                <span>Net Earnings Released</span>
                                <span>ETB {payout.details.net.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payout Timeline</h4>
                            <div className="relative space-y-6 pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                              {payout.details.timeline.map((step, idx) => (
                                <div key={idx} className="relative">
                                  <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${step.completed ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                  <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${step.completed ? 'text-primary' : 'text-gray-400'}`}>{step.status}</span>
                                    <span className="text-[10px] text-gray-400">{new Date(step.date).toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Additional Info</h4>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Reviewer Info</span>
                                <span className="font-bold text-primary">{payout.details.reviewer || 'Auto-approved'}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Payment Method</span>
                                <span className="font-bold text-primary">{payout.method}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Reference ID</span>
                                <span className="font-bold text-primary text-xs">{payout.reference}</span>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full" 
                              leftIcon={Download}
                              onClick={() => handleDownloadStatement(payout)}
                            >
                              Download Full Statement
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
