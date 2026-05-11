import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, DollarSign, Calendar, 
  Users, Package, TrendingUp, ArrowUpRight, 
  ArrowDownRight, ChevronRight, Download, 
  Clock, CreditCard, Shield, History, Tag, MapPin, XCircle
} from 'lucide-react';
import { Button, Badge } from '@/components/UI';

// --- Types ---
type EventStatus = 'Published' | 'Completed';
type PaymentStatus = 'Paid' | 'Pending Payout' | 'Refunded';

interface Booking {
  id: string;
  user: string;
  userImage?: string;
  email: string;
  date: string;
  quantity: number;
  totalPaid: number;
  paymentMethod: 'Telebirr' | 'Chapa' | 'CBE Birr' | 'Card';
  paymentStatus: 'Paid' | 'Refunded';
  transactionId: string;
  accommodation?: {
    hotel: string;
    roomType: string;
  };
}

// --- Activity Log ---
interface ActivityLog {
  date: string;
  action: string;
  user: string;
}

interface EventManagementData {
  id: string;
  title: string;
  organizer: string;
  organizerEmail: string;
  category: string;
  location: string;
  status: EventStatus;
  capacity: number;
  booked: number;
  ticketPrice: number;
  vipTicketPrice: number;
  revenue: number;
  commissionRate: number; // e.g., 10 for 10%
  refundAmount: number;
  paymentStatus: PaymentStatus;
  eventDate: string;
  createdAt: string;
  approvedAt: string;
  lastUpdated: string;
  bookings: Booking[];
  logs: ActivityLog[];
  // Detailed Organizer Info
  description: string;
  images: string[];
  schedule: { time: string; activity: string }[];
  hotels: { name: string; distance: string; price: string }[];
  transportation: { type: string; provider: string; details: string }[];
  services: string[];
  policies: string[];
}

export const AdminEventManagementPage: React.FC<{ initialId?: string }> = ({ initialId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState<EventManagementData | null>(null);
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [appliedDateRange, setAppliedDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventManagementData[]>([]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (data.success) {
        const mappedEvents: EventManagementData[] = data.requests
          .filter((req: any) => ['Published', 'Completed'].includes(req.status))
          .map((req: any) => ({
            ...req,
            organizer: req.organizer?.name || req.organizerName || 'Unknown',
            location: typeof req.location === 'object' 
              ? `${req.location.venue || ''}${req.location.venue && req.location.city ? ', ' : ''}${req.location.city || ''}`.trim() || 'Ethiopia'
              : req.location || 'Ethiopia',
            status: req.status as EventStatus,
            eventDate: req.date ? new Date(req.date).toISOString().split('T')[0] : 'N/A',
          }));
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (initialId && events.length > 0) {
      const event = events.find(e => e.id === initialId);
      if (event) {
        setSelectedEvent(event);
      }
    }
  }, [initialId, events]);

  const filteredEvents = events.filter(event => {
     const title = String(event.title || '');
     const organizer = String(event.organizer || '');
     const search = (searchQuery || '').toLowerCase();
     
     const matchesSearch = title.toLowerCase().includes(search) || 
                          organizer.toLowerCase().includes(search);
     
     const matchesStatus = statusFilter === 'All' || event.status === statusFilter;
     
     return matchesSearch && matchesStatus;
   });

  const stats = {
    totalEvents: events.length,
    totalBookings: events.reduce((sum, e) => sum + e.booked, 0),
    totalRevenue: events.reduce((sum, e) => sum + (e.revenue - (e.revenue * (e.commissionRate || 10) / 100)), 0),
    totalCommission: events.reduce((sum, e) => sum + (e.revenue * (e.commissionRate || 10) / 100), 0),
  };

  const EventDetailModal = ({ event, onClose }: { event: EventManagementData; onClose: () => void }) => {
    const commission = (event.revenue * event.commissionRate) / 100;
    const organizerEarnings = event.revenue - commission - event.refundAmount;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={
                  event.status === 'Published' ? 'info' : 
                  event.status === 'Completed' ? 'success' : 'warning'
                }>
                  {event.status}
                </Badge>
                <span className="text-xs text-gray-400 font-mono">ID: {event.id}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{event.title}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <XCircle className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Overview & Media (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Images Gallery */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Package className="w-4 h-4" /> Event Media
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(event.images || []).map((img, idx) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt={`Event ${idx}`} 
                        className={`rounded-xl object-cover w-full h-32 ${idx === 0 ? 'col-span-2 h-48' : ''}`}
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Core Information
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Organizer</span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">{event.organizer}</p>
                        <p className="text-[10px] text-gray-400">{event.organizerEmail}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Category</span>
                      <span className="text-sm font-bold text-gray-800">{event.category}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Location</span>
                      <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {event.location}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Regular Price</p>
                          <p className="text-lg font-bold text-primary">ETB {event.ticketPrice}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">VIP Price</p>
                          <p className="text-lg font-bold text-amber-600">ETB {event.vipTicketPrice}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services & Policies */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Services</h3>
                    <div className="flex flex-wrap gap-2">
                      {(event.services || []).map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Policies</h3>
                    <ul className="space-y-2">
                      {(event.policies || []).map((p, i) => (
                        <li key={i} className="text-[10px] text-gray-600 flex items-start gap-2">
                          <Shield className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Column: Schedule, Financials & Bookings (8 cols) */}
              <div className="lg:col-span-8 space-y-8">
                {/* Schedule & Logistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Schedule
                    </h3>
                    <div className="space-y-4">
                      {(event.schedule || []).map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-xl transition-colors">
                          <span className="text-xs font-bold text-primary">{item.time}</span>
                          <span className="text-xs text-gray-700">{item.activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Hotels & Transport
                      </h3>
                      <div className="space-y-3">
                        {(event.hotels || []).map((h, i) => (
                          <div key={i} className="text-xs flex justify-between">
                            <span className="font-bold text-gray-800">{h.name}</span>
                            <span className="text-gray-500">{h.distance} • {h.price}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-gray-100">
                          {(event.transportation || []).map((t, i) => (
                            <div key={i} className="mt-2">
                              <p className="text-[10px] font-bold text-primary uppercase">{t.type} - {t.provider}</p>
                              <p className="text-[10px] text-gray-500">{t.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Tickets Sold</p>
                    <p className="text-2xl font-bold text-emerald-900">{event.booked}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Gross Revenue</p>
                    <p className="text-2xl font-bold text-blue-900">ETB {event.revenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Commission (10%)</p>
                    <p className="text-2xl font-bold text-amber-900">ETB {commission.toLocaleString()}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Org. Earnings</p>
                    <p className="text-2xl font-bold text-indigo-900">ETB {organizerEarnings.toLocaleString()}</p>
                  </div>
                </div>

                {/* Booking List */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4" /> Booking List ({(event.bookings || []).length})
                    </h3>
                    <Button size="sm" variant="outline" leftIcon={Download}>Export CSV</Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50/50">
                        <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-3">User</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Qty</th>
                          <th className="px-6 py-3">Accommodation</th>
                          <th className="px-6 py-3">Total Paid</th>
                          <th className="px-6 py-3">Method</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">TXN ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(event.bookings || []).map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={booking.userImage || `https://ui-avatars.com/api/?name=${booking.user}&background=random`} 
                                  className="w-8 h-8 rounded-full border border-gray-200"
                                  alt=""
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <p className="font-bold text-gray-800">{booking.user}</p>
                                  <p className="text-[10px] text-gray-400">{booking.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-600">{booking.date}</td>
                            <td className="px-6 py-4 font-bold text-gray-800">{booking.quantity}</td>
                            <td className="px-6 py-4">
                              {booking.accommodation ? (
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-primary" /> {booking.accommodation.hotel}
                                  </p>
                                  <p className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block">
                                    {booking.accommodation.roomType}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">No Accommodation</span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-800">ETB {booking.totalPaid}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600">{booking.paymentMethod}</span>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={booking.paymentStatus === 'Paid' ? 'success' : 'error'} size="sm">
                                {booking.paymentStatus}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-mono text-gray-400">{booking.transactionId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {loading && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

      <div className="flex flex-col md:flex-row justify-end items-center gap-4">
        <Button variant="outline" leftIcon={Download}>Export Report</Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Events', value: stats.totalEvents.toString(), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Bookings', value: stats.totalBookings.toLocaleString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Revenue', value: `ETB ${(stats.totalRevenue / 1000).toFixed(1)}K`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Platform Comm.', value: `ETB ${(stats.totalCommission / 1000).toFixed(1)}K`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search events or organizers..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <select 
            className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Published">Published</option>
            <option value="Completed">Completed</option>
          </select>
          
          <div className="relative">
            <Button 
              variant={showDateRange ? 'primary' : 'ghost'} 
              size="sm" 
              leftIcon={Calendar}
              onClick={() => setShowDateRange(!showDateRange)}
            >
              Date Range
            </Button>
            
            {showDateRange && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-gray-50 border-none rounded-xl p-2 text-xs focus:ring-2 focus:ring-primary/20"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">End Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-gray-50 border-none rounded-xl p-2 text-xs focus:ring-2 focus:ring-primary/20"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1" 
                      size="sm" 
                      onClick={() => {
                        setAppliedDateRange(dateRange);
                        setShowDateRange(false);
                      }}
                    >
                      Apply
                    </Button>
                    <Button 
                      className="flex-1" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setDateRange({ start: '', end: '' });
                        setAppliedDateRange({ start: '', end: '' });
                        setShowDateRange(false);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Event Title</th>
                <th className="px-6 py-4">Organizer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Booked</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4">Comm.</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEvents.map((event) => {
                const commission = (event.revenue * event.commissionRate) / 100;
                return (
                  <tr key={event.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{event.title}</p>
                      <p className="text-[10px] text-gray-400">ID: {event.id}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">{event.organizer}</td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        event.status === 'Published' ? 'info' : 
                        event.status === 'Completed' ? 'success' : 'warning'
                      } size="sm">
                        {event.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">{event.capacity}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-emerald-600">{event.booked}</span>
                        <span className="text-[10px] text-amber-600 font-bold">{event.capacity - event.booked} left</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">ETB {event.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-amber-600">ETB {commission.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{event.eventDate}</td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedEvent(event)}>View Details</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminEventManagementPage;
