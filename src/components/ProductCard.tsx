import React from 'react';
import Link from 'next/link';
import { Star, Heart, ShoppingCart, Truck, ArrowRight } from 'lucide-react';
import { Button, VerifiedBadge } from './UI';
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
  const { language } = useLanguage();
  const lowStock = product.stock && product.stock < 10;

  const isWishlisted = isInWishlist(product.id);
  const isTourist = user?.role === UserRole.TOURIST;

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

  return (
    <article className="group bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col h-full relative">
      <div className="relative aspect-[4/5] overflow-hidden bg-ethio-bg">
        <Link href={`/products/${product.id}`} className="block h-full">
          <img 
            src={product.images[0]} 
            alt={productName} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          />
        </Link>
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {lowStock && (
            <div className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
              Limited Stock: {product.stock}
            </div>
          )}
          {(product as any).isVerified || (product as any).verificationStatus === 'Approved' && (
            <div className="w-fit scale-90 origin-left shadow-lg">
              <VerifiedBadge />
            </div>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          className={`absolute top-4 right-4 p-3 bg-white/80 backdrop-blur rounded-full transition-all duration-300 shadow-lg border border-white/20 hover:scale-110 active:scale-95 ${
            isWishlisted && isTourist ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
          }`}
          aria-label={`Add ${productName} to wishlist`}
          onClick={handleWishlistClick}
        >
          <Heart className={`w-5 h-5 ${isWishlisted && isTourist ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add Button Overlay */}
        <div className="absolute bottom-6 left-6 right-6 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <Button 
            className="w-full rounded-xl py-3 shadow-2xl font-bold text-[10px] uppercase tracking-[0.2em] bg-white text-primary hover:bg-primary hover:text-white border-none"
            leftIcon={ShoppingCart}
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
          >
            Quick Add
          </Button>
        </div>
      </div>

      <div className="p-7 flex flex-col flex-1">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] bg-secondary/5 px-3 py-1 rounded-full">
            {product.category}
          </span>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
            <Star className="w-3.5 h-3.5 text-secondary fill-current" />
            <span className="text-xs font-bold text-primary">{product.rating ? Number(product.rating).toFixed(1) : '5.0'}</span>
          </div>
        </div>
        
        <h3 className="text-xl font-serif font-bold text-primary mb-2 line-clamp-1 group-hover:text-secondary transition-colors duration-300">
          <Link href={`/products/${product.id}`}>{productName}</Link>
        </h3>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-px bg-gray-200" />
          <Link href={`/products?artisan=${product.artisanId}`} className="text-[11px] text-gray-400 hover:text-primary transition-colors font-medium uppercase tracking-widest">
            {artisanName}
          </Link>
        </div>

        <div className="mt-auto flex items-end justify-between pt-6 border-t border-gray-50">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Price</span>
            <span className="text-2xl font-bold text-primary leading-none">
              <span className="text-sm font-light text-gray-400 mr-1">$</span>
              {product.price}
            </span>
          </div>
          
          <Link 
            href={`/products/${product.id}`}
            className="p-3 bg-ethio-bg text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-300 group/btn shadow-sm"
          >
            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};
