import { useContentLanguage } from '@/hooks/useContentLanguage';

type Product = {
  name_en?: string;
  name_am?: string;
  description_en?: string;
  description_am?: string;
  materials?: string;
  price?: number;
};

export const ProductDisplay = ({ product }: { product: Product }) => {
  const { language, getLocalizedField } = useContentLanguage();

  return (
    <div className="space-y-6">
      {/* Product Name */}
      <h1 className="text-2xl font-serif font-bold text-primary">
        {getLocalizedField(product, 'name')}
      </h1>

      {/* Price (Universal) */}
      {product.price !== undefined && (
        <p className="text-xl font-bold text-primary">
          ${product.price.toFixed(2)}
        </p>
      )}

      {/* Description */}
      <div className="prose">
        <h3>Description</h3>
        <p>{getLocalizedField(product, 'description')}</p>
      </div>

      {/* Materials (Universal Single Field) */}
      {product.materials && (
        <div>
          <h4>Materials</h4>
          <p className="text-sm text-gray-600">{product.materials}</p>
        </div>
      )}
    </div>
  );
};
