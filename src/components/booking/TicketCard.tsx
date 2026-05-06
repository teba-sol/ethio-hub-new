"use client";

import React from 'react';
import { Check } from 'lucide-react';

interface TicketCardProps {
  type: 'vip' | 'standard' | 'earlyBird';
  label: string;
  price: number;
  benefits: string[];
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  disabledReason?: string;
  isVip?: boolean;
  includesHotelTransport?: boolean;
  vipPerks?: string[];
}

export const TicketCard: React.FC<TicketCardProps> = ({ 
  type, 
  label, 
  price, 
  benefits, 
  isSelected, 
  onSelect,
  disabled = false,
  disabledReason
}) => {
  const variants = {
    vip: {
      eyebrow: 'Premium Access',
      badge: 'PREMIUM',
      badgeClass: 'bg-[#f3d8dd] text-[#7b2332]',
      accentClass: 'bg-[#7b2332]',
      priceClass: 'text-white',
      iconClass: 'bg-[#f3d8dd] text-[#7b2332]',
      buttonClass: 'bg-[#7b2332] text-white hover:bg-[#681d2a]',
      headerClass: 'bg-gradient-to-br from-[#7b2332] to-[#52131f] text-white',
      selectedClass: 'border-[#7b2332] shadow-xl ring-2 ring-[#7b2332]/20',
      bodyClass: 'bg-[#fff8f9]',
    },
    standard: {
      eyebrow: 'General Admission',
      badge: '',
      badgeClass: '',
      accentClass: 'bg-[#1f4e5f]',
      priceClass: 'text-white',
      iconClass: 'bg-[#d7e8ee] text-[#1f4e5f]',
      buttonClass: 'bg-[#1f4e5f] text-white hover:bg-[#173c49]',
      headerClass: 'bg-gradient-to-br from-[#1f4e5f] to-[#143540] text-white',
      selectedClass: 'border-[#1f4e5f] shadow-xl ring-2 ring-[#1f4e5f]/20',
      bodyClass: 'bg-[#f7fbfc]',
    },
    earlyBird: {
      eyebrow: 'Limited Offer',
      badge: 'BEST VALUE',
      badgeClass: 'bg-[#e5edd6] text-[#556b2f]',
      accentClass: 'bg-[#556b2f]',
      priceClass: 'text-white',
      iconClass: 'bg-[#e5edd6] text-[#556b2f]',
      buttonClass: 'bg-[#556b2f] text-white hover:bg-[#445625]',
      headerClass: 'bg-gradient-to-br from-[#556b2f] to-[#39491f] text-white',
      selectedClass: 'border-[#556b2f] shadow-xl ring-2 ring-[#556b2f]/20',
      bodyClass: 'bg-[#fbfdf7]',
    },
  };

  const variant = variants[type];
  
  return (
    <div 
      onClick={disabled ? undefined : onSelect}
      className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
        disabled
          ? 'cursor-not-allowed border-gray-200 opacity-70'
          : isSelected 
          ? variant.selectedClass
          : 'border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer'
      }`}
    >
      <div className={`h-1.5 w-full ${variant.accentClass}`} />

      {/* Badge */}
      {variant.badge && (
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full font-bold text-[11px] tracking-wide ${variant.badgeClass}`}>
          {variant.badge}
        </div>
      )}
      
      {/* Header */}
      <div className={`${variant.headerClass} p-6 border-b border-gray-100`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-80 mb-3">
          {variant.eyebrow}
        </p>
        <h3 className="text-xl font-bold mb-2">{label}</h3>
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold ${variant.priceClass}`}>${price}</span>
          <span className="text-sm text-gray-500">per ticket</span>
        </div>
      </div>
      
        {/* Benefits */}
        <div className={`p-6 ${variant.bodyClass}`}>
          <ul className="space-y-3">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${variant.iconClass}`}>
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-gray-600 text-sm leading-relaxed">{benefit}</span>
              </li>
            ))}
          </ul>
          {isVip && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Includes (Free)</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  Hotel Stay (Choose from VIP options)
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  Transport (Choose from VIP options)
                </li>
              </ul>
              {vipPerks && vipPerks.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Priority Perks</p>
                  <ul className="space-y-2">
                    {vipPerks.map((perk, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-amber-500" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        
        {/* Select Button */}
        <button
          type="button"
          disabled={disabled}
          className={`w-full mt-6 py-4 rounded-xl font-bold transition-colors ${
            disabled
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : variant.buttonClass
          }`}
        >
          {disabled ? 'Unavailable' : isSelected ? 'Selected' : 'Select Ticket'}
        </button>
        {disabled && disabledReason && (
          <p className="mt-3 text-xs font-medium text-red-600">{disabledReason}</p>
        )}
      </div>
    </div>
  );
};
