import React, { useState, useEffect } from 'react';
import {
  Search, Filter, CheckCircle2, XCircle, Eye, AlertCircle,
  Tag, DollarSign, Image as ImageIcon, Edit, Shield,
  AlertTriangle, MoreVertical, ChevronDown, Package,
  Truck, Scale, History, Flag, Check, Ban, FileText, Download, Calendar
} from 'lucide-react';
import { Button, Badge, Input } from '../../components/UI';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedText } from '@/utils/getLocalizedText';

// --- Helpers ---
const getString = (val: any, language?: string): string => {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    if (language) {
      const localized = getLocalizedText(val, 'name', language as any) ||
                        getLocalizedText(val, 'description', language as any);
      if (localized) return localized;
    }
    if (val.en) return String(val.en);
    if (val.am) return String(val.am);
    return '';
  }
  return String(val || '');
};

// --- Types ---
type VerificationStatus = 'Pending' | 'Approved' | 'Rejected';

interface ArtisanProfile {
  _id: string;
  name: string;
  email: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  material?: string;
  careInstructions?: string;
  artisanId: ArtisanProfile;
  category: string;
  subcategory?: string;
  tags?: string[];
  sku?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  weight?: string;
  shippingFee: string;
  deliveryTime: string;
  images: string[];
  status: 'Draft' | 'Published' | 'Archived';
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const AdminProductsPage: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [rejectProduct, setRejectProduct] = useState<Product | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [rejectionType, setRejectionType] = useState('Poor image quality');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId: string) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/admin/products/${productId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        setProducts(prev => prev.map(p => p._id === productId ? { ...p, verificationStatus: 'Approved' as VerificationStatus, rejectionReason: undefined } : p));
        setViewProduct(null);
        alert(t('admin.productApproved'));
      } else {
        const data = await response.json();
        alert(data.message || t('admin.errorApproving'));
       }
     } catch (error) {
       console.error('Error approving product:', error);
       alert(t('admin.errorApproving'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (productId: string) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/admin/products/${productId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionType + (actionReason ? ` - ${actionReason}` : '') }),
      });
      if (response.ok) {
        setProducts(prev => prev.map(p => p._id === productId ? { ...p, verificationStatus: 'Rejected' as VerificationStatus, rejectionReason: rejectionType + (actionReason ? ` - ${actionReason}` : '') } : p));
        setRejectProduct(null);
        setViewProduct(null);
        setActionReason('');
        alert(t('admin.productRejected'));
      } else {
        const data = await response.json();
        alert(data.message || t('admin.errorRejecting'));
      }
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert(t('admin.errorRejecting'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesStatus = filterStatus === 'All' || product.verificationStatus === filterStatus;
    const artisanName = product.artisanId?.name || '';
    const artisanEmail = product.artisanId?.email || '';
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          artisanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          artisanEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const toggleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(pid => pid !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleBulkApprove = async () => {
    for (const id of selectedProductIds) {
      await handleApprove(id);
    }
    setSelectedProductIds([]);
  };

  const handleExportLogs = () => {
    const headers = ['Product ID', 'Product Name', 'Artisan', 'Status', 'Created At'];
    const rows = filteredProducts.map(p => [
      p._id, p.name, p.artisanId?.name || 'Unknown', p.verificationStatus, p.createdAt
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `product_verification_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateCommission = (price: number) => {
    const rate = 15;
    return (price * rate) / 100;
  };

  const RejectionModal = ({ product, onClose }: { product: Product; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-500" /> {t('admin.rejectProductTitle')}
          </h2>
          <button onClick={onClose}><XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('admin.rejectProductDesc').replace('{name}', product.name)}
          </p>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.rejectionReasonLabel')} <span className="text-red-500">*</span></label>
            <select
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none"
              value={rejectionType}
              onChange={(e) => setRejectionType(e.target.value)}
            >
              <option value="Poor image quality">{t('admin.rejectionReasonLabel')}</option>
              <option value="Incomplete description">Incomplete description</option>
              <option value="Suspicious pricing">Suspicious pricing</option>
              <option value="Policy violation">Policy violation</option>
              <option value="Duplicate product">Duplicate product</option>
              <option value="Copyright issue">Copyright issue</option>
              <option value="Fake product">Fake product</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.internalNote')}</label>
            <textarea
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none min-h-[80px]"
              placeholder={t('admin.internalNotePlaceholder')}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={onClose}>{t('admin.canceling')}</Button>
            <Button className="bg-red-500 hover:bg-red-600 border-red-500 text-white" onClick={() => handleReject(product._id)} isLoading={submitting}>
              {t('admin.confirmingRejection')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductReviewPage = ({ product, onClose }: { product: Product; onClose: () => void }) => {
    const artisan = product.artisanId;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{t('admin.productVerification')}</h2>
              <p className="text-sm text-gray-500">ID: {product._id} • {t('admin.sku')}: {product.sku || 'N/A'}</p>
            </div>
            <div className="flex gap-2">
              {product.verificationStatus === 'Pending' && (
                <>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setRejectProduct(product)}>{t('admin.rejectProduct')}</Button>
                  <Button className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white" onClick={() => handleApprove(product._id)} isLoading={submitting}>
                    {submitting ? t('admin.approving') : t('admin.approveProduct')}
                  </Button>
                </>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full ml-2">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="mb-10">
              <div className="flex items-center justify-center max-w-2xl mx-auto relative">
                <div className="flex items-center gap-4">
                  {['Pending', 'Approved'].map((step, idx) => {
                    const isCurrent = (step === 'Pending' && product.verificationStatus === 'Pending') ||
                                    (step === 'Approved' && (product.verificationStatus === 'Approved' || product.verificationStatus === 'Rejected'));
                      const isComplete = step === 'Pending' && (product.verificationStatus === 'Approved' || product.verificationStatus === 'Rejected');
                      return (
                        <div key={step} className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                            isComplete
                              ? 'bg-emerald-500 border-emerald-100 text-white'
                              : isCurrent
                                ? 'bg-emerald-500 border-emerald-100 text-white'
                                : 'bg-white border-gray-100 text-gray-300'
                          }`}>
                            {isComplete ? <Check className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                          </div>
                          <span className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${isCurrent || isComplete ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {step}
                          </span>
                          {idx < 1 && <div className={`w-20 h-0.5 mx-2 ${isComplete ? 'bg-emerald-500' : 'bg-gray-100'}`}></div>}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <img src={product.images[0] || 'https://via.placeholder.com/400'} className="w-full aspect-square object-cover rounded-2xl shadow-sm border border-gray-100" alt="Main" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {product.images.slice(1, 4).map((img, i) => (
                      <img key={i} src={img} className="w-full aspect-square object-cover rounded-xl border border-gray-100" alt={`Thumb ${i}`} />
                    ))}
                  </div>
                </div>

                {artisan && (
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">{t('admin.artisanProfile')}</h3>
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                           {getString(artisan.name).charAt(0)}
                         </div>
                         <div>
                           <p className="font-bold text-sm text-gray-800">{getString(artisan.name)}</p>
                           <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{artisan.email}</p>
                         </div>
                     </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="info">{product.category}</Badge>
                    {product.subcategory && <Badge variant="outline">{product.subcategory}</Badge>}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase tracking-widest">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-2 text-sm">{t('admin.description')}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                  </div>

                  {product.material && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                        <Scale className="w-4 h-4 text-primary" /> {t('admin.materials')}
                      </h3>
                      <p className="text-xs text-gray-600">{product.material}</p>
                    </div>
                  )}

                  {product.careInstructions && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <h3 className="font-bold text-gray-800 mb-2 text-sm">{t('admin.careInstructions')}</h3>
                      <p className="text-xs text-gray-600">{product.careInstructions}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                      <Package className="w-4 h-4" /> {t('admin.specs')}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">{t('admin.stock')}</span> <span className="font-bold">{product.stock}</span></div>
                      {product.weight && <div className="flex justify-between"><span className="text-gray-500">{t('products.weight')}</span> <span>{product.weight}</span></div>}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                      <Truck className="w-4 h-4" /> {t('admin.shipping')}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">{t('admin.fee')}</span> <span className="font-bold">{product.shippingFee}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">{t('admin.time')}</span> <span>{product.deliveryTime}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm border-b border-gray-50 pb-2">{t('admin.verificationStatus')}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{t('admin.status')}</span>
                    <Badge variant={product.verificationStatus === 'Approved' ? 'success' : product.verificationStatus === 'Rejected' ? 'error' : 'warning'}>
                      {product.verificationStatus}
                    </Badge>
                  </div>
                  {product.verificationStatus === 'Rejected' && product.rejectionReason && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-[10px] font-bold text-red-700 uppercase mb-1">{t('admin.rejectionReasonLabel')}</p>
                      <p className="text-xs text-red-600 italic">{product.rejectionReason}</p>
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                  <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> {t('admin.financials')}
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-700">{t('admin.listingPrice')}</span>
                      <span className="font-bold text-lg text-emerald-900">ETB {product.price.toLocaleString()}</span>
                    </div>
                    <div className="pt-3 border-t border-emerald-200">
                      <div className="flex justify-between mb-1">
                        <span className="text-emerald-700">{t('admin.commission15')}</span>
                        <span className="font-bold text-emerald-900">ETB {calculateCommission(product.price).toLocaleString()}</span>
                      </div>
                    </div>
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
      {viewProduct && <ProductReviewPage product={viewProduct} onClose={() => setViewProduct(null)} />}
      {rejectProduct && <RejectionModal product={rejectProduct} onClose={() => setRejectProduct(null)} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800">{t('admin.productVerification')}</h1>
          <p className="text-gray-500 text-sm">{t('admin.productVerificationDesc')}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportLogs} leftIcon={Download}>
            {t('admin.exportLogs')}
          </Button>
          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="text-sm font-bold text-gray-600 bg-white px-3 py-2 rounded-xl border border-gray-200">
                {selectedProductIds.length} {t('admin.selectedCount')}
              </span>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500" onClick={handleBulkApprove}>
                {t('admin.approveAll')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('admin.searchProducts')}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-9 pr-8 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer hover:bg-gray-100 appearance-none"
              >
                <option value="All">{t('admin.allStatus')}</option>
                <option value="Pending">{t('admin.pending')}</option>
                <option value="Approved">{t('admin.approved')}</option>
                <option value="Rejected">{t('admin.rejected')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedProductIds(filteredProducts.map(p => p._id));
                      else setSelectedProductIds([]);
                    }}
                  />
                </th>
                <th className="px-6 py-4">{t('admin.product')}</th>
                <th className="px-6 py-4">{t('admin.artisan')}</th>
                <th className="px-6 py-4">{t('admin.category')}</th>
                <th className="px-6 py-4">{t('admin.price')}</th>
                <th className="px-6 py-4">{t('admin.stock')}</th>
                <th className="px-6 py-4">{t('admin.status')}</th>
                <th className="px-6 py-4 text-right">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">{t('admin.loadingProducts')}</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">{t('admin.noProductsFound')}</td></tr>
              ) : filteredProducts.map((product) => (
                <tr key={product._id} className={`hover:bg-gray-50 transition-colors group ${selectedProductIds.includes(product._id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      checked={selectedProductIds.includes(product._id)}
                      onChange={() => toggleSelectProduct(product._id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={product.images[0] || 'https://via.placeholder.com/48'} className="w-12 h-12 rounded-lg object-cover bg-gray-200 border border-gray-100" alt="" />
                      <div>
                        <p className="font-bold text-gray-800 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-500">{t('admin.sku')}: {product.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600">
                          {getString(product.artisanId?.name)?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{getString(product.artisanId?.name || 'Unknown')}</p>
                          <p className="text-[10px] text-gray-400">{product.artisanId?.email || ''}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="info">{product.category}</Badge>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800">ETB {product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">{product.stock}</td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        product.verificationStatus === 'Approved' ? 'success' :
                        product.verificationStatus === 'Pending' ? 'warning' :
                        'error'
                      }
                    >
                      {product.verificationStatus}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewProduct(product)}
                      >
                        {t('admin.review')}
                      </Button>
                      <div className="relative group/actions">
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 hidden group-hover/actions:block animate-in fade-in slide-in-from-top-1">
                          <button
                            className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                            onClick={() => handleApprove(product._id)}
                          >
                            <Check className="w-3.5 h-3.5" /> {t('admin.approveProduct')}
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            onClick={() => setRejectProduct(product)}
                          >
                            <Ban className="w-3.5 h-3.5" /> {t('admin.rejectProduct')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
