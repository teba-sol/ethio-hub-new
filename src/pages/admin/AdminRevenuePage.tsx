import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Download, Calendar, CreditCard, Wallet,
  TrendingUp, Package, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { Button, Badge } from '../../components/UI';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid
} from 'recharts';

interface Transaction {
  _id: string;
  date: Date;
  type: string;
  sellerType: string;
  sellerName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  item: string;
  itemImage: string;
  paymentMethod: string;
  paymentRef: string;
  gross: number;
  commissionRate: number;
  commission: number;
  net: number;
  status: string;
}

interface RevenueStats {
  grossTotal: number;
  totalOrders: number;
  paymentMethodStats: { method: string; count: number; total: number }[];
}

export const AdminRevenuePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('all');
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch revenue data
        const res = await fetch(`/api/admin/revenue?period=${period}&status=all`);
        const data = await res.json();
        
        if (data.stats) {
          setStats(data.stats);
          setTransactions(data.transactions || []);
        } else if (data.message) {
          setError(data.message);
        }
      } catch (err) {
        console.error('Error fetching revenue:', err);
        setError('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const formatCurrency = (amount: number) => `ETB ${(amount || 0).toLocaleString()}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-ethio-bg p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Revenue Yet</h2>
            <p className="text-gray-500">No transactions have been completed yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ethio-bg p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Revenue Dashboard</h1>
            <p className="text-gray-500 text-sm">Platform commissions and earnings</p>
          </div>
          <div className="flex gap-3">
            <select 
              className="bg-white border border-gray-200 rounded-xl py-2.5 pl-4 pr-10 text-sm font-bold text-primary cursor-pointer"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <Button variant="outline" leftIcon={Download}>Export</Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
              <span className="text-xs font-bold text-gray-400 uppercase">Gross Revenue</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.grossTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">Total from all sales</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg"><Package className="w-5 h-5 text-amber-600" /></div>
              <span className="text-xs font-bold text-gray-400 uppercase">Total Orders</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.totalOrders}</p>
            <p className="text-xs text-gray-400 mt-1">Completed transactions</p>
          </div>
        </div>
        
        {/* Revenue Chart */}
        {transactions.length > 0 && (
          <div className="bg-white p-8 rounded-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-primary mb-6">Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={transactions.slice(0, 15)}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="item" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{fontSize: 12}} tickFormatter={(v: number) => `ETB ${v}`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                />
                <Area type="monotone" dataKey="gross" stroke="#10b981" strokeWidth={2} fill="url(#colorRev)" name="Gross" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-primary">Recent Transactions</h3>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-bold text-gray-400 uppercase">
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Type</th>
                    <th className="px-6 py-4 text-left">Item</th>
                    <th className="px-6 py-4 text-left">Artisan</th>
                    <th className="px-6 py-4 text-left">Buyer</th>
                    <th className="px-6 py-4 text-right">Gross</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((trx) => (
                    <tr key={trx._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {trx.date ? new Date(trx.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{trx.type}</Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">{trx.item}</td>
                      <td className="px-6 py-4 text-gray-600">{trx.sellerName}</td>
                      <td className="px-6 py-4 text-gray-600">{trx.buyerName}</td>
                      <td className="px-6 py-4 text-right font-bold text-primary">{formatCurrency(trx.gross)}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={trx.status === 'Paid' ? 'success' : 'warning'}>
                          {trx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="bg-blue-50 p-6 rounded-2xl">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-blue-800 mb-2">Revenue Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Gross Revenue</strong> - Total amount from all customer payments</li>
                <li>• All completed transactions are shown in the table above</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};