import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Heart, ShoppingCart, Truck, Eye, Flag, MapPin, Sparkles } from 'lucide-react';
import { Button, VerifiedBadge, Badge } from './UI';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedText } from '../utils/getLocalizedText';
import { ReportModal } from './ReportModal';

const regionLabels: Record<string, string> = {
  'addis ababa': 'Addis Ababa',
  'sidama': 'Sidama',
  'oromia': 'Oromia',
  'amhara': 'Amhara',
  'tigray': 'Tigray',
  'afar': 'Afar',
  'snnpr': 'SNNPR',
  'harari': 'Harar',
  'gambella': 'Gambella',
  'benishangul': 'Benishangul',
};

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [showReportModal, setShowReportModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const router = useRouter();

  const isWishlisted = !!isInWishlist(product.id || (product as any)._id);
  const isTourist = user?.role?.toLowerCase() === UserRole.TOURIST.toLowerCase();
  const lowStock = typeof product.stock === 'number' && product.stock < 10 && product.stock > 0;
  const hasDiscount = !!(product.discountPrice && product.discountPrice < product.price);

  const productName = getLocalizedText(product as any, 'name', language);
  const artisanName = getLocalizedText(product as any, 'artisanName' as any, language) || product.artisanName || '';
  
  const productRegion = (product as any).region || (product as any)?.artisanId?.region || '';
  const displayRegion = productRegion ? (regionLabels[productRegion.toLowerCase()] || productRegion) : null;
  const isHandmade = product.isHandmade || (product as any).isHandmade === true;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    if (!isTourist) return;
    
    if (isWishlisted) {
      removeFromWishlist(product.id || (product as any)._id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const productId = product.id || (product as any)._id;
    addToCart({ ...product, id: productId });
  };

  return (
    <article className="group relative bg-white dark:bg-ethio-dark rounded-[24px] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 border-2 border-gray-200/80 dark:border-white/10 flex flex-col w-full shadow-md h-full">
      {/* Image Container with Gradient Overlay */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Link href={`/products/${product.id}`}>
          <img
            src={product.images[0]}
            alt={productName}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </Link>
        
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Top Actions */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          {(!user || isTourist) && (
            <button
              className={`w-10 h-10 rounded-xl backdrop-blur-md transition-all duration-300 shadow-xl flex items-center justify-center border group/heart ${
                isWishlisted
                  ? 'bg-red-500 text-white border-red-400'
                  : 'bg-white/90 text-gray-400 border-white/50 hover:text-red-500 hover:bg-white'
              }`}
              onClick={handleWishlistClick}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : 'group-hover:scale-110 transition-transform'}`} />
            </button>
          )}
        </div>

        {/* Essential Badges Only */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg">
              Save {Math.round(((product.price - product.discountPrice!) / product.price) * 100)}%
            </span>
          )}
          {isHandmade && (
            <span className="bg-secondary text-primary text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Handmade
            </span>
          )}
        </div>

        {/* Quick View Button - Modern Floating Style */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
          <Link
            href={`/products/${product.id}`}
            className="transform translate-y-4 group-hover:translate-y-0 transition-all duration-500"
          >
            <div className="bg-white text-primary text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-2xl shadow-2xl hover:bg-primary hover:text-white transition-all">
              View Artifact
            </div>
          </Link>
        </div>
      </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 bg-white dark:bg-ethio-dark">
          {/* Category & Rating */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] bg-secondary/10 px-3 py-1 rounded-full">
              {product.category}
            </span>
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
              <Star className="w-3 h-3 text-amber-400 fill-current" />
              <span className="text-[10px] font-bold text-amber-700">{product.rating || '4.5'}</span>
              <span className="text-[9px] text-amber-600 ml-0.5">(120)</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-serif font-black text-primary group-hover:text-secondary transition-colors mb-2 line-clamp-2 leading-tight uppercase tracking-tight">
            <Link href={`/products/${product.id}`}>{productName}</Link>
          </h3>

          {/* Artisan & Region */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Link
              href={`/products?artisan=${product.artisanId}`}
              className="text-[11px] text-gray-500 hover:text-primary transition-colors font-medium flex items-center gap-1.5"
            >
              <span className="w-5 h-5 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary dark:text-primary">
                {artisanName.charAt(0).toUpperCase()}
              </span>
              {t('productCard.by')} <span className="text-gray-700 dark:text-gray-300">{artisanName}</span>
            </Link>
            {displayRegion && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {displayRegion}
                </span>
              </>
            )}
          </div>

          {/* Price & Actions */}
          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/10 flex items-end justify-between gap-3">
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xl font-black text-primary">
                  {hasDiscount ? product.discountPrice : product.price}
                </span>
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">ETB</span>
                {hasDiscount && (
                  <span className="text-xs text-gray-300 line-through shrink-0 font-medium">
                    {product.price}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="rounded-2xl shadow-xl font-black text-[9px] uppercase tracking-[0.2em] bg-primary hover:bg-secondary transition-all duration-500 px-5 py-3 h-12 border-none"
                onClick={handleAddToCart}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>

        {/* Report Modal */}
        {showReportModal && (
          <ReportModal
            targetId={product.id}
            targetType="Product"
            targetName={productName}
            onClose={() => setShowReportModal(false)}
            userId={user?.id || ''}
          />
        )}
      </article>
  );
};
