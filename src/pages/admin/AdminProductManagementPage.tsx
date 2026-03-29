import React, { useState } from 'react';
import { 
  Search, Filter, Eye, DollarSign, Package, 
  Users, TrendingUp, ArrowUpRight, ArrowDownRight, 
  ChevronRight, Download, Clock, CreditCard, 
  History, Tag, ShoppingBag, AlertTriangle, CheckCircle2,
  XCircle, Calendar, ChevronDown, LayoutGrid
} from 'lucide-react';
import { Button, Badge } from '../../components/UI';

// --- Types ---
type ProductStatus = 'Active' | 'Out of Stock' | 'Disabled';
type PaymentStatus = 'Paid' | 'Pending Payout' | 'Refunded';

interface Order {
  id: string;
  customer: string;
  email: string;
  avatar?: string;
  date: string;
  quantity: number;
  totalPaid: number;
  paymentMethod: 'Telebirr' | 'Chapa' | 'CBE Birr' | 'Card';
  paymentStatus: 'Paid' | 'Refunded';
  transactionId: string;
}

interface StockLog {
  date: string;
  action: string;
  quantity: number;
  type: 'In' | 'Out' | 'Adjustment';
}

interface ProductManagementData {
  id: string;
  name: string;
  description: string;
  images: string[];
  artisan: string;
  artisanEmail: string;
  category: string;
  status: ProductStatus;
  price: number;
  totalStock: number;
  sold: number;
  revenue: number;
  commissionRate: number; // e.g., 15 for 15%
  refundAmount: number;
  paymentStatus: PaymentStatus;
  materials: string[];
  dimensions: string;
  weight: string;
  shippingInfo: string;
  orders: Order[];
  stockHistory: StockLog[];
}

// --- Mock Data ---
const MOCK_PRODUCTS: ProductManagementData[] = Array.from({ length: 10 }).map((_, i) => {
  const totalStock = 100 + (i * 20);
  const sold = Math.floor(totalStock * (0.2 + Math.random() * 0.6));
  const price = 1200 + (i * 300);
  const revenue = sold * price;
  const commissionRate = 15;

  return {
    id: `PRD-MGT-${2000 + i}`,
    name: i % 2 === 0 ? 'Handwoven Cotton Gabi' : 'Traditional Clay Pot',
    description: 'This is a high-quality, authentic Ethiopian artifact handcrafted with traditional techniques passed down through generations. Each piece is unique and reflects the rich cultural heritage of the region.',
    images: [
      `https://picsum.photos/seed/prd${i}1/800/600`,
      `https://picsum.photos/seed/prd${i}2/800/600`,
      `https://picsum.photos/seed/prd${i}3/800/600`
    ],
    artisan: i % 3 === 0 ? 'Sara Crafts' : 'Kebede Pottery',
    artisanEmail: `artisan${i}@example.com`,
    category: i % 2 === 0 ? 'Textiles' : 'Pottery',
    status: i === 2 ? 'Out of Stock' : i === 5 ? 'Disabled' : 'Active',
    price,
    totalStock,
    sold,
    revenue,
    commissionRate,
    refundAmount: i === 3 ? 2400 : 0,
    paymentStatus: i % 4 === 0 ? 'Paid' : 'Pending Payout',
    materials: i % 2 === 0 ? ['Organic Cotton', 'Natural Dyes'] : ['Local Clay', 'Mineral Glaze'],
    dimensions: i % 2 === 0 ? '200cm x 150cm' : '30cm x 30cm x 40cm',
    weight: i % 2 === 0 ? '1.2 kg' : '3.5 kg',
    shippingInfo: 'Standard shipping takes 3-5 business days. International shipping available.',
    orders: Array.from({ length: 5 }).map((_, j) => ({
      id: `ORD-${8000 + j}`,
      customer: `Customer ${j + 1}`,
      email: `customer${j+1}@example.com`,
      avatar: `https://i.pravatar.cc/150?u=customer${j+1}`,
      date: '2025-10-12',
      quantity: 1 + (j % 2),
      totalPaid: (1 + (j % 2)) * price,
      paymentMethod: j % 2 === 0 ? 'Telebirr' : 'Card',
      paymentStatus: 'Paid',
      transactionId: `TXN-P-${7000 + j}`
    })),
    stockHistory: [
      { date: '2025-09-01', action: 'Initial Stock Added', quantity: 100, type: 'In' },
      { date: '2025-10-01', action: 'Restock', quantity: 50, type: 'In' },
      { date: '2025-10-15', action: 'Manual Adjustment', quantity: -5, type: 'Adjustment' }
    ]
  };
});

export const AdminProductManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductManagementData | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({ start: '', end: '' });

  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.artisan.toLowerCase().includes(searchQuery.toLowerCase());
    
    // For mock purposes, we'll just check if any order in the product matches the date range
    // In a real app, this would likely filter by product creation date or order dates
    const matchesDate = !dateRange.start || !dateRange.end || product.orders.some(o => 
      o.date >= dateRange.start && o.date <= dateRange.end
    );

    return matchesSearch && matchesDate;
  });

  const ProductDetailModal = ({ product, onClose }: { product: ProductManagementData; onClose: () => void }) => {
    const commission = (product.revenue * product.commissionRate) / 100;
    const artisanEarnings = product.revenue - commission - product.refundAmount;
    const remainingStock = product.totalStock - product.sold;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={
                  product.status === 'Active' ? 'success' : 
                  product.status === 'Out of Stock' ? 'warning' : 'error'
                }>
                  {product.status}
                </Badge>
                <span className="text-xs text-gray-400 font-mono">ID: {product.id}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{product.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <XCircle className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Section 1: Product Details & Media (5 cols) */}
              <div className="lg:col-span-5 space-y-8">
                {/* Media Gallery */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" /> Product Media
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <img src={product.images[0]} className="w-full h-64 object-cover rounded-2xl shadow-sm" alt="Main" />
                    <div className="grid grid-cols-2 gap-4">
                      {product.images.slice(1).map((img, idx) => (
                        <img key={idx} src={img} className="w-full h-32 object-cover rounded-xl shadow-sm" alt={`Gallery ${idx}`} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Artifact Details */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Artisan Details
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Description</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Materials</p>
                        <div className="flex flex-wrap gap-1">
                          {product.materials.map((m, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-600 font-medium">{m}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Dimensions</p>
                        <p className="text-xs font-bold text-gray-800">{product.dimensions}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Weight</p>
                        <p className="text-xs font-bold text-gray-800">{product.weight}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Category</p>
                        <p className="text-xs font-bold text-gray-800">{product.category}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Shipping Info</p>
                      <p className="text-xs text-gray-600">{product.shippingInfo}</p>
                    </div>
                  </div>
                </div>

                {/* Stock Summary */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Inventory Status
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                      <p className="text-lg font-bold text-gray-800">{product.totalStock}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl text-center">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase">Sold</p>
                      <p className="text-lg font-bold text-emerald-600">{product.sold}</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-center">
                      <p className="text-[10px] text-amber-400 font-bold uppercase">Left</p>
                      <p className="text-lg font-bold text-amber-600">{remainingStock}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Financials & Orders (7 cols) */}
              <div className="lg:col-span-7 space-y-8">
                {/* Financial Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Orders</p>
                    <p className="text-xl font-bold text-emerald-900">{product.orders.length}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Revenue</p>
                    <p className="text-xl font-bold text-blue-900">ETB {product.revenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Comm.</p>
                    <p className="text-xl font-bold text-amber-900">ETB {commission.toLocaleString()}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Artisan</p>
                    <p className="text-xl font-bold text-indigo-900">ETB {artisanEarnings.toLocaleString()}</p>
                  </div>
                </div>

                {/* Order List */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4" /> Order History ({product.orders.length})
                    </h3>
                    <Button size="sm" variant="outline" leftIcon={Download}>Export</Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50/50">
                        <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-3">Customer</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Qty</th>
                          <th className="px-6 py-3">Total</th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {product.orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={order.avatar} className="w-8 h-8 rounded-full object-cover border border-gray-100" alt="" />
                                <div>
                                  <p className="font-bold text-gray-800 text-xs">{order.customer}</p>
                                  <p className="text-[10px] text-gray-400">{order.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[10px] text-gray-600">{order.date}</td>
                            <td className="px-6 py-4 font-bold text-gray-800 text-xs">{order.quantity}</td>
                            <td className="px-6 py-4 font-bold text-gray-800 text-xs">ETB {order.totalPaid.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <Badge variant={order.paymentStatus === 'Paid' ? 'success' : 'error'} size="sm">
                                {order.paymentStatus}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Stock History */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" /> Audit Trail
                  </h3>
                  <div className="space-y-3">
                    {product.stockHistory.map((log, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            log.type === 'In' ? 'bg-emerald-100 text-emerald-600' : 
                            log.type === 'Out' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {log.type === 'In' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{log.action}</p>
                            <p className="text-[10px] text-gray-400">{log.date}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold ${log.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {log.quantity > 0 ? '+' : ''}{log.quantity}
                        </span>
                      </div>
                    ))}
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
      {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}

      <div className="flex flex-col md:flex-row justify-end items-center gap-4">
        <Button variant="outline" leftIcon={Download}>Inventory Report</Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Products', value: '156', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Units Sold', value: '3,420', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Revenue', value: 'ETB 2.4M', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Platform Comm.', value: 'ETB 360K', icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
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
            placeholder="Search products or artisans..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer">
            <option>All Status</option>
            <option>Active</option>
            <option>Out of Stock</option>
            <option>Disabled</option>
          </select>
          
          <div className="relative">
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                dateRange.start || dateRange.end 
                  ? 'bg-primary/5 border-primary text-primary' 
                  : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {dateRange.start || dateRange.end ? 'Date Filter Active' : 'Date Range'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-30 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-gray-50 border-none rounded-lg text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20"
                      value={tempDateRange.start}
                      onChange={(e) => setTempDateRange({ ...tempDateRange, start: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-gray-50 border-none rounded-lg text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20"
                      value={tempDateRange.end}
                      onChange={(e) => setTempDateRange({ ...tempDateRange, end: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="flex-1 text-[10px]"
                      onClick={() => {
                        setTempDateRange({ start: '', end: '' });
                        setDateRange({ start: '', end: '' });
                        setShowDatePicker(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 text-[10px]"
                      onClick={() => {
                        setDateRange(tempDateRange);
                        setShowDatePicker(false);
                      }}
                    >
                      Apply
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
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Artisan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Sold</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4">Comm.</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((product) => {
                const commission = (product.revenue * product.commissionRate) / 100;
                const remainingStock = product.totalStock - product.sold;
                return (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{product.name}</p>
                      <p className="text-[10px] text-gray-400">ID: {product.id}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">{product.artisan}</td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        product.status === 'Active' ? 'success' : 
                        product.status === 'Out of Stock' ? 'warning' : 'error'
                      } size="sm">
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-gray-800">{product.totalStock}</span>
                        <span className="text-[10px] text-amber-600 font-bold">{remainingStock} left</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{product.sold}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">ETB {product.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-amber-600">ETB {commission.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-primary">ETB {product.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedProduct(product)}>View Details</Button>
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

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
