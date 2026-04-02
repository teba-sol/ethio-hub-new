import React, { useState, useMemo, useEffect } from 'react';
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

interface Product {
  _id: string;
  artisanId: string;
  name: string;
  images: string[];
  price: number;
  discountPrice?: number;
  stock: number;
  sold?: number;
  rating?: number;
  status: 'Published' | 'Draft' | 'Archived';
  category: string;
  tags?: string[];
  sku?: string;
  createdAt: string;
  description?: string;
  shippingFee: string;
  deliveryTime: string;
  weight?: string;
  material?: string;
  handmadeBy?: string;
  region?: string;
  careInstructions?: string;
  subcategory?: string;
}

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
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Price</p>
          <p className="text-xl font-bold text-primary mt-1">ETB {product.price.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Stock</p>
          <p className="text-xl font-bold text-primary mt-1">{product.stock}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Category</p>
          <p className="text-lg font-bold text-primary mt-1">{product.category}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status</p>
          <p className="text-lg font-bold text-primary mt-1">{product.status}</p>
        </div>
        <div className="col-span-2 p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Created</p>
            <p className="text-sm font-bold text-primary mt-1">{new Date(product.createdAt).toLocaleDateString()}</p>
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/artisan/products');
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

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Name,Price,Stock,Status,Category,SKU\n"
      + products.map(p => `${p._id},${p.name},${p.price},${p.stock},${p.status},${p.category},${p.sku || ''}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    const product = products.find(p => p._id === id);
    if (!product) return;

    if (product.status === 'Published') {
      alert(`Cannot delete "${product.name}" because it is published. Archive it instead.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/artisan/products/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setProducts(prev => prev.filter(p => p._id !== id));
          if (manageId === id) setManageId(null);
          alert("Product deleted successfully.");
        } else {
          const data = await response.json();
          alert(data.message || 'Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const response = await fetch(`/api/artisan/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Archived' }),
      });
      if (response.ok) {
        setProducts(prev => prev.map(p => p._id === id ? { ...p, status: 'Archived' as const } : p));
        alert("Product archived successfully.");
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to archive product');
      }
    } catch (error) {
      console.error('Error archiving product:', error);
      alert('Failed to archive product');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const response = await fetch(`/api/artisan/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Published' }),
      });
      if (response.ok) {
        setProducts(prev => prev.map(p => p._id === id ? { ...p, status: 'Published' as const } : p));
        alert("Product published successfully.");
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to publish product');
      }
    } catch (error) {
      console.error('Error publishing product:', error);
      alert('Failed to publish product');
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const duplicateData = {
        name: `${product.name} (Copy)`,
        images: product.images,
        description: product.description,
        material: product.material,
        handmadeBy: product.handmadeBy,
        region: product.region,
        careInstructions: product.careInstructions,
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        sku: product.sku ? `${product.sku}-COPY` : undefined,
        category: product.category,
        subcategory: product.subcategory,
        tags: product.tags,
        weight: product.weight,
        deliveryTime: product.deliveryTime,
        shippingFee: product.shippingFee,
        status: 'Draft',
      };

      const response = await fetch('/api/artisan/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData),
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(prev => [data.product, ...prev]);
        alert("Product duplicated successfully.");
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to duplicate product');
      }
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('Failed to duplicate product');
    }
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }

    if (filterStatus !== 'All') {
      if (filterStatus === 'Out of Stock') {
        result = result.filter(p => p.stock === 0);
      } else if (filterStatus === 'Active') {
        result = result.filter(p => p.status === 'Published');
      } else {
        result = result.filter(p => p.status === filterStatus);
      }
    }

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

    result.sort((a, b) => {
      switch (sortBy) {
        case 'Newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'Oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'Lowest Stock': return a.stock - b.stock;
        default: return 0;
      }
    });

    return result;
  }, [searchQuery, filterStatus, dateFilter, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = async (action: string) => {
    if (action === 'Archive') {
      for (const id of selectedItems) {
        await handleArchive(id);
      }
    } else if (action === 'Delete') {
      for (const id of selectedItems) {
        await handleDelete(id);
      }
    }
    setSelectedItems([]);
  };

  const getStatusBadge = (product: Product) => {
    if (product.stock === 0) return <Badge variant="error">Out of Stock</Badge>;
    if (product.status === 'Draft') return <Badge variant="warning">Draft</Badge>;
    if (product.status === 'Archived') return <Badge variant="outline">Archived</Badge>;
    return <Badge variant="success">Published</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  if (manageId) {
    const product = products.find(p => p._id === manageId);
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
              <p className="text-gray-500 text-sm">SKU: {product.sku || 'N/A'} • Created on {new Date(product.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {product.status === 'Draft' && (
              <Button onClick={() => handlePublish(product._id)} variant="primary" className="bg-emerald-600 hover:bg-emerald-700">Publish Product</Button>
            )}
            <Button variant="outline" leftIcon={Eye} onClick={() => window.open(`/product/${product._id}`, '_blank')}>View Public</Button>
            <Button leftIcon={Save} onClick={() => alert("Changes saved successfully.")}>Save Changes</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">Basic Information</h3>
                <button onClick={() => navigate(`/dashboard/artisan/products/edit/${product._id}`)} className="text-emerald-600 text-sm font-bold hover:underline">Edit</button>
              </div>
              <div className="space-y-6">
                {product.images && product.images.length > 0 && (
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {product.images.map((img, i) => (
                      <img key={i} src={img} className="w-32 h-32 rounded-2xl object-cover border border-gray-100 flex-shrink-0" alt="" />
                    ))}
                  </div>
                )}
                
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-700">Description</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{product.category}</Badge>
                  {product.tags && product.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">Pricing & Inventory</h3>
                <button onClick={() => navigate(`/dashboard/artisan/products/edit/${product._id}`)} className="text-emerald-600 text-sm font-bold hover:underline">Edit</button>
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
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Discount</p>
                  <p className="text-xl font-bold text-primary mt-1">{product.discountPrice ? `ETB ${product.discountPrice}` : 'None'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">SKU</p>
                  <p className="text-xl font-bold text-primary mt-1">{product.sku || 'N/A'}</p>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">Shipping Information</h3>
                <button onClick={() => navigate(`/dashboard/artisan/products/edit/${product._id}`)} className="text-emerald-600 text-sm font-bold hover:underline">Edit</button>
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
                    <p className="font-bold text-primary">{product.weight || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-primary">Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => navigate(`/dashboard/artisan/products/edit/${product._id}`)}
                  className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all flex flex-col items-center gap-2 text-center group"
                >
                  <Edit3 className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                  <span className="text-sm font-bold text-gray-600 group-hover:text-primary">Edit Product</span>
                </button>
                <button 
                  onClick={() => handleDuplicate(product)}
                  className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all flex flex-col items-center gap-2 text-center group"
                >
                  <Copy className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                  <span className="text-sm font-bold text-gray-600 group-hover:text-primary">Duplicate</span>
                </button>
                <button 
                  onClick={() => handleArchive(product._id)}
                  className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all flex flex-col items-center gap-2 text-center group"
                >
                  <Archive className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                  <span className="text-sm font-bold text-gray-600 group-hover:text-primary">Archive</span>
                </button>
                <button 
                  onClick={() => handleDelete(product._id)}
                  className={`p-4 border border-gray-100 rounded-2xl transition-all flex flex-col items-center gap-2 text-center group ${product.status === 'Published' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 hover:border-red-200'}`}
                  title={product.status === 'Published' ? "Cannot delete published product" : "Delete product"}
                >
                  <Trash2 className={`w-5 h-5 ${product.status === 'Published' ? 'text-gray-300' : 'text-gray-400 group-hover:text-red-500'}`} />
                  <span className={`text-sm font-bold ${product.status === 'Published' ? 'text-gray-300' : 'text-gray-600 group-hover:text-red-500'}`}>Delete</span>
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20" onClick={() => setActiveMenuId(null)}>
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
              {['All', 'Active', 'Draft', 'Out of Stock', 'Archived'].map(status => (
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

            <div className="relative">
              <select 
                className="appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary cursor-pointer focus:ring-2 focus:ring-primary/10"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option>Newest</option>
                <option>Oldest</option>
                <option>Lowest Stock</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>

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

      {paginatedProducts.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-primary mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || filterStatus !== 'All' 
              ? 'Try adjusting your search or filters' 
              : 'Start by adding your first artifact'}
          </p>
          <Button leftIcon={Plus} onClick={() => navigate('/dashboard/artisan/products/create')}>Add Product</Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedProducts.map(product => (
            <div key={product._id} className={`bg-white rounded-[24px] border transition-all overflow-hidden group relative ${selectedItems.includes(product._id) ? 'border-primary ring-1 ring-primary' : 'border-gray-100 hover:shadow-md'}`}>
              <div className="absolute top-3 left-3 z-10">
                <button onClick={(e) => { e.stopPropagation(); toggleSelection(product._id); }} className="bg-white/80 backdrop-blur-sm rounded-lg p-1.5 hover:bg-white transition-colors">
                  {selectedItems.includes(product._id) ? <CheckSquare className="w-5 h-5 text-primary fill-primary/10" /> : <Square className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
              <div className="absolute top-3 right-3 z-10">
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === product._id ? null : product._id); }}
                    className="bg-white/80 backdrop-blur-sm rounded-lg p-1.5 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  {activeMenuId === product._id && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={() => navigate(`/dashboard/artisan/products/edit/${product._id}`)}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDuplicate(product)}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                      >
                        <Copy className="w-3 h-3" /> Duplicate
                      </button>
                      <button 
                        onClick={() => handleArchive(product._id)}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                      >
                        <Archive className="w-3 h-3" /> Archive
                      </button>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button 
                        onClick={() => handleDelete(product._id)}
                        disabled={product.status === 'Published'}
                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${product.status === 'Published' ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="h-48 overflow-hidden bg-gray-100 relative">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package className="w-12 h-12" />
                  </div>
                )}
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
                </div>
                
                <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                  <div>
                    <p className="text-lg font-bold text-primary">ETB {product.price}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Stock: {product.stock}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setManageId(product._id)}>Manage</Button>
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
                  <button onClick={() => setSelectedItems(selectedItems.length === paginatedProducts.length ? [] : paginatedProducts.map(p => p._id))}>
                    {selectedItems.length === paginatedProducts.length && paginatedProducts.length > 0 ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedProducts.map(product => (
                <tr key={product._id} className={`hover:bg-gray-50 transition-colors ${selectedItems.includes(product._id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelection(product._id)}>
                      {selectedItems.includes(product._id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-gray-300" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} className="w-10 h-10 rounded-lg object-cover bg-gray-100" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-primary">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">ETB {product.price}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${product.stock < 5 ? 'text-red-500' : 'text-gray-600'}`}>{product.stock}</span>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(product)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setManageId(product._id)}><Edit3 className="w-4 h-4" /></Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className={`h-8 w-8 p-0 ${product.status === 'Published' ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-600'}`}
                        onClick={() => handleDelete(product._id)}
                        disabled={product.status === 'Published'}
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

      {totalPages > 1 && (
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
      )}
    </div>
  );
};
