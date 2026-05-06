"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Calendar, Users, Ticket, Star,
  Clock, Flag, ChevronLeft, ChevronRight, X, Play,
  Heart, Share2, ExternalLink, CheckCircle, Award,
  Coffee, Camera, Music, Shield, Wifi, ParkingCircle,
  Info, Tag, AlertCircle
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { Festival } from '@/types';
import { useBooking } from '@/context/BookingContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getLocalizedText } from '@/utils/getLocalizedText';
import { ReportModal } from '@/components/ReportModal';

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const { setEvent } = useBooking();
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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

  const getActiveImage = () => {
    if (festival?.gallery && festival.gallery.length > 0) {
      return festival.gallery[activeImageIndex];
    }
    return festival?.coverImage || '';
  };

  const openLightbox = (index?: number) => {
    setLightboxIndex(index ?? activeImageIndex);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    if (festival?.gallery) {
      setLightboxIndex((prev) => (prev + 1) % festival.gallery.length);
    }
  };

  const prevImage = () => {
    if (festival?.gallery) {
      setLightboxIndex((prev) => (prev - 1 + festival.gallery.length) % festival.gallery.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-white/80 font-medium animate-pulse">Loading experience...</p>
        </div>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-white text-lg">{t('festival.eventNotFound')}</p>
          <Link href="/festivals" className="inline-block mt-6 px-6 py-3 bg-primary rounded-xl text-white font-medium hover:bg-primary/90 transition">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const duration = Math.ceil((new Date(festival.endDate).getTime() - new Date(festival.startDate).getTime()) / (1000 * 60 * 60 * 24));

  const allImages = festival.gallery && festival.gallery.length > 0 
    ? [festival.coverImage, ...festival.gallery]
    : [festival.coverImage];

  const amenities = [
    { icon: Wifi, name: "Free WiFi" },
    { icon: ParkingCircle, name: "Parking Available" },
    { icon: Coffee, name: "Food & Drinks" },
    { icon: Camera, name: "Photo Friendly" },
    { icon: Music, name: "Live Music" },
    { icon: Shield, name: "Security" },
  ];

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative h-[70vh] min-h-[550px] lg:h-[80vh]">
          {/* Main Image */}
          <div 
            className="absolute inset-0 cursor-pointer group overflow-hidden"
            onClick={() => openLightbox()}
          >
            <img 
              src={getActiveImage()} 
              alt={getLocalizedText(festival, 'name', language)}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            
            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          </div>

          {/* Thumbnail Gallery */}
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-6 right-6 z-10">
              <div className="flex gap-2 justify-center md:justify-start">
                {allImages.slice(0, 5).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(idx);
                    }}
                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden transition-all duration-200 ${
                      activeImageIndex === idx 
                        ? 'ring-2 ring-primary ring-offset-2 scale-105' 
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                {allImages.length > 5 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox();
                    }}
                    className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-black/60 flex items-center justify-center border border-white/20 hover:bg-black/80 transition"
                  >
                    <span className="text-white text-xs font-bold">+{allImages.length - 5}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="absolute top-6 left-6 z-20">
            <Link 
              href="/festivals" 
              className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white/90 hover:text-white hover:bg-black/60 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Events</span>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-6 right-6 z-20 flex gap-3">
            <button
              onClick={() => setIsSaved(!isSaved)}
              className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white/90 hover:text-red-500 hover:bg-black/60 transition-all"
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button
              onClick={() => navigator.share?.({
                title: getLocalizedText(festival, 'name', language),
                url: window.location.href,
              })}
              className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white/90 hover:text-white hover:bg-black/60 transition-all"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {user && (
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white/90 hover:text-red-400 hover:bg-black/60 transition-all flex items-center gap-2"
              >
                <Flag className="w-4 h-4" />
                <span className="text-sm font-medium">Report</span>
              </button>
            )}
          </div>

          {/* Hero Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10">
            <div className="max-w-7xl mx-auto">
              {/* Verified Badge */}
              {festival.isVerified && (
                <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-md px-4 py-2 rounded-full mb-4 border border-primary/30">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Verified Event</span>
                </div>
              )}
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 max-w-4xl leading-tight drop-shadow-2xl">
                {getLocalizedText(festival, 'name', language)}
              </h1>
              
              <div className="flex flex-wrap gap-4 md:gap-6 text-white/90">
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Calendar className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium">{formatDate(festival.startDate)} — {formatDate(festival.endDate)}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium">{duration} {duration === 1 ? 'Day' : 'Days'}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <MapPin className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium">{getLocalizedText(festival.location, 'name', language)}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Users className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium">{t('festival.spotsLeft').replace('{count}', String(festival.ticketsAvailable || 0))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-6 h-6 text-primary" />
                  About This Event
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {festival.description || "No description available for this event."}
                  </p>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Amenities & Facilities
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <amenity.icon className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-gray-700">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Map Preview */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Location
                </h3>
                <div className="bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
                      <p className="text-gray-600 font-medium">{getLocalizedText(festival.location, 'name', language)}</p>
                      <p className="text-sm text-gray-500 mt-1">Interactive map coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {/* Price Card */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
                  <div className="p-6 border-b border-gray-700">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">${festival.price || 0}</span>
                      <span className="text-gray-400">per person</span>
                    </div>
                    {festival.ticketsAvailable && festival.ticketsAvailable < 50 && (
                      <div className="mt-3 flex items-center gap-2 text-amber-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Only {festival.ticketsAvailable} tickets left!</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    <Link href={`/checkout/${festival._id}`}>
                      <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                        <Ticket className="w-5 h-5" />
                        Book Now
                      </button>
                    </Link>
                    
                    <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-white/20">
                      <Heart className="w-5 h-5" />
                      Save to Wishlist
                    </button>
                  </div>

                  <div className="p-6 bg-gray-800/50 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Free cancellation</span>
                      <span className="text-green-400">Up to 7 days before</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Best price guarantee</span>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Secure booking</span>
                      <Shield className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Contact Organizer */}
                <div className="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3">Questions?</h4>
                  <p className="text-sm text-gray-600 mb-4">Contact the event organizer directly</p>
                  <button className="w-full border border-primary text-primary hover:bg-primary hover:text-white font-medium py-3 px-4 rounded-xl transition-all duration-200">
                    Contact Organizer
                  </button>
                </div>
              </div>
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
            className="absolute top-6 right-6 text-white hover:text-gray-300 z-10 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-6 text-white hover:text-gray-300 p-2 transition-colors"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-6 text-white hover:text-gray-300 p-2 transition-colors"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
          
          <div className="max-w-5xl max-h-[80vh] px-20" onClick={() => nextImage()}>
            <img 
              src={allImages[lightboxIndex]} 
              alt={`${getLocalizedText(festival, 'name', language)} - Image ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain cursor-pointer"
            />
            <div className="text-center text-white mt-4">
              <span className="font-bold">{lightboxIndex + 1}</span> / <span>{allImages.length}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}