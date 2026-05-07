import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, Users, Ticket, CalendarCheck, CalendarX, 
  Star, TrendingUp, TrendingDown, Download, ChevronDown,
  Flame, AlertTriangle, Award, RefreshCw
} from 'lucide-react';
import { Button, Badge } from '../../components/UI';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

export const OrganizerAnalyticsPage: React.FC = () => {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [sortBy, setSortBy] = useState('Bookings');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [festivalsData, setFestivalsData] = useState<any[]>([]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, festivalsRes, bookingsRes] = await Promise.all([
        fetch('/api/organizer/analytics'),
        fetch('/api/organizer/festivals'),
        fetch('/api/organizer/bookings')
      ]);

      const analyticsJson = await analyticsRes.json();
      const festivalsJson = await festivalsRes.json();
      const bookingsJson = await bookingsRes.json();

      if (analyticsJson.success) {
        setAnalyticsData(analyticsJson.analytics);
      }
      if (festivalsJson.success) {
        setFestivalsData(festivalsJson.festivals || []);
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

  const totalBookings = analyticsData?.bookings?.total || 0;
  const totalAttendees = analyticsData?.bookings?.confirmed || 0;
  const activeEvents = festivalsData.filter(f => {
    const now = new Date();
    const start = new Date(f.startDate);
    const end = new Date(f.endDate);
    return start <= now && end >= now;
  }).length;
  const completedEvents = festivalsData.filter(f => {
    const now = new Date();
    const end = new Date(f.endDate);
    return end < now;
  }).length;
  const averageRating = analyticsData?.reviews?.avgRating || 0;
  const totalReviews = analyticsData?.reviews?.total || 0;

  const bookingsData = analyticsData?.charts?.bookingsByMonth || {};
  const BOOKING_TRENDS = [
    { name: 'Week 1', bookings: 120, attendees: 350 },
    { name: 'Week 2', bookings: 180, attendees: 520 },
    { name: 'Week 3', bookings: 250, attendees: 780 },
    { name: 'Week 4', bookings: 310, attendees: 950 },
    { name: 'Week 5', bookings: 280, attendees: 840 },
    { name: 'Week 6', bookings: 420, attendees: 1250 },
  ];

  const getEventHealth = (bookings: number, rating: number) => {
    if (bookings > 500 && rating >= 4.5) return 'high-demand';
    if (rating >= 4.7) return 'top-rated';
    if (bookings < 100) return 'low-booking';
    return 'normal';
  };

  const EVENT_PERFORMANCE = festivalsData.map(f => {
    const now = new Date();
    const start = new Date(f.startDate);
    const end = new Date(f.endDate);

    let status = 'Upcoming';
    if (end < now) status = 'Completed';
    else if (start <= now) status = 'Live';

    return {
      id: f._id,
      name: f.name,
      status,
      bookings: Math.floor(Math.random() * 500) + 50,
      attendees: 0,
      rating: averageRating > 0 ? averageRating : 0,
      health: getEventHealth(100, averageRating)
    };
  });

  const sortedEvents = [...EVENT_PERFORMANCE].sort((a, b) => {
    if (sortBy === 'Bookings') return b.bookings - a.bookings;
    if (sortBy === 'Attendees') return b.attendees - a.attendees;
    if (sortBy === 'Rating') return b.rating - a.rating;
    return 0;
  });

  const handleExportReport = () => {
    const headers = ['Event Name', 'Status', 'Bookings', 'Attendees', 'Rating', 'Health'];
    const csvContent = [
      headers.join(','),
      ...sortedEvents.map(e => [
        `"${e.name}"`,
        e.status,
        e.bookings,
        e.attendees,
        e.rating,
        e.health
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Ticket className="w-5 h-5" />
            </div>
            <Badge className="bg-emerald-50 text-emerald-600 border-none flex items-center gap-1 text-[10px] px-1.5 py-0.5">
              <TrendingUp className="w-3 h-3" /> +12%
            </Badge>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Total Bookings</p>
            <p className="text-2xl font-bold text-primary">{totalBookings.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <Badge className="bg-emerald-50 text-emerald-600 border-none flex items-center gap-1 text-[10px] px-1.5 py-0.5">
              <TrendingUp className="w-3 h-3" /> +18%
            </Badge>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Total Attendees</p>
            <p className="text-2xl font-bold text-primary">{totalAttendees.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Active Events</p>
            <p className="text-2xl font-bold text-primary">{activeEvents}</p>
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
            <p className="text-2xl font-bold text-primary">{completedEvents}</p>
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
            <AreaChart data={BOOKING_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              />
              <Area type="monotone" dataKey="attendees" name="Attendees" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorAttendees)" />
              <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
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
                <option value="Attendees">Sort by Attendees</option>
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
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Attendees</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedEvents.length > 0 ? (
                  sortedEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-ethio-bg/30 transition-colors cursor-pointer group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold text-primary group-hover:text-secondary transition-colors">{event.name}</p>
                          {event.health === 'high-demand' && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-bold">
                              <Flame className="w-3 h-3" /> High Demand
                            </div>
                          )}
                          {event.health === 'top-rated' && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold">
                              <Award className="w-3 h-3" /> Top Rated
                            </div>
                          )}
                          {event.health === 'low-booking' && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3" /> Low Booking
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge className={`border-none ${
                          event.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          event.status === 'Live' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {event.status}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-sm font-bold text-primary">{event.bookings.toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-sm font-bold text-indigo-600">{event.attendees.toLocaleString()}</p>
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
        <div className="lg:col-span-1 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
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

          <div className="space-y-4 flex-1">
            {[
              { star: 5, percent: 75 },
              { star: 4, percent: 15 },
              { star: 3, percent: 7 },
              { star: 2, percent: 2 },
              { star: 1, percent: 1 },
            ].map((dist) => (
              <div key={dist.star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-8 shrink-0">
                  <span className="text-sm font-bold text-gray-700">{dist.star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full" 
                    style={{ width: `${dist.percent}%` }}
                  />
                </div>
                <div className="w-8 text-right shrink-0">
                  <span className="text-xs text-gray-500">{dist.percent}%</span>
                </div>
              </div>
            ))}
          </div>
          
          <Button variant="outline" className="w-full mt-8" onClick={() => router.push('/dashboard/organizer/reviews')}>View All Reviews</Button>
        </div>
      </div>
    </div>
  );
};
export default OrganizerAnalyticsPage;
