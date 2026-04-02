import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Image as ImageIcon, Upload, Trash2, Info, 
  DollarSign, Package, Tag, Truck, Save, Eye, CheckCircle2,
  AlertCircle, ChevronLeft, Plus
} from 'lucide-react';
import { Button, Input, Badge } from '../../components/UI';

export const ArtisanCreateProductPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    images: [] as string[],
    description: '',
    material: '',
    handmadeBy: '',
    region: '',
    careInstructions: '',
    price: '',
    discountPrice: '',
    stock: '',
    sku: '',
    category: '',
    subcategory: '',
    tags: '',
    weight: '',
    deliveryTime: '',
    shippingFee: '',
    status: 'Draft' as 'Draft' | 'Publish'
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + previewImages.length > 5) {
        alert('Maximum 5 images allowed');
        return;
      }
      
      const newPreviews = files.map((file: File) => URL.createObjectURL(file));
      setPreviewImages([...previewImages, ...newPreviews]);
      // In a real app, you'd handle the actual file upload here
    }
  };

  const removeImage = (index: number) => {
    const newPreviews = [...previewImages];
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
  };

   const handleSubmit = async (status: 'Draft' | 'Publish') => {
     // Validate required fields
     if (!formData.name || previewImages.length === 0 || !formData.description || !formData.price || !formData.stock || !formData.category || !formData.deliveryTime || !formData.shippingFee) {
       alert('Please fill in all required fields marked with *');
       return;
     }

     try {
       const token = localStorage.getItem('token');
       console.log('Token retrieved:', token ? 'Present' : 'Missing');
       if (!token) {
         alert('Authentication required. Please log in again.');
         router.push('/login');
         return;
       }

       const productData = {
         name: formData.name,
         description: formData.description,
         price: parseFloat(formData.price),
         images: previewImages,
         category: formData.category,
         stock: parseInt(formData.stock),
         material: formData.material || undefined,
         handmadeBy: formData.handmadeBy || undefined,
         region: formData.region || undefined,
         careInstructions: formData.careInstructions || undefined,
         discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
         sku: formData.sku || undefined,
         subcategory: formData.subcategory || undefined,
         tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : undefined,
         weight: formData.weight || undefined,
         deliveryTime: formData.deliveryTime,
         shippingFee: formData.shippingFee === 'Free Shipping' ? 'Free Shipping' : formData.shippingFee,
         status: status === 'Publish' ? 'Published' : 'Draft'
       };

       console.log('Sending product data:', productData);

       const response = await fetch('/api/artisan/products', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify(productData)
       });

       const result = await response.json();

       if (!response.ok) {
         throw new Error(result.message || 'Failed to save product');
       }

       alert(`Artifact ${status === 'Publish' ? 'Published' : 'Saved as Draft'} Successfully!`);
       router.push('/dashboard/artisan/products');
     } catch (error: any) {
       console.error('Error submitting product:', error);
       alert(error.message || 'An error occurred while saving the product');
     }
   };

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 sticky top-0 bg-gray-50/80 backdrop-blur-md z-10 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-xl transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Add New Artifact</h1>
            <p className="text-gray-500 text-sm">Share your craft with the world.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={Save} onClick={() => handleSubmit('Draft')}>Save Draft</Button>
          <Button leftIcon={CheckCircle2} onClick={() => handleSubmit('Publish')}>Publish Artifact</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Basic Information */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Info className="w-5 h-5" /></div>
              <h2 className="text-xl font-bold text-primary">Basic Information</h2>
            </div>
            
            <Input 
              label="Product Name *" 
              placeholder="e.g. Handwoven Dorze Cotton Scarf"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product Images * (Max 5)</label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {previewImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-gray-100">
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {idx === 0 && <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] font-bold text-center py-1">Cover</div>}
                  </div>
                ))}
                {previewImages.length < 5 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all group">
                    <Upload className="w-6 h-6 text-gray-300 group-hover:text-primary mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-primary">Upload</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description *</label>
              <textarea 
                className="w-full h-40 p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="Describe the material, cultural background, and handmade process..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Material" 
                  placeholder="e.g. 100% Cotton" 
                  value={formData.material}
                  onChange={e => setFormData({...formData, material: e.target.value})}
                />
                <Input 
                  label="Handmade By" 
                  placeholder="e.g. Dorze Weavers" 
                  value={formData.handmadeBy}
                  onChange={e => setFormData({...formData, handmadeBy: e.target.value})}
                />
                <Input 
                  label="Region" 
                  placeholder="e.g. Southern Ethiopia" 
                  value={formData.region}
                  onChange={e => setFormData({...formData, region: e.target.value})}
                />
                <Input 
                  label="Care Instructions" 
                  placeholder="e.g. Hand wash only" 
                  value={formData.careInstructions}
                  onChange={e => setFormData({...formData, careInstructions: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* 2. Pricing Section */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
              <h2 className="text-xl font-bold text-primary">Pricing</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Price (ETB) *" 
                type="number" 
                placeholder="0.00"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
              <Input 
                label="Discount Price (Optional)" 
                type="number" 
                placeholder="0.00"
                value={formData.discountPrice}
                onChange={e => setFormData({...formData, discountPrice: e.target.value})}
              />
            </div>
             {formData.price && formData.discountPrice && (
               <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-4">
                 <span className="text-xs font-bold text-gray-500 uppercase">Preview:</span>
                 <span className="text-gray-400 line-through text-sm">ETB {formData.price}</span>
                 <span className="text-emerald-600 font-bold text-lg">ETB {formData.discountPrice}</span>
                 <Badge variant="success">
                   {Math.round(((Number(formData.price) - Number(formData.discountPrice)) / Number(formData.price)) * 100)}% OFF
                 </Badge>
               </div>
             )}
          </section>

          {/* 3. Inventory Section */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Package className="w-5 h-5" /></div>
              <h2 className="text-xl font-bold text-primary">Inventory</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Stock Quantity *" 
                type="number" 
                placeholder="e.g. 10"
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: e.target.value})}
              />
              <Input 
                label="SKU (Optional)" 
                placeholder="e.g. DC-2025-001"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
              />
            </div>
            {Number(formData.stock) === 0 && formData.stock !== '' && (
              <div className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4" />
                Product will be marked as "Out of Stock"
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* 4. Category & Classification */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Tag className="w-5 h-5" /></div>
              <h2 className="text-xl font-bold text-primary">Category</h2>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category *</label>
              <select 
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select Category</option>
                <option value="Clothing">Clothing</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Pottery">Pottery</option>
                <option value="Woodcraft">Woodcraft</option>
                <option value="Textile">Textile</option>
                <option value="Cultural Art">Cultural Art</option>
              </select>
            </div>

            <Input 
              label="Subcategory (Optional)" 
              placeholder="e.g. Scarves"
              value={formData.subcategory}
              onChange={e => setFormData({...formData, subcategory: e.target.value})}
            />

            <Input 
              label="Tags (Optional)" 
              placeholder="e.g. Handmade, Cotton"
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
            />
          </section>

          {/* 5. Shipping Information */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Truck className="w-5 h-5" /></div>
              <h2 className="text-xl font-bold text-primary">Shipping</h2>
            </div>

            <Input 
              label="Weight (Optional)" 
              placeholder="e.g. 0.5 kg"
              value={formData.weight}
              onChange={e => setFormData({...formData, weight: e.target.value})}
            />

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Delivery Time *</label>
              <select 
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                value={formData.deliveryTime}
                onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
              >
                <option value="">Select Delivery Time</option>
                <option value="1-3 days">1-3 days</option>
                <option value="3-5 days">3-5 days</option>
                <option value="5-7 days">5-7 days</option>
                <option value="1-2 weeks">1-2 weeks</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Shipping Fee *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="shipping" 
                    checked={formData.shippingFee === 'Free Shipping'}
                    onChange={() => setFormData({...formData, shippingFee: 'Free Shipping'})}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Free Shipping</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="shipping" 
                    checked={formData.shippingFee !== 'Free Shipping' && formData.shippingFee !== ''}
                    onChange={() => setFormData({...formData, shippingFee: '0'})}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Fixed Rate</span>
                </label>
              </div>
              {formData.shippingFee !== 'Free Shipping' && (
                <Input 
                  placeholder="Enter fee (ETB)"
                  type="number"
                  value={formData.shippingFee === 'Free Shipping' ? '' : formData.shippingFee}
                  onChange={e => setFormData({...formData, shippingFee: e.target.value})}
                  className="mt-2"
                />
              )}
            </div>
          </section>

          {/* 6. Product Status */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><Eye className="w-5 h-5" /></div>
              <h2 className="text-xl font-bold text-primary">Status</h2>
            </div>
            
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button 
                onClick={() => setFormData({...formData, status: 'Draft'})}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.status === 'Draft' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
              >
                Draft
              </button>
              <button 
                onClick={() => setFormData({...formData, status: 'Publish'})}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.status === 'Publish' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-primary'}`}
              >
                Publish
              </button>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {formData.status === 'Draft' 
                ? 'Product will be saved but not visible to customers.' 
                : 'Product will be live and visible to all customers immediately.'}
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
