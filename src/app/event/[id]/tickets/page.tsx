"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Check, Hotel, Car, Star, Info, ChevronRight, 
  ShoppingCart, Plus, Bed, Bus, Plane, Building, Sparkles,
  RefreshCcw, ShieldCheck, Ticket, CreditCard, Clock, Shield
} from 'lucide-react';
import { TicketCard } from '@/components/booking/TicketCard';
import { PriceSummary } from '@/components/booking/PriceSummary';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/lib/apiClient';
import { Festival } from '@/types';
import { Button } from '@/components/UI';
import { motion, AnimatePresence } from 'motion/react';

const EARLY_BIRD_WINDOW_HOURS = Number(process.env.NEXT_PUBLIC_EARLY_BIRD_WINDOW_HOURS || 5);

export default function TicketsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const initialType = searchParams?.get('type');
  
  const { 
    setEvent, 
    ticketSelection, 
    setTicketSelection,
    selectedHotel,
    selectedTransport,
  } = useBooking();
  
  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGrid, setShowGrid] = useState(!ticketSelection && !initialType);

  // Early Bird Logic
  const pricing = festival?.pricing;
  const earlyBirdDeadline = pricing?.earlyBirdDeadline ? new Date(pricing.earlyBirdDeadline) : null;
  const postedAtRaw = festival?.reviewedAt || festival?.updatedAt || festival?.createdAt;
  const postedAt = postedAtRaw ? new Date(postedAtRaw) : null;
  const earlyBirdDays = pricing?.earlyBirdDays || 0;
  
  const earlyBirdExpiresAt = earlyBirdDeadline || (postedAt && earlyBirdDays > 0
    ? new Date(postedAt.getTime() + earlyBirdDays * 24 * 60 * 60 * 1000)
    : null);
    
  const isEarlyBirdAvailable = !!earlyBirdExpiresAt && new Date() <= earlyBirdExpiresAt;
  const earlyBirdPercent = pricing?.earlyBird || 0;

  // Pricing values
  const basePrice = pricing?.basePrice || festival?.baseTicketPrice || 0;
  const vipPriceBase = pricing?.vipPrice || festival?.vipTicketPrice || basePrice * 2;
  
  const standardPrice = isEarlyBirdAvailable && earlyBirdPercent > 0 
    ? basePrice * (1 - earlyBirdPercent / 100) 
    : basePrice;
    
  const vipPrice = isEarlyBirdAvailable && earlyBirdPercent > 0 
    ? vipPriceBase * (1 - earlyBirdPercent / 100) 
    : vipPriceBase;

  const standardDiscount = isEarlyBirdAvailable && earlyBirdPercent > 0 ? earlyBirdPercent : 0;
  const vipDiscount = isEarlyBirdAvailable && earlyBirdPercent > 0 ? earlyBirdPercent : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const festRes = await apiClient.get(`/api/festivals/${eventId}`);
        const festivalData = festRes?.festival || festRes;
        
        if (festivalData) {
          setFestival(festivalData);
          setEvent(festivalData);

          // Handle initial type selection from query param
          if (initialType && !ticketSelection) {
            // Recalculate availability for initial selection
            const p = festivalData.pricing;
            const dead = p?.earlyBirdDeadline ? new Date(p.earlyBirdDeadline) : null;
            const post = (festivalData.reviewedAt || festivalData.updatedAt || festivalData.createdAt) ? new Date(festivalData.reviewedAt || festivalData.updatedAt || festivalData.createdAt) : null;
            const days = p?.earlyBirdDays || 0;
            const expires = dead || (post && days > 0 ? new Date(post.getTime() + days * 24 * 60 * 60 * 1000) : null);
            const isAvail = !!expires && new Date() <= expires;
            const discount = p?.earlyBird || 0;

            const type = initialType.toLowerCase() === 'vip' ? 'vip' : 'standard';
            const bPrice = p?.basePrice || festivalData.baseTicketPrice || 0;
            const vPriceBase = p?.vipPrice || festivalData.vipTicketPrice || bPrice * 2;

            const finalPrice = type === 'vip' ? 
              (isAvail ? vPriceBase * (1 - discount / 100) : vPriceBase) : 
              (isAvail ? bPrice * (1 - discount / 100) : bPrice);
            
            const originalPrice = type === 'vip' ? vPriceBase : bPrice;
            
            setTicketSelection({ 
              type, 
              name: type === 'vip' ? 'VIP All-Inclusive' : 'General Admission',
              price: finalPrice, 
              originalPrice, 
              quantity: 1 
            });
            setShowGrid(false);
          }
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId, initialType]);

  const handleSelect = (type: 'vip' | 'standard') => {
    const price = type === 'vip' ? vipPrice : standardPrice;
    const originalPrice = type === 'vip' ? vipPriceBase : basePrice;
    setTicketSelection({ 
      type, 
      name: type === 'vip' ? 'VIP All-Inclusive' : 'General Admission',
      price, 
      originalPrice, 
      quantity: 1 
    });
    setShowGrid(false);
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
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full"
          />
          <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">Designing Experience</p>
        </div>
      </div>
    );
  }

  const selectedTicketInfo = TICKET_TYPES.find(t => t.type === ticketSelection?.type);

  return (
    <div className="min-h-screen transition-colors duration-500">
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#0a1411]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push(`/event/${eventId}`)}
            className="flex items-center gap-2 text-gray-500 hover:text-secondary font-bold transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Event Details</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-secondary" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {showGrid ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4 max-w-2xl mx-auto mb-10">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary">Passage Selection</span>
                <h1 className="text-4xl md:text-6xl font-serif font-black text-gray-900 dark:text-white leading-tight">
                  Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary italic">Tier</span>
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {TICKET_TYPES.map((ticket) => {
                  const availability = festival?.ticketTypes?.find(t => 
                    (t.name_en || t.name || '').toLowerCase().includes(ticket.type)
                  )?.available ?? 10;
                  const isSoldOut = availability <= 0;

                  return (
                    <TicketCard
                      key={ticket.type}
                      type={ticket.type}
                      label={ticket.label}
                      price={ticket.price}
                      originalPrice={ticket.originalPrice}
                      discountPercent={ticket.discountPercent}
                      benefits={ticket.benefits}
                      isSelected={ticketSelection?.type === ticket.type}
                      onSelect={() => handleSelect(ticket.type)}
                      disabled={isSoldOut}
                      disabledReason={isSoldOut ? "This category is currently sold out" : undefined}
                    />
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_0.4fr] gap-12 items-start"
            >
              {/* Left: Enhanced Detail View */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setShowGrid(true)}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-secondary hover:opacity-70 transition-opacity"
                  >
                    <RefreshCcw className="w-4 h-4" /> Change Selection
                  </button>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    <ShieldCheck className="w-4 h-4" /> Instant Confirmation
                  </div>
                </div>

                <div className={`p-10 md:p-16 rounded-[60px] border-2 transition-all shadow-2xl relative overflow-hidden ${
                  ticketSelection?.type === 'vip' 
                    ? 'bg-white border-amber-200/50 dark:bg-white/5' 
                    : 'bg-white border-secondary/20 dark:bg-white/5'
                }`}>
                  <div className="relative z-10 space-y-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="space-y-4">
                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-xl ${
                          ticketSelection?.type === 'vip' ? 'bg-secondary text-primary' : 'bg-primary text-white'
                        }`}>
                          {ticketSelection?.type === 'vip' ? <Star className="w-8 h-8 fill-current" /> : <Info className="w-8 h-8" />}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-serif font-black text-gray-900 dark:text-white leading-tight">
                          {selectedTicketInfo?.label}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg italic">
                          "{selectedTicketInfo?.description}"
                        </p>
                      </div>
                      <div className="text-left md:text-right space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Current Rate</p>
                        <div className="flex items-baseline gap-2 md:justify-end">
                          <span className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter">
                            {ticketSelection?.price.toLocaleString()}
                          </span>
                          <span className="text-xl font-bold text-gray-400">ETB</span>
                        </div>
                        {ticketSelection?.originalPrice && ticketSelection.originalPrice > ticketSelection.price && (
                          <p className="text-sm font-bold text-red-500 line-through opacity-70">
                            WAS ETB {ticketSelection.originalPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-gray-100 dark:border-white/10">
                      <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">What's Included</h4>
                        <div className="space-y-3">
                          {selectedTicketInfo?.benefits.map((benefit, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 group hover:border-secondary transition-all">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                ticketSelection?.type === 'vip' ? 'bg-secondary text-primary' : 'bg-primary text-white'
                              }`}>
                                <Check className="w-3.5 h-3.5 stroke-[4]" />
                              </div>
                              <span className="text-sm font-bold text-gray-700 dark:text-white/90">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        {ticketSelection?.type === 'vip' ? (
                          <>
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">VIP Package Details</h4>
                            <div className="space-y-4">
                              {festival?.hotels?.[0] && (
                                <Link href={`/event/${festival._id}/hotels`} className="block group">
                                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-[32px] border border-gray-100 dark:border-white/10 space-y-4 hover:border-secondary transition-all">
                                    <div className="h-32 w-full rounded-[24px] overflow-hidden">
                                      <img src={festival.hotels[0].image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Hotel" />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-secondary">
                                        <Hotel className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Included Stay</span>
                                      </div>
                                      <p className="font-bold text-gray-900 dark:text-white">{festival.hotels[0].name}</p>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{festival.hotels[0].rooms?.[0]?.name || 'Premium Suite'}</span>
                                        <span className="text-[10px] font-black uppercase text-secondary">View Details</span>
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              )}
                              {festival?.transportation?.[0] && (
                                <Link href={`/event/${festival._id}/transport`} className="block group">
                                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-[32px] border border-gray-100 dark:border-white/10 space-y-4 hover:border-secondary transition-all">
                                    <div className="h-32 w-full rounded-[24px] overflow-hidden">
                                      <img src={festival.transportation[0].image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Transport" />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-secondary">
                                        <Car className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">VIP Transport</span>
                                      </div>
                                      <p className="font-bold text-gray-900 dark:text-white">{festival.transportation[0].type}</p>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Dedicated Professional Driver</span>
                                        <span className="text-[10px] font-black uppercase text-secondary">View Details</span>
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">Enhance Experience</h4>
                            <div className="grid grid-cols-1 gap-4">
                              <button
                                onClick={handleViewHotels}
                                className="flex items-center gap-4 p-5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-secondary hover:bg-secondary/5 transition-all group"
                              >
                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-secondary group-hover:text-primary transition-all">
                                  <Bed className="w-6 h-6" />
                                </div>
                                <div className="flex-1 text-left">
                                  <h5 className="text-sm font-black text-gray-800 dark:text-white">Accommodation</h5>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                                    Add Luxury Lodging
                                  </p>
                                </div>
                                <Plus className="w-5 h-5 text-secondary group-hover:scale-125 transition-transform" />
                              </button>

                              <button
                                onClick={handleViewTransport}
                                className="flex items-center gap-4 p-5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-secondary hover:bg-secondary/5 transition-all group"
                              >
                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-secondary group-hover:text-primary transition-all">
                                  <Bus className="w-6 h-6" />
                                </div>
                                <div className="flex-1 text-left">
                                  <h5 className="text-sm font-black text-gray-800 dark:text-white">Transportation</h5>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                                    Add Secure Transport
                                  </p>
                                </div>
                                <Plus className="w-5 h-5 text-secondary group-hover:scale-125 transition-transform" />
                              </button>
                            </div>
                          </>
                        )}

                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-6 h-6 text-emerald-500" />
                          </div>
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 leading-relaxed">
                            <strong>Early Bird Privilege:</strong> You're currently viewing restricted rates. Prices may increase as the event date approaches.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* Right: Summary Column */}
              <div className="sticky top-32 space-y-8">
                <PriceSummary eventId={eventId} />
                
                <div className="space-y-4">
                  <Button 
                    size="lg" 
                    className="w-full py-7 rounded-[32px] shadow-2xl shadow-secondary/20 bg-secondary text-primary font-black uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform"
                    onClick={handleCheckoutDirectly}
                    rightIcon={ShoppingCart}
                  >
                    {ticketSelection?.type === 'vip' ? 'Secure Payment' : 'Proceed to Payment'}
                  </Button>
                  
                  <button 
                    onClick={() => router.push(`/event/${eventId}/hotels`)}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-secondary transition-colors"
                  >
                    Explore Packages & Add-ons
                  </button>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-[32px] border border-gray-100 dark:border-white/5 space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Secure Booking</h5>
                  <div className="space-y-3">
                    {[
                      { icon: ShieldCheck, text: 'SSL Secured Transaction' },
                      { icon: CreditCard, text: 'Local & Global Payment Support' },
                      { icon: Clock, text: '24/7 Concierge Support' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-gray-400">
                        <item.icon className="w-4 h-4 text-emerald-500" />
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
