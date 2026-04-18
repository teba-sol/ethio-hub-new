"use client";

import React from 'react';
import { Users, Shield, Fuel, Gauge } from 'lucide-react';
import { TransportOption } from '@/types';

interface TransportCardProps {
  transport: TransportOption;
  onSelect: (transport: TransportOption) => void;
  isSelected?: boolean;
}

export const TransportCard: React.FC<TransportCardProps> = ({ transport, onSelect, isSelected }) => {
  return (
    <div 
      onClick={() => onSelect(transport)}
      className={`bg-white rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
        isSelected 
          ? 'border-primary shadow-xl' 
          : 'border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={transport.image} 
          alt={transport.type}
          className="w-full h-full object-cover"
        />
        {isSelected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="bg-primary text-white px-4 py-2 rounded-full font-bold">
              Selected
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-primary">{transport.type}</h3>
            {transport.provider && (
              <p className="text-gray-500 text-sm">{transport.provider}</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">${transport.price}</span>
            <span className="text-gray-500 text-sm">/day</span>
          </div>
        </div>
        
        {/* Features */}
        {transport.features && transport.features.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {transport.features.map((feature, idx) => (
              <span key={idx} className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded-full text-gray-600">
                {feature === 'AC' && <Shield className="w-3 h-3" />}
                {feature === 'WiFi' && <span>📶</span>}
                {feature === 'GPS' && <span>🗺️</span>}
                {feature === 'USB Charging' && <span>🔌</span>}
                {feature === 'Leather Seats' && <span>🪑</span>}
                {feature === 'Professional Driver' && <span>👨‍✈️</span>}
                {feature === 'Luggage Space' && <span>🧳</span>}
                {feature}
              </span>
            ))}
          </div>
        )}
        
        {/* Specs */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {transport.capacity && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{transport.capacity} seats</span>
            </div>
          )}
        </div>
        
        {/* Select Button */}
        <button
          className={`w-full mt-4 py-3 rounded-xl font-bold transition-colors ${
            isSelected 
              ? 'bg-green-600 text-white' 
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {isSelected ? 'Selected' : 'Select Vehicle'}
        </button>
      </div>
    </div>
  );
};