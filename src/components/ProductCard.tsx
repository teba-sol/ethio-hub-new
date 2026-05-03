import React from 'react';
import Link from 'next/link';
import { Star, Heart, ShoppingCart, Truck } from 'lucide-react';
import { Button, VerifiedBadge, Badge } from './UI';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedText } from '../utils/getLocalizedText';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const isWishlisted = isInWishlist(product.id);
  const isTourist = user?.role === UserRole.TOURIST;
  const lowStock = product.stock && product.stock < 10;

  const productName = getLocalizedText(product as any, 'name', language);
  const artisanName = getLocalizedText(product as any, 'artisanName' as any, language) || product.artisanName || '';

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isTourist) return;

    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
  };

  return (
    <article className="group relative bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 border border-gray-100 flex flex-col">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Link href={`/products/${product.id}`}>
          <img
            src={product.images[0]}
            alt={productName}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Wishlist Button */}
        <button
          className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-sm transition-all duration-300 shadow-md hover:scale-110 ${
            isWishlisted && isTourist
              ? 'bg-red-50 text-red-500 hover:bg-red-100'
              : 'bg-white/90 text-gray-600 hover:text-secondary hover:bg-white'
          }`}
          aria-label={t('productCard.addToWishlist').replace('{name}', productName)}
          onClick={handleWishlistClick}
        >
          <Heart className={`w-[18px] h-[18px] ${isWishlisted && isTourist ? 'fill-current' : ''}`} />
        </button>

        {/* Verified Badge */}
        {(product as any).isVerified || (product as any).verificationStatus === 'Approved' ? (
          <div className="absolute bottom-4 left-4">
            <VerifiedBadge />
          </div>
        ) : null}

        {/* Low Stock Badge */}
        {lowStock && (
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
            {t('productCard.onlyLeft').replace('{count}', String(product.stock))}
          </div>
        )}

        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className="bg-white text-primary px-6 py-3 rounded-full font-bold text-sm shadow-xl hover:shadow-2xl hover:bg-secondary hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {t('productCard.add')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.1em]">
            {product.category}
          </span>
          <div className="flex items-center gap-1.5 bg-ethio-bg px-2 py-1 rounded-full">
            <Star className="w-3.5 h-3.5 text-secondary fill-current" />
            <span className="text-xs font-bold text-primary">{product.rating}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-serif font-bold text-primary group-hover:text-secondary transition-colors mb-2 line-clamp-2 leading-snug">
          <Link href={`/products/${product.id}`}>{productName}</Link>
        </h3>

        {/* Artisan */}
        <Link
          href={`/products?artisan=${product.artisanId}`}
          className="text-xs text-gray-500 hover:text-primary transition-colors font-medium mb-4 block"
        >
          {t('productCard.by')} {artisanName}
        </Link>

        {/* Shipping Info */}
        <div className="flex items-center text-[11px] text-gray-400 mb-5 gap-1.5">
          <Truck className="w-3.5 h-3.5" />
          <span>{t('productCard.shipsIn')} {product.estimatedDelivery}</span>
        </div>

        {/* Price & Actions */}
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-end justify-between gap-4">
          <div>
            <span className="text-2xl font-bold text-primary">${product.price}</span>
            {product.discountPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">${product.discountPrice}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/products/${product.id}`}
              className="inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-primary text-primary hover:bg-ethio-light focus:ring-primary rounded-xl px-4 py-2.5 text-xs uppercase tracking-wider font-bold"
            >
              {t('productCard.details')}
            </Link>
            <Button
              size="sm"
              className="rounded-xl shadow-lg font-bold text-xs uppercase tracking-wider bg-primary text-white hover:bg-secondary px-4 py-2.5 min-h-[40px]"
              leftIcon={ShoppingCart}
              onClick={handleAddToCart}
            >
              {t('productCard.add')}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};
