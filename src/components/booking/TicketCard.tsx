"use client";

import React from 'react';
import { Check, Star, Info } from 'lucide-react';

interface TicketCardProps {
  type: 'vip' | 'standard';
  label: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  benefits: string[];
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({ 
  type, 
  label, 
  price, 
  originalPrice,
  discountPercent,
  benefits,
  isSelected, 
  onSelect,
  disabled = false,
  disabledReason,
}) => {
  const isStandard = type === 'standard';
  
  // Compute badge content
  const badge = isStandard 
    ? (discountPercent ? `-${discountPercent}%` : '')
    : 'PREMIUM';
  const showDiscount = isStandard && !!discountPercent && discountPercent > 0;

  return (
    <div 
      onClick={disabled ? undefined : onSelect}
      className={`relative p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[240px] group ${
        disabled
          ? 'cursor-not-allowed opacity-50 grayscale border-gray-100'
          : isSelected 
          ? isStandard 
            ? 'border-primary ring-4 ring-primary/15 bg-gradient-to-br from-white to-primary/5 shadow-2xl shadow-primary/20 scale-[1.02]'
            : 'border-amber-500 ring-4 ring-amber-500/15 bg-gradient-to-br from-white to-amber-50/50 shadow-2xl shadow-amber-500/20 scale-[1.02]'
          : isStandard
          ? 'border-gray-200 bg-white hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.01]'
          : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10 hover:scale-[1.01]'
      }`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150">
        <div className="w-full h-full bg-current rounded-full" />
      </div>

      <div className="space-y-4 relative z-10">
        {/* Header with icon and badge */}
        <div className={`p-3.5 rounded-2xl shadow-lg shadow-current/15 group-hover:shadow-current/25 transition-all ${
          isStandard 
            ? 'bg-primary text-white' 
            : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
        }`}>
          {isStandard ? <Info className="w-6 h-6" /> : <Star className="w-6 h-6" />}
        </div>
        {badge && badge !== '' && (
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
            isStandard && discountPercent
              ? 'bg-red-500 text-white'  // Red badge for discount
              : isStandard
              ? 'bg-gray-100 text-gray-600'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
          }`}>
            {badge}
          </span>
        )}
      </div>

      {/* Title */}
      <div>
        <h3 className="text-xl font-serif font-bold text-primary leading-tight group-hover:text-primary/90 transition-colors">
          {label}
        </h3>
        {showDiscount && (
          <div className="flex items-center gap-2 mt-2">
            {originalPrice && originalPrice > price && (
              <>
                <span className="text-xs text-red-500/80 line-through font-bold">ETB {originalPrice}</span>
                <span className="w-1 h-1 rounded-full bg-red-300" />
              </>
            )}
            <span className="text-xs font-black bg-red-500 text-white px-2 py-0.5 rounded-md">
              Save {discountPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Price and selection */}
      <div className="mt-6 pt-5 border-t border-gray-100/80 flex items-baseline justify-between relative z-10">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-black ${isStandard ? 'text-primary' : 'text-amber-700'}`}>ETB {price}</span>
            <span className="text-xs text-gray-400 font-medium">/person</span>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
          isSelected 
            ? isStandard 
              ? 'bg-primary border-primary scale-110' 
              : 'bg-amber-500 border-amber-500 scale-110'
            : 'border-gray-200 group-hover:border-gray-300'
        }`}>
          {isSelected && <Check className="w-5 h-5 text-white stroke-[3]" />}
        </div>
      </div>

      {/* Benefits preview on hover/selected */}
      {benefits && benefits.length > 0 && (
        <div className={`mt-4 space-y-2 transition-all duration-300 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'
        }`}>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <div className="grid grid-cols-1 gap-1.5">
            {benefits.slice(0, 2).map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                <div className={`w-1.5 h-1.5 rounded-full ${isStandard ? 'bg-primary' : 'bg-amber-500'}`} />
                <span className="truncate">{benefit}</span>
              </div>
            ))}
            {benefits.length > 2 && (
              <span className="text-[10px] text-gray-400 font-medium">+{benefits.length - 2} more</span>
            )}
          </div>
        </div>
      )}

      {disabled && disabledReason && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-[3px] rounded-3xl flex items-center justify-center p-6 text-center z-20">
          <p className="text-xs font-bold text-red-500 leading-relaxed">{disabledReason}</p>
        </div>
      )}
    </div>
  );
};
