import React, { useState } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Minus, Plus, Check, 
  BedDouble, Users, Maximize, Wifi, Coffee, Tv, Wind,
  Star, MapPin
} from 'lucide-react';
import { RoomType, HotelAccommodation } from '../types';
import { Button } from './UI';

interface RoomBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomType;
  hotel: HotelAccommodation;
  checkIn: Date | null;
  checkOut: Date | null;
  adults: number;
  children: number;
  onBook: (roomId: string, quantity: number, totalPrice: number) => void;
}

const ROOM_AMENITIES: Record<string, React.ReactNode> = {
  'Free WiFi': <Wifi className="w-4 h-4" />,
  'Air Conditioning': <Wind className="w-4 h-4" />,
  'Coffee/Tea': <Coffee className="w-4 h-4" />,
  'TV': <Tv className="w-4 h-4" />,
};

export const RoomBookingModal: React.FC<RoomBookingModalProps> = ({
  isOpen,
  onClose,
  room,
  hotel,
  checkIn,
  checkOut,
  adults,
  children,
  onBook
}) => {
  const [roomCount, setRoomCount] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showExtras, setShowExtras] = useState(false);

  if (!isOpen) return null;

  const roomImages = room.image ? [room.image] : [];
  const galleryImages = hotel.gallery?.length ? hotel.gallery : roomImages;

  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  const roomPrice = room.pricePerNight || 0;
  const subtotal = roomPrice * roomCount * nights;
  const taxes = subtotal * 0.15;
  const totalPrice = subtotal + taxes;
  const payNow = totalPrice * 0.3;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const handleBook = () => {
    onBook(room.id, roomCount, totalPrice);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not selected';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-serif font-bold text-primary">Book Your Stay</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative bg-gray-900">
              <div className="aspect-[4/3] relative">
                <img 
                  src={galleryImages[currentImageIndex] || room.image} 
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{hotel.address}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{room.name}</h3>
                <p className="text-white/70 text-sm mb-4">{hotel.name}</p>
                <div className="flex items-center gap-3">
                  {Array.from({ length: hotel.starRating || 0 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-ethio-bg rounded-2xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Check In</span>
                    <div className="font-medium">{formatDate(checkIn)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Check Out</span>
                    <div className="font-medium">{formatDate(checkOut)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Guests</span>
                    <div className="font-medium">{adults} Adult{adults !== 1 ? 's' : ''} {children > 0 && `, ${children} Child${children !== 1 ? 'ren' : ''}`}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration</span>
                    <div className="font-medium">{nights} Night{nights !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              </div>

              <div className="bg-ethio-bg rounded-2xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Select Rooms</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{room.name}</div>
                    <div className="text-sm text-gray-500">Max {room.capacity} Guest{room.capacity !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setRoomCount(Math.max(1, roomCount - 1))}
                      disabled={roomCount <= 1}
                      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-8 text-center font-bold text-xl">{roomCount}</span>
                    <button
                      onClick={() => setRoomCount(Math.min(room.availability || 5, roomCount + 1))}
                      disabled={roomCount >= (room.availability || 5)}
                      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-500">
                  {room.availability || 5} rooms available
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Room Features</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BedDouble className="w-4 h-4 text-primary" />
                    <span>{room.bedType || 'King Size Bed'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Maximize className="w-4 h-4 text-primary" />
                    <span>{room.sqm || 35} m²</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Up to {room.capacity} Guests</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Wifi className="w-4 h-4 text-primary" />
                    <span>Free WiFi</span>
                  </div>
                </div>
                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {room.amenities.map((amenity, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-ethio-bg rounded-2xl p-4 space-y-3">
                <h4 className="font-semibold text-gray-800">Price Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      ${roomPrice} × {roomCount} room{roomCount > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}
                    </span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxes & fees (15%)</span>
                    <span className="font-medium">${taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="font-bold text-xl text-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">Free Cancellation</span>
                </div>
                <p className="text-sm text-gray-600">Cancel before check-in date for a full refund</p>
              </div>

              <div className="space-y-3">
                <div className="text-center text-sm text-gray-500">
                  Pay now <span className="font-bold text-primary">${payNow.toFixed(2)}</span>
                </div>
                <Button className="w-full py-4 text-lg font-bold rounded-xl">
                  Book Now
                </Button>
                <Button variant="outline" className="w-full py-4 text-lg font-semibold rounded-xl">
                  Send Enquiry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
