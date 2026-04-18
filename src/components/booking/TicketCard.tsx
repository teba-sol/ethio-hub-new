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
}

export const TicketCard: React.FC<TicketCardProps> = ({ 
  type, 
  label, 
  price, 
  benefits, 
  isSelected, 
  onSelect 
}) => {
  const colors = {
    vip: 'from-purple-500 to-purple-700',
    standard: 'from-blue-500 to-blue-700',
    earlyBird: 'from-green-500 to-green-700',
  };
  
  return (
    <div 
      onClick={onSelect}
      className={`relative bg-white rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
        isSelected 
          ? 'border-primary shadow-xl ring-2 ring-primary/20' 
          : 'border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      {/* Badge */}
      {type === 'earlyBird' && (
        <div className={`absolute top-0 right-0 bg-gradient-to-r ${colors[type]} text-white px-4 py-1 rounded-bl-xl font-bold text-sm`}>
          BEST VALUE
        </div>
      )}
      {type === 'vip' && (
        <div className={`absolute top-0 right-0 bg-gradient-to-r ${colors[type]} text-white px-4 py-1 rounded-bl-xl font-bold text-sm`}>
          PREMIUM
        </div>
      )}
      
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors[type]} p-6 text-white`}>
        <h3 className="text-xl font-bold mb-1">{label}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">${price}</span>
          <span className="text-white/80">per ticket</span>
        </div>
      </div>
      
      {/* Benefits */}
      <div className="p-6">
        <ul className="space-y-3">
          {benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-gray-600 text-sm">{benefit}</span>
            </li>
          ))}
        </ul>
        
        {/* Select Button */}
        <button
          className={`w-full mt-6 py-4 rounded-xl font-bold transition-colors ${
            isSelected 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isSelected ? 'Selected' : 'Select Ticket'}
        </button>
      </div>
    </div>
  );
};