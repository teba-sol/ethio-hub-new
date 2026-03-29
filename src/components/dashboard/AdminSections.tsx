import React, { useState } from 'react';
import { 
  BarChart3, Users, ShieldCheck, DollarSign, ShieldAlert,
  Calendar, UserCheck, History, Settings, MoreVertical,
  UserPlus, CheckCircle2, ImageIcon, Download, RefreshCw,
  FileText, AlertCircle
} from 'lucide-react';
import { Button, Badge, Input } from '../UI';
import { MOCK_FESTIVALS, MOCK_PRODUCTS } from '../../data/constants';
import { 
  CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis
} from 'recharts';

const REVENUE_DATA = [
  { name: 'Jan', revenue: 45000, bookings: 120, users: 400, sales: 85 },
  { name: 'Feb', revenue: 52000, bookings: 145, users: 450, sales: 92 },
  { name: 'Mar', revenue: 48000, bookings: 130, users: 480, sales: 110 },
  { name: 'Apr', revenue: 61000, bookings: 170, users: 520, sales: 130 },
  { name: 'May', revenue: 55000, bookings: 155, users: 590, sales: 125 },
  { name: 'Jun', revenue: 67000, bookings: 190, users: 650, sales: 150 },
  { name: 'Jul', revenue: 72000, bookings: 210, users: 710, sales: 180 },
];

export const AdminOverview: React.FC = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <header className="flex justify-between items-end">
      <div><h1 className="text-3xl font-serif font-bold text-primary">System Overview</h1><p className="text-gray-500 text-sm mt-1">Live data monitoring.</p></div>
      <div className="flex space-x-3"><Button variant="outline" size="sm" leftIcon={Download}>Reports</Button><Button variant="primary" size="sm" leftIcon={RefreshCw}>Sync</Button></div>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {[
        { label: 'Total Users', val: '1,284', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Organizers', val: '42', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Total Artisans', val: '156', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Active Events', val: '18', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Platform Rev', val: 'ETB 1.2M', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
      ].map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p><p className="text-2xl font-bold text-primary">{stat.val}</p></div>
          <div className={`p-3 ${stat.bg} rounded-xl`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-primary mb-8">Revenue & Growth</h3>
        <div className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={REVENUE_DATA}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} /><Tooltip /><Area type="monotone" dataKey="revenue" stroke="#0F4C3A" fill="#0F4C3A" fillOpacity={0.05} strokeWidth={3} /></AreaChart></ResponsiveContainer></div>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col"><h3 className="text-lg font-bold text-primary mb-6">Urgent Actions</h3><div className="flex-1 space-y-4">{[{ label: 'Event Approval', desc: 'Timket 2026 pending', icon: Calendar, color: 'text-amber-500', count: 3 }].map((alert, i) => (<div key={i} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-ethio-bg transition-all cursor-pointer"><div className={`p-2 bg-white rounded-lg shadow-sm`}><alert.icon className={`w-5 h-5 ${alert.color}`} /></div><div className="flex-1"><div className="flex justify-between items-center mb-0.5"><p className="text-sm font-bold text-primary">{alert.label}</p><span className="text-[10px] font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{alert.count}</span></div><p className="text-[11px] text-gray-400 leading-tight">{alert.desc}</p></div></div>))}</div></div>
    </div>
  </div>
);

export const AdminUserManagement: React.FC = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center"><h2 className="text-2xl font-serif font-bold text-primary">User Directory</h2><Button leftIcon={UserPlus} size="sm">Add Staff</Button></div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto"><table className="w-full text-left text-sm min-w-[600px]"><thead className="bg-gray-50 border-b border-gray-100"><tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest"><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-50">{[1, 2, 3].map(i => (<tr key={i} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-4"><div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-gray-200" /><div><p className="font-bold text-primary">User {i}</p><p className="text-xs text-gray-400">user{i}@example.com</p></div></div></td><td className="px-6 py-4"><Badge variant="info">Tourist</Badge></td><td className="px-6 py-4"><Badge variant="success">Active</Badge></td><td className="px-6 py-4 text-right"><MoreVertical className="w-4 h-4 ml-auto text-gray-400" /></td></tr>))}</tbody></table></div>
  </div>
);

export const AdminEventVerification: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-serif font-bold text-primary">Event Approvals</h2>
    <div className="grid grid-cols-1 gap-4">{MOCK_FESTIVALS.map(f => (<div key={f.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"><div className="flex items-center space-x-4"><img src={f.coverImage} className="w-16 h-16 rounded-xl object-cover" alt="" /><div><h3 className="font-bold text-primary">{f.name}</h3><p className="text-xs text-gray-400">{f.locationName}</p></div></div><div className="flex space-x-2"><Button variant="outline" size="sm" className="text-red-500 border-red-100">Reject</Button><Button size="sm">Approve</Button></div></div>))}</div>
  </div>
);

export const AdminProductVerification: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-serif font-bold text-primary">Product Moderation</h2>
    <div className="grid grid-cols-1 gap-4">{MOCK_PRODUCTS.map(p => (<div key={p.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"><div className="flex items-center space-x-4"><img src={p.images[0]} className="w-16 h-16 rounded-xl object-cover" alt="" /><div><h3 className="font-bold text-primary">{p.name}</h3><p className="text-xs text-gray-400">by {p.artisanName}</p></div></div><div className="flex space-x-2"><Button variant="outline" size="sm">View</Button><Button size="sm">Approve</Button></div></div>))}</div>
  </div>
);

export const AdminRevenue: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-serif font-bold text-primary">Financial Health</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center"><p className="text-xs font-bold text-gray-400 uppercase mb-2">Total GMV</p><p className="text-3xl font-bold text-primary">ETB 4.2M</p></div><div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center"><p className="text-xs font-bold text-gray-400 uppercase mb-2">Platform Commission</p><p className="text-3xl font-bold text-emerald-600">ETB 630k</p></div><div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center"><p className="text-xs font-bold text-gray-400 uppercase mb-2">Pending Payouts</p><p className="text-3xl font-bold text-amber-500">ETB 1.1M</p></div></div>
  </div>
);
