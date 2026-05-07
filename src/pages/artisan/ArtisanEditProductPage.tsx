import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Image as ImageIcon, Upload, Trash2, Info, 
  DollarSign, Package, Tag, Truck, Save, Eye, CheckCircle2,
  AlertCircle, ChevronLeft, Plus
} from 'lucide-react';
import { Button, Input, Badge } from '../../components/UI';
import { DualLanguageField } from '../../components/BilingualInput';
import { ETHIOPIA_REGIONS } from '../../data/constants';

export const ArtisanEditProductPage: React.FC<{ params: Promise<{ id: string }> }> = ({ params }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    name_am: '',
    images: [] as string[],
    description: '',
    description_en: '',
    description_am: '',
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

  useEffect(() => {
    const init = async () => {
      const resolved = await params;
      setProductId(resolved.id);
      fetchProduct(resolved.id);
    };
    init();
  }, [params]);

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/artisan/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        const product = data.product;
        setFormData({
          name: product.name || '',
          name_en: product.name_en || product.name || '',
          name_am: product.name_am || '',
          images: product.images || [],
          description: product.description || '',
          description_en: product.description_en || product.description || '',
          description_am: product.description_am || '',
          material: product.material || '',
          handmadeBy: product.handmadeBy || '',
          region: product.region || '',
          careInstructions: product.careInstructions || '',
          price: product.price?.toString() || '',
          discountPrice: product.discountPrice?.toString() || '',
          stock: product.stock?.toString() || '',
          sku: product.sku || '',
          category: product.category || '',
          subcategory: product.subcategory || '',
          tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
          weight: product.weight || '',
          deliveryTime: product.deliveryTime || '',
          shippingFee: product.shippingFee || '',
          status: product.status === 'Published' ? 'Publish' : 'Draft'
        });
        setPreviewImages(product.images || []);
      } else {
        alert('Failed to load product');
        router.push('/dashboard/artisan/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + previewImages.length > 5) {
        alert('Maximum 5 images allowed');
        return;
      }
      
      const newPreviews = files.map((file: File) => URL.createObjectURL(file));
      setPreviewImages([...previewImages, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newPreviews = [...previewImages];
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
  };

  const handleSubmit = async (status: 'Draft' | 'Publish') => {
    if (!formData.name_en.trim() || !formData.name_am.trim() || !formData.description_en.trim() || !formData.description_am.trim() || !formData.price || !formData.stock || !formData.category || !formData.deliveryTime || !formData.shippingFee) {
      alert('Please fill in all required fields marked with *');
      return;
    }

    try {
      setSaving(true);
      const productData = {
        name: formData.name_en,
        name_en: formData.name_en,
        name_am: formData.name_am,
        description: formData.description_en,
        description_en: formData.description_en,
        description_am: formData.description_am,
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
        status: status === 'Publish' 
          ? (parseInt(formData.stock) === 0 ? 'Out of Stock' : 'Pending') 
          : 'Draft'
      };

      const response = await fetch(`/api/artisan/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update product');
      }

      let successMsg = '';
      if (status === 'Draft') {
        successMsg = 'Artifact saved as Draft successfully!';
      } else if (parseInt(formData.stock) === 0) {
        successMsg = 'Artifact marked as Out of Stock!';
      } else {
        successMsg = 'Artifact submitted for admin verification!';
      }
      alert(successMsg);
      router.push('/dashboard/artisan/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(error.message || 'An error occurred while saving the product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading product...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8 sticky top-0 bg-gray-50/80 backdrop-blur-md z-10 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-xl transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Edit Artifact</h1>
            <p className="text-gray-500 text-sm">Update your artifact details.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={Save} onClick={() => handleSubmit('Draft')} isLoading={saving}>Save Draft</Button>
          <Button leftIcon={CheckCircle2} onClick={() => handleSubmit('Publish')} isLoading={saving}>Save Change</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Info className="w-5 h-5" /></div>
              <h2 className="text-xl font-bold text-primary">Basic Information</h2>
            </div>
            
            <DualLanguageField
              label="Product Name"
              englishValue={formData.name_en}
              amharicValue={formData.name_am}
              onEnglishChange={value => setFormData({...formData, name: value, name_en: value})}
              onAmharicChange={value => setFormData({...formData, name_am: value})}
              englishPlaceholder="e.g. Handwoven Dorze Cotton Scarf"
              amharicPlaceholder="e.g. በእጅ የተሸመነ የዶርዜ ጥጥ ሻርፕ"
            />

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product Images (Max 5)</label>
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
              <DualLanguageField
                label="Description"
                englishValue={formData.description_en}
                amharicValue={formData.description_am}
                onEnglishChange={value => setFormData({...formData, description: value, description_en: value})}
                onAmharicChange={value => setFormData({...formData, description_am: value})}
                textarea
                rows={6}
                englishPlaceholder="Describe the material, cultural background, and handmade process..."
                amharicPlaceholder="ቁሳቁሱን፣ ባህላዊ ታሪኩን እና የእጅ ስራ ሂደቱን ይግለጹ..."
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

        <div className="space-y-8">
          
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
                : 'Product will be submitted for admin verification before going live.'}
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ArtisanEditProductPage;
