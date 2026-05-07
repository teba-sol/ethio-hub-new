"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Calendar, Ticket, Star,
  Clock, Flag, ChevronLeft, ChevronRight, X,
  Heart, Share2, CheckCircle, Award,
  Coffee, Camera, Music, Shield, Wifi, ParkingCircle,
  Info, AlertCircle, Sparkles, Utensils, CalendarDays,
  Banknote, Users, Building2
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { Festival, FoodPackage } from '@/types';
import { useBooking } from '@/context/BookingContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { getLocalizedText } from '@/utils/getLocalizedText';
import { ReportModal } from '@/components/ReportModal';

type TabType = 'about' | 'schedule' | 'services' | 'info';

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
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [isWishlisted, setIsWishlisted] = useState(false);

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

  const tabs = [
    { id: 'about' as TabType, label: language === 'am' ? 'ስለ' : 'About', icon: Sparkles },
    { id: 'schedule' as TabType, label: language === 'am' ? 'መርሐግብ' : 'Schedule', icon: CalendarDays },
    { id: 'services' as TabType, label: language === 'am' ? 'አገልግሎቶች' : 'Services', icon: Coffee },
    { id: 'info' as TabType, label: language === 'am' ? 'መረጃ' : 'Info', icon: Info },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ethio-bg to-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-3 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">{language === 'am' ? 'በመጫን ላይ...' : 'Loading event details...'}</p>
        </div>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ethio-bg to-white">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{language === 'am' ? 'ዝግጅት አልተገኘም' : 'Event Not Found'}</h2>
          <p className="text-gray-500 mb-6">{t('festival.eventNotFound')}</p>
          <Link href="/festivals" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all">
            <ArrowLeft className="w-4 h-4" />
            {language === 'am' ? 'ዝግጅቶችን ይመልከቱ' : 'Browse Events'}
          </Link>
        </div>
      </div>
    );
  }

  const eventPrice = festival.pricing?.basePrice || festival.baseTicketPrice || 0;
  const eventCurrency = festival.pricing?.currency || festival.currency || 'ETB';

  return (
    <>
      {/* Sticky Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/festivals')}
            className="flex items-center gap-2 text-gray-600 hover:text-primary font-medium transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">{language === 'am' ? 'ወደ ዝግጅቶች' : 'Back'}</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleWishlistToggle}
              className={`p-2.5 rounded-xl transition-all ${
                isWishlisted 
                  ? 'text-red-500 bg-red-50' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title={language === 'am' ? 'ወደ ምኞት ዝርዝር ጨምር' : 'Add to wishlist'}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title={language === 'am' ? 'ሪፖርት' : 'Report'}
            >
              <Flag className="w-5 h-5" />
            </button>
            <button
              className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              title={language === 'am' ? 'አጋራ' : 'Share'}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[45vh] md:h-[50vh] lg:h-[55vh] overflow-hidden bg-gray-900">
        <img
          src={getActiveImage()}
          alt={getLocalizedText(festival, 'name', language)}
          className="w-full h-full object-cover transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        
        {/* Image Navigation */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10 backdrop-blur-md hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveImageIndex((prev) => (prev + 1) % allImages.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10 backdrop-blur-md hover:scale-110"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <div className="absolute bottom-6 right-6 px-3 py-1.5 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm font-medium">
              {activeImageIndex + 1} / {allImages.length}
            </div>
          </>
        )}
        
        {/* Event Info Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-secondary/90 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                {festival.type || 'Festival'}
              </span>
              {festival.isVerified && (
                <span className="bg-emerald-500/90 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" /> {language === 'am' ? 'የተረጋገጠ' : 'Verified'}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 drop-shadow-lg">
              {getLocalizedText(festival, 'name', language)}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <MapPin className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium">{getLocalizedText(festival.location as any, 'name', language) || festival.locationName}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Calendar className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium">{new Date(festival.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Flag className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium">
                  {festival.policies?.ageRestriction || '12+'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Strip */}
      {allImages.length > 1 && (
        <div className="bg-ethio-bg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                    idx === activeImageIndex
                      ? 'ring-2 ring-secondary ring-offset-2 scale-105 shadow-lg'
                      : 'opacity-60 hover:opacity-100 hover:scale-102'
                  }`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tabbed Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Quick Info Grid - Industry Standard */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center text-center group hover:border-primary/30 transition-colors">
                      <div className="p-2.5 bg-white rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{language === 'am' ? 'ቆይታ' : 'Duration'}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {festival.schedule?.length || 1} {language === 'am' ? 'ቀናት' : 'Days'}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center text-center group hover:border-secondary/30 transition-colors">
                      <div className="p-2.5 bg-white rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5 text-secondary" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{language === 'am' ? 'ቡድን' : 'Group Size'}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {festival.ticketsAvailable > 50 ? (language === 'am' ? 'ትልቅ' : 'Large') : (language === 'am' ? 'መካከለኛ' : 'Boutique')}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center text-center group hover:border-emerald-300 transition-colors">
                      <div className="p-2.5 bg-white rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Utensils className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{language === 'am' ? 'ምግብ' : 'Food'}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {(festival.services?.foodPackages?.length || 0) > 0 ? (language === 'am' ? 'ተካትቷል' : 'Included') : (language === 'am' ? 'አልተካተተም' : 'Available')}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center text-center group hover:border-purple-300 transition-colors">
                      <div className="p-2.5 bg-white rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Shield className="w-5 h-5 text-purple-500" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{language === 'am' ? 'ደህንነት' : 'Safety'}</span>
                      <span className="text-sm font-bold text-gray-900">{language === 'am' ? 'የተረጋገጠ' : 'Verified'}</span>
                    </div>
                  </div>

                  {/* Event Description */}
                  {getLocalizedText(festival, 'shortDescription', language) && (
                    <div className="mb-8 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-primary font-medium italic leading-relaxed relative z-10 text-lg">
                        "{getLocalizedText(festival, 'shortDescription', language)}"
                      </p>
                    </div>
                  )}

                  <div className="prose max-w-none mb-10">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{language === 'am' ? 'ስለ ዝግጅቱ' : 'About the Event'}</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {getLocalizedText(festival, 'fullDescription', language) || getLocalizedText(festival, 'description', language) || "No description available for this event."}
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  {festival.mainActivities && (
                    <div className="mb-10">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-secondary/10 rounded-xl">
                          <Star className="w-5 h-5 text-secondary" />
                        </div>
                        {language === 'am' ? 'ዋና ዋና ትዕይንቶች' : 'Experience Highlights'}
                      </h3>
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <p className="text-gray-700 leading-relaxed text-lg">
                          {festival.mainActivities}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Featured Artists/Performances */}
                  {festival.performances && festival.performances.length > 0 && (
                    <div className="mb-10">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-xl">
                          <Music className="w-5 h-5 text-purple-500" />
                        </div>
                        {language === 'am' ? 'ተለይተው የሚቀርቡ' : 'Featured Performances'}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {festival.performances.map((perf, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-purple-200 transition-colors group">
                            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                              <Star className="w-4 h-4 text-purple-500" />
                            </div>
                            <span className="font-bold text-gray-800">{perf}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Schedule Tab */}
              {activeTab === 'schedule' && (
                <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{language === 'am' ? 'የዝግጅቱ መርሐግብር' : 'Event Schedule'}</h3>
                    <p className="text-gray-500">{language === 'am' ? 'የዝግጅቱ ሙሉ የጊዜ ሰሌዳ' : 'A detailed timeline of the entire event.'}</p>
                  </div>

                  {festival.schedule && festival.schedule.length > 0 ? (
                    <div className="relative">
                      {/* Vertical connecting line */}
                      <div className="absolute left-[22px] top-8 bottom-8 w-1 bg-gradient-to-b from-secondary via-primary/50 to-secondary rounded-full" />
                      
                      <div className="space-y-10">
                        {festival.schedule.map((item, idx) => (
                          <div key={idx} className="relative flex gap-8 group">
                            {/* Day Circle */}
                            <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                              idx === 0 
                                ? 'bg-gradient-to-br from-secondary to-amber-400 text-primary' 
                                : 'bg-gradient-to-br from-primary to-[#0a3d2e] text-white'
                            }`}>
                              <span className="text-[8px] font-bold uppercase leading-none mb-0.5">{language === 'am' ? 'ቀን' : 'Day'}</span>
                              <span className="text-xl font-black leading-none">{item.day}</span>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1">
                              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-secondary/30 transition-all duration-500 group-hover:-translate-y-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                  <h4 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                                    {getLocalizedText(item, 'title', language)}
                                  </h4>
                                  {item.time && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-xl text-xs font-bold w-fit border border-primary/10">
                                      <Clock className="w-4 h-4" />
                                      {item.time}
                                    </div>
                                  )}
                                </div>
                                <p className="text-gray-600 leading-relaxed text-lg mb-4">
                                  {getLocalizedText(item, 'activities', language)}
                                </p>
                                
                                {item.performers && item.performers.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                                    {item.performers.map((performer, pIdx) => (
                                      <span key={pIdx} className="flex items-center gap-1.5 bg-gray-50 text-gray-600 text-xs px-3 py-1.5 rounded-lg font-bold border border-gray-100">
                                        <Music className="w-3.5 h-3.5 text-secondary" />
                                        {performer}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <CalendarDays className="w-10 h-10 text-gray-300" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{language === 'am' ? 'መርሐግብር አልተዘጋጀም' : 'Schedule Coming Soon'}</h4>
                      <p className="text-gray-500 max-w-xs mx-auto">{language === 'am' ? 'ዝርዝር መርሐግብር በቅርቡ ይፋ ይደረጋል።' : 'The detailed event schedule will be announced closer to the event date.'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-10">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{language === 'am' ? 'አገልግሎቶችና ጥቅማጥቅሞች' : 'Services & Inclusions'}</h3>
                    <p className="text-gray-500">{language === 'am' ? 'በዝግጅቱ ላይ የሚያገኟቸው አገልግሎቶች' : 'Explore the various services and food packages included in your experience.'}</p>
                  </div>

                  <div className="space-y-10">
                    {/* Cultural Services */}
                    {(festival.services?.culturalServices || festival.culturalServices || []).length > 0 && (
                      <section>
                        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-xl">
                            <Sparkles className="w-5 h-5 text-emerald-600" />
                          </div>
                          {language === 'am' ? 'ባህላዊ አገልግሎቶች' : 'Cultural Experiences'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {(festival.services?.culturalServices || festival.culturalServices || []).map((service: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                              <div className="mt-1 p-1 bg-emerald-500 rounded-full">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                              <span className="font-bold text-gray-800 leading-tight">{service}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Food Packages */}
                    {(festival.services?.foodPackages || festival.foodPackages || []).length > 0 && (
                      <section>
                        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-xl">
                            <Utensils className="w-5 h-5 text-amber-600" />
                          </div>
                          {language === 'am' ? 'የምግብና መጠጥ ፓኬጆች' : 'Culinary Packages'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(festival.services?.foodPackages || festival.foodPackages || []).map((pkg: FoodPackage, idx: number) => (
                            <div key={idx} className="group relative bg-gradient-to-br from-white to-amber-50/30 rounded-3xl p-6 border border-amber-100/50 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
                              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-150 transition-transform duration-700">
                                <Utensils className="w-24 h-24 text-amber-900" />
                              </div>
                              
                              <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                  <h5 className="text-xl font-black text-gray-900 mb-1">{getLocalizedText(pkg, 'name', language)}</h5>
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-md">
                                      {language === 'am' ? 'ፓኬጅ' : 'Package'} {idx + 1}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-black text-primary leading-none">
                                    {eventCurrency} {pkg.pricePerPerson}
                                  </div>
                                  <div className="text-[10px] font-bold text-gray-400 uppercase">{language === 'am' ? 'ለሰው' : 'per person'}</div>
                                </div>
                              </div>
                              
                              <p className="text-gray-600 mb-6 text-sm leading-relaxed relative z-10">
                                {getLocalizedText(pkg, 'description', language)}
                              </p>
                              
                              <div className="space-y-2 relative z-10">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{language === 'am' ? 'ምን ያካትታል' : 'What\'s Included'}</div>
                                <div className="flex flex-wrap gap-2">
                                  {(pkg.items || []).map((item: string, iIdx: number) => (
                                    <span key={iIdx} className="px-3 py-1.5 bg-white border border-amber-100 text-amber-900 text-xs font-bold rounded-xl shadow-sm">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Extras */}
                    {(festival.services?.extras || []).length > 0 && (
                      <section>
                        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-xl">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                          </div>
                          {language === 'am' ? 'ተጨማሪ አገልግሎቶች' : 'Premium Extras'}
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {(festival.services.extras || []).map((extra: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-2xl text-purple-900 font-bold text-sm">
                              <Star className="w-4 h-4 text-purple-500 fill-current" />
                              {extra}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              )}

              {/* Info Tab */}
              {activeTab === 'info' && (
                <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-10">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{language === 'am' ? 'ጠቃሚ መረጃዎች' : 'Essential Information'}</h3>
                    <p className="text-gray-500">{language === 'am' ? 'ፖሊሲዎች፣ ደንቦችና መመሪያዎች' : 'Review important policies, safety guidelines, and event details.'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Core Logistics */}
                    <div className="space-y-6">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        {language === 'am' ? 'መረጃ' : 'Information'}
                      </h4>
                      <div className="space-y-4">
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-lg transition-all">
                          <div className="flex items-center gap-3 mb-2">
                            <Flag className="w-5 h-5 text-primary" />
                            <span className="font-bold text-gray-900">{language === 'am' ? 'የዕድሜ ገደብ' : 'Age Restriction'}</span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            {festival.policies?.ageRestriction || '12+'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Policies */}
                    <div className="space-y-6">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-red-500" />
                        {language === 'am' ? 'ፖሊሲዎች' : 'Policies'}
                      </h4>
                      <div className="space-y-4">
                        <div className="p-5 bg-red-50/30 rounded-2xl border border-red-100 group hover:bg-white hover:shadow-lg transition-all">
                          <div className="flex items-center gap-3 mb-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-bold">{language === 'am' ? 'የመሰረዝ ፖሊሲ' : 'Cancellation'}</span>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {festival.policies?.cancellation || festival.cancellationPolicy || (language === 'am' ? 'መደበኛ የመሰረዝ ፖሊሲ ተፈጻሚ ይሆናል።' : 'Standard cancellation policy applies.')}
                          </p>
                        </div>
                        <div className="p-5 bg-blue-50/30 rounded-2xl border border-blue-100 group hover:bg-white hover:shadow-lg transition-all">
                          <div className="flex items-center gap-3 mb-2 text-blue-700">
                            <Shield className="w-5 h-5" />
                            <span className="font-bold">{language === 'am' ? 'ደህንነት' : 'Safety'}</span>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {festival.policies?.safety || (language === 'am' ? 'የደህንነት መመሪያዎችን ይከተሉ።' : 'Follow all local safety and health guidelines.')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Terms */}
                  {festival.policies?.terms && (
                    <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <h5 className="font-bold text-gray-900 mb-3">{language === 'am' ? 'ተጨማሪ ውሎች' : 'Additional Terms & Conditions'}</h5>
                      <p className="text-sm text-gray-500 leading-relaxed">{festival.policies.terms}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-5">
              {/* Price Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-primary to-[#0a3d2e] p-6 text-white">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                      {language === 'am' ? 'ከ' : 'From'}
                    </span>
                    {festival.isVerified && (
                      <CheckCircle className="w-4 h-4 text-white/80" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{eventCurrency}</span>
                    <span className="text-4xl font-black">{eventPrice}</span>
                  </div>
                  <p className="text-white/70 text-xs mt-1">{language === 'am' ? 'ለሰው' : 'per person'}</p>
                </div>

                <div className="p-5 space-y-4">
                  <Link href={`/event/${festival._id}/tickets`} className="block">
                    <button className="w-full bg-primary text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] group">
                      <Ticket className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      {language === 'am' ? 'ቦኪን ያድርጉ' : 'Reserve Now'}
                    </button>
                  </Link>
                  
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-green-500" />
                      <span>{language === 'am' ? 'ደህንነታዊ' : 'Secure'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                      <span>{language === 'am' ? 'ፈጣን ማረጋገጫ' : 'Instant'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-secondary" />
                    {language === 'am' ? 'አድራሻ' : 'Location'}
                  </h3>
                  <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 p-4 text-center">
                    <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-900 font-semibold text-sm mb-1">
                      {getLocalizedText(festival.location as any, 'name', language) || festival.locationName}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {getLocalizedText(festival.location as any, 'address', language) || 'Ethiopia'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Organizer Card */}
              {festival.organizerId && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      {language === 'am' ? 'አዘጋጅ' : 'Organizer'}
                    </h3>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold text-sm">
                          {typeof festival.organizerId === 'object' 
                            ? (festival.organizerId?.name || 'Verified Organizer')
                            : (festival.organizer?.name || 'Verified Organizer')}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {language === 'am' ? 'የተረጋገጠ አዘጋጅ' : 'Verified Organizer'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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

      {/* Lightbox */}
      {lightboxOpen && allImages.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 z-10 transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <X className="w-8 h-8" />
          </button>
          
          {allImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
          
          <div className="max-w-5xl max-h-[80vh] px-20">
            <img
              src={allImages[lightboxIndex]}
              alt="Gallery"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white text-sm rounded-full backdrop-blur-sm">
            {lightboxIndex + 1} / {allImages.length}
          </div>
        </div>
      )}
    </>
  );
}
