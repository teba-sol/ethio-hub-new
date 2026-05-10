import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, CalendarX, 
  Star, TrendingUp, TrendingDown, Download, ChevronDown,
  Flame, AlertTriangle, Award, RefreshCw, Wallet, Clock, PieChart
} from 'lucide-react';
import { Button, Badge } from '@/components/UI';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart as RePieChart, Pie
} from 'recharts';

export const OrganizerAnalyticsPage: React.FC = () => {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [sortBy, setSortBy] = useState('Bookings');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [festivalsData, setFestivalsData] = useState<any[]>([]);
  const [peakHourEvent, setPeakHourEvent] = useState('all');
  const [ticketEvent, setTicketEvent] = useState('all');

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/organizer/analytics');
      const json = await res.json();

      if (json.success) {
        setAnalyticsData(json.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const publishedEvents = analyticsData?.festivals?.published || 0;
  const completedEvents = analyticsData?.festivals?.completed || 0;
  const averageRating = analyticsData?.reviews?.avgRating || 0;
  const totalReviews = analyticsData?.reviews?.total || 0;
  const allEvents = analyticsData?.allEvents || [];

  // Process Booking Trend Data based on timeRange
  const bookingTrends = useMemo(() => {
    if (!analyticsData?.charts) return [];
    
    let sourceData = analyticsData.charts.bookingsByDay || {};
    if (timeRange === 'Last 30 Days') sourceData = analyticsData.charts.bookingsLast30Days || {};
    if (timeRange === 'Last 3 Months') sourceData = analyticsData.charts.bookingsLast90Days || {};

    // Get all unique event names from the data
    const allEventNames = new Set<string>();
    Object.values(sourceData).forEach((item: any) => {
      if (item?.events) {
        Object.keys(item.events).forEach(name => allEventNames.add(name));
      }
    });
    const eventNames = Array.from(allEventNames);

    return Object.entries(sourceData).map(([date, item]: [string, any]) => {
      const entry: any = {
        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: date,
      };
      // Add each event's booking count
      eventNames.forEach(eventName => {
        entry[eventName] = item?.events?.[eventName] || 0;
      });
      return entry;
    });
  }, [analyticsData, timeRange]);

  // Get event names for legend
  const eventNames = useMemo(() => {
    if (!bookingTrends.length) return [];
    const names = new Set<string>();
    bookingTrends.forEach((item: any) => {
      Object.keys(item).forEach(key => {
        if (key !== 'name' && key !== 'date') names.add(key);
      });
    });
    return Array.from(names);
  }, [bookingTrends]);

  // Ticket Type Breakdown Data
  const ticketTypeData = useMemo(() => {
    if (!analyticsData?.charts?.ticketTypeBreakdown) return [];
    
    if (ticketEvent === 'all') {
      return Object.entries(analyticsData.charts.ticketTypeBreakdown).map(([name, value]) => ({
        name,
        value
      }));
    } else {
      const eventBreakdown = analyticsData.charts.ticketTypeBreakdownByEvent?.[ticketEvent];
      if (!eventBreakdown) return [];
      return Object.entries(eventBreakdown).map(([name, value]) => ({
        name,
        value
      }));
    }
  }, [analyticsData, ticketEvent]);

  const COLORS = ['#3b82f6', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  // Peak Booking Hour Data
  const peakHourData = useMemo(() => {
    if (!analyticsData?.charts?.peakBookingHours) return [];
    
    if (peakHourEvent === 'all') {
      return Object.entries(analyticsData.charts.peakBookingHours).map(([hour, count]) => ({
        hour: `${hour}:00`,
        bookings: count
      }));
    } else {
      const eventPeakHours = analyticsData.charts.peakBookingHoursByEvent?.[peakHourEvent] || {};
      const hourCounts: Record<number, number> = {};
      for (let i = 0; i < 24; i++) hourCounts[i] = 0;
      Object.entries(eventPeakHours).forEach(([hour, count]) => {
        hourCounts[parseInt(hour, 10)] = count as number;
      });
      return Object.entries(hourCounts).map(([hour, count]) => ({
        hour: `${hour}:00`,
        bookings: count
      }));
    }
  }, [analyticsData, peakHourEvent]);

  const eventPerformance = analyticsData?.eventPerformance || [];
  const topBookedEvents = analyticsData?.topBookedEvents || [];

  const sortedEvents = useMemo(() => {
    const filtered = eventPerformance.filter(e => 
      e.status === 'Published' || e.status === 'Completed'
    );
    return [...filtered].sort((a, b) => {
      if (sortBy === 'Bookings') return b.bookings - a.bookings;
      if (sortBy === 'Income') return b.netIncome - a.netIncome;
      if (sortBy === 'Rating') return b.rating - a.rating;
      return 0;
    });
  }, [eventPerformance, sortBy]);

  const handleExportReport = () => {
    const headers = ['Event Name', 'Status', 'Bookings', 'Net Income', 'Rating'];
    const csvContent = [
      headers.join(','),
      ...sortedEvents.map(e => [
        `"${e.name}"`,
        e.status,
        e.bookings,
        e.netIncome,
        e.rating
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-primary">Analytics Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Monitor event performance, attendance, and guest satisfaction.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={Download} onClick={handleExportReport}>Export Report</Button>
        </div>
      </header>

      {/* Top KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Published Events</p>
            <p className="text-2xl font-bold text-primary">{publishedEvents.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-gray-100 text-gray-600">
              <CalendarX className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Completed Events</p>
            <p className="text-2xl font-bold text-primary">{completedEvents.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500">
              <Star className="w-5 h-5 fill-current" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Avg Event Rating</p>
            <p className="text-2xl font-bold text-primary">{averageRating.toFixed(1)} <span className="text-sm font-normal text-gray-400">/ 5.0</span></p>
          </div>
        </div>
      </div>

      {/* Booking Trends Chart */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-serif font-bold text-primary">Booking Trends</h3>
            <p className="text-sm text-gray-500 mt-1">Track booking momentum and audience growth over time.</p>
          </div>
          <div className="bg-gray-50 p-1 rounded-xl flex items-center">
            {['Last 7 Days', 'Last 30 Days', 'Last 3 Months'].map(range => (
              <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeRange === range ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bookingTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {eventNames.map((eventName, idx) => (
                  <linearGradient key={eventName} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: any, name: string) => [value, name]}
              />
              <Legend />
              {eventNames.map((eventName, idx) => (
                <Area 
                  key={eventName}
                  type="monotone" 
                  dataKey={eventName} 
                  name={eventName} 
                  stroke={COLORS[idx % COLORS.length]} 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill={`url(#color${idx})`} 
                  stackId="1"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Event Performance Table */}
        <div className="lg:col-span-3 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-primary">Event Performance</h3>
              <p className="text-sm text-gray-500 mt-1">Identify your strongest and weakest events.</p>
            </div>
            <div className="relative min-w-[160px]">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
              >
                <option value="Bookings">Sort by Bookings</option>
                <option value="Income">Sort by Income</option>
                <option value="Rating">Sort by Rating</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Event Name</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Bookings</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Net Income</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedEvents.length > 0 ? (
                  sortedEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-ethio-bg/30 transition-colors cursor-pointer group">
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-primary group-hover:text-secondary transition-colors">{event.name}</p>
                      </td>
                      <td className="px-8 py-6">
                        <Badge className={`border-none ${
                          event.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          event.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {event.status}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-sm font-bold text-primary">{event.bookings.toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-sm font-bold text-emerald-600">ETB {event.netIncome.toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                          <span className="text-sm font-bold text-primary">{event.rating.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-gray-500">
                      No events found. Create events to see analytics here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rating & Review Summary */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-xl font-serif font-bold text-primary mb-6">Review Summary</h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="text-5xl font-serif font-bold text-primary">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</div>
              <div>
                <div className="flex text-amber-400 mb-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'fill-current' : 'text-gray-200'}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-500 font-medium">Based on {totalReviews} reviews</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { star: 5, label: 'Excellent' },
                { star: 4, label: 'Good' },
                { star: 3, label: 'Average' },
                { star: 2, label: 'Poor' },
                { star: 1, label: 'Very Poor' },
              ].map((dist) => (
                <div key={dist.star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-8 shrink-0">
                    <span className="text-sm font-bold text-gray-700">{dist.star}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-current" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full" 
                      style={{ width: `${(averageRating / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <Button variant="outline" className="w-full mt-8" onClick={() => router.push('/dashboard/organizer/reviews')}>View All Reviews</Button>
          </div>

          {/* Wallet / Top Income Section */}
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold text-primary">Top Income</h3>
              <Wallet className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="space-y-6">
              {topBookedEvents.slice(0, 3).map((event: any, idx: number) => (
                <div key={event.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-primary truncate max-w-[120px]">{event.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{event.bookings} Bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">ETB {event.netIncome.toLocaleString()}</p>
                    <Badge className="text-[10px] bg-emerald-50 text-emerald-600 border-none">Top {idx + 1}</Badge>
                  </div>
                </div>
              ))}
              {topBookedEvents.length === 0 && (
                <p className="text-sm text-gray-400 italic">No income data available yet.</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-6" onClick={() => router.push('/dashboard/organizer/wallet')}>Manage Wallet</Button>
          </div>
        </div>
      </div>

      {/* New Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ticket Type Breakdown */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-serif font-bold text-primary">Ticket Breakdown</h3>
              <p className="text-sm text-gray-500 mt-1">Analysis of ticket types sold across all events.</p>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={ticketEvent}
                onChange={(e) => setTicketEvent(e.target.value)}
                className="text-xs font-bold bg-gray-50 border-none rounded-lg py-1.5 px-3 text-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
              >
                <option value="all">All Events</option>
                {allEvents.map((event: any) => (
                  <option key={event.id} value={event.name}>{event.name}</option>
                ))}
              </select>
              <PieChart className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="h-64">
            {ticketTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={ticketTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ticketTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No ticket data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Peak Booking Hours */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-serif font-bold text-primary">Peak Booking Hours</h3>
              <p className="text-sm text-gray-500 mt-1">When are your customers most likely to book?</p>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={peakHourEvent}
                onChange={(e) => setPeakHourEvent(e.target.value)}
                className="text-xs font-bold bg-gray-50 border-none rounded-lg py-1.5 px-3 text-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
              >
                <option value="all">All Events</option>
                {allEvents.map((event: any) => (
                  <option key={event.id} value={event.name}>{event.name}</option>
                ))}
              </select>
              <Clock className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHourData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OrganizerAnalyticsPage;
