import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { ProductCard } from '../../components/ProductCard';

export const TouristWishlistPage: React.FC = () => {
  const { wishlist } = useWishlist();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h2 className="text-3xl font-serif font-bold text-primary">My Wishlist</h2>
      
      {wishlist.length === 0 ? (
        <div className="bg-white p-10 md:p-20 rounded-[48px] border border-gray-100 text-center">
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">Your wishlist is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
