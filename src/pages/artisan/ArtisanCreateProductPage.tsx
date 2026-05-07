import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Image as ImageIcon, Upload, Trash2, Info, 
  DollarSign, Package, Tag, Truck, Save, Eye, CheckCircle2,
  AlertCircle, ChevronLeft, Plus, Loader2
} from 'lucide-react';
import { Button, Input, Badge } from '../../components/UI';
import { DualLanguageField } from '../../components/BilingualInput';
import { ETHIOPIA_REGIONS } from '../../data/constants';

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
    shippingFee: '0',
    status: 'Pending' as 'Draft' | 'Publish'
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotify = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingCover(true);
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', e.target.files[0]);
        formDataUpload.append('folder', 'products');
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload
        });
        
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) {
          setCoverImage(uploadResult.url);
          setErrors(prev => ({ ...prev, coverImage: false }));
        } else {
          showNotify(uploadResult.message || 'Failed to upload cover image');
        }
      } catch (err) {
        console.error('Upload error:', err);
        showNotify('An error occurred during cover image upload');
      } finally {
        setUploadingCover(false);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + previewImages.length > 5) {
        showNotify('Maximum 5 images allowed');
        return;
      }
      
      setUploading(true);
      const newUrls: string[] = [];

      try {
        for (const file of files) {
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);
          formDataUpload.append('folder', 'products');
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload
          });
          
          const uploadResult = await uploadRes.json();
          if (uploadResult.success) {
            newUrls.push(uploadResult.url);
          } else {
            showNotify(uploadResult.message || 'Failed to upload image');
          }
        }

        if (newUrls.length > 0) {
          setPreviewImages(prev => [...prev, ...newUrls]);
          setErrors(prev => ({ ...prev, images: false }));
        }
      } catch (err) {
        console.error('Upload error:', err);
        showNotify('An error occurred during image upload');
      } finally {
        setUploading(false);
      }
    }
  };

  const removeImage = (index: number) => {
    const newPreviews = [...previewImages];
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
  };

   const handleSubmit = async (status: 'Draft' | 'Publish') => {
     const newErrors: Record<string, boolean> = {};
     
     // Specific validation
     if (!formData.name.trim()) newErrors.name = true;
     if (!coverImage) newErrors.coverImage = true;
     if (!formData.description.trim()) newErrors.description = true;
     if (!formData.price) newErrors.price = true;
     if (!formData.stock) newErrors.stock = true;
     if (!formData.deliveryTime) newErrors.deliveryTime = true;
     if (!formData.category) newErrors.category = true;

     if (Object.keys(newErrors).length > 0) {
       setErrors(newErrors);
       showNotify('Please fill in all required fields highlighted in red.');
       return;
     }

     // Validate Discount Price: Cannot be greater than Price
     if (formData.discountPrice && parseFloat(formData.discountPrice) >= parseFloat(formData.price)) {
       setErrors({ discountPrice: true });
       showNotify('Discount price must be less than the regular price.');
       return;
     }

     try {
       const token = localStorage.getItem('token') || localStorage.getItem('sessionToken') || document.cookie.split('; ').find(row => row.startsWith('sessionToken='))?.split('=')[1];

       const productData = {
         name: formData.name,
         name_en: formData.name,
         name_am: formData.name, 
         description: formData.description,
         description_en: formData.description,
         description_am: formData.description, 
         price: parseFloat(formData.price),
         images: coverImage ? [coverImage, ...previewImages] : previewImages,
         category: formData.category || 'Other',
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
         shippingFee: '0', 
         status: status
       };

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
         const errorMsg = result.errors ? result.errors.join(', ') : (result.message || 'Failed to save product');
         throw new Error(errorMsg);
       }

        showNotify(status === 'Publish' ? 'Artifact submitted for admin verification!' : 'Artifact saved as Draft successfully!', 'success');
        
        setTimeout(() => {
          router.push('/dashboard/artisan/products');
        }, 2000);
     } catch (error: any) {
       console.error('Error submitting product:', error);
       showNotify(error.message || 'An error occurred while saving the product');
     }
   };

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-500 relative">
      {/* Custom Notification */}
      {notification && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-in zoom-in-95 fade-in duration-300">
          <div className={`px-8 py-4 rounded-[20px] shadow-2xl flex items-center gap-4 backdrop-blur-md border ${
            notification.type === 'success' 
              ? 'bg-emerald-500/90 border-emerald-400 text-white' 
              : 'bg-red-500/90 border-red-400 text-white'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <p className="font-bold text-lg">{notification.message}</p>
          </div>
        </div>
      )}

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
              onChange={e => {
                setFormData({...formData, name: e.target.value});
                if (errors.name) setErrors(prev => ({ ...prev, name: false }));
              }}
              error={errors.name}
            />

            <div className="space-y-4">
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-widest ${errors.coverImage ? 'text-red-500' : 'text-gray-500'}`}>Cover Image *</label>
                <div className="flex gap-4 items-start">
                  {coverImage ? (
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-100 group">
                      <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setCoverImage(null)}
                        className="absolute top-1 right-1 p-1.5 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group ${
                      uploadingCover ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'border-gray-200 hover:border-primary/30 hover:bg-primary/5'
                    } ${errors.coverImage ? 'bg-red-50 border-red-200' : ''}`}>
                      {uploadingCover ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-300 group-hover:text-primary mb-1" />
                          <span className="text-[10px] font-bold text-gray-400 group-hover:text-primary">Cover</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Detail Product Images (Max 5)</label>
                <div className="flex flex-wrap gap-4 p-2 rounded-2xl transition-all">
                  {previewImages.map((img, idx) => (
                    <div key={idx} className="relative w-32 h-32 rounded-2xl overflow-hidden group border border-gray-100">
                      <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1.5 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {previewImages.length < 5 && (
                    <label className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group ${
                      uploading ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'border-gray-200 hover:border-primary/30 hover:bg-primary/5'
                    }`}>
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-300 group-hover:text-primary mb-1" />
                          <span className="text-[10px] font-bold text-gray-400 group-hover:text-primary">Detail</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            className="hidden" 
                            onChange={handleImageUpload} 
                            disabled={uploading}
                          />
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-widest ${errors.description ? 'text-red-500' : 'text-gray-500'}`}>Description *</label>
                <textarea
                  className={`w-full border-none rounded-xl py-3 px-4 text-sm focus:ring-2 min-h-[150px] transition-all ${
                    errors.description 
                      ? 'bg-red-50 ring-2 ring-red-500 focus:ring-red-500' 
                      : 'bg-gray-50 focus:ring-primary/10'
                  }`}
                  placeholder="Describe the material, cultural background, and handmade process..."
                  value={formData.description}
                  onChange={e => {
                    setFormData({...formData, description: e.target.value});
                    if (errors.description) setErrors(prev => ({ ...prev, description: false }));
                  }}
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Material (Optional)" 
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
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Origin / Region</label>
                    <select 
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/10"
                      value={formData.region}
                      onChange={e => setFormData({...formData, region: e.target.value})}
                    >
                      <option value="">Select Origin Region</option>
                      {ETHIOPIA_REGIONS.map(region => (
                        <option key={region.id} value={region.id}>{region.name}</option>
                      ))}
                    </select>
                  </div>
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
                onChange={e => {
                  setFormData({...formData, price: e.target.value});
                  if (errors.price) setErrors(prev => ({ ...prev, price: false }));
                }}
                error={errors.price}
              />
              <Input 
                label="Discount Price (Optional)" 
                type="number" 
                placeholder="0.00"
                value={formData.discountPrice}
                onChange={e => {
                  setFormData({...formData, discountPrice: e.target.value});
                  if (errors.discountPrice) setErrors(prev => ({ ...prev, discountPrice: false }));
                }}
                error={errors.discountPrice}
              />
            </div>
             {formData.price && formData.discountPrice && (
               <div className={`p-4 rounded-xl flex items-center gap-4 transition-all ${
                 parseFloat(formData.discountPrice) >= parseFloat(formData.price) 
                   ? 'bg-red-50 border border-red-100' 
                   : 'bg-gray-50'
               }`}>
                 <span className="text-xs font-bold text-gray-500 uppercase">Preview:</span>
                 <span className="text-gray-400 line-through text-sm">ETB {formData.price}</span>
                 <span className="text-emerald-600 font-bold text-lg">ETB {formData.discountPrice}</span>
                 {parseFloat(formData.discountPrice) < parseFloat(formData.price) ? (
                   <Badge variant="success">
                     {Math.round(((parseFloat(formData.price) - parseFloat(formData.discountPrice)) / parseFloat(formData.price)) * 100)}% OFF
                   </Badge>
                 ) : (
                   <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                     <AlertCircle className="w-3 h-3" /> Invalid Discount
                   </span>
                 )}
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
                onChange={e => {
                  setFormData({...formData, stock: e.target.value});
                  if (errors.stock) setErrors(prev => ({ ...prev, stock: false }));
                }}
                error={errors.stock}
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
              <label className={`text-xs font-bold uppercase tracking-widest ${errors.category ? 'text-red-500' : 'text-gray-500'}`}>Category *</label>
              <select 
                className={`w-full border-none rounded-xl py-3 px-4 text-sm focus:ring-2 transition-all ${
                  errors.category 
                    ? 'bg-red-50 ring-2 ring-red-500 focus:ring-red-500' 
                    : 'bg-gray-50 focus:ring-primary/10'
                }`}
                value={formData.category}
                onChange={e => {
                  setFormData({...formData, category: e.target.value});
                  if (errors.category) setErrors(prev => ({ ...prev, category: false }));
                }}
              >
                <option value="">Select Category</option>
                <option value="Clothing">Clothing</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Pottery">Pottery</option>
                <option value="Woodcraft">Woodcraft</option>
                <option value="Textile">Textile</option>
                <option value="Cultural Art">Cultural Art</option>
                <option value="Other">Other</option>
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

          {/* 5. Delivery Information */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Truck className="w-5 h-5" /></div>
              <h2 className="text-xl font-bold text-primary">Delivery</h2>
            </div>

            <Input 
              label="Weight (Optional)" 
              placeholder="e.g. 0.5 kg"
              value={formData.weight}
              onChange={e => setFormData({...formData, weight: e.target.value})}
            />

            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-widest ${errors.deliveryTime ? 'text-red-500' : 'text-gray-500'}`}>Delivery Time *</label>
              <select 
                className={`w-full border-none rounded-xl py-3 px-4 text-sm focus:ring-2 transition-all ${
                  errors.deliveryTime 
                    ? 'bg-red-50 ring-2 ring-red-500 focus:ring-red-500' 
                    : 'bg-gray-50 focus:ring-primary/10'
                }`}
                value={formData.deliveryTime}
                onChange={e => {
                  setFormData({...formData, deliveryTime: e.target.value});
                  if (errors.deliveryTime) setErrors(prev => ({ ...prev, deliveryTime: false }));
                }}
              >
                <option value="">Select Delivery Time</option>
                <option value="1-3 days">1-3 days</option>
                <option value="3-5 days">3-5 days</option>
                <option value="5-7 days">5-7 days</option>
                <option value="1-2 weeks">1-2 weeks</option>
              </select>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ArtisanCreateProductPage;
