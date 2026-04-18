"use client";

import React from 'react';
import { MapPin, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { HotelAccommodation } from '@/types';

interface HotelCardProps {
  hotel: HotelAccommodation;
  eventId: string;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, eventId }) => {
  // Get lowest room price
  const lowestPrice = hotel.rooms?.reduce((min, room) => 
    room.pricePerNight < min ? room.pricePerNight : min
  , 0) || 0;

  return (
    <Link href={`/hotels/${hotel.id}?event=${eventId}`}>
      <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <img 
            src={hotel.image} 
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {hotel.starRating && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-bold text-primary">{hotel.starRating}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-primary group-hover:text-secondary transition-colors mb-1">
            {hotel.name}
          </h3>
          
          <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
            <MapPin className="w-4 h-4" />
            <span>{hotel.address}</span>
          </div>
          
          {/* Amenities preview */}
          {hotel.facilities && hotel.facilities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {hotel.facilities.slice(0, 3).map((facility, idx) => (
                <span key={idx} className="text-xs bg-gray-50 px-2 py-1 rounded-full text-gray-600">
                  {facility}
                </span>
              ))}
              {hotel.facilities.length > 3 && (
                <span className="text-xs text-gray-400">+{hotel.facilities.length - 3} more</span>
              )}
            </div>
          )}
          
          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <span className="text-2xl font-bold text-primary">${lowestPrice}</span>
              <span className="text-gray-500 text-sm">/night</span>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {hotel.rooms?.[0]?.capacity || 2} guests
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};