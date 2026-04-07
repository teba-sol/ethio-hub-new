import React from 'react';
import Link from 'next/link';
import { Star, Heart, ShoppingCart, Truck } from 'lucide-react';
import { Button, VerifiedBadge } from './UI';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const lowStock = product.stock && product.stock < 10;

  const isWishlisted = isInWishlist(product.id);
  const isTourist = user?.role === UserRole.TOURIST;

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
    <article className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col h-full">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Link href={`/products/${product.id}`}>
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </Link>
        <button 
          className={`absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur rounded-full transition-colors shadow-sm ${
            isWishlisted && isTourist ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-accent'
          }`}
          aria-label={`Add ${product.name} to wishlist`}
          onClick={handleWishlistClick}
        >
          <Heart className={`w-5 h-5 ${isWishlisted && isTourist ? 'fill-current' : ''}`} />
        </button>
        {(product.isVerified || (product as any).verificationStatus === 'Approved') && (
          <div className="absolute bottom-4 left-4">
            <VerifiedBadge />
          </div>
        )}
        {lowStock && (
           <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
             Only {product.stock} left
           </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{product.category}</p>
          <div className="flex items-center text-xs text-gray-500">
            <Star className="w-3 h-3 text-secondary fill-current mr-1" />
            <span className="font-bold">{product.rating}</span>
          </div>
        </div>
        
        <h3 className="text-lg font-serif font-bold text-primary group-hover:text-secondary transition-colors mb-1">
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        
        <Link href={`/products?artisan=${product.artisanId}`} className="text-xs text-gray-500 hover:text-primary transition-colors font-medium mb-3 block">
          By: {product.artisanName}
        </Link>

        <div className="flex items-center text-[10px] text-gray-400 mb-4">
          <Truck className="w-3 h-3 mr-1" />
          <span>Ships in {product.estimatedDelivery}</span>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-primary">${product.price}</span>
          
          <div className="flex items-center gap-2">
            <Link 
              href={`/products/${product.id}`}
              className="inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-primary text-primary hover:bg-ethio-light focus:ring-primary rounded-xl px-3 text-[9px] uppercase tracking-widest font-bold h-9"
            >
              Details
            </Link>
            <Button 
              size="sm" 
              className="rounded-xl px-4 shadow-lg font-bold text-[9px] uppercase tracking-widest h-9"
              leftIcon={ShoppingCart}
              onClick={(e) => {
                e.preventDefault();
                addToCart(product);
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};
