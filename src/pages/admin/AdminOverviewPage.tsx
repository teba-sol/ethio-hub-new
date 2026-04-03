import React, { useState } from 'react';
import { 
  Users, Calendar, Package, DollarSign, AlertCircle, 
  TrendingUp, Activity, ShieldCheck, UserCheck, CreditCard,
  Flag, MessageSquare, ShoppingCart, Ticket, ArrowUpRight,
  ArrowDownLeft, Clock, Server, CheckCircle2, XCircle,
  Download, Settings, Palette, Globe
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { Button, Badge } from '../../components/UI';

import { useRouter } from 'next/navigation';

// --- Mock Data ---
const REVENUE_DATA = [
  { name: 'Jan', revenue: 45000, commission: 6750, eventComm: 4000, prodComm: 2750 },
  { name: 'Feb', revenue: 52000, commission: 7800, eventComm: 4500, prodComm: 3300 },
  { name: 'Mar', revenue: 48000, commission: 7200, eventComm: 4200, prodComm: 3000 },
  { name: 'Apr', revenue: 61000, commission: 9150, eventComm: 5500, prodComm: 3650 },
  { name: 'May', revenue: 55000, commission: 8250, eventComm: 4800, prodComm: 3450 },
  { name: 'Jun', revenue: 75000, commission: 11250, eventComm: 6500, prodComm: 4750 },
];

const USER_GROWTH_DATA = [
  { name: 'Week 1', tourists: 45, artisans: 5, organizers: 2 },
  { name: 'Week 2', tourists: 52, artisans: 8, organizers: 3 },
  { name: 'Week 3', tourists: 48, artisans: 6, organizers: 4 },
  { name: 'Week 4', tourists: 65, artisans: 12, organizers: 5 },
];

const PENDING_APPROVALS = [
  { id: 1, type: 'Event', name: 'Meskel Festival 2026', submitter: 'Addis Events', date: '2 hours ago' },
  { id: 2, type: 'Product', name: 'Handwoven Gabi', submitter: 'Sara Crafts', date: '5 hours ago' },
  { id: 3, type: 'Organizer', name: 'Ethio Tours PLC', submitter: 'Ethio Tours', date: '1 day ago' },
  { id: 4, type: 'Artisan', name: 'Lalibela Pottery', submitter: 'Kebede T.', date: '1 day ago' },
];

const PENDING_VERIFICATIONS = [
  { id: 1, name: 'John Doe', role: 'Organizer', date: '2 hours ago', avatar: 'J' },
  { id: 2, name: 'Sara Crafts', role: 'Artisan', date: '5 hours ago', avatar: 'S' },
  { id: 3, name: 'Abebe Kebede', role: 'Artisan', date: '1 day ago', avatar: 'A' },
];

const RECENT_ACTIVITY = [
  { id: 1, type: 'Registration', message: 'New Artisan "Gondar Crafts" registered', time: '10 mins ago', icon: UserCheck, color: 'text-emerald-500' },
  { id: 2, type: 'Submission', message: 'Event "Timket 2026" submitted for review', time: '25 mins ago', icon: Calendar, color: 'text-blue-500' },
  { id: 3, type: 'Booking', message: 'Large booking (ETB 15,000) confirmed', time: '1 hour ago', icon: DollarSign, color: 'text-purple-500' },
  { id: 4, type: 'Report', message: 'Product reported for copyright violation', time: '2 hours ago', icon: Flag, color: 'text-red-500' },
  { id: 5, type: 'Refund', message: 'Refund requested for Order #8821', time: '3 hours ago', icon: AlertCircle, color: 'text-amber-500' },
];

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

export const AdminOverviewPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('30days');
  const router = useRouter();

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

      {/* 0. User Demographics (New Section) */}
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
             <h3 className="text-4xl font-bold mb-1">12,450</h3>
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
             <h3 className="text-3xl font-bold text-gray-800">11,500</h3>
             <p className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
               <ArrowUpRight className="w-3 h-3" /> +8.5% growth
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
             <h3 className="text-3xl font-bold text-gray-800">850</h3>
             <p className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
               <ArrowUpRight className="w-3 h-3" /> +15% growth
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
             <h3 className="text-3xl font-bold text-gray-800">100</h3>
             <p className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
               <ArrowUpRight className="w-3 h-3" /> +4% growth
             </p>
           </div>
        </div>
      </div>

      {/* 1. Financial Overview (CRITICAL) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Revenue Card - Large & Prominent */}
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
                <h3 className="text-5xl font-bold mb-2 tracking-tight">ETB 4,250,000</h3>
                <p className="text-gray-400 font-medium">Total Platform Gross Revenue</p>
              </div>
              
              <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Commission Earned</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-emerald-400">ETB 630K</span>
                    <span className="text-[10px] text-emerald-500/60 font-bold">15% Avg</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Net Disbursed</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-blue-400">ETB 3.4M</span>
                    <span className="text-[10px] text-blue-500/60 font-bold">To Sellers</span>
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
                  <p className="text-[10px] text-red-500 font-bold">-2.4%</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Refund Volume</p>
              <h4 className="text-2xl font-bold text-gray-800">ETB 45,200</h4>
              <p className="text-xs text-gray-500 mt-1 font-medium">1.2% of total sales</p>
            </div>
          </div>
        </div>

        {/* New User Verification Card */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-t-4 border-t-primary">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <Badge variant="warning" className="animate-pulse">Action Required</Badge>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">Verifications</h3>
            <p className="text-xs text-gray-500 mb-6">3 new users need approval</p>
            
            <div className="space-y-4 mb-6">
              {PENDING_VERIFICATIONS.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group" onClick={() => router.push('/dashboard/admin/verification-moderation')}>
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{user.role} • {user.date}</p>
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
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Commission from Events</p>
              <p className="text-xl font-bold text-gray-800">ETB 285,000</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Commission from Products</p>
              <p className="text-xl font-bold text-gray-800">ETB 345,000</p>
            </div>
          </div>
        </div>

        {/* 3. Live Activity Feed */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <SectionHeader title="Live Activity" subtitle="Real-time platform updates" />
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-primary/20 transition-colors`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="absolute top-10 bottom-[-24px] left-1/2 w-px bg-gray-100 -translate-x-1/2 last:hidden"></div>
                </div>
                <div className="pb-6">
                  <p className="text-sm font-bold text-gray-800">{item.type}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.message}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-2">{item.time}</p>
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
          <p className="text-2xl font-bold text-gray-800">1,245</p>
          <p className="text-xs text-emerald-500 font-bold mt-1">+12% this week</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Ticket className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-400 uppercase">Event Bookings</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">856</p>
          <p className="text-xs text-emerald-500 font-bold mt-1">+5% this week</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Activity className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-400 uppercase">Avg Order Value</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">ETB 2,450</p>
          <p className="text-xs text-gray-500 font-bold mt-1">Per transaction</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg text-red-600"><XCircle className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-400 uppercase">Cancellation Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">2.4%</p>
          <p className="text-xs text-emerald-500 font-bold mt-1">-0.5% improvement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 5. User Growth (Improved) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <SectionHeader 
            title="User Growth" 
            subtitle="New registrations by user type"
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Weekly</Button>
                <Button size="sm" variant="ghost">Monthly</Button>
              </div>
            }
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
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-800">1,240</p>
              <p className="text-xs text-gray-500 font-bold uppercase">Active This Week</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">45</p>
              <p className="text-xs text-gray-500 font-bold uppercase">Inactive Sellers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">98%</p>
              <p className="text-xs text-gray-500 font-bold uppercase">Retention Rate</p>
            </div>
          </div>
        </div>

        {/* 6. Approval & Moderation Panel */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <SectionHeader title="Moderation Queue" subtitle="Pending items requiring action" />
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-amber-900">Pending Events</span>
              </div>
              <Badge variant="warning">12</Badge>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-blue-900">Pending Products</span>
              </div>
              <Badge variant="secondary">34</Badge>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center gap-3">
                <Flag className="w-5 h-5 text-red-600" />
                <span className="font-bold text-red-900">Reported Items</span>
              </div>
              <Badge variant="error">5</Badge>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-gray-600" />
                <span className="font-bold text-gray-900">Verification Requests</span>
              </div>
              <Badge variant="secondary">8</Badge>
            </div>
          </div>
          <Button className="w-full mt-6" onClick={() => router.push('/dashboard/admin/verification-moderation')}>Go to Moderation Center</Button>
        </div>
      </div>

      {/* 7. Top Performers & Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <SectionHeader title="Top Performers" subtitle="Highest revenue generators this month" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Top Event</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold">T</div>
                <div>
                  <p className="font-bold text-gray-800">Timket Festival 2026</p>
                  <p className="text-xs text-emerald-600 font-bold">ETB 450,000 Revenue</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Top Product</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">S</div>
                <div>
                  <p className="font-bold text-gray-800">Traditional Coffee Set</p>
                  <p className="text-xs text-emerald-600 font-bold">ETB 125,000 Sales</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Top Artisan</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">G</div>
                <div>
                  <p className="font-bold text-gray-800">Gondar Crafts</p>
                  <p className="text-xs text-emerald-600 font-bold">ETB 85,000 Revenue</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Top Organizer</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold">E</div>
                <div>
                  <p className="font-bold text-gray-800">Ethio Tours PLC</p>
                  <p className="text-xs text-emerald-600 font-bold">ETB 1.2M Revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <SectionHeader title="Risk & Security" subtitle="Potential issues detected" />
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Suspicious Transactions</span>
              <Badge variant="error">3</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Multiple Refund Accounts</span>
              <Badge variant="warning">1</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">High Cancellation Sellers</span>
              <Badge variant="warning">5</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Pending Verification</span>
              <Badge variant="secondary">12</Badge>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="font-bold text-gray-800 mb-4">System Health</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Server className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-emerald-700">Server OK</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Activity className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-emerald-700">API 99.9%</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CreditCard className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-emerald-700">Payments OK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
