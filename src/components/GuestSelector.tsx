import React from 'react';
import { Users, Minus, Plus } from 'lucide-react';

interface GuestSelectorProps {
  adults: number;
  children: number;
  onAdultsChange: (count: number) => void;
  onChildrenChange: (count: number) => void;
  maxGuests?: number;
  className?: string;
}

export const GuestSelector: React.FC<GuestSelectorProps> = ({
  adults,
  children,
  onAdultsChange,
  onChildrenChange,
  maxGuests = 10,
  className = ''
}) => {
  const totalGuests = adults + children;

  const handleAdultDecrement = () => {
    if (adults > 1) onAdultsChange(adults - 1);
  };

  const handleAdultIncrement = () => {
    if (totalGuests < maxGuests) onAdultsChange(adults + 1);
  };

  const handleChildrenDecrement = () => {
    if (children > 0) onChildrenChange(children - 1);
  };

  const handleChildrenIncrement = () => {
    if (totalGuests < maxGuests) onChildrenChange(children + 1);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <span className="font-semibold text-gray-800">Guests</span>
        <span className="text-sm text-gray-500 ml-auto">{adults + children} Guest{adults + children !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-800">Adults</div>
            <div className="text-sm text-gray-500">Age 13+</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAdultDecrement}
              disabled={adults <= 1}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-semibold text-lg">{adults}</span>
            <button
              onClick={handleAdultIncrement}
              disabled={totalGuests >= maxGuests}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">Children</div>
              <div className="text-sm text-gray-500">Age 0-12</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleChildrenDecrement}
                disabled={children <= 0}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-semibold text-lg">{children}</span>
              <button
                onClick={handleChildrenIncrement}
                disabled={totalGuests >= maxGuests}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
