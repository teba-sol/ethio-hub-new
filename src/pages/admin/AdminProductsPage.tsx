import React, { useState } from 'react';
import { 
  Search, Filter, CheckCircle2, XCircle, Eye, AlertCircle, 
  Tag, DollarSign, Image as ImageIcon, Edit, Shield, 
  AlertTriangle, MoreVertical, ChevronDown, Package, 
  Truck, Scale, History, Flag, Check, Ban, FileText, Download, Calendar
} from 'lucide-react';
import { Button, Badge, Input } from '../../components/UI';

// --- Types ---
type VerificationStatus = 'Not Submitted' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
type ProductStatus = 'Active' | 'Archived';

interface VerificationDocument {
  id: string;
  name: string;
  type: 'ID' | 'License' | 'Certificate' | 'Authenticity Proof' | 'Other';
  url: string;
  thumbnail: string;
  expiryDate?: string;
  uploadedAt: string;
}

interface VerificationLog {
  date: string;
  action: VerificationStatus | 'Resubmitted' | 'Flagged';
  by: string;
  note?: string;
  reason?: string;
}

interface ArtisanProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  joinDate: string;
  totalProducts: number;
  totalSales: number;
  cancellationRate: string;
  previousRejections: number;
  reportHistory: number;
  status: 'Active' | 'Suspended';
}

interface Product {
  id: string;
  name: string;
  description: string;
  materials: string;
  culturalBackground: string;
  careInstructions: string;
  artisan: ArtisanProfile;
  category: string;
  subcategory: string;
  tags: string[];
  sku: string;
  price: number;
  discount?: number;
  stockQuantity: number;
  weight: string;
  dimensions: string;
  shippingFee: number;
  deliveryTime: string;
  variations: { name: string; options: string[] }[];
  images: string[];
  documents: VerificationDocument[];
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  resubmittedAt?: string;
  decisionReason?: string;
  verificationStatus: VerificationStatus;
  productStatus: ProductStatus;
  riskBadges: string[];
  authenticityScore: number;
  verificationHistory: VerificationLog[];
}

// --- Mock Data ---
const MOCK_PRODUCTS: Product[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `PROD-${5000 + i}`,
  name: i % 2 === 0 ? 'Handwoven Cotton Gabi' : 'Traditional Coffee Pot Set',
  description: 'Authentic handmade product using traditional techniques passed down through generations. Made with 100% organic cotton and natural dyes.',
  materials: '100% Organic Cotton, Natural Indigo Dye',
  culturalBackground: 'The Gabi is a traditional Ethiopian handmade cloth worn by both men and women. It is typically made of cotton and is very thick and warm.',
  careInstructions: 'Hand wash only with cold water. Do not bleach. Air dry in shade.',
  artisan: {
    id: `ART-${100 + i}`,
    name: i % 3 === 0 ? 'Sara Crafts' : 'Kebede Pottery',
    email: i % 3 === 0 ? 'sara@example.com' : 'kebede@example.com',
    role: 'Master Artisan',
    isVerified: i % 3 === 0,
    joinDate: '2024-02-10',
    totalProducts: 15 + i,
    totalSales: 120 + i * 5,
    cancellationRate: i === 1 ? '12%' : '1%',
    previousRejections: i === 1 ? 2 : 0,
    reportHistory: i === 4 ? 1 : 0,
    status: 'Active'
  },
  category: i % 2 === 0 ? 'Textiles' : 'Pottery',
  subcategory: i % 2 === 0 ? 'Traditional Wear' : 'Kitchenware',
  tags: ['Handmade', 'Organic', 'Cultural'],
  sku: `SKU-${1000 + i}`,
  price: 2500 + (i * 150),
  discount: i % 5 === 0 ? 10 : 0,
  stockQuantity: i === 2 ? 2 : 50,
  weight: '1.5 kg',
  dimensions: '20x30x10 cm',
  shippingFee: 150,
  deliveryTime: '3-5 Days',
  variations: [
    { name: 'Size', options: ['Standard', 'Large'] },
    { name: 'Color', options: ['White', 'Off-White'] }
  ],
  images: [
    `https://picsum.photos/seed/prod${i}/800/800`,
    `https://picsum.photos/seed/prod${i}b/800/800`,
    `https://picsum.photos/seed/prod${i}c/800/800`
  ],
  documents: [
    {
      id: 'DOC-1',
      name: 'Artisan Business License',
      type: 'License',
      url: '#',
      thumbnail: `https://picsum.photos/seed/doc${i}/200/200`,
      expiryDate: '2026-12-31',
      uploadedAt: '2025-10-25'
    },
    {
      id: 'DOC-2',
      name: 'Authenticity Certificate',
      type: 'Authenticity Proof',
      url: '#',
      thumbnail: `https://picsum.photos/seed/auth${i}/200/200`,
      uploadedAt: '2025-10-25'
    }
  ],
  submittedAt: '2025-10-25 09:00 AM',
  reviewedAt: i > 0 ? '2025-10-26 10:30 AM' : undefined,
  reviewedBy: i > 0 ? 'Admin Sarah' : undefined,
  verificationStatus: i === 0 ? 'Submitted' : i % 4 === 0 ? 'Approved' : 'Rejected',
  productStatus: i % 4 === 0 ? 'Active' : 'Archived',
  riskBadges: i === 1 ? ['New Artisan', 'High Price'] : i === 2 ? ['Low Stock'] : [],
  authenticityScore: 85 + (i % 15),
  verificationHistory: [
    { date: '2025-10-25 09:00 AM', action: 'Submitted', by: 'System' },
    ...(i > 0 ? [{ date: '2025-10-26 10:30 AM', action: i % 4 === 0 ? 'Approved' : 'Rejected' as VerificationStatus, by: 'Admin Sarah', reason: i % 4 !== 0 ? 'Suspicious pricing' : undefined }] : [])
  ]
}));

export const AdminProductsPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  // Modal States
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [rejectProduct, setRejectProduct] = useState<Product | null>(null);
  const [flagProduct, setFlagProduct] = useState<Product | null>(null);

  // Action States
  const [actionReason, setActionReason] = useState('');
  const [rejectionType, setRejectionType] = useState('Poor image quality');

  const [resubmitProduct, setResubmitProduct] = useState<Product | null>(null);
  const [resubmissionNote, setResubmissionNote] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({ start: '', end: '' });

  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    const matchesStatus = filterStatus === 'All' || product.verificationStatus === filterStatus;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.artisan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.artisan.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const productDate = new Date(product.submittedAt);
    const matchesDate = (!dateRange.start || productDate >= new Date(dateRange.start)) &&
                        (!dateRange.end || productDate <= new Date(dateRange.end));

    return matchesStatus && matchesSearch && matchesDate;
  });

  const toggleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(pid => pid !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleBulkApprove = () => {
    console.log('Bulk approving:', selectedProductIds);
    setSelectedProductIds([]);
  };

  const handleExportLogs = () => {
    const headers = ['Product ID', 'Product Name', 'Artisan', 'Status', 'Submitted At', 'Reviewed At', 'Reviewed By'];
    const rows = filteredProducts.map(p => [
      p.id, p.name, p.artisan.name, p.verificationStatus, p.submittedAt, p.reviewedAt || '-', p.reviewedBy || '-'
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
    const rate = 15; // 15% commission
    return (price * rate) / 100;
  };

  // --- Modals ---

  const ResubmitModal = ({ product, onClose }: { product: Product; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-amber-500" /> Request Resubmission
          </h2>
          <button onClick={onClose}><XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You are asking <span className="font-bold text-gray-800">{product.artisan.name}</span> to resubmit information for <span className="font-bold text-gray-800">{product.name}</span>.
          </p>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Items to Correct <span className="text-red-500">*</span></label>
            <textarea 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none min-h-[120px]"
              placeholder="List the images or information that need correction..."
              value={resubmissionNote}
              onChange={(e) => setResubmissionNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 border-amber-500 text-white" onClick={() => {
              console.log('Resubmission Requested:', product.id, resubmissionNote);
              onClose();
            }}>
              Send Request
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const RejectionModal = ({ product, onClose }: { product: Product; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-500" /> Reject Product
          </h2>
          <button onClick={onClose}><XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Rejecting <span className="font-bold text-gray-800">{product.name}</span>. 
            This will notify the artisan.
          </p>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none"
              value={rejectionType}
              onChange={(e) => setRejectionType(e.target.value)}
            >
              <option value="Poor image quality">Poor image quality</option>
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
            <label className="block text-sm font-bold text-gray-700 mb-1">Internal Note (Admin Only)</label>
            <textarea 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none min-h-[80px]"
              placeholder="Internal details for audit trail..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button className="bg-red-500 hover:bg-red-600 border-red-500 text-white" onClick={() => {
              console.log('Rejected:', product.id, rejectionType, actionReason);
              onClose();
            }}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductReviewPage = ({ product, onClose }: { product: Product; onClose: () => void }) => {
    const statusSteps = ['Submitted', 'Under Review', 'Approved'];
    const currentStepIndex = statusSteps.indexOf(product.verificationStatus === 'Rejected' ? 'Under Review' : product.verificationStatus);

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Product Verification</h2>
              <p className="text-sm text-gray-500">ID: {product.id} • SKU: {product.sku}</p>
            </div>
            <div className="flex gap-2">
              {['Submitted', 'Under Review'].includes(product.verificationStatus) && (
                <>
                  <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => setResubmitProduct(product)}>Request Resubmission</Button>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setRejectProduct(product)}>Reject</Button>
                  <Button className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white" onClick={() => { console.log('Approved'); onClose(); }}>Approve</Button>
                </>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full ml-2">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {/* Progress Indicator */}
            <div className="mb-10">
              <div className="flex items-center justify-between max-w-2xl mx-auto relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
                <div 
                  className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500" 
                  style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                ></div>
                
                {statusSteps.map((step, idx) => (
                  <div key={step} className="relative z-10 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                      idx <= currentStepIndex 
                        ? 'bg-emerald-500 border-emerald-100 text-white' 
                        : 'bg-white border-gray-100 text-gray-300'
                    }`}>
                      {idx < currentStepIndex ? <Check className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                    </div>
                    <span className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${idx <= currentStepIndex ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left: Images & Documents (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Images Carousel */}
                <div className="space-y-4">
                  <div className="relative group">
                    <img src={product.images[0]} className="w-full aspect-square object-cover rounded-2xl shadow-sm border border-gray-100" alt="Main" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                      <Button variant="ghost" className="text-white border-white hover:bg-white/20"><Eye className="w-5 h-5 mr-2" /> Full Preview</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {product.images.slice(1).map((img, i) => (
                      <img key={i} src={img} className="w-full aspect-square object-cover rounded-xl border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity" alt={`Thumb ${i}`} />
                    ))}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Submitted Documents
                  </h3>
                  <div className="space-y-3">
                    {product.documents.map((doc) => (
                      <div key={doc.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                          <img src={doc.thumbnail} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{doc.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{doc.type}</p>
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1.5 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Artisan Summary */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Artisan Profile</h3>
                    <Button size="sm" variant="ghost">View Profile</Button>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {product.artisan.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{product.artisan.name}</p>
                      <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{product.artisan.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <span className="block text-gray-400">Total Sales</span>
                      <span className="font-bold text-gray-800">{product.artisan.totalSales}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <span className="block text-gray-400">Products</span>
                      <span className="font-bold text-gray-800">{product.artisan.totalProducts}</span>
                    </div>
                  </div>

                  {product.artisan.reportHistory > 0 && (
                    <div className="p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 flex items-center gap-2">
                      <Flag className="w-3 h-3" /> Has {product.artisan.reportHistory} prior reports.
                    </div>
                  )}
                </div>
              </div>

              {/* Center: Product Details (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="info">{product.category}</Badge>
                    <Badge variant="outline">{product.subcategory}</Badge>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase tracking-widest">#{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-2 text-sm">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                        <Scale className="w-4 h-4 text-primary" /> Materials
                      </h3>
                      <p className="text-xs text-gray-600">{product.materials}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> Cultural Background
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-3">{product.culturalBackground}</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-2 text-sm">Care Instructions</h3>
                    <p className="text-xs text-gray-600">{product.careInstructions}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                      <Package className="w-4 h-4" /> Specs
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Stock</span> <span className="font-bold">{product.stockQuantity}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Weight</span> <span>{product.weight}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Dimensions</span> <span>{product.dimensions}</span></div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                      <Truck className="w-4 h-4" /> Shipping
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Fee</span> <span className="font-bold">ETB {product.shippingFee}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Time</span> <span>{product.deliveryTime}</span></div>
                    </div>
                  </div>
                </div>

                {/* Audit Trail */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" /> Audit Trail
                  </h3>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-gray-500 font-medium">Date</th>
                          <th className="px-4 py-2 text-gray-500 font-medium">Action</th>
                          <th className="px-4 py-2 text-gray-500 font-medium">By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {product.verificationHistory.map((log, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-gray-600">{log.date}</td>
                            <td className="px-4 py-2">
                              <Badge variant={log.action === 'Approved' ? 'success' : log.action === 'Rejected' ? 'error' : 'info'}>
                                {log.action}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-gray-600">{log.by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right: Admin Tools (3 cols) */}
              <div className="lg:col-span-3 space-y-6">
                {/* Status Card */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm border-b border-gray-50 pb-2">Lifecycle Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Verification</span>
                      <Badge variant={product.verificationStatus === 'Approved' ? 'success' : product.verificationStatus === 'Rejected' ? 'error' : 'warning'}>
                        {product.verificationStatus}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Product Status</span>
                      <Badge variant={product.productStatus === 'Active' ? 'success' : 'outline'}>
                        {product.productStatus}
                      </Badge>
                    </div>
                  </div>
                  {product.verificationStatus === 'Rejected' && product.decisionReason && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-[10px] font-bold text-red-700 uppercase mb-1">Rejection Reason</p>
                      <p className="text-xs text-red-600 italic">{product.decisionReason}</p>
                    </div>
                  )}
                </div>

                {/* Submission Metadata */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm border-b border-gray-200 pb-2">Submission Metadata</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Submitted At</p>
                      <p className="text-xs font-bold text-gray-700">{product.submittedAt}</p>
                    </div>
                    {product.reviewedAt && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Reviewed At</p>
                        <p className="text-xs font-bold text-gray-700">{product.reviewedAt}</p>
                      </div>
                    )}
                    {product.reviewedBy && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Reviewed By</p>
                        <p className="text-xs font-bold text-gray-700">{product.reviewedBy}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & Commission */}
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                  <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Financials
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-700">Listing Price</span>
                      <span className="font-bold text-lg text-emerald-900">ETB {product.price.toLocaleString()}</span>
                    </div>
                    
                    <div className="bg-white/50 p-2 rounded-lg text-xs text-emerald-800 mb-2">
                      <div className="flex justify-between mb-1"><span>Avg Category Price:</span> <span className="font-bold">ETB 2,200</span></div>
                      <div className="flex justify-between"><span>Price Status:</span> <span className="font-bold text-emerald-600">Reasonable</span></div>
                    </div>

                    <div className="pt-3 border-t border-emerald-200">
                      <div className="flex justify-between mb-1">
                        <span className="text-emerald-700">Commission (15%)</span>
                        <span className="font-bold text-emerald-900">ETB {calculateCommission(product.price).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Indicators */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Risk Analysis
                  </h3>
                  <div className="space-y-2">
                    {product.riskBadges.length > 0 ? (
                      product.riskBadges.map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-100">
                          <AlertTriangle className="w-3.5 h-3.5" /> {badge}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Low Risk Detected
                      </div>
                    )}
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
      {/* Modals */}
      {viewProduct && <ProductReviewPage product={viewProduct} onClose={() => setViewProduct(null)} />}
      {rejectProduct && <RejectionModal product={rejectProduct} onClose={() => setRejectProduct(null)} />}
      {resubmitProduct && <ResubmitModal product={resubmitProduct} onClose={() => setResubmitProduct(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800">Product Verification</h1>
          <p className="text-gray-500 text-sm">Ensure cultural authenticity and quality of artisan products.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportLogs} leftIcon={Download}>
            Export Logs
          </Button>
          {/* Bulk Actions */}
          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="text-sm font-bold text-gray-600 bg-white px-3 py-2 rounded-xl border border-gray-200">
                {selectedProductIds.length} Selected
              </span>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500" onClick={handleBulkApprove}>
                Approve All
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                Reject All
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search products, artisans, or SKUs..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <select className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer hover:bg-gray-100">
            <option>All Categories</option>
            <option>Textiles</option>
            <option>Pottery</option>
            <option>Jewelry</option>
          </select>
          <select className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer hover:bg-gray-100">
            <option>Any Price</option>
            <option>Under 1000 ETB</option>
            <option>Over 5000 ETB</option>
          </select>
          <div className="w-px h-8 bg-gray-200 mx-2 hidden xl:block"></div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-9 pr-8 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer hover:bg-gray-100 appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Submitted">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

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
                        Clear
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
      </div>

      {/* Products Table */}
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
                      if (e.target.checked) setSelectedProductIds(filteredProducts.map(p => p.id));
                      else setSelectedProductIds([]);
                    }}
                  />
                </th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Artisan</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((product) => (
                <tr key={product.id} className={`hover:bg-gray-50 transition-colors group ${selectedProductIds.includes(product.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => toggleSelectProduct(product.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={product.images[0]} className="w-12 h-12 rounded-lg object-cover bg-gray-200 border border-gray-100" alt="" />
                      <div>
                        <p className="font-bold text-gray-800 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600">
                        {product.artisan.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{product.artisan.name}</p>
                        <p className="text-[10px] text-gray-400">{product.artisan.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="info">{product.category}</Badge>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800">ETB {product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">{product.stockQuantity}</td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={
                        product.verificationStatus === 'Approved' ? 'success' : 
                        product.verificationStatus === 'Submitted' ? 'warning' : 
                        product.verificationStatus === 'Rejected' ? 'error' : 'info'
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
                        Review
                      </Button>
                      <div className="relative group/actions">
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 hidden group-hover/actions:block animate-in fade-in slide-in-from-top-1">
                          <button 
                            className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                            onClick={() => { console.log('Approved'); }}
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Product
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                            onClick={() => setResubmitProduct(product)}
                          >
                            <AlertCircle className="w-3.5 h-3.5" /> Request Resubmission
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            onClick={() => setRejectProduct(product)}
                          >
                            <Ban className="w-3.5 h-3.5" /> Reject Product
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
