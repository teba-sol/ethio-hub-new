"use client";

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Check, X } from 'lucide-react';

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
  const foodPackageTotal = getFoodPackageTotal();
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-primary">Price Summary</h3>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Tickets */}
        {ticketSelection ? (
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">
                {ticketSelection.type.toUpperCase()} Tickets
              </p>
              <p className="text-sm text-gray-500">
                {ticketSelection.quantity} × ${ticketSelection.price}
              </p>
            </div>
            <span className="font-bold text-primary">${getTicketTotal()}</span>
          </div>
        ) : (
          <div className="text-sm text-gray-400">Select tickets to continue</div>
        )}
        
        {/* Hotel */}
        {(selectedRoom && checkIn && checkOut) ? (
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">
                  {selectedHotel?.name || selectedRoom.name}
                </p>
                <p className="text-sm text-gray-500">
                  {guests} guest{guests > 1 ? 's' : ''} × {hotelNights} night{hotelNights > 1 ? 's' : ''} × ${selectedRoom.pricePerNight}
                </p>
              </div>
              <span className="font-bold text-primary">${selectedRoom.pricePerNight * hotelNights * guests}</span>
            </div>
            
            {/* Food Packages */}
            {selectedFoodPackages.length > 0 && (
              <div className="bg-primary/5 p-3 rounded-lg space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Food Packages</p>
                {selectedFoodPackages.map((pkg, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{pkg.name} ({guests} × ${pkg.pricePerPerson})</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary">${pkg.pricePerPerson * guests}</span>
                      <button 
                        onClick={() => removeFoodPackage(pkg.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400">Select hotel to continue</div>
        )}
        
        {/* Transport */}
        {selectedTransport ? (
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">
                {selectedTransport.type}
              </p>
              <p className="text-sm text-gray-500">
                {transportDays} day{transportDays > 1 ? 's' : ''} × ${selectedTransport.price}
              </p>
            </div>
            <span className="font-bold text-primary">${getTransportTotal()}</span>
          </div>
        ) : (
          <div className="text-sm text-gray-400">Optional transport</div>
        )}
        
        {/* Divider */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-primary">${grandTotal}</span>
          </div>
        </div>
      </div>
      
      {/* Continue Button */}
      <div className="p-6 pt-0">
        <a 
          href={`/event/${eventId}/checkout`}
          className="block w-full py-4 bg-primary text-white text-center rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          Continue to Checkout
        </a>
      </div>
    </div>
  );
};