"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Check, Hotel, Car, Star, Info, ChevronRight, 
  ShoppingCart, Plus, Bed, Bus, Plane, Building, Sparkles
} from 'lucide-react';
import { TicketCard } from '@/components/booking/TicketCard';
import { PriceSummary } from '@/components/booking/PriceSummary';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/lib/apiClient';
import { Festival } from '@/types';
import { Button } from '@/components/UI';

const EARLY_BIRD_WINDOW_HOURS = Number(process.env.NEXT_PUBLIC_EARLY_BIRD_WINDOW_HOURS || 5);

export default function TicketsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  
  const { 
    setEvent, 
    ticketSelection, 
    setTicketSelection,
    selectedHotel,
    selectedTransport,
  } = useBooking();
  
  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const festRes = await apiClient.get(`/api/festivals/${eventId}`);
        const festivalData = festRes?.festival || festRes;
        
        if (festivalData) {
          setFestival(festivalData);
          setEvent(festivalData);
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId]);

  const postedAtRaw = festival?.reviewedAt || festival?.updatedAt;
  const postedAt = postedAtRaw ? new Date(postedAtRaw) : null;
  const hasValidPostedAt = !!postedAt && !Number.isNaN(postedAt.getTime());
  const earlyBirdDays = festival?.pricing?.earlyBirdDays || 0;
  const earlyBirdExpiresAt = hasValidPostedAt && earlyBirdDays > 0
    ? new Date(postedAt!.getTime() + earlyBirdDays * 24 * 60 * 60 * 1000)
    : null;
  const now = new Date();
  const isEarlyBirdAvailable = !!earlyBirdExpiresAt && now <= earlyBirdExpiresAt;

  // Get pricing values
  const basePrice = festival?.pricing?.basePrice || festival?.baseTicketPrice || 0;
  const vipPriceBase = festival?.pricing?.vipPrice || festival?.vipTicketPrice || basePrice * 2;
  
  // Calculate early bird price (percentage stored in backend as 0-100)
  const earlyBirdPercent = (festival?.pricing?.earlyBird || 0);
  
  const standardPrice = isEarlyBirdAvailable && earlyBirdPercent > 0 
    ? basePrice * (1 - earlyBirdPercent / 100) 
    : basePrice;
    
  const vipPrice = isEarlyBirdAvailable && earlyBirdPercent > 0 
    ? vipPriceBase * (1 - earlyBirdPercent / 100) 
    : vipPriceBase;

  const standardDiscount = isEarlyBirdAvailable && earlyBirdPercent > 0 ? earlyBirdPercent : 0;
  const vipDiscount = isEarlyBirdAvailable && earlyBirdPercent > 0 ? earlyBirdPercent : 0;

  // Calculate VIP value (what it would cost separately) - estimate based on first hotel room price
  const firstRoomPrice = festival?.hotels?.[0]?.rooms?.[0]?.pricePerNight || 200;
  const separateHotelCost = firstRoomPrice * 3; // 3 nights estimate
  const separateTransportCost = festival?.transportation?.[0]?.price || 150;
  const vipValue = separateHotelCost + separateTransportCost + basePrice;
  const vipSavingsPercent = vipPrice < vipValue ? Math.round(((vipValue - vipPrice) / vipValue) * 100) : 0;

   const handleSelect = (type: 'vip' | 'standard') => {
    const price = type === 'vip' ? vipPrice : standardPrice;
    setTicketSelection({ type, price, quantity: 1 });
  };

  const handleCheckoutDirectly = () => {
    router.push(`/event/${eventId}/checkout`);
  };

  const handleViewHotels = () => {
    if (ticketSelection?.type === 'vip') {
      router.push(`/event/${eventId}/package`);
    } else {
      router.push(`/event/${eventId}/hotels`);
    }
  };

  const handleViewTransport = () => {
    if (ticketSelection?.type === 'vip') {
      router.push(`/event/${eventId}/package`);
    } else {
      router.push(`/event/${eventId}/transport`);
    }
  };

  const TICKET_TYPES = useMemo(() => [
    {
      type: 'vip' as const,
      label: 'VIP All-Inclusive',
      price: vipPrice,
      originalPrice: vipPriceBase,
      discountPercent: vipDiscount,
      benefits: festival?.vipPerks || ['Included Hotel Stay', 'VIP Transport', 'Exclusive Access', 'Fast Track Entry'],
      description: 'The ultimate all-inclusive experience with premium accommodation and dedicated transport.',
    },
    {
      type: 'standard' as const,
      label: 'General Admission',
      price: standardPrice,
      originalPrice: basePrice,
      discountPercent: standardDiscount,
      benefits: ['Full Event Access', 'Food Court Entry', 'Event Map', 'Public Transport'],
      description: 'Full access to all main performances and festival grounds.',
    },
  ], [festival, vipPrice, standardPrice, basePrice, standardDiscount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <div className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Loading...</div>
        </div>
      </div>
    );
  }

  const selectedTicketInfo = TICKET_TYPES.find(t => t.type === ticketSelection?.type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Dynamic Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-gray-100/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push(`/event/${eventId}`)}
            className="flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Event Details</span>
          </button>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-4 text-xs font-black uppercase tracking-widest text-gray-400">
                <span className="text-primary border-b-2 border-primary pb-1">1. Tickets</span>
                <span className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => router.push(`/event/${eventId}/hotels`)}>2. Options</span>
                <span className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => router.push(`/event/${eventId}/checkout`)}>3. Payment</span>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: Ticket Selection */}
          <div className="lg:col-span-7 space-y-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Choose Your Experience</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-primary leading-tight">
                Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 italic">Pass</span>
              </h1>
              <p className="text-gray-500 font-medium">Choose how you want to experience the festival.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {TICKET_TYPES.map((ticket) => {
                const availability = festival?.ticketTypes?.find(t => 
                  (t.name_en || t.name || '').toLowerCase().includes(ticket.type)
                )?.available ?? 10; // Default to 10 if not found
                
                const isSoldOut = availability <= 0;

                return (
                  <div key={ticket.type} onClick={() => !isSoldOut && handleSelect(ticket.type)}>
                    <TicketCard
                      type={ticket.type}
                      label={ticket.label}
                      price={ticket.price}
                      originalPrice={ticket.originalPrice}
                      discountPercent={ticket.discountPercent}
                      benefits={ticket.benefits}
                      isSelected={ticketSelection?.type === ticket.type}
                      onSelect={() => handleSelect(ticket.type)}
                      disabled={isSoldOut}
                      disabledReason={isSoldOut ? "This ticket category is currently sold out" : undefined}
                    />
                  </div>
                );
              })}
            </div>

            {/* Navigation hint */}
            <div className="text-center text-gray-400 text-xs font-medium uppercase tracking-widest mt-2">
              Select a ticket to view details & continue
            </div>
          </div>

          {/* RIGHT: Detail Panel & Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-6">
              
              {/* Detail Panel - Modern Card */}
              <div className={`bg-white rounded-3xl border transition-all duration-500 overflow-hidden shadow-2xl ${
                ticketSelection 
                  ? ticketSelection.type === 'vip' 
                    ? 'border-amber-200/50 opacity-100 translate-y-0' 
                    : 'border-blue-200/50 opacity-100 translate-y-0'
                  : 'border-gray-100 opacity-60 translate-y-4'
              }`}>
                {ticketSelection ? (
                  <div className="p-8 space-y-8">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-3xl shadow-lg shadow-current/10 ${
                        ticketSelection.type === 'vip' 
                          ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' 
                          : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                      }`}>
                        {ticketSelection.type === 'vip' ? <Star className="w-8 h-8 fill-white" /> : <Info className="w-8 h-8" />}
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif font-black text-primary">{selectedTicketInfo?.label}</h3>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
                          {ticketSelection.type === 'vip' ? 'ALL-INCLUSIVE' : 'GENERAL ADMISSION'}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-600 leading-relaxed font-light text-base italic bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      "{selectedTicketInfo?.description}"
                    </p>

                    {/* What's Included */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">What's Included</p>
                      <div className="grid grid-cols-1 gap-3">
                        {selectedTicketInfo?.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-current/20 transition-all">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              ticketSelection.type === 'vip' 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-blue-600 text-white'
                            }`}>
                              <Check className="w-3.5 h-3.5 text-white stroke-[4]" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Navigation Actions */}
                    {ticketSelection.type === 'standard' && (
                      <div className="space-y-4 pt-6 border-t border-gray-100">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Enhance Your Experience</p>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <button
                            onClick={handleViewHotels}
                            disabled={!festival?.hotels?.some(h => h.rooms?.some(r => r.available > 0))}
                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 transition-all group ${
                              !festival?.hotels?.some(h => h.rooms?.some(r => r.available > 0))
                              ? 'opacity-50 cursor-not-allowed grayscale'
                              : 'hover:border-blue-300 hover:bg-blue-50/50'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                              <Bed className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <h5 className="text-sm font-bold text-gray-800">
                                {!festival?.hotels?.some(h => h.rooms?.some(r => r.available > 0)) ? 'Hotels Sold Out' : 'Add Accommodation'}
                              </h5>
                              <p className="text-[11px] text-gray-500">Book a hotel near the venue</p>
                            </div>
                            <Plus className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                          </button>

                          <button
                            onClick={handleViewTransport}
                            disabled={!festival?.transportation?.some(t => t.available > 0)}
                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 transition-all group ${
                              !festival?.transportation?.some(t => t.available > 0)
                              ? 'opacity-50 cursor-not-allowed grayscale'
                              : 'hover:border-blue-300 hover:bg-blue-50/50'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                              <Bus className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <h5 className="text-sm font-bold text-gray-800">
                                {!festival?.transportation?.some(t => t.available > 0) ? 'Transport Sold Out' : 'Add Transport'}
                              </h5>
                              <p className="text-[11px] text-gray-500">Get rides to and from event</p>
                            </div>
                            <Plus className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>

                        {earlyBirdPercent > 0 && (
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 rounded-2xl border border-blue-200 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-blue-900">Limited Time Offer</p>
                              <p className="text-xs text-blue-700">{earlyBirdPercent}% off ends soon!</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Navigation Actions */}
                    <div className="space-y-4 pt-8">
                      {ticketSelection.type === 'vip' ? (
                        <Button 
                          size="lg" 
                          className="w-full py-6 rounded-2xl shadow-xl shadow-amber-500/20 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold group"
                          onClick={handleViewHotels}
                          rightIcon={ChevronRight}
                        >
                          View Your VIP Package
                        </Button>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          <Button 
                            variant="secondary"
                            size="lg" 
                            className="w-full py-6 rounded-2xl shadow-xl shadow-gray-200/50 bg-white border-2 border-gray-100 hover:border-blue-200 text-primary font-bold"
                            onClick={handleCheckoutDirectly}
                            rightIcon={ShoppingCart}
                          >
                            Proceed to Checkout
                          </Button>
                          <button 
                            onClick={handleViewHotels}
                            className="flex items-center justify-center gap-2 text-blue-600 font-bold uppercase tracking-wider text-[10px] hover:text-blue-800 py-3 hover:bg-blue-50 rounded-2xl transition-all"
                          >
                            <Plus className="w-4 h-4" /> Browse Hotels & Transport
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center mx-auto border border-gray-100">
                       <Info className="w-10 h-10 text-gray-200" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-bold text-gray-300">No Ticket Selected</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Select a pass to see details</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Summary Integration */}
              {ticketSelection && (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  <PriceSummary eventId={eventId} />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
