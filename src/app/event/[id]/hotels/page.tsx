"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Star, SlidersHorizontal, Wifi, Waves, Utensils, Dumbbell, Car, Coffee, ShieldCheck } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/lib/apiClient';
import { Festival, HotelAccommodation } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedText } from '@/utils/getLocalizedText';

const FACILITIES = [
  { id: 'wifi', label: 'Free WiFi', labelKey: 'hotel.freeWiFi', icon: Wifi },
  { id: 'pool', label: 'Swimming Pool', labelKey: 'hotel.swimmingPool', icon: Waves },
  { id: 'restaurant', label: 'Restaurant', labelKey: 'hotel.restaurant', icon: Utensils },
  { id: 'gym', label: 'Fitness Center', labelKey: 'hotel.fitnessCenter', icon: Dumbbell },
  { id: 'parking', label: 'Free Parking', labelKey: 'hotel.freeParking', icon: Car },
  { id: 'spa', label: 'Spa & Wellness', labelKey: 'hotel.spaWellness', icon: Coffee },
];

export default function HotelsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
   
  const { setEvent, setSelectedHotel, setSelectedRoom, ticketSelection } = useBooking();
  const { language, t } = useLanguage();

  const [festival, setFestival] = useState<Festival | null>(null);
  const [hotels, setHotels] = useState<HotelAccommodation[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<HotelAccommodation[]>([]);
   const [loading, setLoading] = useState(true);
   
   const [showFilters, setShowFilters] = useState(false);
   const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
   const [selectedStars, setSelectedStars] = useState<number[]>([]);
const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
    // Always show hotels directly for Standard tickets (no "Add Accommodation?" modal)
    const wantsHotel = true;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [festRes, availabilityRes] = await Promise.all([
          apiClient.get(`/api/festivals/${eventId}`),
          apiClient.get(`/api/festivals/${eventId}/availability`),
        ]);
        
        if (!festRes || !festRes.success) {
          console.error('Festival fetch failed:', festRes);
          setLoading(false);
          return;
        }
        
        const festivalData = festRes?.festival;
        
        if (festivalData) {
          setFestival(festivalData);
          setEvent(festivalData);
        }
        
        if (!availabilityRes || !availabilityRes.success) {
          console.error('Availability fetch failed:', availabilityRes);
          setHotels([]);
          setFilteredHotels([]);
          setLoading(false);
          return;
        }
        
        const hotelsData = availabilityRes?.hotels || festivalData?.hotels || [];
        
        const tier = ticketSelection?.type === 'vip' ? 'vip' : 'standard';
        const vipIncludedHotels = festivalData?.pricing?.vipIncludedHotels || [];

        const normalizedHotels = hotelsData.map((hotel: any, index: number) => {
          const filteredRooms = (hotel.rooms || []).filter((room: any) => {
            const roomTier = room.tier || 'both';
            return roomTier === 'both' || roomTier === tier;
          }).map((room: any, roomIndex: number) => {
            const currentAvailable = typeof room.available === 'number' ? room.available : (Number(room.availability) || 0);
            return {
              ...room,
              id: room._id || room.id || `room-${index}-${roomIndex}`,
              remaining: currentAvailable,
            };
          });

          return {
            ...hotel,
            id: hotel._id || hotel.id || `hotel-${index}`,
            rooms: filteredRooms,
          };
        }).filter((hotel: any) => {
          // If VIP, only show included hotels if specified
          if (tier === 'vip' && vipIncludedHotels.length > 0) {
            return vipIncludedHotels.includes(hotel.id) && hotel.rooms.length > 0;
          }
          return hotel.rooms.length > 0;
        });
        
        setHotels(normalizedHotels);
        setFilteredHotels(normalizedHotels);
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId]);

   useEffect(() => {
     let result = [...hotels];
     
     result = result.filter(h => {
       const minPrice = h.rooms?.[0]?.pricePerNight || 0;
       return minPrice >= priceRange[0] && minPrice <= priceRange[1];
     });
     
     if (selectedStars.length > 0) {
       result = result.filter(h => selectedStars.includes(h.starRating));
     }
     
     if (selectedFacilities.length > 0) {
       result = result.filter(h => 
         selectedFacilities.every(f => h.facilities?.includes(f))
       );
     }
     
     // Sort by star rating (highest first) then by price (low to high)
     result.sort((a, b) => {
       const ratingDiff = b.starRating - a.starRating;
       if (ratingDiff !== 0) return ratingDiff;
       return (a.rooms?.[0]?.pricePerNight || 0) - (b.rooms?.[0]?.pricePerNight || 0);
     });
     
     setFilteredHotels(result);
   }, [hotels, priceRange, selectedStars, selectedFacilities]);

  const toggleStar = (star: number) => {
    setSelectedStars(prev => 
      prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]
    );
  };

  const toggleFacility = (facility: string) => {
    setSelectedFacilities(prev => 
      prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className="min-h-screen bg-ethio-bg">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-4">
           <button 
             onClick={() => router.back()}
             className="flex items-center gap-2 text-gray-500 hover:text-primary"
           >
             <ArrowLeft className="w-4 h-4" />
             <span>{t('common.back')}</span>
           </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-serif font-bold text-primary mb-4">
              Accommodations
            </h1>
            <p className="text-gray-500 text-lg">
              No partner accommodations available for this event.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-yellow-800 mb-2">Contact Organizer for Bookings</h3>
            <p className="text-yellow-700 mb-4">
              This event organizer has not yet added partner accommodations. 
              Please contact them directly for booking assistance.
            </p>
            <button
              onClick={() => router.push(`/event/${eventId}/checkout`)}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90"
            >
              Continue to Checkout →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show hotels directly (no "Add Accommodation?" modal)

  return (
    <div className="min-h-screen bg-ethio-bg">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Event</span>
          </button>
        </div>
      </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">
            {t('festival.selectAccommodation')}
          </h1>
          <p className="text-gray-500 text-lg">
            {t('festival.chooseFromHotels')} {getLocalizedText(festival?.location, 'name', language)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  {t('festival.filters')}
                </h3>
                 <button 
                   onClick={() => setShowFilters(!showFilters)}
                   className="lg:hidden text-gray-500"
                 >
                   {showFilters ? t('common.hide') : t('common.show')}
                 </button>
              </div>
              
              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{t('festival.priceRange')}</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                       placeholder={t('common.min')}
                     />
                     <span className="text-gray-400">-</span>
                     <input 
                       type="number" 
                       value={priceRange[1]}
                       onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
                       className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                       placeholder={t('common.max')}
                     />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{t('festival.hotelStar')}</label>
                  <div className="flex gap-2">
                    {[5, 4, 3, 2, 1].map(star => (
                      <button
                        key={star}
                        onClick={() => toggleStar(star)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                          selectedStars.includes(star) 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Star className={`w-3 h-3 ${selectedStars.includes(star) ? 'fill-white' : 'fill-yellow-400 text-yellow-400'}`} />
                        {star}
                      </button>
                    ))}
                  </div>
                </div>

                 <div>
                   <label className="text-sm font-medium text-gray-700 mb-2 block">{t('hotel.facilities')}</label>
                    <div className="space-y-2">
                     {FACILITIES.map(facility => (
                       <label 
                         key={facility.id}
                         className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                           selectedFacilities.includes(facility.label)
                             ? 'bg-primary/10 text-primary border border-primary'
                             : 'hover:bg-gray-50 text-gray-600'
                         }`}
                       >
                         <input 
                           type="checkbox" 
                           className="hidden"
                           checked={selectedFacilities.includes(facility.label)}
                           onChange={() => toggleFacility(facility.label)}
                         />
                         <facility.icon className="w-4 h-4" />
                         <span className="text-sm">{t(facility.labelKey)}</span>
                       </label>
                     ))}
                   </div>
                </div>

                {(selectedStars.length > 0 || selectedFacilities.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000) && (
                    <button
                      onClick={() => {
                        setSelectedStars([]);
                        setSelectedFacilities([]);
                        setPriceRange([0, 1000]);
                      }}
                      className="text-sm text-gray-500 hover:text-primary"
                    >
                      {t('common.clearAllFilters')}
                    </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="mb-4">
              <p className="text-gray-500 text-sm">
                {filteredHotels.length} {filteredHotels.length === 1 ? t('festival.hotelFound') : t('festival.hotelsFound')}
              </p>
            </div>

            {filteredHotels.map((hotel) => {
              const minPrice = hotel.rooms?.[0]?.pricePerNight || 0;
              const totalRemaining = (hotel.rooms || []).reduce(
                (sum, room) => sum + (room.remaining || 0),
                0
              );
              const isSoldOut = totalRemaining <= 0;
              
              return (
                <Link 
                  key={hotel.id}
                  href={`/event/${eventId}/hotels/${hotel.id}`}
                  className={`block bg-white rounded-2xl overflow-hidden border transition-all ${
                    isSoldOut
                      ? 'border-red-100 opacity-80'
                      : 'border-gray-100 hover:border-gray-200 hover:shadow-lg'
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-64 h-48 md:h-auto flex-shrink-0 relative group">
                      <img 
                        src={hotel.image} 
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {ticketSelection?.type === 'vip' && (
                        <div className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wider">
                          <Star className="w-3.5 h-3.5 fill-white" /> Included for VIP
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-primary">{getLocalizedText(hotel, 'name', language)}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {hotel.starRating && (
                              <div className="flex items-center gap-1">
                                {[...Array(hotel.starRating)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                ))}
                              </div>
                            )}
                            <span className="text-xs text-gray-400">
                              {hotel.starRating} Star{hotel.starRating !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{hotel.address}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary">
                            {ticketSelection?.type === 'vip' ? 'Included' : `${festival?.pricing?.currency || festival?.currency || 'ETB'} ${minPrice}`}
                          </span>
                          {ticketSelection?.type !== 'vip' && <span className="text-gray-500 text-sm">/night</span>}
                          <p className="text-xs text-gray-400 mt-1">
                            {ticketSelection?.type === 'vip' ? 'with VIP ticket' : 'from'}
                          </p>
                          <div className="mt-2">
                            {isSoldOut ? (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                                Sold out
                              </span>
                            ) : totalRemaining <= 3 ? (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                                Only {totalRemaining} room{totalRemaining === 1 ? '' : 's'} left
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                                {totalRemaining} rooms available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {hotel.facilities && hotel.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {hotel.facilities.slice(0, 4).map((facility, idx) => (
                            <span key={idx} className="text-xs bg-gray-50 px-2 py-1 rounded-full text-gray-600">
                              {facility}
                            </span>
                          ))}
                          {hotel.facilities.length > 4 && (
                            <span className="text-xs text-gray-400">+{hotel.facilities.length - 4} more</span>
                          )}
                        </div>
                      )}
                      
                       <div className="mt-4">
                         <span className="text-sm text-primary font-medium hover:underline">
                           {t('hotel.viewDetails')}
                         </span>
                       </div>
                    </div>
                  </div>
                </Link>
              );
            })}

             {filteredHotels.length === 0 && (
               <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                 <p className="text-gray-500">{t('common.noResults')}</p>
                 <button
                  onClick={() => {
                    setSelectedStars([]);
                    setSelectedFacilities([]);
                    setPriceRange([0, 1000]);
                  }}
                  className="text-primary hover:underline mt-2"
                >
                  Clear filters
                </button>
              </div>
            )}

            {filteredHotels.length > 0 && (
              <button
                onClick={() => {
                  setSelectedHotel(null);
                  setSelectedRoom(null);
                  router.push(`/event/${eventId}/checkout`);
                }}
                className="w-full mt-6 py-3 text-center text-gray-500 text-sm hover:text-primary border border-gray-200 rounded-xl"
              >
                {t('festival.skipHotel')} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
