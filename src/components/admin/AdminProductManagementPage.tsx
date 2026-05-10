import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Eye, DollarSign, Package, 
  Users, TrendingUp, ArrowUpRight, ArrowDownRight, 
  ChevronRight, Download, Clock, CreditCard, 
  History, Tag, ShoppingBag, AlertTriangle, CheckCircle2,
  XCircle, Calendar, ChevronDown, LayoutGrid, Loader2
} from 'lucide-react';
import { Button, Badge } from '@/components/UI';
import { useLanguage } from '@/context/LanguageContext';

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
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Refunded';
  transactionId: string;
}

interface StockLog {
  date: string;
  action: string;
  quantity: number;
  type: 'In' | 'Out' | 'Adjustment';
}

interface ProductData {
  _id: string;
  name: string;
  description: string;
  images: string[];
  artisan: string;
  artisanEmail: string;
  artisanRegion: string;
  artisanCity: string;
  category: string;
  status: ProductStatus;
  verificationStatus: string;
  price: number;
  discountPrice: number | null;
  totalStock: number;
  sold: number;
  revenue: number;
  commissionRate: number;
  totalCommission: number;
  artisanEarnings: number;
  refundAmount: number;
  paymentStatus: PaymentStatus;
  materials: string[];
  dimensions: string;
  weight: string;
  shippingInfo: string;
  deliveryTime: string;
  orderCount: number;
  createdAt: string;
  region: string;
  rating: number;
  numReviews: number;
  orders: Order[];
  stockHistory: StockLog[];
}

interface Stats {
  total: number;
  totalSold: number;
  totalRevenue: number;
  totalCommission: number;
}

export const AdminProductManagementPage: React.FC<{ initialId?: string }> = ({ initialId }) => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, totalSold: 0, totalRevenue: 0, totalCommission: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterVerification, setFilterVerification] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({ start: '', end: '' });
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const LIMIT = 20;

  const fetchProducts = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', LIMIT.toString());
      if (searchQuery) params.set('search', searchQuery);
      if (filterStatus !== 'All') params.set('status', filterStatus);
      if (filterVerification !== 'All') params.set('verificationStatus', filterVerification);
      if (dateRange.start) params.set('startDate', dateRange.start);
      if (dateRange.end) params.set('endDate', dateRange.end);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (pageNum === 1) {
          setProducts(data.products || []);
        } else {
          setProducts(prev => [...prev, ...(data.products || [])]);
        }
        setStats(data.stats || { total: 0, totalSold: 0, totalRevenue: 0, totalCommission: 0 });
        setHasMore(data.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStatus, filterVerification, dateRange]);

  const fetchProductDetail = useCallback(async (id: string) => {
    setLoadingProduct(true);
    try {
      const res = await fetch(`/api/public/products/${id}`);
      const data = await res.json();
      if (data.success && data.product) {
        const p = data.product;
        const artisanName = p.artisanId?.name || 'Unknown Artisan';
        const artisanEmail = p.artisanId?.email || '';
        setSelectedProduct({
          _id: p._id,
          name: p.name_en || p.name || 'Untitled',
          description: p.description_en || p.description || '',
          images: p.images || [],
          artisan: artisanName,
          artisanEmail,
          artisanRegion: p.artisanId?.artisanProfile?.region || '',
          artisanCity: p.artisanId?.artisanProfile?.city || '',
          category: p.category || 'General',
          status: p.status === 'Published' ? 'Active' : p.status === 'Out of Stock' ? 'Out of Stock' : 'Disabled',
          verificationStatus: p.verificationStatus,
          price: p.price || 0,
          discountPrice: p.discountPrice || null,
          totalStock: p.stock || 0,
          sold: 0,
          revenue: 0,
          commissionRate: p.commissionRate || 10,
          totalCommission: 0,
          artisanEarnings: 0,
          refundAmount: 0,
          paymentStatus: 'Pending Payout',
          materials: p.material ? [p.material] : [],
          dimensions: p.dimensions || '',
          weight: p.weight || '',
          shippingInfo: p.shippingFee ? `Shipping: ${p.shippingFee}` : '',
          deliveryTime: p.deliveryTime || '',
          orderCount: 0,
          createdAt: p.createdAt,
          region: p.region || '',
          rating: p.rating || 0,
          numReviews: p.numReviews || 0,
          orders: [],
          stockHistory: [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch product detail:', error);
    } finally {
      setLoadingProduct(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchProducts(1);
  }, [fetchProducts]);

  useEffect(() => {
    if (initialId) {
      fetchProductDetail(initialId);
    }
  }, [initialId, fetchProductDetail]);

  const handleAction = async (productId: string, action: 'approve' | 'reject' | 'drop' | 'archive') => {
    setActionLoading(productId);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts(1);
        if (selectedProduct && selectedProduct._id === productId) {
          setSelectedProduct(null);
        }
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const openProductDetail = async (product: ProductData) => {
    const enriched = products.find(p => p._id === product._id);
    if (enriched && enriched.orderCount > 0) {
      try {
        const res = await fetch(`/api/admin/products/orders?productId=${product._id}`);
        const data = await res.json();
        if (data.success) {
          setSelectedProduct({ ...enriched, orders: data.orders || [], stockHistory: data.stockHistory || [] });
          return;
        }
      } catch (e) { /* ignore */ }
    }
    setSelectedProduct({ ...enriched } as ProductData);
  };

  const ProductDetailModal = ({ product, onClose }: { product: ProductData; onClose: () => void }) => {
    const commission = product.totalCommission || (product.revenue * product.commissionRate) / 100;
    const artisanEarnings = product.artisanEarnings || product.revenue - commission - product.refundAmount;
    const remainingStock = product.totalStock - product.sold;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={product.status === 'Active' ? 'success' : product.status === 'Out of Stock' ? 'warning' : 'error'}>
                  {product.status}
                </Badge>
                {product.verificationStatus && product.verificationStatus !== 'Approved' && (
                  <Badge variant={product.verificationStatus === 'Rejected' ? 'error' : 'warning'} size="sm">
                    {product.verificationStatus}
                  </Badge>
                )}
                <span className="text-xs text-gray-400 font-mono">ID: {product._id.slice(-8).toUpperCase()}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{product.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <XCircle className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" /> Product Media
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {(product.images?.length || 0) > 0 ? (
                      <>
                        <img src={product.images?.[0]} className="w-full h-64 object-cover rounded-2xl shadow-sm" alt="Main" />
                        {(product.images?.length || 0) > 1 && (
                          <div className="grid grid-cols-2 gap-4">
                            {product.images?.slice(1, 3).map((img, idx) => (
                              <img key={idx} src={img} className="w-full h-32 object-cover rounded-xl shadow-sm" alt={`Gallery ${idx}`} />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Product Details
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Description</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{product.description || 'No description'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Materials</p>
                        <div className="flex flex-wrap gap-1">
                          {(product.materials || []).map((m, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-600 font-medium">{m}</span>
                          ))}
                          {(!product.materials || product.materials.length === 0) && <span className="text-xs text-gray-400">N/A</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Dimensions</p>
                        <p className="text-xs font-bold text-gray-800">{product.dimensions || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Weight</p>
                        <p className="text-xs font-bold text-gray-800">{product.weight || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Category</p>
                        <p className="text-xs font-bold text-gray-800">{product.category}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Delivery Time</p>
                        <p className="text-xs font-bold text-gray-800">{product.deliveryTime || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Region</p>
                        <p className="text-xs font-bold text-gray-800">{product.region || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Shipping Info</p>
                      <p className="text-xs text-gray-600">{product.shippingInfo || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Artisan Info
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Name</p>
                      <p className="text-sm font-medium text-gray-800">{product.artisan}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Email</p>
                      <p className="text-sm text-gray-600">{product.artisanEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Location</p>
                      <p className="text-sm text-gray-600">{[product.artisanRegion, product.artisanCity].filter(Boolean).join(', ') || 'N/A'}</p>
                    </div>
                  </div>
                </div>

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

              <div className="lg:col-span-7 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Orders</p>
                    <p className="text-xl font-bold text-emerald-900">{product.orderCount || product.orders?.length || 0}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Revenue</p>
                    <p className="text-xl font-bold text-blue-900">ETB {(product.revenue || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Commission</p>
                    <p className="text-xl font-bold text-amber-900">ETB {commission.toLocaleString()}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Artisan</p>
                    <p className="text-xl font-bold text-indigo-900">ETB {artisanEarnings.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4" /> Order History ({product.orders?.length || 0})
                    </h3>
                  </div>
                  {(product.orders?.length || 0) === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                      <p className="text-sm">No orders yet for this product.</p>
                    </div>
                  ) : (
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
                          {(product.orders || []).map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {order.avatar ? (
                                    <img src={order.avatar} className="w-8 h-8 rounded-full object-cover border border-gray-100" alt="" />
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-400">{order.customer?.charAt(0) || '?'}</div>
                                  )}
                                  <div>
                                    <p className="font-bold text-gray-800 text-xs">{order.customer}</p>
                                    <p className="text-[10px] text-gray-400">{order.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-[10px] text-gray-600">{order.date}</td>
                              <td className="px-6 py-4 font-bold text-gray-800 text-xs">{order.quantity}</td>
                              <td className="px-6 py-4 font-bold text-gray-800 text-xs">ETB {(order.totalPaid || 0).toLocaleString()}</td>
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
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" /> Admin Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {product.verificationStatus !== 'Approved' && (
                      <Button
                        className="bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"
                        size="sm"
                        leftIcon={actionLoading === product._id ? Loader2 : CheckCircle2}
                        onClick={() => handleAction(product._id, 'approve')}
                        disabled={actionLoading === product._id}
                      >
                        Approve
                      </Button>
                    )}
                    {product.verificationStatus !== 'Rejected' && product.status !== 'Disabled' && (
                      <Button
                        className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                        size="sm"
                        leftIcon={actionLoading === product._id ? Loader2 : XCircle}
                        onClick={() => handleAction(product._id, 'reject')}
                        disabled={actionLoading === product._id}
                      >
                        Reject
                      </Button>
                    )}
                    {product.status === 'Active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(product._id, 'drop')}
                        disabled={actionLoading === product._id}
                      >
                        Drop
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAction(product._id, 'archive')}
                      disabled={actionLoading === product._id}
                    >
                      Archive
                    </Button>
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
      {loadingProduct && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[60] flex items-center justify-center">
          <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      )}
      {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}

      <div className="flex flex-col md:flex-row justify-end items-center gap-4">
        <Button variant="outline" leftIcon={Download}>Inventory Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Products', value: stats.total.toString() || '0', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Units Sold', value: (stats.totalSold || 0).toLocaleString(), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Revenue', value: `ETB ${((stats.totalRevenue || 0) / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Platform Comm.', value: `ETB ${((stats.totalCommission || 0) / 1000).toFixed(1)}K`, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
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

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search products or artisans..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts(1)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer" value={filterVerification} onChange={(e) => setFilterVerification(e.target.value)}>
            <option value="All">All Verification</option>
            <option value="Pending">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Disabled">Disabled</option>
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
              {dateRange.start || dateRange.end ? 'Date Active' : 'Date Range'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
            </button>
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-30 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Date</label>
                    <input type="date" className="w-full bg-gray-50 border-none rounded-lg text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20" value={tempDateRange.start} onChange={(e) => setTempDateRange({ ...tempDateRange, start: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Date</label>
                    <input type="date" className="w-full bg-gray-50 border-none rounded-lg text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20" value={tempDateRange.end} onChange={(e) => setTempDateRange({ ...tempDateRange, end: e.target.value })} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="ghost" className="flex-1 text-[10px]" onClick={() => { setTempDateRange({ start: '', end: '' }); setDateRange({ start: '', end: '' }); setShowDatePicker(false); }}>Cancel</Button>
                    <Button size="sm" className="flex-1 text-[10px]" onClick={() => { setDateRange(tempDateRange); setShowDatePicker(false); }}>Apply</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Artisan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Sold</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => {
                  const commission = product.totalCommission || (product.revenue * product.commissionRate) / 100;
                  const remainingStock = product.totalStock - product.sold;
                  return (
                    <tr key={product._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            {(product.images?.length || 0) > 0 ? (
                              <img src={product.images?.[0]} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-gray-300" /></div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 text-sm truncate">{product.name}</p>
                            <p className="text-[10px] text-gray-400">ID: {product._id.slice(-8).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-700 text-sm">{product.artisan}</p>
                        <p className="text-[10px] text-gray-400">{product.category}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={product.status === 'Active' ? 'success' : product.status === 'Out of Stock' ? 'warning' : 'secondary'} size="sm">
                          {product.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={product.verificationStatus === 'Approved' ? 'success' : product.verificationStatus === 'Rejected' ? 'error' : 'warning'} size="sm">
                          {product.verificationStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-800">{product.totalStock}</span>
                          <span className="text-[10px] text-amber-600 font-bold">{remainingStock} left</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">{product.sold}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">ETB {(product.revenue || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-primary">ETB {product.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="ghost" onClick={() => openProductDetail(product)}>View Details</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => { const nextPage = page + 1; setPage(nextPage); fetchProducts(nextPage); }} leftIcon={Loader2}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminProductManagementPage;
