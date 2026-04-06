import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, 
  Download, Calendar, ArrowUpRight, ArrowDownLeft,
  PieChart, BarChart2, RefreshCw, Wallet, Package,
  Filter, Search, AlertTriangle, CheckCircle2, XCircle,
  Settings, FileText, ChevronDown, User, Eye, Flag,
  Clock, MapPin, Phone, Mail, ShieldCheck, ExternalLink,
  ArrowRight
} from 'lucide-react';
import { Button, Badge } from '../../components/UI';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, BarChart, Bar, Legend, PieChart as RePieChart, 
  Pie, Cell 
} from 'recharts';

// --- Mock Data ---
const MOCK_TRANSACTIONS = Array.from({ length: 20 }).map((_, i) => {
  const isEvent = i % 2 === 0;
  const gross = 1500 + (i * 100);
  const commissionRate = isEvent ? 15 : 12;
  const commission = gross * (commissionRate / 100);
  const date = new Date();
  date.setDate(date.getDate() - i);
  const time = "14:30:45";
  
  return {
    id: `TRX-${8800 + i}`,
    date: date.toISOString().split('T')[0],
    time,
    type: isEvent ? 'Event Booking' : 'Product Sale',
    sellerType: isEvent ? 'Organizer' : 'Artisan',
    sellerName: isEvent ? 'Addis Events PLC' : 'Sara Crafts',
    sellerVerified: true,
    buyerName: `Tourist ${i + 1}`,
    buyerEmail: `tourist${i+1}@example.com`,
    buyerPhone: `+251 911 ${100000 + i}`,
    item: isEvent ? 'Timket Festival Ticket' : 'Handwoven Scarf',
    itemImage: isEvent 
      ? "https://picsum.photos/seed/event/400/300" 
      : "https://picsum.photos/seed/product/400/300",
    itemDetails: isEvent 
      ? { date: "2025-11-15", location: "Meskel Square, Addis Ababa", ticketType: "VIP" }
      : { materials: "Pure Cotton", weight: "200g", dimensions: "180x40cm" },
    paymentMethod: i % 3 === 0 ? 'Telebirr' : i % 3 === 1 ? 'CBE Birr' : 'Chapa (Card)',
    paymentRef: `REF-${Math.random().toString(36).substring(7).toUpperCase()}`,
    gatewayResponse: "Success - Payment authorized",
    gross,
    commissionRate,
    commission,
    net: gross - commission,
    taxes: gross * 0.02,
    status: i === 0 ? 'Pending' : i === 5 ? 'Refunded' : i === 10 ? 'Failed' : 'Completed',
    isSuspicious: i === 4,
    suspiciousReason: 'Unusually high amount for this user',
    timeline: [
      { label: 'Order placed', time: `${date.toISOString().split('T')[0]} 14:25`, status: 'completed' },
      { label: 'Payment confirmed', time: `${date.toISOString().split('T')[0]} 14:30`, status: 'completed' },
      { label: 'Payout requested', time: i > 0 ? `${date.toISOString().split('T')[0]} 16:00` : null, status: i > 0 ? 'completed' : 'pending' },
      { label: 'Payout approved', time: i > 1 ? `${date.toISOString().split('T')[0]} 18:00` : null, status: i > 1 ? 'completed' : 'pending' },
    ]
  };
});

const MOCK_PAYOUT_REQUESTS = Array.from({ length: 8 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i * 2);
  return {
    id: `PAY-${200 + i}`,
    user: i % 2 === 0 ? 'Addis Events PLC' : 'Kebede Pottery',
    userType: i % 2 === 0 ? 'Organizer' : 'Artisan',
    availableBalance: 50000 + (i * 5000),
    requestedAmount: 20000 + (i * 2000),
    requestDate: date.toISOString().split('T')[0],
    status: i < 2 ? 'Pending' : 'Processed',
  };
});

const REVENUE_TREND_DATA = Array.from({ length: 12 }).map((_, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  revenue: Math.floor(Math.random() * 500000) + 200000,
  commission: Math.floor(Math.random() * 75000) + 30000,
  payouts: Math.floor(Math.random() * 400000) + 150000,
}));

const PAYMENT_METHOD_DATA = [
  { name: 'Telebirr', value: 450000, color: '#10b981' },
  { name: 'CBE Birr', value: 320000, color: '#f59e0b' },
  { name: 'Chapa (Card)', value: 280000, color: '#3b82f6' },
  { name: 'Other', value: 50000, color: '#6b7280' },
];

const REFUNDS = Array.from({ length: 3 }).map((_, i) => ({
  id: `REF-${900 + i}`,
  originalTrx: `TRX-${8800 + i}`,
  user: `User ${i + 10}`,
  amount: 1500,
  type: i === 0 ? 'Full' : 'Partial',
  reason: 'Event Cancelled',
  processedBy: 'Admin Sarah',
  date: '2025-10-20'
}));

// --- Components ---

const TransactionDetailModal: React.FC<{ 
  trx: typeof MOCK_TRANSACTIONS[0]; 
  onClose: () => void;
  onAction: (id: string, action: string) => void;
}> = ({ trx, onClose, onAction }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
      {/* Modal Header */}
      <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-800">Transaction Details</h2>
            <p className="text-sm text-gray-500 font-mono">{trx.id} • {trx.date} {trx.time}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <XCircle className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-h-[70vh] overflow-y-auto">
        {/* Left Column: Info Sections */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Parties Involved */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buyer Info */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User className="w-3 h-3" /> Buyer Information
              </h3>
              <div className="space-y-3">
                <p className="font-bold text-gray-800">{trx.buyerName}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" /> {trx.buyerEmail}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" /> {trx.buyerPhone}
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Seller Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-gray-800">{trx.sellerName}</p>
                  <Badge variant="success" size="sm">Verified</Badge>
                </div>
                <p className="text-xs text-gray-500">{trx.sellerType}</p>
                <button className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                  View Profile <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. Item Details */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Package className="w-3 h-3" /> Item Details
            </h3>
            <div className="flex flex-col md:flex-row gap-6">
              <img 
                src={trx.itemImage} 
                alt={trx.item} 
                className="w-full md:w-48 h-32 object-cover rounded-xl border border-gray-100"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{trx.item}</h4>
                  <Badge variant="secondary" className="mt-1">{trx.type}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {trx.type === 'Event Booking' ? (
                    <>
                      <div>
                        <p className="text-gray-400 text-xs uppercase font-bold">Event Date</p>
                        <p className="text-gray-700">{(trx.itemDetails as any).date}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase font-bold">Ticket Type</p>
                        <p className="text-gray-700">{(trx.itemDetails as any).ticketType}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs uppercase font-bold">Location</p>
                        <p className="text-gray-700 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {(trx.itemDetails as any).location}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-gray-400 text-xs uppercase font-bold">Materials</p>
                        <p className="text-gray-700">{(trx.itemDetails as any).materials}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase font-bold">Dimensions</p>
                        <p className="text-gray-700">{(trx.itemDetails as any).dimensions}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Payment Details */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard className="w-3 h-3" /> Payment & Gateway Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Method</p>
                <p className="text-gray-700 font-medium">{trx.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Reference ID</p>
                <p className="text-gray-700 font-mono text-xs">{trx.paymentRef}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Gateway Response</p>
                <p className="text-emerald-600 text-xs font-medium">{trx.gatewayResponse}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financials & Timeline */}
        <div className="space-y-8">
          {/* Financial Breakdown */}
          <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Financial Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Gross Amount</span>
                <span className="font-bold">ETB {trx.gross.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Commission ({trx.commissionRate}%)</span>
                <span className="text-red-400 font-bold">- ETB {trx.commission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Taxes/Fees (2%)</span>
                <span className="text-red-400 font-bold">- ETB {trx.taxes.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                <span className="text-lg font-serif">Net Payout</span>
                <span className="text-2xl font-bold text-emerald-400">ETB {(trx.net - trx.taxes).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Transaction Timeline
            </h3>
            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
              {trx.timeline.map((step, idx) => (
                <div key={idx} className="relative pl-8">
                  <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${
                    step.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-200'
                  }`} />
                  <p className={`text-sm font-bold ${step.status === 'completed' ? 'text-gray-800' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {step.time && <p className="text-[10px] text-gray-400">{step.time}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Admin Actions</h3>
            {trx.status === 'Pending' && (
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => onAction(trx.id, 'Approve')}>
                Approve Payout
              </Button>
            )}
            <Button variant="outline" className="w-full text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => onAction(trx.id, 'Flag')}>
              Flag for Review
            </Button>
            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => onAction(trx.id, 'Refund')}>
              Process Refund
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatCard: React.FC<{ 
  label: string; 
  value: string; 
  subValue?: string;
  trend?: string; 
  trendUp?: boolean; 
  icon: any; 
  color: string;
}> = ({ label, value, subValue, trend, trendUp, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
    <div className={`absolute top-0 right-0 p-4 opacity-10 ${color.replace('bg-', 'text-')}`}>
      <Icon className="w-16 h-16" />
    </div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
    <div className="relative z-10">
      <h3 className="text-2xl font-bold text-gray-800 mb-1">{value}</h3>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
    </div>
  </div>
);

export const AdminRevenuePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'payouts' | 'refunds' | 'settings'>('transactions');
  const [dateRange, setDateRange] = useState('This Month');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  
  // Tab-specific filters
  const [trxSearch, setTrxSearch] = useState('');
  const [trxDateRange, setTrxDateRange] = useState({ start: '', end: '' });
  const [showTrxDatePicker, setShowTrxDatePicker] = useState(false);
  
  const [payoutDateRange, setPayoutDateRange] = useState({ start: '', end: '' });
  const [showPayoutDatePicker, setShowPayoutDatePicker] = useState(false);

  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [payoutRequests, setPayoutRequests] = useState(MOCK_PAYOUT_REQUESTS);
  const [selectedTrx, setSelectedTrx] = useState<typeof MOCK_TRANSACTIONS[0] | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSyncData = () => {
    setIsSyncing(true);
    // Simulate API call to sync with payment gateways
    setTimeout(() => {
      setIsSyncing(false);
      alert('Financial data synchronized successfully with Telebirr, CBE Birr, and Chapa gateways.');
    }, 2000);
  };

  const handleExportReport = () => {
    setIsExporting(true);
    // Simulate report generation and download
    setTimeout(() => {
      setIsExporting(false);
      alert('Financial report (PDF/CSV) has been generated and is now downloading.');
    }, 1500);
  };

  const handlePayoutAction = (id: string, newStatus: 'Processed' | 'Rejected') => {
    setPayoutRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: newStatus } : req
    ));
  };

  const handleTrxAction = (id: string, action: string) => {
    if (action === 'Approve') {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
    } else if (action === 'Refund') {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'Refunded' } : t));
    } else if (action === 'Flag') {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, isSuspicious: true, suspiciousReason: 'Flagged by Admin' } : t));
    }
    setSelectedTrx(null);
  };

  const filteredTransactions = transactions.filter(trx => {
    const matchesSearch = trx.id.toLowerCase().includes(trxSearch.toLowerCase()) ||
                          trx.sellerName.toLowerCase().includes(trxSearch.toLowerCase()) ||
                          trx.buyerName.toLowerCase().includes(trxSearch.toLowerCase()) ||
                          trx.item.toLowerCase().includes(trxSearch.toLowerCase());
    
    const matchesDate = !trxDateRange.start || !trxDateRange.end || 
                        (trx.date >= trxDateRange.start && trx.date <= trxDateRange.end);
    
    return matchesSearch && matchesDate;
  });

  const filteredPayouts = payoutRequests.filter(req => {
    const matchesDate = !payoutDateRange.start || !payoutDateRange.end || 
                        (req.requestDate >= payoutDateRange.start && req.requestDate <= payoutDateRange.end);
    return matchesDate;
  });

  // Mock stats based on dateRange selection
  const getStats = () => {
    switch(dateRange) {
      case 'Today': return { gross: 'ETB 450K', comm: 'ETB 67K', refunds: 'ETB 2K', pending: 'ETB 120K', net: 'ETB 380K' };
      case 'This Week': return { gross: 'ETB 2.8M', comm: 'ETB 420K', refunds: 'ETB 12K', pending: 'ETB 450K', net: 'ETB 2.3M' };
      case 'This Year': return { gross: 'ETB 48M', comm: 'ETB 7.2M', refunds: 'ETB 180K', pending: 'ETB 2.1M', net: 'ETB 40M' };
      default: return { gross: 'ETB 12.5M', comm: 'ETB 1.8M', refunds: 'ETB 45K', pending: 'ETB 850K', net: 'ETB 10.5M' };
    }
  };

  const stats = getStats();

  const DatePickerDropdown = ({ 
    range, 
    setRange, 
    show, 
    setShow 
  }: { 
    range: { start: string, end: string }, 
    setRange: (r: { start: string, end: string }) => void,
    show: boolean,
    setShow: (s: boolean) => void
  }) => (
    <div className="relative">
      <Button 
        variant={range.start ? 'primary' : 'outline'} 
        size="sm" 
        leftIcon={Calendar}
        onClick={() => setShow(!show)}
      >
        {range.start ? `${range.start} - ${range.end}` : 'Date Range'}
      </Button>
      {show && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-30 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Start Date</label>
              <input 
                type="date" 
                className="w-full bg-gray-50 border-none rounded-xl p-2 text-xs"
                value={range.start}
                onChange={(e) => setRange({ ...range, start: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">End Date</label>
              <input 
                type="date" 
                className="w-full bg-gray-50 border-none rounded-xl p-2 text-xs"
                value={range.end}
                onChange={(e) => setRange({ ...range, end: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" size="sm" onClick={() => setShow(false)}>Apply</Button>
              <Button className="flex-1" variant="ghost" size="sm" onClick={() => {
                setRange({ start: '', end: '' });
                setShow(false);
              }}>Clear</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800">Financial Overview</h1>
          <p className="text-gray-500 text-sm">Monitor platform revenue, commissions, and payouts.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select 
              className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                if (e.target.value === 'Custom Range') setShowCustomPicker(true);
              }}
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
              <option>Custom Range</option>
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            
            {showCustomPicker && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-30 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-800">Custom Range</h4>
                    <button onClick={() => setShowCustomPicker(false)}><XCircle className="w-4 h-4 text-gray-400" /></button>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Start Date</label>
                    <input type="date" className="w-full bg-gray-50 border-none rounded-xl p-2 text-xs" value={customRange.start} onChange={(e) => setCustomRange({...customRange, start: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">End Date</label>
                    <input type="date" className="w-full bg-gray-50 border-none rounded-xl p-2 text-xs" value={customRange.end} onChange={(e) => setCustomRange({...customRange, end: e.target.value})} />
                  </div>
                  <Button className="w-full" size="sm" onClick={() => setShowCustomPicker(false)}>Apply Range</Button>
                </div>
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            leftIcon={Download} 
            onClick={handleExportReport}
            isLoading={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Report'}
          </Button>
          <Button 
            leftIcon={RefreshCw} 
            onClick={handleSyncData}
            isLoading={isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </Button>
        </div>
      </div>

      {/* 1. Summary Cards (6 Key Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard 
          label="Gross Sales" 
          value={stats.gross} 
          trend="+15.2%" 
          trendUp={true} 
          icon={DollarSign} 
          color="bg-blue-500" 
        />
        <StatCard 
          label="Platform Commission" 
          value={stats.comm} 
          trend="+12.5%" 
          trendUp={true} 
          icon={PieChart} 
          color="bg-emerald-500" 
        />
        <StatCard 
          label="Total Refunds" 
          value={stats.refunds} 
          trend="-2.1%" 
          trendUp={true} 
          icon={RefreshCw} 
          color="bg-red-500" 
        />
        <StatCard 
          label="Pending Payouts" 
          value={stats.pending} 
          subValue="12 Requests"
          icon={Wallet} 
          color="bg-amber-500" 
        />
        <StatCard 
          label="Completed Payouts" 
          value="ETB 9.2M" 
          trend="+8.4%" 
          trendUp={true} 
          icon={CheckCircle2} 
          color="bg-purple-500" 
        />
        <StatCard 
          label="Net Profit" 
          value={stats.net} 
          subValue="After Ops Costs"
          trend="+10.1%" 
          trendUp={true} 
          icon={TrendingUp} 
          color="bg-indigo-500" 
        />
      </div>

      {/* 2. Financial Summary Row */}
      <div className="bg-gray-900 text-white p-4 rounded-2xl flex flex-wrap justify-between items-center gap-4 text-sm shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Gross Sales:</span>
          <span className="font-bold text-emerald-400">ETB 12,500,000</span>
        </div>
        <div className="w-px h-4 bg-gray-700 hidden md:block"></div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Commission Earned:</span>
          <span className="font-bold text-blue-400">ETB 1,875,000</span>
        </div>
        <div className="w-px h-4 bg-gray-700 hidden md:block"></div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Refunded:</span>
          <span className="font-bold text-red-400">ETB 45,000</span>
        </div>
        <div className="w-px h-4 bg-gray-700 hidden md:block"></div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Net Seller Earnings:</span>
          <span className="font-bold text-white">ETB 10,580,000</span>
        </div>
        <div className="w-px h-4 bg-gray-700 hidden md:block"></div>
        <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-lg border border-gray-700">
          <span className="text-gray-400">Platform Balance:</span>
          <span className="font-bold text-emerald-400">ETB 1,830,000</span>
        </div>
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue & Payout Trends</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_TREND_DATA}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`ETB ${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="payouts" name="Payouts" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPay)" />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Payment Methods</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={PAYMENT_METHOD_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {PAYMENT_METHOD_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `ETB ${value.toLocaleString()}`} />
                <Legend verticalAlign="bottom" layout="vertical" iconType="circle" />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Tabbed Interface */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
        {/* Tabs Header */}
        <div className="border-b border-gray-100 px-8 pt-6 flex gap-8 overflow-x-auto">
          {[
            { id: 'transactions', label: 'Transactions', icon: FileText },
            { id: 'payouts', label: 'Payout Requests', icon: Wallet },
            { id: 'refunds', label: 'Refunds', icon: RefreshCw },
            { id: 'settings', label: 'Commission Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'text-primary border-primary' 
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8">
          
          {/* TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search ID, Seller, Buyer, Item..." 
                    className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-primary/20 w-64" 
                    value={trxSearch}
                    onChange={(e) => setTrxSearch(e.target.value)}
                  />
                </div>
                <select className="px-4 py-2 bg-gray-50 rounded-xl text-sm border-none text-gray-600 font-medium cursor-pointer">
                  <option>All Types</option>
                  <option>Event Booking</option>
                  <option>Product Sale</option>
                </select>
                <DatePickerDropdown 
                  range={trxDateRange} 
                  setRange={setTrxDateRange} 
                  show={showTrxDatePicker} 
                  setShow={setShowTrxDatePicker} 
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Transaction ID</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4">Seller</th>
                      <th className="px-6 py-4">Buyer</th>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4">Financials</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredTransactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-800">{trx.id}</span>
                            {trx.isSuspicious && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700 text-xs">{trx.date}</p>
                          <p className="text-[10px] text-gray-400">{trx.time}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-bold text-gray-700 text-xs">{trx.sellerName}</p>
                              <p className="text-[10px] text-gray-400">{trx.sellerType}</p>
                            </div>
                            <button className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3 h-3 text-primary" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-700 text-xs">{trx.buyerName}</p>
                          <p className="text-[10px] text-gray-400">{trx.buyerEmail}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800 text-xs truncate max-w-[120px]">{trx.item}</p>
                          <Badge variant="secondary" size="sm" className="mt-1">{trx.type}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-right">
                            <p className="font-bold text-gray-800 text-xs">Gross: ETB {trx.gross.toLocaleString()}</p>
                            <p className="text-[10px] text-emerald-600 font-medium">Comm: +{trx.commission.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-500">Net: ETB {trx.net.toLocaleString()}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={
                            trx.status === 'Completed' ? 'success' : 
                            trx.status === 'Refunded' ? 'secondary' : 
                            trx.status === 'Failed' ? 'error' : 'warning'
                          } size="sm">
                            {trx.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setSelectedTrx(trx)}
                              className="p-2 hover:bg-primary/10 rounded-xl text-primary transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleTrxAction(trx.id, 'Flag')}
                              className="p-2 hover:bg-amber-100 rounded-xl text-amber-600 transition-colors"
                              title="Flag for Review"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAYOUT REQUESTS TAB */}
          {activeTab === 'payouts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Pending & Recent Payouts</h3>
                <DatePickerDropdown 
                  range={payoutDateRange} 
                  setRange={setPayoutDateRange} 
                  show={showPayoutDatePicker} 
                  setShow={setShowPayoutDatePicker} 
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Request ID</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Available Balance</th>
                      <th className="px-6 py-4">Requested Amount</th>
                      <th className="px-6 py-4">Request Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPayouts.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-600">{req.id}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-700">{req.user}</p>
                          <p className="text-xs text-gray-400">{req.userType}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">ETB {req.availableBalance.toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">ETB {req.requestedAmount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-500">{req.requestDate}</td>
                        <td className="px-6 py-4">
                          <Badge variant={
                            req.status === 'Processed' ? 'success' : 
                            req.status === 'Rejected' ? 'error' : 'warning'
                          } size="sm">
                            {req.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {req.status === 'Pending' && (
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500 h-8 text-[10px]"
                                onClick={() => handlePayoutAction(req.id, 'Processed')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 border-red-200 h-8 text-[10px] hover:bg-red-50"
                                onClick={() => handlePayoutAction(req.id, 'Rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REFUNDS TAB */}
          {activeTab === 'refunds' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Refund ID</th>
                      <th className="px-6 py-4">Original Trx</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Processed By</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {REFUNDS.map((ref) => (
                      <tr key={ref.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-600">{ref.id}</td>
                        <td className="px-6 py-4 font-mono text-blue-600 cursor-pointer hover:underline">{ref.originalTrx}</td>
                        <td className="px-6 py-4 text-gray-700">{ref.user}</td>
                        <td className="px-6 py-4 font-bold text-red-600">- ETB {ref.amount.toLocaleString()}</td>
                        <td className="px-6 py-4"><Badge variant="secondary" size="sm">{ref.type}</Badge></td>
                        <td className="px-6 py-4 text-gray-600">{ref.reason}</td>
                        <td className="px-6 py-4 text-gray-500">{ref.processedBy}</td>
                        <td className="px-6 py-4 text-gray-500">{ref.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COMMISSION SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-8">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2">Global Commission Rates</h3>
                <p className="text-sm text-blue-700 mb-6">These rates apply to all transactions unless a custom rate is set for a specific seller.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Event Booking Commission (%)</label>
                    <div className="flex gap-2">
                      <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-primary/20" defaultValue={15} />
                      <Button>Save</Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Product Sale Commission (%)</label>
                    <div className="flex gap-2">
                      <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-primary/20" defaultValue={12} />
                      <Button>Save</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Custom Seller Rates</h3>
                  <Button size="sm" variant="outline" leftIcon={User}>Add Custom Rate</Button>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-gray-500 font-medium">Seller Name</th>
                        <th className="px-4 py-3 text-gray-500 font-medium">Type</th>
                        <th className="px-4 py-3 text-gray-500 font-medium">Custom Rate</th>
                        <th className="px-4 py-3 text-gray-500 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 font-bold text-gray-700">Addis Events PLC</td>
                        <td className="px-4 py-3 text-gray-500">Organizer</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">10%</td>
                        <td className="px-4 py-3 text-right"><button className="text-blue-600 hover:underline text-xs">Edit</button></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-gray-700">Premium Crafts</td>
                        <td className="px-4 py-3 text-gray-500">Artisan</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">8%</td>
                        <td className="px-4 py-3 text-right"><button className="text-blue-600 hover:underline text-xs">Edit</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Modals */}
      {selectedTrx && (
        <TransactionDetailModal 
          trx={selectedTrx} 
          onClose={() => setSelectedTrx(null)} 
          onAction={handleTrxAction}
        />
      )}
    </div>
  );
};
