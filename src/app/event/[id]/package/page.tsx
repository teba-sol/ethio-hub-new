"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, Star, Hotel, Car, Bus, Plane, 
  Utensils, Coffee, Check, Bath, Bed, Users, 
  ExternalLink, ShieldCheck, Clock, Calendar, 
  MapPinned, Phone, Mail, Gift, UtensilsCrossed,
  Home, Ticket, Wrench, Accessibility, File,
  Sparkles, Camera, Shield, Share2, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/lib/apiClient';
import { Festival } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

export default function PackagePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const { language } = useLanguage();
  
  const { ticketSelection } = useBooking();
  
  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);

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
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  const getLocalizedText = (obj: any, field: string, lang: string) => {
    if (!obj) return '';
    return obj[`${field}_${lang}`] || obj[field] || '';
  };

  const currency = festival?.pricing?.currency || 'USD';
  const allHotels = festival?.hotels || [];
  const allTransport = festival?.transportation || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a1411]">
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full"
          />
          <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">Loading Experience</p>
        </div>
      </div>
    );
  }

  if (!festival) return null;

  const sectionVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="text-gray-900 dark:text-white min-h-screen font-sans selection:bg-secondary selection:text-primary transition-colors duration-500">
      
      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={festival.coverImage} 
            alt={festival.name_en} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent dark:from-black/80 dark:via-black/40 dark:to-[#0a0a0b]" />
        </div>

        {/* Action Buttons */}
        <div className="absolute top-24 inset-x-0 z-20 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <motion.button 
              whileHover={{ x: -5 }}
              onClick={handleBack}
              className="w-12 h-12 flex items-center justify-center bg-gray-100/50 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-full text-gray-900 dark:text-white hover:bg-white hover:text-primary transition-all group shadow-2xl"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </motion.button>
            
            <div className="flex items-center gap-3">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-12 h-12 flex items-center justify-center backdrop-blur-xl border rounded-full transition-all shadow-2xl ${
                  isWishlisted 
                    ? 'bg-red-500/20 border-red-500/50 text-red-500' 
                    : 'bg-gray-100/50 dark:bg-white/10 border-gray-200 dark:border-white/20 text-gray-900 dark:text-white hover:bg-white hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 flex items-center justify-center bg-gray-100/50 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-full text-gray-900 dark:text-white hover:bg-white hover:text-blue-500 transition-all shadow-2xl"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-end pb-12 px-6 z-10">
          <div className="max-w-7xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 bg-secondary text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                  VIP All-Inclusive
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
                Your <span className="text-secondary">Premium</span> Package
              </h1>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-24 space-y-32">
        
        {/* Package Overview */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="grid grid-cols-1 lg:grid-cols-[1fr_0.4fr] gap-12"
        >
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px w-12 bg-secondary" />
                <span className="text-xs font-bold uppercase tracking-[0.4em] text-secondary">The Experience</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold dark:text-white">Everything Covered</h2>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                As a VIP guest, your journey is curated for absolute comfort. All accommodations, transfers, and exclusive event access are included in your selection.
              </p>
            </div>

            {/* Quick Benefits Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Priority Entry', icon: Sparkles },
                { label: 'VIP Lounge', icon: Coffee },
                { label: 'Hotel Stay', icon: Hotel },
                { label: 'Private Transit', icon: Car },
              ].map((benefit, i) => (
                <div key={i} className="p-6 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl group hover:border-secondary/50 transition-all">
                  <benefit.icon className="w-6 h-6 text-secondary mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest leading-tight">{benefit.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Summary Card */}
          <div className="bg-secondary p-8 rounded-[40px] text-primary space-y-8 shadow-2xl shadow-secondary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Selected Ticket</p>
                <p className="text-xl font-bold">{ticketSelection?.name || 'VIP Package'}</p>
              </div>
            </div>
            
            <div className="space-y-2 border-t border-primary/10 pt-6">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Value</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-serif font-bold">{currency} {ticketSelection?.price?.toLocaleString() || '0'}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
            >
              Secure Checkout
            </button>
          </div>
        </motion.section>

        {/* Accommodation Section */}
        {allHotels.length > 0 && (
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={sectionVariants}
            className="space-y-12"
          >
            <div className="flex items-end justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-[0.5em] text-secondary">The Sanctuary</span>
                <h2 className="text-4xl md:text-6xl font-serif font-bold dark:text-white">Your Stay</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
              {allHotels.map((hotel: any, idx: number) => (
                <div key={idx} className="group bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[48px] overflow-hidden flex flex-col lg:flex-row gap-12 p-8">
                  <div className="lg:w-[45%] h-[400px] lg:h-auto rounded-[32px] overflow-hidden relative">
                    <img 
                      src={hotel.image || hotel.coverImage} 
                      alt={hotel.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    />
                    {hotel.latitude && hotel.longitude && (
                      <a 
                        href={getGoogleMapsUrl(hotel.latitude, hotel.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl text-primary hover:bg-secondary transition-all shadow-xl"
                      >
                        <MapPin className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-8 py-4">
                    <div className="space-y-4">
                      <div className="flex gap-1">
                        {[...Array(hotel.starRating || 5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-secondary fill-current" />
                        ))}
                      </div>
                      <h3 className="text-4xl font-serif font-bold dark:text-white">
                        {getLocalizedText(hotel, 'name', language)}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-light">
                        {getLocalizedText(hotel, 'description', language) || getLocalizedText(hotel, 'fullDescription', language)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-200 dark:border-white/10">
                      <div>
                        <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-4">Inclusions</h4>
                        <div className="flex flex-wrap gap-2">
                          {(hotel.facilities || []).slice(0, 4).map((f: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-xl text-xs font-medium">{f}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-4">Dining</h4>
                        <div className="flex flex-wrap gap-2">
                          {(hotel.foodAndDrink || []).slice(0, 4).map((f: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl text-xs font-medium">{f}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Room Details */}
                    {hotel.rooms && hotel.rooms.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest">Selected Rooms</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {hotel.rooms.map((room: any, ri: number) => (
                            <div key={ri} className="p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                                  <Bed className="w-5 h-5 text-secondary" />
                                </div>
                                <span className="text-sm font-medium">{getLocalizedText(room, 'name', language)}</span>
                              </div>
                              <Check className="w-4 h-4 text-emerald-500" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Transport Section */}
        {allTransport.length > 0 && (
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={sectionVariants}
            className="space-y-12"
          >
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-[0.5em] text-secondary">The Transit</span>
              <h2 className="text-4xl md:text-6xl font-serif font-bold dark:text-white">Seamless Transfers</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {allTransport.map((transport: any, index: number) => (
                <div key={index} className="group bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[40px] p-8 overflow-hidden hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center">
                      {transport.type_en?.toLowerCase().includes('bus') ? (
                        <Bus className="w-8 h-8 text-secondary" />
                      ) : (
                        <Car className="w-8 h-8 text-secondary" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-2xl font-serif font-bold dark:text-white">
                        {getLocalizedText(transport, 'type', language)}
                      </h4>
                      <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-widest mt-1">
                        <Check className="w-3.5 h-3.5" /> Fully Included
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed mb-8">
                    {getLocalizedText(transport, 'description', language)}
                  </p>

                  <div className="space-y-4 pt-8 border-t border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <MapPinned className="w-4 h-4 text-secondary" />
                      <span>{transport.pickupLocations || 'Designated Pickup Points'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(transport.features || []).map((f: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Policies */}
        {(festival?.policies?.cancellation_en || festival?.policies?.terms_en) && (
          <motion.section 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={sectionVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 dark:border-white/10 pt-12"
          >
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-bold uppercase tracking-widest text-xs text-secondary">
                <Gift className="w-4 h-4" /> Cancellation Policy
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {getLocalizedText(festival.policies, 'cancellation', language)}
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-bold uppercase tracking-widest text-xs text-secondary">
                <File className="w-4 h-4" /> Terms & Conditions
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {getLocalizedText(festival.policies, 'terms', language)}
              </p>
            </div>
          </motion.section>
        )}

        {/* Final CTA */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="text-center pt-12"
        >
          <button 
            onClick={handleCheckout}
            className="px-20 py-6 bg-secondary text-primary font-black uppercase tracking-widest text-lg rounded-3xl shadow-2xl shadow-secondary/20 hover:scale-[1.05] transition-transform"
          >
            Continue to Secure Payment
          </button>
          <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Instant Confirmation • SSL Secured Payment
          </p>
        </motion.div>
      </div>
    </div>
  );
}