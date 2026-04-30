import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Download, Calendar, CreditCard, Wallet,
  TrendingUp, Clock, Package, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Button, Badge } from '../UI';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid
} from 'recharts';

interface OrderData {
  _id: string;
  date: string;
  productName: string;
  productImage: string;
  buyerName: string;
  quantity: number;
  gross: number;
  commission: number;
  net: number;
  status: string;
}

interface RevenueStats {
  grossTotal: number;
  totalOrders: number;
}

export const ArtisanRevenueManager: React.FC = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<{
    orders: OrderData[];
    stats: RevenueStats;
    revenueByProduct: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch revenue data
        const res = await fetch(`/api/artisan/revenue?period=${timeRange}`);
        const data = await res.json();
        
        if (data.message && !data.stats) {
          setError(data.message);
          setRevenueData(null);
        } else if (data.stats) {
          setRevenueData(data);
        }
      } catch (err) {
        console.error('Error fetching revenue:', err);
        setError('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [timeRange]);

  const stats = revenueData?.stats;
  const orders = revenueData?.orders || [];
  const revenueByProduct = revenueData?.revenueByProduct || [];

  const formatCurrency = (amount: number) => `ETB ${(amount || 0).toLocaleString()}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-ethio-bg p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Revenue Data</h2>
            <p className="text-gray-500">
              {error || 'You haven\'t made any sales yet. Share your products to start earning!'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ethio-bg p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Revenue Dashboard</h1>
            <p className="text-gray-500 text-sm">Track your earnings and sales</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select 
                className="bg-white border border-gray-200 rounded-xl py-2.5 pl-4 pr-10 text-sm font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
              <span className="text-xs font-bold text-gray-400 uppercase">Gross Sales</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.grossTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">Total sales</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
              <span className="text-xs font-bold text-gray-400 uppercase">Total Orders</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.totalOrders}</p>
            <p className="text-xs text-gray-400 mt-1">Completed orders</p>
          </div>
        </div>

        {/* Revenue Chart */}
        {orders.length > 0 && (
          <div className="bg-white p-8 rounded-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-primary mb-6">Sales Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={orders.slice(0, 20)}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="productName" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{fontSize: 12}} tickFormatter={(v: number) => `ETB ${v}`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="gross" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="url(#colorRevenue)" 
                  name="Gross"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-primary">Recent Orders</h3>
          </div>
           
          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-bold text-gray-400 uppercase">
                    <th className="px-6 py-4 text-left">Product</th>
                    <th className="px-6 py-4 text-left">Buyer</th>
                    <th className="px-6 py-4 text-left">Qty</th>
                    <th className="px-6 py-4 text-right">Gross</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {order.productImage ? (
                            <img src={order.productImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <span className="font-bold text-gray-800">{order.productName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{order.buyerName}</td>
                      <td className="px-6 py-4 text-gray-600">{order.quantity}</td>
                      <td className="px-6 py-4 text-right font-bold text-primary">{formatCurrency(order.gross)}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={order.status === 'Paid' ? 'success' : 'warning'}>
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sales by Product */}
        {revenueByProduct.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-primary mb-6">Sales by Product</h3>
            <div className="space-y-4">
              {revenueByProduct.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-bold text-gray-800">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.count} sales</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(item.totalSales)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 p-6 rounded-2xl">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-blue-800 mb-2">Revenue Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li><strong>Gross Revenue</strong> - Total amount from all customer payments</li>
                <li>Revenue is calculated based on completed orders</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};