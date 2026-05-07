"use client";

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Check, X, Info, Tag, CreditCard } from 'lucide-react';

interface PriceSummaryProps {
  eventId: string;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({ eventId }) => {
  const {
    ticketSelection,
    selectedRoom,
    selectedHotel,
    checkIn,
    checkOut,
    selectedTransport,
    transportDays,
    selectedFoodPackages,
    getTicketTotal,
    getHotelTotal,
    getFoodPackageTotal,
    getTransportTotal,
    getGrandTotal,
    guests,
    removeFoodPackage,
  } = useBooking();
  
  const hotelNights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const grandTotal = getGrandTotal();
  const currency = 'ETB';
  
  if (!ticketSelection) return null;

  return (
    <div className="bg-primary rounded-[40px] p-8 text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
         <CreditCard className="w-32 h-32" />
      </div>

      <div className="relative z-10 space-y-8">
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <h3 className="text-xl font-serif font-black tracking-tight">Order Summary</h3>
          <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
            {ticketSelection.type} Pass
          </span>
        </div>
        
        <div className="space-y-6">
          {/* Tickets */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="font-bold text-sm uppercase tracking-wider text-white/80">Tickets</p>
              <p className="text-lg font-black">{ticketSelection.quantity} × {ticketSelection.type.toUpperCase()}</p>
            </div>
            <span className="text-lg font-black">{currency} {getTicketTotal().toLocaleString()}</span>
          </div>
          
          {/* Hotel & Transport (if VIP or selected) */}
          {(selectedRoom || ticketSelection.type === 'vip') && (
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-bold text-sm uppercase tracking-wider text-white/80">Stay & Travel</p>
                  <p className="text-xs font-medium text-white/60">
                    {ticketSelection.type === 'vip' ? 'VIP All-Inclusive' : (selectedHotel?.name || 'Selected Stay')}
                  </p>
                </div>
                <span className="text-lg font-black">
                  {ticketSelection.type === 'vip' ? 'INCLUDED' : `${currency} ${(getHotelTotal() + getTransportTotal()).toLocaleString()}`}
                </span>
              </div>
            </div>
          )}

          {/* Food Packages */}
          {selectedFoodPackages.length > 0 && (
            <div className="pt-6 border-t border-white/10 space-y-3">
              <p className="font-bold text-sm uppercase tracking-wider text-white/80">Dining</p>
              {selectedFoodPackages.map((pkg, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-white/70">{pkg.name} ({guests} guests)</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black">{currency} {(pkg.pricePerPerson * guests).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Grand Total */}
        <div className="pt-8 border-t-2 border-dashed border-white/20">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Estimated Total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{currency}</span>
                <span className="text-5xl font-black tracking-tighter">{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-white/40 mt-6 flex items-center gap-2">
            <Info className="w-3 h-3" /> All taxes and service fees included
          </p>
        </div>
      </div>
    </div>
  );
};