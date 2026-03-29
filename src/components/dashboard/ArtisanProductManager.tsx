import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Filter, Plus, LayoutGrid, List, MoreVertical, 
  Edit3, Trash2, Copy, Archive, Eye, TrendingUp, 
  DollarSign, Package, Tag, Truck, Calendar, ChevronLeft,
  ChevronRight, CheckSquare, Square, AlertCircle, ArrowUpDown,
  Download, BarChart2, Save, Star, Clock, MoreHorizontal
} from 'lucide-react';
import { Button, Badge, Input } from '../UI';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

// --- Types ---
interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
  discountPrice?: number;
  stock: number;
  sold: number;
  rating: number;
  status: 'Published' | 'Draft' | 'Archived' | 'Pending Verification';
  category: string;
  tags: string[];
  sku: string;
  createdAt: string;
  lastOrderDate: string;
  views: number;
  revenue: number;
  description?: string;
  shippingFee: string;
  deliveryTime: string;
  weight: string;
}

// --- Mock Data ---
const MOCK_PRODUCTS_DATA: Product[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `prod-${i + 1}`,
  name: i % 2 === 0 ? `Handwoven Gabi Scarf ${i + 1}` : `Traditional Clay Pot ${i + 1}`,
  images: [
    i % 2 === 0 ? 'https://picsum.photos/seed/gabi/300/300' : 'https://picsum.photos/seed/pot/300/300',
    'https://picsum.photos/seed/detail1/300/300',
    'https://picsum.photos/seed/detail2/300/300'
  ],
  price: 1200 + (i * 50),
  stock: i === 2 ? 0 : i === 5 ? 3 : 15 + i,
  sold: 50 + (i * 2),
  rating: 4.5 + (i % 5) * 0.1,
  status: i === 2 ? 'Published' : i === 5 ? 'Published' : i % 4 === 0 ? 'Draft' : 'Published',
  category: i % 2 === 0 ? 'Textiles' : 'Pottery',
  tags: ['Handmade', 'Ethiopian', 'Cultural'],
  sku: `ETH-${2024000 + i}`,
  createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(), // Spread out over days
  lastOrderDate: new Date(Date.now() - i * 3600000).toISOString(),
  views: 1200 + (i * 100),
  revenue: (1200 + (i * 50)) * (50 + (i * 2)),
  description: 'Authentic handmade Ethiopian artifact crafted with care and tradition. Made from locally sourced materials by skilled artisans.',
  shippingFee: i % 3 === 0 ? 'Free Shipping' : 'ETB 150',
  deliveryTime: '3-5 Days',
  weight: '0.5 kg'
}));

// --- Components ---

const ProductPerformanceCard: React.FC<{ product: Product }> = ({ product }) => {
  const data = [
    { name: 'Mon', sales: 4 },
    { name: 'Tue', sales: 3 },
    { name: 'Wed', sales: 7 },
    { name: 'Thu', sales: 5 },
    { name: 'Fri', sales: 8 },
    { name: 'Sat', sales: 12 },
    { name: 'Sun', sales: 9 },
  ];

  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><BarChart2 className="w-5 h-5" /></div>
        <h3 className="text-lg font-bold text-primary">Performance</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-2xl">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Revenue</p>
          <p className="text-xl font-bold text-primary mt-1">ETB {product.revenue.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Units Sold</p>
          <p className="text-xl font-bold text-primary mt-1">{product.sold}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Views</p>
          <p className="text-xl font-bold text-primary mt-1">{product.views.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Conversion</p>
          <p className="text-xl font-bold text-primary mt-1">{((product.sold / product.views) * 100).toFixed(1)}%</p>
        </div>
        <div className="col-span-2 p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Last Order</p>
            <p className="text-sm font-bold text-primary mt-1">{new Date(product.lastOrderDate).toLocaleDateString()}</p>
          </div>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="h-40 w-full pt-4 border-t border-gray-100">
        <p className="text-xs font-bold text-gray-400 mb-4">Last 7 Days Sales</p>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const ArtisanProductManager: React.FC = () => {
  const router = useRouter();
  const navigate = (to: string) => router.push(to);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS_DATA);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [manageId, setManageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [sortBy, setSortBy] = useState('Newest');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const itemsPerPage = 8;

  // --- Handlers ---
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Name,Price,Stock,Sold,Status,Category,SKU\n"
      + products.map(p => `${p.id},${p.name},${p.price},${p.stock},${p.sold},${p.status},${p.category},${p.sku}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    if (product.sold > 0) {
      alert(`Cannot delete "${product.name}" because it has ${product.sold} existing orders. You can archive it instead.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setManageId(null);
      alert("Product deleted successfully.");
    }
  };

  const handleArchive = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'Archived' } : p));
    alert("Product archived successfully.");
  };

  const handlePublish = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'Pending Verification' } : p));
    alert("Product submitted for verification. It will be live once approved by an admin.");
  };

  // --- Derived State ---
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }

    // Filter Status
    if (filterStatus !== 'All') {
      if (filterStatus === 'Out of Stock') {
        result = result.filter(p => p.stock === 0);
      } else if (filterStatus === 'Active') {
        result = result.filter(p => p.status === 'Published');
      } else if (filterStatus === 'Pending') {
        result = result.filter(p => p.status === 'Pending Verification');
      } else {
        result = result.filter(p => p.status === filterStatus as any);
      }
    }

    // Filter Date
    const now = new Date();
    if (dateFilter === 'Today') {
      result = result.filter(p => new Date(p.createdAt).toDateString() === now.toDateString());
    } else if (dateFilter === 'This Month') {
      result = result.filter(p => {
        const d = new Date(p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (dateFilter === 'This Year') {
      result = result.filter(p => new Date(p.createdAt).getFullYear() === now.getFullYear());
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'Newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'Oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'Best Selling': return b.sold - a.sold;
        case 'Lowest Selling': return a.sold - b.sold;
        case 'Lowest Stock': return a.stock - b.stock;
        case 'Highest Revenue': return b.revenue - a.revenue;
        case 'Recently Updated': return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime(); // Mocking updated with last order
        default: return 0;
      }
    });

    return result;
  }, [searchQuery, filterStatus, dateFilter, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Handlers ---
  const toggleSelection = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = (action: string) => {
    alert(`${action} ${selectedItems.length} items`);
    setSelectedItems([]);
  };

  const getStatusBadge = (product: Product) => {
    if (product.stock === 0) return <Badge variant="error" size="sm">Out of Stock</Badge>;
    if (product.status === 'Draft') return <Badge variant="warning" size="sm">Draft</Badge>;
    if (product.status === 'Archived') return <Badge variant="secondary" size="sm">Archived</Badge>;
    if (product.status === 'Pending Verification') return <Badge variant="info" size="sm">Pending Verification</Badge>;
    return <Badge variant="success" size="sm">Published</Badge>;
  };

  // --- Manage View ---
  if (manageId) {
    const product = products.find(p => p.id === manageId);
    if (!product) return <div>Product not found</div>;

    return (
      <div className="space-y-8 animate-in fade-in duration-300 pb-20">
        <header className="flex items-center justify-between sticky top-0 bg-gray-50/80 backdrop-blur-md z-20 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setManageId(null)} className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-gray-100">
              <ChevronLeft className="w-6 h-6 text-gray-500" />
            </button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-3">
                {product.name}
                {getStatusBadge(product)}
              </h1>
              <p className="text-gray-500 text-sm">SKU: {product.sku} • Created on {new Date(product.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {product.status === 'Draft' && (
              <Button onClick={() => handlePublish(product.id)} variant="primary" className="bg-emerald-600 hover:bg-emerald-700">Publish Product</Button>
            )}
            <Button variant="outline" leftIcon={Eye} onClick={() => window.open(`/product/${product.id}`, '_blank')}>View Public</Button>
            <Button leftIcon={Save} onClick={() => alert("Changes saved successfully.")}>Save Changes</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">Basic Information</h3>
                <button className="text-emerald-600 text-sm font-bold hover:underline">Edit</button>
              </div>
              <div className="space-y-6">
                {/* Image Carousel Mock */}
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {product.images.map((img, i) => (
                    <img key={i} src={img} className="w-32 h-32 rounded-2xl object-cover border border-gray-100 flex-shrink-0" alt="" />
                  ))}
                  <button className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                    <Plus className="w-6 h-6 text-gray-300" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-700">Description</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{product.category}</Badge>
                  {product.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                </div>
              </div>
            </section>

            {/* Pricing & Inventory */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">Pricing & Inventory</h3>
                <button className="text-emerald-600 text-sm font-bold hover:underline">Edit</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Price</p>
                  <p className="text-xl font-bold text-primary mt-1">ETB {product.price}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Stock</p>
                  <p className={`text-xl font-bold mt-1 ${product.stock < 5 ? 'text-red-500' : 'text-primary'}`}>
                    {product.stock} {product.stock < 5 && <AlertCircle className="w-4 h-4 inline ml-1" />}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Sold</p>
                  <p className="text-xl font-bold text-primary mt-1">{product.sold}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">SKU</p>
                  <p className="text-xl font-bold text-primary mt-1">{product.sku}</p>
                </div>
              </div>
            </section>

            {/* Shipping */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">Shipping Information</h3>
                <button className="text-emerald-600 text-sm font-bold hover:underline">Edit</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl">
                  <Truck className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Shipping Fee</p>
                    <p className="font-bold text-primary">{product.shippingFee}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Delivery Time</p>
                    <p className="font-bold text-primary">{product.deliveryTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-2xl">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Weight</p>
                    <p className="font-bold text-primary">{product.weight}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Management Actions */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-primary">Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => navigate(`/dashboard/artisan/products/edit/${product.id}`)}
                  className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all flex flex-col items-center gap-2 text-center group"
                >
                  <Edit3 className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                  <span className="text-sm font-bold text-gray-600 group-hover:text-primary">Edit Product</span>
                </button>
                <button 
                  onClick={() => alert("Product duplicated.")}
                  className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all flex flex-col items-center gap-2 text-center group"
                >
                  <Copy className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                  <span className="text-sm font-bold text-gray-600 group-hover:text-primary">Duplicate</span>
                </button>
                <button 
                  onClick={() => handleArchive(product.id)}
                  className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all flex flex-col items-center gap-2 text-center group"
                >
                  <Archive className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                  <span className="text-sm font-bold text-gray-600 group-hover:text-primary">Archive</span>
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className={`p-4 border border-gray-100 rounded-2xl transition-all flex flex-col items-center gap-2 text-center group ${product.sold > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 hover:border-red-200'}`}
                  title={product.sold > 0 ? "Cannot delete product with existing orders" : "Delete product"}
                >
                  <Trash2 className={`w-5 h-5 ${product.sold > 0 ? 'text-gray-300' : 'text-gray-400 group-hover:text-red-500'}`} />
                  <span className={`text-sm font-bold ${product.sold > 0 ? 'text-gray-300' : 'text-gray-600 group-hover:text-red-500'}`}>Delete</span>
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <ProductPerformanceCard product={product} />
          </div>
        </div>
      </div>
    );
  }

  // --- List View ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20" onClick={() => setActiveMenuId(null)}>
      {/* Header & Controls */}
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">My Products</h1>
            <p className="text-gray-500 text-sm">Manage your catalog and inventory.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" leftIcon={Download} onClick={handleExport}>Export</Button>
            <Button leftIcon={Plus} onClick={() => navigate('/dashboard/artisan/products/create')}>Add Product</Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by name or SKU..." 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="h-8 w-[1px] bg-gray-100 hidden md:block"></div>
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              {['All', 'Active', 'Draft', 'Pending', 'Out of Stock', 'Archived'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    filterStatus === status ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
             {/* Date Filter */}
             <div className="relative">
              <select 
                className="appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option>All Time</option>
                <option>Today</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select 
                className="appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option>Newest</option>
                <option>Oldest</option>
                <option>Best Selling</option>
                <option>Lowest Selling</option>
                <option>Lowest Stock</option>
                <option>Highest Revenue</option>
                <option>Recently Updated</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>

            {/* View Toggle */}
            <div className="bg-gray-50 p-1 rounded-xl flex">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-primary'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-primary'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedItems.length > 0 && (
          <div className="bg-primary text-white p-4 rounded-2xl flex justify-between items-center animate-in slide-in-from-top-2">
            <span className="text-sm font-bold">{selectedItems.length} items selected</span>
            <div className="flex gap-3">
              <button onClick={() => handleBulkAction('Archive')} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">Archive</button>
              <button onClick={() => handleBulkAction('Delete')} className="px-4 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-bold transition-colors">Delete</button>
              <button onClick={() => setSelectedItems([])} className="px-4 py-1.5 text-white/60 hover:text-white text-xs font-bold">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid/Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedProducts.map(product => (
            <div key={product.id} className={`bg-white rounded-[24px] border transition-all overflow-hidden group relative ${selectedItems.includes(product.id) ? 'border-primary ring-1 ring-primary' : 'border-gray-100 hover:shadow-md'}`}>
              <div className="absolute top-3 left-3 z-10">
                <button onClick={(e) => { e.stopPropagation(); toggleSelection(product.id); }} className="bg-white/80 backdrop-blur-sm rounded-lg p-1.5 hover:bg-white transition-colors">
                  {selectedItems.includes(product.id) ? <CheckSquare className="w-5 h-5 text-primary fill-primary/10" /> : <Square className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
              <div className="absolute top-3 right-3 z-10">
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === product.id ? null : product.id); }}
                    className="bg-white/80 backdrop-blur-sm rounded-lg p-1.5 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  {activeMenuId === product.id && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={() => navigate(`/dashboard/artisan/products/edit/${product.id}`)}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button 
                        onClick={() => alert("Product duplicated.")}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                      >
                        <Copy className="w-3 h-3" /> Duplicate
                      </button>
                      <button 
                        onClick={() => handleArchive(product.id)}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                      >
                        <Archive className="w-3 h-3" /> Archive
                      </button>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        disabled={product.sold > 0}
                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${product.sold > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="h-48 overflow-hidden bg-gray-100 relative">
                <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                {product.stock < 5 && product.stock > 0 && (
                  <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Low Stock
                  </div>
                )}
              </div>
              
              <div className="p-5 space-y-3">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-primary line-clamp-1" title={product.name}>{product.name}</h3>
                    {getStatusBadge(product)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-gray-600">{product.rating}</span>
                    <span className="text-[10px] text-gray-400">• {product.sold} sold</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                  <div>
                    <p className="text-lg font-bold text-primary">ETB {product.price}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Stock: {product.stock}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setManageId(product.id)}>Manage</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4 w-12">
                  <button onClick={() => setSelectedItems(selectedItems.length === paginatedProducts.length ? [] : paginatedProducts.map(p => p.id))}>
                    {selectedItems.length === paginatedProducts.length && paginatedProducts.length > 0 ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Sold</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedProducts.map(product => (
                <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${selectedItems.includes(product.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelection(product.id)}>
                      {selectedItems.includes(product.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-gray-300" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={product.images[0]} className="w-10 h-10 rounded-lg object-cover bg-gray-100" alt="" />
                      <div>
                        <p className="font-bold text-primary">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">ETB {product.price}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${product.stock < 5 ? 'text-red-500' : 'text-gray-600'}`}>{product.stock}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{product.sold}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-600">{product.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(product)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setManageId(product.id)}><Edit3 className="w-4 h-4" /></Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className={`h-8 w-8 p-0 ${product.sold > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-600'}`}
                        onClick={() => handleDelete(product.id)}
                        disabled={product.sold > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center pt-4">
        <p className="text-xs text-gray-400 font-medium">Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products</p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            leftIcon={ChevronLeft}
          >
            Prev
          </Button>
          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            rightIcon={ChevronRight}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
