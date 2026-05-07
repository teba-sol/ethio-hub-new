import React, { useState } from 'react';
import Link from 'next/link';
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

  const isWishlisted = isInWishlist(product.id);
  const isTourist = user?.role === UserRole.TOURIST;
  const lowStock = product.stock && product.stock < 10;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  const productName = getLocalizedText(product as any, 'name', language);
  const artisanName = getLocalizedText(product as any, 'artisanName' as any, language) || product.artisanName || '';
  
  const productRegion = (product as any).region || (product as any)?.artisanId?.region || '';
  const displayRegion = productRegion ? (regionLabels[productRegion.toLowerCase()] || productRegion) : null;
  const isHandmade = product.isHandmade || (product as any).isHandmade === true;

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
    <article className="group relative bg-white rounded-[24px] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 border-2 border-gray-200/80 flex flex-col max-w-[320px] mx-auto w-full shadow-md">
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
        
        {/* Top Action Buttons */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          {/* Left Side - Badges */}
          <div className="flex flex-col gap-2">
            {hasDiscount && (
              <Badge className="bg-red-500 text-white border-none text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                -{Math.round(((product.price - product.discountPrice!) / product.price) * 100)}%
              </Badge>
            )}
            {lowStock && (
              <Badge className="bg-amber-500 text-white border-none text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                Only {product.stock} left
              </Badge>
            )}
            {isHandmade && (
              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-none text-[9px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Handmade
              </Badge>
            )}
          </div>
          
          {/* Right Side - Wishlist & Report */}
          <div className="flex flex-col gap-2">
            {isTourist && (
              <button
                className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg hover:scale-110 ${
                  isWishlisted
                    ? 'bg-red-50 text-red-500 border-2 border-red-200'
                    : 'bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white'
                }`}
                aria-label={t('productCard.addToWishlist').replace('{name}', productName)}
                onClick={handleWishlistClick}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            )}

            {/* Report Button */}
            {user && (
              <button
                className="p-3 rounded-full bg-white/90 backdrop-blur-md transition-all duration-300 shadow-lg hover:scale-110 text-gray-400 hover:text-red-500"
                aria-label="Report this product"
                onClick={(e) => {
                  e.preventDefault();
                  setShowReportModal(true);
                }}
              >
                <Flag className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Verified Badge */}
        {(product as any).isVerified || (product as any).verificationStatus === 'Approved' ? (
          <div className="absolute bottom-4 left-4">
            <VerifiedBadge />
          </div>
        ) : null}

        {/* Region Badge - Show on card */}
        {displayRegion && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-primary/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
              <MapPin className="w-3 h-3" />
              {displayRegion}
            </span>
          </div>
        )}

        {/* Quick View Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Link
            href={`/products/${product.id}`}
            className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
          >
            <Button
              variant="outline"
              className="bg-white/90 backdrop-blur-md border-white/50 text-primary hover:bg-white shadow-xl rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
              leftIcon={Eye}
            >
              Quick View
            </Button>
          </Link>
        </div>
      </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 bg-white">
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
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors mb-2 line-clamp-2 leading-snug">
            <Link href={`/products/${product.id}`}>{productName}</Link>
          </h3>

          {/* Artisan & Region */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Link
              href={`/products?artisan=${product.artisanId}`}
              className="text-[11px] text-gray-500 hover:text-primary transition-colors font-medium flex items-center gap-1.5"
            >
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                {artisanName.charAt(0).toUpperCase()}
              </span>
              {t('productCard.by')} <span className="text-gray-700">{artisanName}</span>
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

          {/* Shipping Info */}
          <div className="flex items-center text-[10px] text-gray-400 mb-4 gap-1.5">
            <Truck className="w-3 h-3" />
            <span>{t('productCard.shipsIn')} {product.estimatedDelivery}</span>
            {product.shippingCost === 0 && (
              <Badge variant="success" className="ml-auto text-[8px] px-2 py-0.5 font-bold">FREE SHIP</Badge>
            )}
          </div>

          {/* Price & Actions */}
          <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between gap-3">
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-lg font-bold text-gray-900">
                  {hasDiscount ? product.discountPrice : product.price}
                </span>
                <span className="text-xs text-gray-500 font-medium">{product.currency || 'ETB'}</span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through shrink-0">
                    {product.price}
                  </span>
                )}
              </div>
              {product.material && (
                <span className="text-[10px] text-gray-400 mt-1 truncate">{product.material}</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/products/${product.id}`}
                className="inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-lg px-3 py-1.5 text-[9px] uppercase tracking-wider font-semibold whitespace-nowrap"
              >
                Details
              </Link>
              <Button
                size="sm"
                className="rounded-xl shadow-lg font-bold text-[10px] uppercase tracking-wider bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300 px-4 py-2 min-h-[36px] border-0 whitespace-nowrap"
                leftIcon={ShoppingCart}
                onClick={handleAddToCart}
              >
                {t('productCard.add')}
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
