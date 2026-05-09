"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Calendar, Ticket, Star,
  Clock, Flag, ChevronLeft, ChevronRight, X,
  Heart, Share2, CheckCircle, Award,
  Coffee, Camera, Music, Shield, ShieldCheck, Wifi, ParkingCircle,
  Info, AlertCircle, Sparkles, Utensils, CalendarDays,
  Banknote, Users, Building2, Car, Map as MapIcon,
  ChevronDown, ExternalLink, Globe
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import apiClient from '@/lib/apiClient';
import { Festival, FoodPackage } from '@/types';
import { useBooking } from '@/context/BookingContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { getLocalizedText } from '@/utils/getLocalizedText';
import { ReportModal } from '@/components/ReportModal';

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const { setEvent } = useBooking();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { scrollYProgress } = useScroll();

  const opacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

  const allImages = festival?.gallery && festival.gallery.length > 0
    ? [festival.coverImage, ...festival.gallery]
    : festival ? [festival.coverImage] : [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get(`/api/festivals/${eventId}`);
        const festivalData = res?.festival || res;

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
  }, [eventId, setEvent]);

  // Early Bird Pricing logic
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

  useEffect(() => {
    if (festival) {
      setIsWishlisted(isInWishlist(festival._id || festival.id));
    }
  }, [festival, isInWishlist]);

  const handleWishlistToggle = () => {
    if (!user) {
      router.push('/auth?mode=login');
      return;
    }
    if (isWishlisted) {
      removeFromWishlist(festival?._id || festival?.id || '');
    } else {
      addToWishlist({ ...festival, type: 'event' } as any);
    }
    setIsWishlisted(!isWishlisted);
  };

  const getActiveImage = () => {
    return allImages[activeImageIndex] || festival?.coverImage || '';
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a1411]">
        <div className="flex flex-col items-center gap-8">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative w-20 h-20"
          >
            <div className="absolute inset-0 border-4 border-secondary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-secondary border-t-transparent rounded-full"></div>
            <div className="absolute inset-4 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-4 border-4 border-primary border-b-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-400 font-serif italic text-xl tracking-widest"
          >
            {language === 'am' ? 'ባህላዊ ጉዞዎን በማዘጋጀት ላይ...' : 'Preparing your cultural journey...'}
          </motion.p>
        </div>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a1411]">
        <div className="text-center max-w-md px-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 mx-auto mb-8 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20"
          >
            <AlertCircle className="w-12 h-12 text-red-500" />
          </motion.div>
          <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4 transition-colors">
            {language === 'am' ? 'ዝግጅት አልተገኘም' : 'The Path is Hidden'}
          </h2>
          <p className="text-gray-400 mb-10 leading-relaxed font-light">
            {language === 'am' ? 'የፈለጉት ዝግጅት አልተገኘም። እባክዎ እንደገና ይሞክሩ።' : "We couldn't find the cultural event you're looking for. It might have moved or is no longer available."}
          </p>
          <Link href="/festivals">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'am' ? 'ዝግጅቶችን ይመልከቱ' : 'Explore All Festivals'}
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  const basePrice = festival.pricing?.basePrice || festival.baseTicketPrice || 0;
  const eventPrice = isEarlyBirdAvailable && earlyBirdPercent > 0 
    ? Math.round(basePrice * (1 - earlyBirdPercent / 100)) 
    : basePrice;
  const eventCurrency = festival.pricing?.currency || festival.currency || 'ETB';

  const sectionVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="bg-white text-gray-900 dark:bg-[#0a1411] dark:text-white min-h-screen font-sans selection:bg-secondary selection:text-primary transition-colors duration-500">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Action Buttons (Inside Hero Area) */}
        <div className="absolute top-24 inset-x-0 z-20 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <motion.button
              whileHover={{ x: -5 }}
              onClick={() => router.back()}
              className="w-12 h-12 flex items-center justify-center bg-gray-100/50 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-full text-gray-900 dark:text-white hover:bg-white hover:text-primary transition-all group shadow-2xl"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </motion.button>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWishlistToggle}
                className={`w-12 h-12 flex items-center justify-center backdrop-blur-xl border rounded-full transition-all shadow-2xl ${isWishlisted
                  ? 'bg-red-500/20 border-red-500/50 text-red-500'
                  : 'bg-gray-100/50 dark:bg-white/10 border-gray-200 dark:border-white/20 text-gray-900 dark:text-white hover:bg-white hover:text-red-500'
                  }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="w-12 h-12 flex items-center justify-center bg-gray-100/50 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-full text-gray-900 dark:text-white hover:bg-white hover:text-blue-500 transition-all shadow-2xl"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        <motion.div
          style={{ scale }}
          className="absolute inset-0 z-0"
        >
          <img
            src={getActiveImage()}
            alt={getLocalizedText(festival, 'name', language)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0a0a0b] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        </motion.div>

        <div className="absolute inset-0 flex flex-col justify-end pb-24 px-6">
          <div className="max-w-7xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="space-y-6 max-w-4xl"
            >
              <div className="flex flex-wrap gap-3">
                <span className="bg-secondary text-primary text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-2xl shadow-secondary/20">
                  {festival.type || 'Cultural Experience'}
                </span>
                {festival.isVerified && (
                  <span className="bg-emerald-500/10 dark:bg-emerald-500/20 backdrop-blur-md text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> {language === 'am' ? 'የተረጋገጠ' : 'Verified'}
                  </span>
                )}
              </div>

              <h1 className="text-6xl md:text-8xl font-serif font-bold leading-[1.1] text-gray-900 dark:text-white tracking-tight drop-shadow-2xl transition-colors">
                {getLocalizedText(festival, 'name', language)}
              </h1>

              <div className="flex flex-wrap items-center gap-8 pt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em]">{language === 'am' ? 'ቦታ' : 'Location'}</span>
                  <div className="flex items-center gap-2 text-xl font-light text-gray-700 dark:text-white/90 transition-colors">
                    <MapPin className="w-5 h-5 text-secondary" />
                    <span>{getLocalizedText(festival.location as any, 'name', language) || festival.locationName}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em]">{language === 'am' ? 'ቀን' : 'Date'}</span>
                  <div className="flex items-center gap-2 text-xl font-light text-gray-700 dark:text-white/90 transition-colors">
                    <Calendar className="w-5 h-5 text-secondary" />
                    <span>{new Date(festival.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70 text-gray-900 dark:text-white"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] font-black">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </section>

      {/* Main Content Sections */}
      <div className="relative z-10 px-6 space-y-32 pb-32">

        {/* Story Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          className="max-w-7xl mx-auto pt-24"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.4fr] gap-20 items-start">
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px w-12 bg-secondary" />
                  <span className="text-xs font-bold uppercase tracking-[0.4em] text-secondary">The Cultural Story</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 dark:text-white leading-tight transition-colors">
                  {language === 'am' ? 'ስለ ዝግጅቱ ጥልቅ መረጃ' : 'Experience the Soul of Ethiopia'}
                </h2>
              </div>

              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-2xl font-light text-gray-600 dark:text-gray-300 leading-relaxed italic border-l-4 border-secondary pl-8 py-4 mb-12 bg-gray-100 dark:bg-white/5 rounded-r-3xl transition-colors">
                  "{getLocalizedText(festival, 'shortDescription', language) || "A journey through Ethiopia's living traditions."}"
                </p>
                <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed font-light transition-colors">
                  {getLocalizedText(festival, 'fullDescription', language) || getLocalizedText(festival, 'description', language) || "No detailed description available."}
                </p>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-gray-100 dark:border-white/10 transition-colors">
                {[
                  { label: language === 'am' ? 'ቆይታ' : 'Duration', value: `${festival.schedule?.length || 1} Days`, icon: Clock },
                  { label: language === 'am' ? 'ዓይነት' : 'Experience', value: festival.type || 'Traditional', icon: Sparkles },
                  { label: language === 'am' ? 'ዕድሜ' : 'Age', value: festival.policies?.ageRestriction || 'All Ages', icon: Shield },
                  { label: language === 'am' ? 'ቦታዎች' : 'Capacity', value: festival.totalCapacity || 'Limited', icon: Users },
                ].map((stat, i) => (
                  <div key={i} className="space-y-2 group">
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 group-hover:border-secondary/50 transition-all w-fit">
                      <stat.icon className="w-5 h-5 text-secondary" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white transition-colors">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky top-32 space-y-8">
              {/* Media Preview / Gallery Stack */}
              <div className="relative group cursor-pointer" onClick={() => setLightboxOpen(true)}>
                <div className="aspect-[3/4] rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
                  <img
                    src={allImages[1] || allImages[0]}
                    alt="Gallery preview"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/80">{allImages.length} Photographs</span>
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl -z-10" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
              </div>

              {/* Price Callout */}
              <div className="bg-gray-50 dark:bg-gradient-to-br dark:from-secondary/10 dark:to-primary/10 border border-gray-100 dark:border-secondary/20 rounded-[32px] p-8 backdrop-blur-xl transition-all">
                <p className="text-xs font-bold text-secondary uppercase tracking-[0.3em] mb-4">{language === 'am' ? 'ጀምሮ' : 'Starting From'}</p>
                <div className="flex flex-col gap-1 mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-serif font-bold text-gray-900 dark:text-white transition-colors">{eventPrice}</span>
                    <span className="text-xl font-light text-gray-500 dark:text-white/60 transition-colors">{eventCurrency}</span>
                  </div>
                  {eventPrice < basePrice && (
                    <span className="text-sm font-bold text-red-500 line-through opacity-80">
                      Was {basePrice} {eventCurrency}
                    </span>
                  )}
                </div>
                <Link href={`/event/${festival._id}/tickets`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-secondary text-primary font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-secondary/10"
                  >
                    {language === 'am' ? 'ቦታዎን ያስይዙ' : 'Proceed to Booking'}
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Experience Timeline Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-24 space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.5em] text-secondary">The Journey</span>
            <h2 className="text-5xl md:text-7xl font-serif font-bold text-gray-900 dark:text-white leading-tight transition-colors">
              {language === 'am' ? 'የዝግጅቱ መርሐግብር' : 'Sacred Timeline'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {festival.schedule && festival.schedule.length > 0 ? (
              festival.schedule.map((day, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -10 }}
                  className="group relative bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[40px] p-8 overflow-hidden transition-all hover:bg-gray-100 dark:hover:bg-white/10 hover:border-secondary/30"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <CalendarDays className="w-48 h-48 text-gray-900 dark:text-white" />
                  </div>

                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="h-14 w-14 rounded-2xl bg-secondary flex flex-col items-center justify-center text-primary shadow-xl shadow-secondary/10">
                        <span className="text-[8px] font-black uppercase leading-none mb-0.5">Day</span>
                        <span className="text-2xl font-black leading-none">{day.day}</span>
                      </div>
                      {day.time && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/10 text-[10px] font-bold text-gray-500 dark:text-white/60 transition-colors">
                          <Clock className="w-3 h-3" />
                          {day.time}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white group-hover:text-secondary transition-colors">
                        {getLocalizedText(day, 'title', language)}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-light transition-colors">
                        {getLocalizedText(day, 'activities', language)}
                      </p>
                    </div>

                    {day.performers && day.performers.length > 0 && (
                      <div className="pt-8 border-t border-gray-100 dark:border-white/10 transition-colors">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Featured Voices</div>
                        <div className="flex flex-wrap gap-2">
                          {day.performers.map((p, pi) => (
                            <span key={pi} className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-xs font-medium text-gray-600 dark:text-white/80 transition-colors">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-24 bg-gray-50 dark:bg-white/5 rounded-[40px] border border-dashed border-gray-200 dark:border-white/10 text-center transition-colors">
                <Info className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-6 transition-colors" />
                <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2 transition-colors">Schedule Unveiling Soon</h3>
                <p className="text-gray-500">The detailed mysteries of this journey are being finalized.</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* Accommodation Section */}
        {festival.hotels && festival.hotels.length > 0 && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
            className="max-w-7xl mx-auto"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-[0.5em] text-secondary">Sanctuary</span>
                <h2 className="text-5xl md:text-7xl font-serif font-bold text-gray-900 dark:text-white leading-tight transition-colors">
                  {language === 'am' ? 'መቆያ ስፍራዎች' : 'Where to Rest'}
                </h2>
              </div>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm text-lg font-light leading-relaxed transition-colors">
                Hand-picked accommodations that blend modern comfort with traditional Ethiopian hospitality.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {festival.hotels.map((hotel: any, idx: number) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.01 }}
                  className="group bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[48px] overflow-hidden flex flex-col md:flex-row gap-8 p-8 transition-all"
                >
                  <div className="w-full md:w-[45%] h-[400px] md:h-auto rounded-[32px] overflow-hidden">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-4">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {[...Array(hotel.starRating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-secondary fill-current" />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest transition-colors">Hotel Partner</span>
                      </div>

                      <h3 className="text-3xl font-serif font-bold text-gray-900 dark:text-white leading-tight transition-colors">
                        {getLocalizedText(hotel, 'name', language)}
                      </h3>

                      <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400 transition-colors">
                        <MapPin className="w-4 h-4 text-secondary shrink-0 mt-1" />
                        <span className="text-sm font-light leading-relaxed">{hotel.address || 'Central Location'}</span>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-white/10 transition-colors">
                        <div className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest transition-colors">Included Rooms</div>
                        <div className="space-y-3">
                          {hotel.rooms?.slice(0, 2).map((room: any, ri: number) => (
                            <div key={ri} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700 dark:text-white/80 font-medium transition-colors">{getLocalizedText(room, 'name', language)}</span>
                              <span className="text-secondary font-bold">{eventCurrency} {room.pricePerNight}<span className="text-[10px] text-gray-400 font-light ml-1">/night</span></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Link href={`/event/${festival._id}/hotels`}>
                      <button className="mt-8 w-full py-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-gray-900 dark:text-white">
                        View Availability
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Transportation Section */}
        {festival.transportation && festival.transportation.length > 0 && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
            className="max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[0.4fr_1fr] gap-20 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-[0.5em] text-secondary">Transit</span>
                  <h2 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 dark:text-white leading-tight transition-colors">
                    {language === 'am' ? 'የትራንስፖርት አገልግሎት' : 'Seamless Travels'}
                  </h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-light leading-relaxed transition-colors">
                  Arrive with ease. We offer premium transportation options to ensure your journey is as memorable as the destination.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {festival.transportation.map((t, idx) => (
                  <div key={idx} className="group relative bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[40px] p-8 overflow-hidden hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform">
                      <Car className="w-32 h-32 text-gray-900 dark:text-white" />
                    </div>

                    <div className="relative z-10 space-y-6">
                      <div className="h-12 w-12 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center transition-colors">
                        <Car className="w-6 h-6 text-secondary" />
                      </div>

                      <div>
                        <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2 transition-colors">{getLocalizedText(t, 'type', language)}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-light leading-relaxed line-clamp-2 transition-colors">
                          {getLocalizedText(t, 'description', language)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/10 transition-colors">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest transition-colors">Option Price</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{eventCurrency} {t.price}</p>
                        </div>
                        <Link href={`/event/${festival._id}/transport`}>
                          <button className="p-3 bg-secondary rounded-xl text-primary hover:rotate-12 transition-transform">
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Premium Inclusions (Services & Packages) */}
        {((festival.services?.culturalServices || []).length > 0 || (festival.services?.foodPackages || []).length > 0) && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
            className="max-w-7xl mx-auto"
          >
            <div className="text-center mb-24 space-y-4">
              <span className="text-xs font-bold uppercase tracking-[0.5em] text-secondary">The Full Experience</span>
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-gray-900 dark:text-white leading-tight">
                {language === 'am' ? 'ልዩ አገልግሎቶች' : 'Curated Services'}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Culinary Packages */}
              {festival.services?.foodPackages?.map((pkg: FoodPackage, idx: number) => (
                <div key={idx} className="group bg-gray-50 dark:bg-gradient-to-br dark:from-white/5 dark:to-secondary/5 border border-gray-100 dark:border-white/10 rounded-[48px] p-10 relative overflow-hidden transition-all">
                  <div className="absolute -top-12 -right-12 p-24 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <Utensils className="w-64 h-64 text-gray-900 dark:text-white" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-14 w-14 rounded-2xl bg-secondary/20 border border-secondary/30 flex items-center justify-center">
                        <Utensils className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-serif font-bold text-gray-900 dark:text-white transition-colors">{getLocalizedText(pkg, 'name', language)}</h3>
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Culinary Package</span>
                      </div>
                    </div>

                    <p className="text-gray-500 dark:text-gray-400 text-lg font-light leading-relaxed mb-10 transition-colors">
                      {getLocalizedText(pkg, 'description', language)}
                    </p>

                    <div className="space-y-6 mb-12">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">What's Served</div>
                      <div className="flex flex-wrap gap-3">
                        {pkg.items?.map((item, ii) => (
                          <span key={ii} className="px-4 py-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-medium text-gray-700 dark:text-white/90 transition-colors">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-10 border-t border-gray-100 dark:border-white/10 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Per Guest</span>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{eventCurrency} {pkg.pricePerPerson}</span>
                      </div>
                      <Link href={`/event/${festival._id}/package`}>
                        <button className="px-8 py-4 bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all text-gray-900 dark:text-white">
                          Select Package
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Cultural Services List */}
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[48px] p-10 flex flex-col justify-between transition-all">
                <div className="space-y-10">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.4em]">Inclusions</span>
                    <h3 className="text-4xl font-serif font-bold text-gray-900 dark:text-white transition-colors">Guest Services</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(festival.services?.culturalServices || festival.culturalServices || []).map((s: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-4 p-5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl group hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                        <div className="p-2 bg-secondary/10 rounded-xl group-hover:scale-110 transition-transform">
                          <CheckCircle className="w-4 h-4 text-secondary" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-white/90 transition-colors">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {festival.services?.extras && festival.services.extras.length > 0 && (
                  <div className="mt-12 pt-12 border-t border-gray-100 dark:border-white/10 space-y-6 transition-colors">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Premium Add-ons</div>
                    <div className="flex flex-wrap gap-3">
                      {festival.services.extras.map((ex, ei) => (
                        <div key={ei} className="px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full text-secondary text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Sparkles className="w-3 h-3" />
                          {ex}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* Policies & Rules Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          className="max-w-7xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px w-12 bg-secondary" />
                <span className="text-xs font-bold uppercase tracking-[0.4em] text-secondary">Policies</span>
              </div>
              <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-white leading-tight">
                Rules of the Journey
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                Important information regarding your participation in this cultural experience.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { 
                  title: language === 'am' ? 'የስረዛ ፖሊሲ' : 'Cancellation Policy', 
                  content: getLocalizedText(festival.policies as any, 'cancellation', language) || festival.cancellationPolicy || 'Standard cancellation policies apply.',
                  icon: AlertCircle 
                },
                { 
                  title: language === 'am' ? 'የደህንነት ደንቦች' : 'Safety & Health', 
                  content: getLocalizedText(festival.policies as any, 'safety', language) || festival.safetyRules || 'All guests must follow on-site safety protocols.',
                  icon: Shield 
                },
                { 
                  title: language === 'am' ? 'የዕድሜ ገደብ' : 'Age Guidelines', 
                  content: getLocalizedText(festival.policies as any, 'ageRestriction', language) || festival.ageRestriction || 'Please check specific age requirements for this event.',
                  icon: Users 
                },
                { 
                  title: language === 'am' ? 'የቦታ አጠቃቀም ደንቦች' : 'Booking Terms', 
                  content: getLocalizedText(festival.policies as any, 'terms', language) || festival.bookingTerms || 'By booking, you agree to the event terms and conditions.',
                  icon: Info 
                }
              ].map((policy, pi) => (
                <div key={pi} className="p-8 bg-gray-50 dark:bg-white/5 rounded-[32px] border border-gray-100 dark:border-white/10 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-secondary/10 rounded-xl">
                      <policy.icon className="w-5 h-5 text-secondary" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{policy.title}</h4>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-light">
                    {policy.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Final CTA Section */}
        <motion.section
          id="tickets"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-primary rounded-[56px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/40 border border-white/10">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 mix-blend-overlay">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            </div>
            
            <div className="relative z-10 space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white text-[10px] font-black uppercase tracking-[0.3em]">
                  <Sparkles className="w-4 h-4 text-secondary" />
                  {language === 'am' ? 'ጉዞዎን ይጀምሩ' : 'Begin Your Journey'}
                </div>
                <h2 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
                  {language === 'am' ? 'ለመሳተፍ ተዘጋጅተዋል?' : 'Ready to Experience the Magic?'}
                </h2>
                <p className="text-white/60 text-xl font-light max-w-2xl mx-auto">
                  Step into the vibrant heart of Ethiopian culture. Secure your passage and create memories that will last a lifetime.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href={`/event/${festival._id}/tickets`} className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:px-12 py-5 bg-secondary text-primary font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-secondary/30"
                  >
                    {language === 'am' ? 'አሁኑኑ ይቁረጡ' : 'Book Your Passage Now'}
                  </motion.button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 text-white/40 pt-12 border-t border-white/5">
                {[
                  { icon: Shield, text: language === 'am' ? 'አስተማማኝ ክፍያ' : 'Secure Payments' },
                  { icon: CheckCircle, text: language === 'am' ? 'ፈጣን ማረጋገጫ' : 'Instant Confirmation' },
                  { icon: Award, text: language === 'am' ? 'የተረጋገጠ ዝግጅት' : 'Verified Event' }
                ].map((badge, bi) => (
                  <div key={bi} className="flex items-center gap-3">
                    <badge.icon className="w-5 h-5 text-secondary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Info & Policies Footer Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          className="max-w-7xl mx-auto border-t border-white/10 pt-24"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
            <div className="space-y-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.4em] text-secondary">Organizer</h4>
              <div className="flex items-center gap-4 group">
                <div className="h-16 w-16 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-white/10 transition-all">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-bold text-lg transition-colors">
                    {typeof festival.organizerId === 'object'
                      ? (festival.organizerId?.name || 'Ethio-Hub Partner')
                      : (festival.organizer?.name || 'Ethio-Hub Partner')}
                  </p>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Official Partner</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.4em] text-secondary">Safety & Health</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400 text-sm font-light leading-relaxed transition-colors">
                  <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{festival.policies?.safety || "Standard cultural safety protocols applied."}</span>
                </li>
                <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400 text-sm font-light leading-relaxed transition-colors">
                  <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{language === 'am' ? 'የጤና መመሪያዎችን ይከተሉ።' : 'Full health & safety support team on-site.'}</span>
                </li>
              </ul>
            </div>

            <div className="space-y-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.4em] text-secondary">Terms</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400 text-sm font-light leading-relaxed transition-colors">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{festival.policies?.cancellation || "Standard cancellation policy (48h notice)."}</span>
                </li>
                <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400 text-sm font-light leading-relaxed cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => setShowReportModal(true)}>
                  <Flag className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{language === 'am' ? 'ሪፖርት ያድርጉ' : 'Report this event'}</span>
                </li>
              </ul>
            </div>

            <div className="space-y-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.4em] text-secondary">Contact</h4>
              <div className="space-y-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-light leading-relaxed transition-colors">
                  Have questions about the journey? Our concierge team is available 24/7.
                </p>
                <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-900 dark:text-white">
                  <Globe className="w-4 h-4" /> Help Center
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-6 md:p-20"
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center">
              <motion.img
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={allImages[lightboxIndex]}
                className="max-w-full max-h-full object-contain shadow-2xl"
              />

              {allImages.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-0 p-6 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all">
                    <ChevronLeft className="w-10 h-10" />
                  </button>
                  <button onClick={nextImage} className="absolute right-0 p-6 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all">
                    <ChevronRight className="w-10 h-10" />
                  </button>
                </>
              )}
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-xs font-bold tracking-widest">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      {showReportModal && festival && (
        <ReportModal
          targetId={eventId}
          targetType="Event"
          targetName={getLocalizedText(festival, 'name', language)}
          onClose={() => setShowReportModal(false)}
          userId={user?.id || ''}
        />
      )}

    </div>
  );
}

