import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, 
  Download, Calendar, BarChart2, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, Wallet, Receipt, Search,
  ChevronDown, Filter, X, User, Mail, Phone, FileText, RefreshCw
} from 'lucide-react';
import { Button, Badge } from '@/components/UI';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart as RechartsPieChart, Pie
} from 'recharts';

export const OrganizerRevenuePage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('Monthly');
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [bookedUsers, setBookedUsers] = useState<any[]>([]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/organizer/revenue');
      const data = await res.json();
      if (data.success) {
        setRevenueData(data.revenue);
      }
    } catch (err) {
      console.error('Error fetching revenue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchEventBookings = async (eventId: string) => {
    try {
      const res = await fetch(`/api/organizer/bookings?festivalId=${eventId}`);
      const data = await res.json();
      if (data.success) {
        setBookedUsers(data.bookings.map((b: any) => ({
          id: b._id?.slice(-6) || 'N/A',
          name: b.contactInfo?.fullName || b.tourist?.name || 'Unknown',
          email: b.contactInfo?.email || b.tourist?.email || 'N/A',
          phone: b.contactInfo?.phone || 'N/A',
          ticketType: b.ticketType || 'Standard',
          quantity: b.quantity || 1,
          total: b.totalPrice || 0,
          date: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : 'N/A',
          status: b.status || 'Pending',
        })));
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    fetchEventBookings(event.id);
  };

  const handleExportReport = () => {
    if (!revenueData?.eventRevenue) return;
    
    const headers = ['Event Name', 'Status', 'Gross Sales', 'Commission', 'Refunds', 'Net Revenue'];
    const csvContent = [
      headers.join(','),
      ...revenueData.eventRevenue.map((e: any) => [
        `"${e.name}"`,
        e.status,
        e.gross,
        e.commission,
        e.refunds,
        e.net
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `revenue_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const grossSales = revenueData?.grossSales || 0;
  const commissionRate = revenueData?.commissionRate || 0.10;
  const commission = grossSales * commissionRate;
  const refunds = revenueData?.refunds || 0;
  const pendingRevenue = revenueData?.pendingRevenue || 0;
  const paidOut = revenueData?.paidOut || 0;
  const netRevenue = grossSales - commission - refunds;

  const REVENUE_DATA = revenueData?.revenueData || [
    { name: 'Jan', gross: 0, net: 0 },
    { name: 'Feb', gross: 0, net: 0 },
    { name: 'Mar', gross: 0, net: 0 },
    { name: 'Apr', gross: 0, net: 0 },
    { name: 'May', gross: 0, net: 0 },
    { name: 'Jun', gross: 0, net: 0 },
  ];

  const EVENT_REVENUE = revenueData?.eventRevenue || [];

  const filteredEvents = EVENT_REVENUE.filter((event: any) => {
    if (searchQuery && !event.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'All' && event.status !== statusFilter) return false;
    return true;
  });

  const displayedEvents = showAllEvents ? filteredEvents : filteredEvents.slice(0, 5);

  const PAYMENT_METHODS = [
    { name: 'Telebirr', value: grossSales * 0.4 || 0, color: '#10b981' },
    { name: 'Chapa (Card)', value: grossSales * 0.33 || 0, color: '#3b82f6' },
    { name: 'Bank Transfer', value: grossSales * 0.27 || 0, color: '#8b5cf6' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-primary">Revenue Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Track your earnings, payouts, and financial performance.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
              className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-primary flex items-center gap-2 hover:shadow-sm transition-all"
            >
              <Calendar className="w-4 h-4 text-gray-400" />
              {timeRange}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showTimeRangeDropdown && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95">
                {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(range => (
                  <button 
                    key={range}
                    onClick={() => { setTimeRange(range); setShowTimeRangeDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-gray-50 ${timeRange === range ? 'text-primary bg-gray-50' : 'text-gray-500'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" leftIcon={Download} onClick={handleExportReport}>Export Report</Button>
        </div>
      </header>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 border-none flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12.5%
              </Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Gross Sales</p>
            <p className="text-3xl font-serif font-bold text-primary">ETB {grossSales.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">Before commission & refunds</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <Receipt className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Platform Commission (10%)</p>
            <p className="text-3xl font-serif font-bold text-red-600">- ETB {commission.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">Deducted automatically</p>
          </div>
        </div>

        <div className="bg-ethio-dark p-8 rounded-[32px] shadow-xl relative overflow-hidden group text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/10 text-white rounded-2xl backdrop-blur-sm">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-1">Net Revenue (Your Earnings)</p>
            <p className="text-3xl font-serif font-bold">ETB {Math.max(0, netRevenue).toLocaleString()}</p>
            <p className="text-xs text-white/60 mt-2">Gross - Commission - Refunds</p>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Pending Revenue</p>
            <p className="text-xl font-bold text-primary">ETB {pendingRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">Awaiting event completion</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Paid Out</p>
            <p className="text-xl font-bold text-primary">ETB {paidOut.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">Transferred to bank</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-gray-50 text-gray-600 rounded-2xl">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Refunds / Cancellations</p>
            <p className="text-xl font-bold text-primary">ETB {refunds.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">Subtracted from totals</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-serif font-bold text-primary">Revenue Growth</h3>
            <Badge className="bg-ethio-bg text-primary border-none">2025</Badge>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `ETB ${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [`ETB ${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="gross" name="Gross Sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorGross)" />
                <Area type="monotone" dataKey="net" name="Net Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6 flex flex-col">
          <h3 className="text-xl font-serif font-bold text-primary">Payment Methods</h3>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-48 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={PAYMENT_METHODS}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {PAYMENT_METHODS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`ETB ${value.toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {PAYMENT_METHODS.map((method, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }} />
                    <span className="text-sm font-bold text-primary">{method.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">ETB {method.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Per Event */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-xl font-serif font-bold text-primary">Revenue by Event</h3>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search events..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-gray-50 border-none rounded-xl py-2 pl-4 pr-10 text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowAllEvents(!showAllEvents)}>
              {showAllEvents ? 'Show Less' : 'View All'}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Event Name</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Gross Sales</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Commission (10%)</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Refunds</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Net Revenue</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedEvents.length > 0 ? (
                displayedEvents.map((event: any, i: number) => (
                  <tr key={i} className="hover:bg-ethio-bg/30 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-primary">{event.name}</p>
                    </td>
                    <td className="px-8 py-6">
                      <Badge className={`border-none ${
                        event.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        event.status === 'Live' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {event.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-sm font-bold text-primary">ETB {event.gross.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-sm text-red-500">- ETB {event.commission.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-sm text-gray-500">- ETB {event.refunds.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-sm font-bold text-emerald-600">ETB {event.net.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleEventClick(event)}
                        className="text-xs font-bold text-primary hover:text-secondary underline"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center text-gray-500">
                    No event revenue data. Create events and get bookings to see revenue here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white w-full max-w-4xl rounded-[40px] p-8 space-y-8 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-serif font-bold text-primary">{selectedEvent.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={`border-none ${
                    selectedEvent.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                    selectedEvent.status === 'Live' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{selectedEvent.status}</Badge>
                  <span className="text-sm text-gray-500">Revenue Breakdown & Booked Users</span>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6 text-gray-500" /></button>
            </div>

            {/* Event Specific Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-6 rounded-3xl">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">ETB {selectedEvent.gross.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Net Earnings</p>
                <p className="text-2xl font-bold text-emerald-600">ETB {selectedEvent.net.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-primary">{bookedUsers.length}</p>
              </div>
            </div>

            {/* Booked Users Table */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-primary">Booked Users</h4>
                <Button variant="outline" size="sm" leftIcon={Download}>Export List</Button>
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                {bookedUsers.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">User</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Contact</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Ticket</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Total</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookedUsers.map((user, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-primary">{user.name}</p>
                                <p className="text-xs text-gray-400">ID: {user.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="text-xs flex items-center gap-2 text-gray-600"><Mail className="w-3 h-3" /> {user.email}</p>
                              <p className="text-xs flex items-center gap-2 text-gray-600"><Phone className="w-3 h-3" /> {user.phone}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-primary">{user.ticketType}</p>
                            <p className="text-xs text-gray-500">Qty: {user.quantity}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-primary">ETB {user.total.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`border-none ${
                              user.status === 'confirmed' || user.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                              user.status === 'completed' || user.status === 'Checked-in' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>{user.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    No bookings for this event yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OrganizerRevenuePage;
