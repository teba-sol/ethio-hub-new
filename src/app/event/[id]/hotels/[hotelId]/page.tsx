"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Star, Wifi, Car, Coffee as CoffeeIcon, Dumbbell, Waves,
  Utensils, Sparkles, Check, X, ChevronLeft, ChevronRight, Users, Maximize,
  BedDouble, Calendar, ChevronDown, ExternalLink, Facebook, Twitter,
  AlertCircle,
  Linkedin, Mail, Shield, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/UI';
import { useBooking } from '@/context/BookingContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNotification } from '@/context/NotificationContext';
import apiClient from '@/lib/apiClient';
import { getLocalizedText } from '@/utils/getLocalizedText';
import { Festival, HotelAccommodation, RoomType } from '@/types';

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const hotelId = params?.hotelId as string;

  const {
    setSelectedHotel,
    selectedRoom,
    setSelectedRoom,
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    guests,
    selectedFoodPackages,
    selectFoodPackage,
    clearFoodPackages,
    ticketSelection
  } = useBooking();
  const { language, t } = useLanguage();
  const { showNotification } = useNotification();
  const [festival, setFestival] = useState<Festival | null>(null);
  const [hotel, setHotel] = useState<HotelAccommodation | null>(null);
  const [allHotels, setAllHotels] = useState<HotelAccommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const normalizeHotel = (hotelData: any, hotelIndex = 0): HotelAccommodation => {
    const tier = ticketSelection?.type === 'vip' ? 'vip' : 'standard';
    return {
      ...hotelData,
      id: hotelData._id || hotelData.id || `hotel-${hotelIndex}`,
      hotelServices: hotelData.hotelServices || [],
      rooms: (hotelData.rooms || [])
        .filter((room: any) => {
          const roomTier = room.tier || 'both';
          return roomTier === 'both' || roomTier === tier;
        })
        .map((room: any, roomIndex: number) => {
          const currentAvailable = typeof room.available === 'number' ? room.available : (Number(room.availability) || 0);
          return {
            ...room,
            id: room._id || room.id || `room-${hotelIndex}-${roomIndex}`,
            remaining: currentAvailable,
          };
        }),
    };
  };

  useEffect(() => {
    setSelectedRoom(null);
    clearFoodPackages();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [festRes, availabilityRes] = await Promise.all([
          apiClient.get(`/api/festivals/${eventId}`),
          apiClient.get(`/api/festivals/${eventId}/availability`),
        ]);
        const festivalData = festRes?.festival || festRes;

        if (festivalData) {
          setFestival(festivalData);
          const normalizedHotels = ((availabilityRes?.hotels || festivalData.hotels) || []).map((hotel: any, index: number) =>
            normalizeHotel(hotel, index)
          );

          setAllHotels(normalizedHotels);

          // Find the specific hotel - normalize IDs first
          let hotelData = normalizedHotels.find((h: any) => {
            const hId = h.id || '';
            return hId === hotelId || hId === `hotel-${hotelId}`;
          });

          // Fallback to index-based lookup
          if (!hotelData) {
            const idx = parseInt(hotelId);
            if (!isNaN(idx) && normalizedHotels[idx]) {
              hotelData = normalizedHotels[idx];
            }
          }

          if (hotelData) {
            setHotel(hotelData);
            setSelectedHotel(hotelData);
          }
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, hotelId]);

  // Get related hotels (other hotels from the same event, excluding current)
  const relatedHotels = allHotels.filter(h => {
    const hId = h.id || '';
    return hId !== hotelId && hId !== `hotel-${hotelId}`;
  }).slice(0, 3);

  const handleSelectRoom = (room: RoomType) => {
    if ((room.remaining ?? room.availability ?? 0) <= 0) {
      return;
    }

    if (selectedRoom?.id === room.id) {
      setSelectedRoom(null);
    } else {
      setSelectedRoom(room);
    }
  };

  // For VIP: Auto-select first available VIP room if not selected
  useEffect(() => {
    if (ticketSelection?.type === 'vip' && hotel?.rooms && !selectedRoom) {
      const vipRoom = hotel.rooms.find(r => (r.remaining ?? 0) > 0);
      if (vipRoom) {
        setSelectedRoom(vipRoom);
      }
    }
  }, [ticketSelection, hotel, selectedRoom]);

  const handleContinue = (destination: 'transport' | 'checkout') => {
    if (!selectedRoom) return;

    if (missingSelections.length > 0) {
      setValidationErrors(missingSelections);
      return;
    }

    router.push(
      destination === 'transport'
        ? `/event/${eventId}/transport`
        : `/event/${eventId}/checkout`
    );
  };

  const formatShortDate = (date: Date | null) => {
    if (!date) return 'Select';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleEnquiry = () => {
    showNotification('Enquiry sent! The hotel will contact you soon.', 'success');
    setShowEnquiryModal(false);
    setEnquiryMessage('');
  };

  const gallery = hotel?.gallery?.length ? hotel.gallery : hotel?.image ? [hotel.image] : [];
  const foodPackages = (((festival as any)?.services?.foodPackages || []) as any[]).map((pkg, index) => ({
    ...pkg,
    id: pkg._id || pkg.id || `food-package-${index}`,
  }));
  const requiresFoodPackage = foodPackages.length > 0;
  const missingSelections = [
    !selectedRoom ? 'Room selection' : null,
    !checkIn ? 'Check-in date' : null,
    !checkOut ? 'Check-out date' : null,
  ].filter(Boolean) as string[];

  useEffect(() => {
    setValidationErrors((prev) => (prev.length > 0 ? [] : prev));
  }, [selectedRoom, checkIn, checkOut, selectedFoodPackages.length]);

  const renderValidationNotice = () => {
    if (validationErrors.length === 0) return null;

    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">Complete your booking details before continuing</p>
            <p className="text-sm text-amber-800 mt-1">
              Please review the following item{validationErrors.length > 1 ? 's' : ''}:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-amber-800">
              {validationErrors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Hotel not found</p>
          <Button onClick={() => router.push(`/event/${eventId}/hotels`)}>
            Back to Hotels
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => router.push(`/event/${eventId}/hotels`)}
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.backToHotels')}</span>
          </button>
          
          <button
            onClick={() => router.push(`/event/${eventId}/hotels`)}
            className="px-6 py-2 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-gray-200"
          >
            Back
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hotel Info Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {Array.from({ length: hotel.starRating || 0 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3">{getLocalizedText(hotel, 'name', language)}</h1>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{getLocalizedText(hotel, 'address', language)}</span>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(hotel.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm ml-2 flex items-center gap-1"
            >
              {t('common.viewOnMap')} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery Section */}
            <div>
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 h-[300px] md:h-[450px]">
                {gallery.length > 0 ? (
                  <img
                    src={gallery[activeImageIndex]}
                    alt={hotel.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setLightboxOpen(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}

                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex(Math.max(0, activeImageIndex - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex(Math.min(gallery.length - 1, activeImageIndex + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {gallery.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${idx === activeImageIndex ? 'bg-white w-6' : 'bg-white/50'
                            }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                <button
                  onClick={() => setLightboxOpen(true)}
                  className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Thumbnail Strip */}
              {gallery.length > 1 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {gallery.slice(0, 5).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative rounded-lg overflow-hidden h-16 cursor-pointer group ${idx === activeImageIndex ? 'ring-2 ring-primary' : ''
                        }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description Section */}
            <div>
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">{t('hotel.description')}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {getLocalizedText(hotel, 'fullDescription', language) || getLocalizedText(hotel, 'description', language) || t('hotel.noDescription')}
              </p>
            </div>

            {/* Structured Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-gray-100">
              {/* Facilities */}
              {hotel.facilities && hotel.facilities.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Facilities
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3">
                    {hotel.facilities.map((facility, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500" />
                        {facility}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Food & Drink */}
              {hotel.foodAndDrink && hotel.foodAndDrink.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary" />
                    Food and Drink
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {hotel.foodAndDrink.map((item, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm border border-gray-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-gray-100">
              {/* Hotel Rules */}
              {hotel.hotelRules && hotel.hotelRules.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Hotel Rules - Policies
                  </h3>
                  <div className="space-y-3">
                    {hotel.hotelRules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                        {rule}
                      </div>
                    ))}
                    <div className="flex gap-6 mt-4 pt-4 border-t border-gray-50">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check In</p>
                        <p className="text-sm font-bold text-gray-700">{hotel.checkInTime || '12:00 PM'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check Out</p>
                        <p className="text-sm font-bold text-gray-700">{hotel.checkOutTime || '11:00 AM'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Property Type & Location Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Property Info
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Property Type</span>
                    <span className="text-sm font-bold text-gray-700">{hotel.propertyType || 'Hotel'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Location</span>
                    <span className="text-sm font-bold text-gray-700">{getLocalizedText(hotel, 'address', language)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Select Your Room Section */}
            <div id="select-room">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">
                {ticketSelection?.type === 'vip' ? 'Your Included VIP Room' : t('hotel.selectRoom')}
              </h2>

              <div className="space-y-4">
                {(hotel.rooms || [])
                  .filter(room => {
                    if (ticketSelection?.type === 'vip') {
                      // If VIP, only show the 'vip' tier room or the first one if no tier is specified
                      return room.tier === 'vip' || (!hotel.rooms.some((r: any) => r.tier === 'vip') && hotel.rooms.indexOf(room) === 0);
                    }
                    return true;
                  })
                  .map((room) => {
                    const isSelected = selectedRoom?.id === room.id || (ticketSelection?.type === 'vip');
                    const remainingRooms = room.remaining ?? room.availability ?? 0;
                    const isSoldOut = remainingRooms <= 0;
                    return (
                      <div
                        key={room.id}
                        onClick={ticketSelection?.type === 'vip' ? undefined : () => handleSelectRoom(room)}
                        className={`bg-gray-50 rounded-2xl p-6 border-2 transition-all ${ticketSelection?.type === 'vip'
                            ? 'border-amber-200 bg-amber-50/30 shadow-sm'
                            : isSoldOut
                              ? 'cursor-not-allowed border-red-100 opacity-70'
                              : isSelected
                                ? 'cursor-pointer border-primary bg-primary/5'
                                : 'cursor-pointer border-transparent hover:border-gray-200'
                          }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="md:col-span-1">
                            <img
                              src={room.image || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop'}
                              alt={getLocalizedText(room, 'name', language)}
                              className="w-full h-32 md:h-24 object-cover rounded-xl"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{getLocalizedText(room, 'name', language)}</h3>
                            <p className="text-gray-600 text-sm mb-3">{getLocalizedText(room, 'description', language)}</p>
                            <div className="flex flex-wrap gap-3">
                              <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                                <Maximize className="w-3.5 h-3.5" /> {room.sqm || 30} m²
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                                <Users className="w-3.5 h-3.5" /> {room.capacity || 2} Guests
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                                <BedDouble className="w-3.5 h-3.5" /> {room.bedType || 'King Size'}
                              </span>
                            </div>
                            {room.amenities && room.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {room.amenities.slice(0, 4).map((amenity, idx) => (
                                  <span key={idx} className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                                    {amenity}
                                  </span>
                                ))}
                                {room.amenities.length > 4 && (
                                  <span className="text-xs text-gray-400">+{room.amenities.length - 4} more</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-1 flex flex-col justify-between items-end">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {ticketSelection?.type === 'vip' ? 'Included' : `${festival?.pricing?.currency || festival?.currency || 'ETB'} ${room.pricePerNight}`}
                              </div>
                              {ticketSelection?.type !== 'vip' && <div className="text-sm text-gray-500">/night</div>}
                              {ticketSelection?.type === 'vip' && (
                                <div className="flex items-center justify-end gap-1.5 text-amber-600 font-bold mt-1">
                                  <Star className="w-3 h-3 fill-amber-600" />
                                  <span className="text-xs uppercase tracking-widest">VIP Pass</span>
                                </div>
                              )}
                            </div>
                            {ticketSelection?.type !== 'vip' && (
                              isSoldOut ? (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full mt-2">
                                  Sold out
                                </span>
                              ) : remainingRooms <= 3 ? (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full mt-2">
                                  Only {remainingRooms} left
                                </span>
                              ) : (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full mt-2">
                                  {remainingRooms} rooms available
                                </span>
                              )
                            )}
                            {isSelected && (
                              <span className={`flex items-center justify-center gap-2 mt-2 py-2 px-4 rounded-xl text-sm font-medium ${ticketSelection?.type === 'vip' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-primary text-white'
                                }`}>
                                <Check className="w-4 h-4" /> {ticketSelection?.type === 'vip' ? 'Package Included' : 'Selected'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {(!hotel.rooms || hotel.rooms.length === 0) && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <p className="text-gray-500">No rooms available. Please check back later.</p>
                </div>
              )}
            </div>

            {/* Hotel Services (Pay at Hotel) */}
            {hotel.hotelServices && hotel.hotelServices.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">Hotel Services (Pay at Hotel)</h2>
                <p className="text-sm text-gray-500 mb-6">These services are paid directly at the hotel, not through the platform.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hotel.hotelServices.map((service: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-xl border border-gray-100">
                      <h3 className="font-bold text-gray-900">{service.name}</h3>
                      {service.description && <p className="text-sm text-gray-500 mt-1">{service.description}</p>}
                      <p className="text-lg font-bold text-primary mt-2">
                        {festival?.pricing?.currency || festival?.currency || 'ETB'} {service.price}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {foodPackages.length > 0 && (
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">{t('hotel.foodPackages')}</h2>
                <p className="text-gray-500 text-sm mb-4">{t('hotel.enhanceStay')}</p>

                <div className="space-y-3">
                  {foodPackages.map((pkg: any) => {
                    return (
                      <div
                        key={pkg.id}
                        className="rounded-xl p-5 border-2 border-gray-100 bg-gray-50/50 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <Utensils className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                              <p className="text-gray-600 text-sm mt-1">{pkg.description}</p>
                              {pkg.items && pkg.items.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {pkg.items.map((item, idx) => (
                                    <span key={idx} className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded border border-gray-100">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            <div className="mt-8 pt-6 border-t border-gray-200">
              {renderValidationNotice()}
            </div>

            {/* Facilities Section */}
            {hotel.facilities && hotel.facilities.length > 0 && (
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Facilities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.facilities.map((facility, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Check className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{facility}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotel Rules - Policies */}
            <div>
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Hotel Rules - Policies</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Check In</h3>
                  <p className="text-2xl font-bold text-gray-900">{hotel.checkInTime || '14:00'}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Check Out</h3>
                  <p className="text-2xl font-bold text-gray-900">{hotel.checkOutTime || '12:00'}</p>
                </div>
              </div>
              {hotel.policies && (
                <p className="mt-4 text-gray-600">{hotel.policies}</p>
              )}
            </div>

            {/* Location Section */}
            <div>
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Location</h2>
              <div className="relative h-64 bg-gray-200 rounded-2xl overflow-hidden">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(hotel.address)}&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Reviews Section */}
            <div>
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Reviews</h2>
              <div className="flex items-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-500">/5</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">Not rated</div>
                  <div className="text-sm text-gray-500">From 0 review</div>
                </div>
              </div>
              <p className="text-gray-500 text-center py-8">No reviews yet.</p>
            </div>

            {/* Why Book With Us */}
            <div className="bg-primary rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-serif font-bold mb-4">Why Book With Us?</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-4">
                  <Shield className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">Best Price Guarantee</h3>
                    <p className="text-sm text-white/70">No-hassle best price</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Users className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">24/7 Support</h3>
                    <p className="text-sm text-white/70">Customer care available</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Sparkles className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">Hand-picked Hotels</h3>
                    <p className="text-sm text-white/70">Quality accommodations</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Car className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">Free Insurance</h3>
                    <p className="text-sm text-white/70">Travel protection</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Share */}
            <div className="flex gap-4">
              <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <Facebook className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <Twitter className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <Linkedin className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <Mail className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* You might also like */}
            {relatedHotels.length > 0 && (
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">You might also like...</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedHotels.map((relatedHotel) => (
                    <Link
                      key={relatedHotel.id}
                      href={`/event/${eventId}/hotels/${relatedHotel.id}`}
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="h-32">
                        <img
                          src={relatedHotel.image}
                          alt={relatedHotel.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-primary text-sm truncate">{relatedHotel.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            {[...Array(relatedHotel.starRating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <span className="text-sm font-bold text-primary">
                            from ${relatedHotel.rooms?.[0]?.pricePerNight || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Booking Widget */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sticky top-28">              {ticketSelection?.type === 'vip' ? (
                <div className="space-y-6">
                  <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-500 rounded-lg">
                        <Star className="w-5 h-5 text-white fill-white" />
                      </div>
                      <h3 className="font-bold text-amber-900">VIP Package</h3>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed mb-4">
                      Your stay at {hotel.name} is fully included in your VIP pass. No additional selection or dates are required.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-widest">
                      <Check className="w-4 h-4" /> All-Inclusive Stay
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 space-y-3">
                    <Button
                      className="w-full py-6 rounded-2xl shadow-lg shadow-primary/20"
                      onClick={() => handleContinue('transport')}
                    >
                      Continue to Transport
                    </Button>
                    <button
                      onClick={() => router.push(`/event/${eventId}/hotels`)}
                      className="w-full py-3 text-center text-gray-400 text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors border border-gray-100 rounded-xl"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Check In</span>
                      <button
                        onClick={() => { setShowDatePicker(!showDatePicker); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-sm">{formatShortDate(checkIn)}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Check Out</span>
                      <button
                        onClick={() => { setShowDatePicker(!showDatePicker); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-sm">{formatShortDate(checkOut)}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    {showDatePicker && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-2">Select dates</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Check In</p>
                            <input
                              type="date"
                              className="w-full p-2 border rounded-lg text-sm"
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setCheckIn(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Check Out</p>
                            <input
                              type="date"
                              className="w-full p-2 border rounded-lg text-sm"
                              min={checkIn ? new Date(checkIn).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                              onChange={(e) => setCheckOut(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    {selectedRoom ? (
                      <div className="bg-primary/5 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Room</p>
                            <p className="font-bold text-primary">{selectedRoom.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary">
                              {festival?.pricing?.currency || festival?.currency || 'ETB'} {selectedRoom.pricePerNight * (guests || 1)}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                              {guests || 1} × {selectedRoom.pricePerNight} / night
                            </p>
                          </div>
                        </div>
                        {selectedFoodPackages.length > 0 && (
                          <div className="border-t border-primary/10 pt-2 mt-2">
                            <p className="text-xs text-gray-500">Food Packages:</p>
                            {selectedFoodPackages.map((pkg, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-600">{pkg.name}</span>
                                <span className="font-medium">{festival?.pricing?.currency || festival?.currency || 'ETB'} {pkg.pricePerPerson * guests}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                        <p className="text-sm text-gray-500">Select a room below to book</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <span className="text-2xl font-bold text-primary">
                          {`${festival?.pricing?.currency || festival?.currency || 'ETB'} ${selectedRoom?.pricePerNight || hotel.rooms?.[0]?.pricePerNight || 0}`}
                        </span>
                        <span className="text-gray-500 text-sm"> /night</span>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {selectedRoom?.remaining ?? selectedRoom?.availability ?? hotel.rooms?.[0]?.remaining ?? hotel.rooms?.[0]?.availability ?? 0} rooms left
                      </div>
                    </div>

                    <div className="space-y-3">
                      {renderValidationNotice()}
                      <Button
                        className={`w-full py-4 shadow-lg shadow-primary/25 ${validationErrors.length > 0 ? 'mt-4' : ''}`}
                        onClick={() => handleContinue('transport')}
                        disabled={!selectedRoom}
                      >
                        {selectedRoom ? 'Continue to Transport' : 'Select a Room'}
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          className="w-full py-3"
                          onClick={() => handleContinue('checkout')}
                          disabled={!selectedRoom}
                          variant="outline"
                        >
                          To Checkout
                        </Button>
                        <button
                          onClick={() => {
                            setSelectedHotel(null);
                            setSelectedRoom(null);
                            router.push(`/event/${eventId}/transport`);
                          }}
                          className="w-full py-3 text-center text-gray-400 text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors border border-gray-100 rounded-xl"
                        >
                          Skip Hotel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveImageIndex(Math.max(0, activeImageIndex - 1))}
            className="absolute left-6 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={() => setActiveImageIndex(Math.min(gallery.length - 1, activeImageIndex + 1))}
            className="absolute right-6 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <img
            src={gallery[activeImageIndex]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm">
            {activeImageIndex + 1} / {gallery.length}
          </div>
        </div>
      )}

      {/* Enquiry Modal */}
      {showEnquiryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Enquiry</h2>
              <button onClick={() => setShowEnquiryModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={enquiryMessage}
              onChange={(e) => setEnquiryMessage(e.target.value)}
              placeholder="Write your enquiry here..."
              className="w-full p-4 border border-gray-200 rounded-xl text-sm mb-4 h-40 resize-none"
            />
            <Button className="w-full py-3 flex items-center justify-center gap-2" onClick={handleEnquiry}>
              Send Enquiry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
