"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, Star, Hotel, Car, Bus, Plane, 
  Wifi, Waves, Utensils, Dumbbell, Car as CarIcon, Coffee, 
  Check, Bath, Bed, Users, Eye, ExternalLink, ShieldCheck,
  Clock, Calendar, MapPinned, Phone, Mail, Gift, UtensilsCrossed,
  Home, Ticket, Wrench, Accessibility, File
} from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/lib/apiClient';
import { Festival } from '@/types';

export default function PackagePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  
  const { ticketSelection } = useBooking();
  
  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const festRes = await apiClient.get(`/api/festivals/${eventId}`);
        const festivalData = festRes?.festival || festRes;
        
        if (festivalData) {
          setFestival(festivalData);
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId]);

  const handleBack = () => router.push(`/event/${eventId}/tickets`);
  const handleCheckout = () => router.push(`/event/${eventId}/checkout`);

  const getGoogleMapsUrl = (lat: number, lng: number, name?: string) => {
    const label = encodeURIComponent(name || 'Hotel Location');
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  const currency = festival?.pricing?.currency || 'USD';
  const allHotels = festival?.hotels || [];
  const allTransport = festival?.transportation || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin" />
          <div className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-amber-100/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Tickets</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full">
              <Star className="w-4 h-4 text-amber-600 fill-current" />
              <span className="text-sm font-bold text-amber-800">VIP Package</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Package Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-sm font-bold mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Your All-Inclusive VIP Package</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-primary mb-4">
            Your <span className="text-amber-600">Package</span> Details
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Everything included with your VIP ticket. All details are provided by the event organizer.
          </p>
        </div>

        {/* Ticket Summary Card */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-8 text-white mb-12 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Ticket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">VIP Experience</h3>
                <p className="text-amber-100">1 × {currency} {ticketSelection?.price?.toLocaleString() || '0'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-amber-100 text-sm">Total Paid</p>
              <p className="text-3xl font-bold">{currency} {ticketSelection?.price?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

        {/* ==================== HOTELS SECTION ==================== */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Hotel className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-primary">Accommodation</h2>
            <span className="px-3 py-1 bg-blue-100 rounded-full text-sm font-medium text-blue-700">
              {allHotels.length} {allHotels.length === 1 ? 'Hotel' : 'Hotels'} Included
            </span>
          </div>

          {allHotels.length > 0 ? (
            <div className="space-y-10">
              {allHotels.map((hotel: any, hotelIndex: number) => (
                <div key={hotelIndex} className="bg-white rounded-3xl border-2 border-amber-100 shadow-2xl overflow-hidden">
                  {/* Hotel Cover Image */}
                  <div className="relative h-80">
                    {hotel.image || hotel.coverImage ? (
                      <img 
                        src={hotel.image || hotel.coverImage} 
                        alt={hotel.name_en || hotel.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                        <Hotel className="w-24 h-24 text-amber-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Hotel Name Overlay */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex items-center gap-2 mb-2">
                        {[...Array(hotel.starRating || 4)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                        ))}
                        <span className="text-sm text-white/80 ml-2">{hotel.propertyType || 'Hotel'}</span>
                      </div>
                      <h3 className="text-3xl font-bold text-white drop-shadow-lg">
                        {hotel.name_en || hotel.name_am || hotel.name || 'Hotel'}
                      </h3>
                    </div>

                    {/* View on Map Button */}
                    {hotel.latitude && hotel.longitude && (
                      <a 
                        href={getGoogleMapsUrl(hotel.latitude, hotel.longitude, hotel.name_en || hotel.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 rounded-xl shadow-lg transition-all"
                      >
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-bold text-gray-700">View on Map</span>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    )}
                  </div>

                  {/* Hotel Info Grid */}
                  <div className="p-8">
                    {/* Address & Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {hotel.address && (
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Address</p>
                            <p className="text-gray-700">{hotel.address}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Check-in / Check-out</p>
                          <p className="text-gray-700">
                            {hotel.checkInTime || '14:00'} / {hotel.checkOutTime || '12:00'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Full Description */}
                    {(hotel.description_en || hotel.description_am || hotel.description || hotel.fullDescription_en || hotel.fullDescription_am) && (
                      <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">About the Property</p>
                        <p className="text-gray-700 leading-relaxed">
                          {hotel.description_en || hotel.description_am || hotel.description || 
                           hotel.fullDescription_en || hotel.fullDescription_am}
                        </p>
                      </div>
                    )}

                    {/* Hotel Facilities */}
                    {hotel.facilities && hotel.facilities.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Wrench className="w-4 h-4" /> Hotel Facilities
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {hotel.facilities.map((facility: string, i: number) => (
                            <span key={i} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700">
                              {facility}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Food & Drink */}
                    {hotel.foodAndDrink && hotel.foodAndDrink.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <UtensilsCrossed className="w-4 h-4" /> Food & Drink
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {hotel.foodAndDrink.map((item: string, i: number) => (
                            <span key={i} className="px-4 py-2 bg-green-50 rounded-xl text-sm font-medium text-green-700">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hotel Rules */}
                    {hotel.hotelRules && hotel.hotelRules.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> Hotel Rules
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {hotel.hotelRules.map((rule: string, i: number) => (
                            <span key={i} className="px-4 py-2 bg-amber-50 rounded-xl text-sm font-medium text-amber-700">
                              {rule}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ==================== ROOMS ==================== */}
                    {hotel.rooms && hotel.rooms.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-gray-100">
                        <h4 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                          <Home className="w-5 h-5" /> Room Details
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {hotel.rooms.map((room: any, roomIndex: number) => (
                            <div key={roomIndex} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-100 overflow-hidden">
                              {/* Room Image */}
                              {room.image && (
                                <div className="relative h-40">
                                  <img src={room.image} alt={room.name_en || room.name} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-3 left-3">
                                    <span className="px-2 py-1 bg-white/90 rounded-md text-xs font-bold text-gray-700">
                                      {room.availability || room.available || 0} rooms available
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Room Info */}
                              <div className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-lg font-bold text-primary">
                                    {room.name_en || room.name_am || room.name || `Room ${roomIndex + 1}`}
                                  </h5>
                                  {room.bedType && (
                                    <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-gray-600 border">
                                      {room.bedType}
                                    </span>
                                  )}
                                </div>

                                {/* Room Specs */}
                                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                                  {room.capacity && (
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                      <Users className="w-4 h-4" />
                                      <span>{room.capacity} Guests</span>
                                    </div>
                                  )}
                                  {room.sqm && (
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                      <Accessibility className="w-4 h-4" />
                                      <span>{room.sqm} m²</span>
                                    </div>
                                  )}
                                  {room.pricePerNight && (
                                    <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                                      <span>{currency} {room.pricePerNight}</span>
                                      <span className="text-xs font-normal text-gray-400">/night</span>
                                    </div>
                                  )}
                                </div>

                                {/* Room Description */}
                                {room.description_en || room.description_am || room.description && (
                                  <p className="text-sm text-gray-600 mb-4">
                                    {room.description_en || room.description_am || room.description}
                                  </p>
                                )}

                                {/* Room Amenities */}
                                {room.amenities && room.amenities.length > 0 && (
                                  <div className="pt-3 border-t border-amber-100">
                                    <div className="flex flex-wrap gap-1.5">
                                      {room.amenities.map((amenity: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-600">
                                          {amenity}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <Hotel className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No accommodation data available for this event.</p>
            </div>
          )}
        </div>

        {/* ==================== TRANSPORT SECTION ==================== */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-primary">Transport</h2>
            <span className="px-3 py-1 bg-green-100 rounded-full text-sm font-medium text-green-700">
              {allTransport.length} {allTransport.length === 1 ? 'Option' : 'Options'} Included
            </span>
          </div>

          {allTransport.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allTransport.map((transport: any, index: number) => (
                <div key={index} className="bg-white rounded-3xl border-2 border-green-100 shadow-xl overflow-hidden">
                  {/* Transport Image */}
                  {transport.image && (
                    <div className="relative h-48">
                      <img src={transport.image} alt={transport.type_en || transport.type} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <span className="px-2 py-1 bg-white/90 rounded-md text-xs font-bold text-gray-700">
                          {transport.available || transport.availability || 0} available
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                        {transport.type_en?.toLowerCase().includes('bus') ? (
                          <Bus className="w-7 h-7 text-green-600" />
                        ) : transport.type_en?.toLowerCase().includes('car') || transport.type_en?.toLowerCase().includes('taxi') ? (
                          <CarIcon className="w-7 h-7 text-green-600" />
                        ) : transport.type_en?.toLowerCase().includes('van') ? (
                          <Bus className="w-7 h-7 text-green-600" />
                        ) : (
                          <Plane className="w-7 h-7 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-primary">
                          {transport.type_en || transport.type_am || transport.type || 'Transport'}
                        </h4>
                        {transport.capacity && (
                          <p className="text-sm text-gray-500">Up to {transport.capacity} passengers</p>
                        )}
                      </div>
                    </div>

                    {/* Transport Description */}
                    {transport.description_en || transport.description_am || transport.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {transport.description_en || transport.description_am || transport.description}
                      </p>
                    )}

                    {/* Transport Features */}
                    {transport.features && transport.features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {transport.features.map((feature: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-green-50 rounded-lg text-sm font-medium text-green-700">
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Pickup Locations */}
                    {transport.pickupLocations && (
                      <div className="flex items-start gap-2 pt-3 border-t border-green-100">
                        <MapPinned className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-green-600 uppercase">Pickup Locations</p>
                          <p className="text-sm text-gray-600">{transport.pickupLocations}</p>
                        </div>
                      </div>
                    )}

                    {/* VIP Included Badge */}
                    <div className="mt-4 pt-4 border-t border-green-100">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold">
                        <Check className="w-3 h-3" /> Included with VIP
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transport data available for this event.</p>
            </div>
          )}
        </div>

        {/* ==================== VIP PERKS ==================== */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-primary">VIP Benefits</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              'Priority Entry', 'VIP Lounge', 'Meet & Greet', 'Drinks Included',
              'Hotel (1 night)', 'Transport', 'Fast Track', 'Welcome Gift',
              'Exclusive Access', 'Dedicated Support', 'Early Access', 'Premium Seating'
            ].map((perk, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-purple-800">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ==================== POLICIES ==================== */}
        {(festival?.policies?.cancellation_en || festival?.policies?.cancellation_am || festival?.policies?.terms_en || festival?.policies?.terms_am) && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-primary">Policies</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(festival?.policies?.cancellation_en || festival?.policies?.cancellation_am || festival?.policies?.cancellation) && (
                <div className="bg-white rounded-2xl p-6 border-2 border-red-100">
                  <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-red-500" /> Cancellation Policy
                  </h4>
                  <p className="text-sm text-gray-600">
                    {festival?.policies?.cancellation_en || festival?.policies?.cancellation_am || festival?.policies?.cancellation}
                  </p>
                </div>
              )}
              {(festival?.policies?.terms_en || festival?.policies?.terms_am || festival?.policies?.terms) && (
                <div className="bg-white rounded-2xl p-6 border-2 border-red-100">
                  <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                    <File className="w-5 h-5 text-red-500" /> Terms & Conditions
                  </h4>
                  <p className="text-sm text-gray-600">
                    {festival?.policies?.terms_en || festival?.policies?.terms_am || festival?.policies?.terms}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== SECURE PAYMENT BUTTON ==================== */}
        <div className="text-center pb-12">
          <button 
            onClick={handleCheckout}
            className="w-full md:w-auto px-20 py-6 rounded-3xl shadow-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xl transition-all transform hover:scale-105"
          >
            <ShieldCheck className="w-6 h-6 inline mr-3" />
            Secure Payment
          </button>
          <p className="mt-4 text-sm text-gray-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            Secure SSL Encryption • Instant Confirmation
          </p>
        </div>
      </div>
    </div>
  );
}