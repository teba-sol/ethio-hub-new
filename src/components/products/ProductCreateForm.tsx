import { useState } from 'react';
import { DualLanguageField, BilingualInput } from '@/components/BilingualInput';
import { Button } from '@/components/UI';
import { useLanguage } from '@/context/LanguageContext';

type ProductFormData = {
  name_en: string;
  name_am: string;
  description_en: string;
  description_am: string;
  materials: string;
  price: number;
  sku: string;
  stock: number;
};

export const ProductCreateForm = ({ onSubmit, initialData }: { 
  onSubmit: (data: ProductFormData) => void;
  initialData?: Partial<ProductFormData>;
}) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<ProductFormData>({
    name_en: initialData?.name_en || '',
    name_am: initialData?.name_am || '',
    description_en: initialData?.description_en || '',
    description_am: initialData?.description_am || '',
    materials: initialData?.materials || '',
    price: initialData?.price || 0,
    sku: initialData?.sku || '',
    stock: initialData?.stock || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate dual critical fields
    if (!formData.name_en || !formData.name_am) {
      alert('Product name in both English and Amharic is required');
      return;
    }
    if (!formData.description_en || !formData.description_am) {
      alert('Product description in both English and Amharic is required');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Critical Dual Language Fields (Required) */}
      <div className="space-y-6">
        <h3 className="text-2xl font-serif font-bold text-primary">Product Information</h3>
        
        <DualLanguageField
          label="Product Name"
          englishValue={formData.name_en}
          amharicValue={formData.name_am}
          onEnglishChange={(val) => setFormData({ ...formData, name_en: val })}
          onAmharicChange={(val) => setFormData({ ...formData, name_am: val })}
          required={true}
          englishPlaceholder="e.g. Handwoven Ethiopian Basket"
          amharicPlaceholder="e.g. በእጅ የተሰራ የኢትዮጵያ ቀልቢስ"
        />

        <DualLanguageField
          label="Product Description"
          englishValue={formData.description_en}
          amharicValue={formData.description_am}
          onEnglishChange={(val) => setFormData({ ...formData, description_en: val })}
          onAmharicChange={(val) => setFormData({ ...formData, description_am: val })}
          textarea
          rows={6}
          required={true}
          englishPlaceholder="Describe the product, materials, craftsmanship..."
          amharicPlaceholder="ምርቱን፣ ቁሳቁሶችን፣ ምስራትን ይግሉ..."
        />
      </div>

      {/* Universal Single Fields (Optional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Materials (Optional)</label>
          <input
            type="text"
            value={formData.materials}
            onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="e.g. Cotton, Leather, Bamboo"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price (Optional)</label>
          <input
            type="number"
            value={formData.price || ''}
            onChange={(e) => setFormData({ ...formData, price: e.target.value ? Number(e.target.value) : 0 })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">SKU (Optional)</label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="e.g. ETH-BASKET-001"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stock (Optional)</label>
          <input
            type="number"
            value={formData.stock || ''}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value ? Number(e.target.value) : 0 })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <Button type="submit" variant="primary" className="w-full md:w-auto">
        Save Product
      </Button>
    </form>
  );
};
