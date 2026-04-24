"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, Calendar, Users, Ticket, ArrowRight, Star, 
  Clock, Shield, Phone, Mail, Globe, Bus, Utensils, Music, 
  ChevronLeft, ChevronRight, X, Check, Play
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { Festival } from '@/types';
import { useBooking } from '@/context/BookingContext';

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  
  const { setEvent } = useBooking();
  
  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'schedule' | 'location' | 'organizer'>('about');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
  }, [eventId]);

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

  const changeHeroImage = (index: number) => {
    setActiveImageIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white">Event not found</p>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const duration = Math.ceil((new Date(festival.endDate).getTime() - new Date(festival.startDate).getTime()) / (1000 * 60 * 60 * 24));

  const allImages = festival.gallery && festival.gallery.length > 0 
    ? [festival.coverImage, ...festival.gallery]
    : [festival.coverImage];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Full-width Hero with Main Image */}
      <div className="relative h-[65vh] min-h-[500px]">
        <div 
          className="absolute inset-0 cursor-pointer group"
          onClick={() => openLightbox()}
        >
          <img 
            src={getActiveImage()} 
            alt={festival.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          
          {/* Play Button Overlay for Video/More */}
          {festival.gallery && festival.gallery.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
            </div>
          )}
        </div>
        
        {/* Back button */}
        <div className="absolute top-6 left-6 z-10">
          <Link href="/festivals" className="flex items-center gap-2 text-white/80 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm uppercase tracking-widest">All Events</span>
          </Link>
        </div>
        
        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-7xl mx-auto">
            {/* Badge */}
            {festival.isVerified && (
              <div className="inline-flex items-center gap-1 bg-secondary px-3 py-1 rounded-full mb-4">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-xs font-bold text-primary uppercase">Vetted Experience</span>
              </div>
            )}
            
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 max-w-3xl">
              {festival.name}
            </h1>
            
            <div className="flex flex-wrap gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary" />
                <span className="font-bold">{formatDate(festival.startDate)} — {formatDate(festival.endDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary" />
                <span className="font-bold">{duration} Days</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-secondary" />
                <span className="font-bold">{festival.locationName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary" />
                <span className="font-bold">{festival.ticketsAvailable} spots left</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Thumnails - Below Hero */}
      {festival.gallery && festival.gallery.length > 0 && (
        <div className="bg-black py-6 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {festival.gallery.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => changeHeroImage(idx)}
                  className={`flex-shrink-0 w-24 h-16 md:w-32 md:h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer relative ${
                    activeImageIndex === idx 
                      ? 'border-secondary scale-105' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={image} 
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {activeImageIndex === idx && (
                    <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                      <Star className="w-4 h-4 text-secondary fill-current" />
                    </div>
                  )}
                </button>
              ))}
              
              {/* Video/All Photos Button */}
              {festival.gallery.length > 1 && (
                <button
                  onClick={() => openLightbox(0)}
                  className="flex-shrink-0 w-24 h-16 md:w-32 md:h-20 rounded-lg bg-white/10 border border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
                >
                  <Play className="w-6 h-6 text-white" />
                  <span className="text-[10px] font-bold text-white mt-1">View All</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Content Below */}
      <div className="bg-ethio-bg text-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-2xl">
              <h3 className="font-bold text-primary mb-2">Starting from</h3>
              <p className="text-4xl font-bold text-primary">${festival.baseTicketPrice}</p>
              <p className="text-gray-500 text-sm">per person</p>
            </div>
            <div className="bg-white p-6 rounded-2xl">
              <h3 className="font-bold text-primary mb-2">Available Tickets</h3>
              <p className="text-4xl font-bold text-primary">{festival.ticketsAvailable}</p>
              <p className="text-gray-500 text-sm">spots available</p>
            </div>
            <div className="bg-white p-6 rounded-2xl">
              <h3 className="font-bold text-primary mb-2">Duration</h3>
              <p className="text-4xl font-bold text-primary">{duration}</p>
              <p className="text-gray-500 text-sm">days</p>
            </div>
            <div className="bg-white p-6 rounded-2xl">
              <h3 className="font-bold text-primary mb-2">Category</h3>
              <p className="text-2xl font-bold text-primary capitalize">Cultural</p>
              <p className="text-gray-500 text-sm">event type</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 mb-8 pb-2">
            {[
              { id: 'about', label: 'About', icon: Star },
              { id: 'schedule', label: 'Schedule', icon: Calendar },
              { id: 'location', label: 'Location', icon: MapPin },
              { id: 'organizer', label: 'Organizer', icon: Shield },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-3xl p-8 mb-12">
            {activeTab === 'about' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-4">About This Experience</h2>
                  <p className="text-gray-600 leading-relaxed text-lg">{festival.fullDescription}</p>
                </div>
                
                {festival.shortDescription && (
                  <div className="bg-ethio-bg p-6 rounded-2xl">
                    <h3 className="font-bold text-primary mb-2">Quick Overview</h3>
                    <p className="text-gray-600">{festival.shortDescription}</p>
                  </div>
                )}

                {/* What's Included */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(festival.foodPackages?.length > 0 || festival.culturalServices?.length > 0) && (
                    <div>
                      <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-secondary" />
                        Included Services
                      </h3>
                      <ul className="space-y-3">
                        {festival.foodPackages?.map((item: any, idx: number) => (
                          <li key={idx} className="flex items-center gap-3 text-gray-600">
                            <Check className="w-4 h-4 text-green-500" />
                            {item.name || item}
                          </li>
                        ))}
                        {festival.culturalServices?.map((item: any, idx: number) => (
                          <li key={idx} className="flex items-center gap-3 text-gray-600">
                            <Music className="w-4 h-4 text-purple-500" />
                            {item.name || item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {festival.transportation && festival.transportation.length > 0 && (
                    <div>
                      <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                        <Bus className="w-5 h-5 text-secondary" />
                        Transport Options
                      </h3>
                      <ul className="space-y-3">
                        {festival.transportation.map((transport: any, idx: number) => (
                          <li key={idx} className="flex items-center gap-3 text-gray-600">
                            <Bus className="w-4 h-4 text-blue-500" />
                            {transport.type} - ${transport.price}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Policies */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                  <div className="bg-red-50 p-6 rounded-2xl">
                    <h3 className="font-bold text-red-800 mb-2">Cancellation Policy</h3>
                    <p className="text-red-700 text-sm">{festival.cancellationPolicy || 'Standard cancellation policy applies'}</p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-2xl">
                    <h3 className="font-bold text-blue-800 mb-2">Age Restriction</h3>
                    <p className="text-blue-700 text-sm">{festival.ageRestriction || 'All ages welcome'}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div>
                <h2 className="text-2xl font-bold text-primary mb-6">Event Schedule</h2>
                {festival.schedule && festival.schedule.length > 0 ? (
                  <div className="space-y-6">
                    {festival.schedule.map((day: any, idx: number) => (
                      <div key={idx} className="flex gap-6 p-6 bg-ethio-bg rounded-2xl">
                        <div className="w-20 h-20 bg-primary rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0">
                          <span className="text-xs font-bold uppercase">Day</span>
                          <span className="text-3xl font-bold">{day.day}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-primary mb-2">{day.title}</h3>
                          <p className="text-gray-600">{day.activities}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Schedule will be announced soon</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'location' && (
              <div>
                <h2 className="text-2xl font-bold text-primary mb-6">Event Location</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="bg-ethio-bg p-6 rounded-2xl mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <MapPin className="w-6 h-6 text-secondary" />
                        <div>
                          <h3 className="font-bold text-primary">{festival.locationName}</h3>
                          <p className="text-gray-500 text-sm">{festival.address || 'Ethiopia'}</p>
                        </div>
                      </div>
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(festival.locationName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm font-bold"
                      >
                        View on Google Maps →
                      </a>
                    </div>
                  </div>
                  <div className="h-[400px] rounded-2xl overflow-hidden">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight={0} 
                      marginWidth={0} 
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(festival.locationName)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                      className="w-full h-full grayscale"
                    ></iframe>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'organizer' && (
              <div>
                <h2 className="text-2xl font-bold text-primary mb-6">Event Organizer</h2>
                {(festival as any).organizer ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-ethio-bg p-6 rounded-2xl">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {(festival as any).organizer?.name?.charAt(0) || 'O'}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-primary">{(festival as any).organizer?.name}</h3>
                          <p className="text-gray-500">Verified Organizer</p>
                        </div>
                      </div>
                      {(festival as any).organizer?.description && (
                        <p className="text-gray-600">{(festival as any).organizer?.description}</p>
                      )}
                    </div>
                    <div className="space-y-4">
                      {(festival as any).organizer?.email && (
                        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">{(festival as any).organizer?.email}</span>
                        </div>
                      )}
                      {(festival as any).organizer?.phone && (
                        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">{(festival as any).organizer?.phone}</span>
                        </div>
                      )}
                      {(festival as any).organizer?.website && (
                        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border">
                          <Globe className="w-5 h-5 text-gray-400" />
                          <a href={(festival as any).organizer?.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {(festival as any).organizer?.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Organizer information will be available soon</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* CTA */}
          <div className="flex flex-col md:flex-row gap-4">
            <Link 
              href={`/event/${eventId}/hotels`}
              className="flex-1 bg-primary text-white text-center py-6 px-8 rounded-2xl font-bold text-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              Book Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            {festival.hotels && festival.hotels.length > 0 && (
              <Link 
                href={`/event/${eventId}/hotels`}
                className="px-8 py-6 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-colors"
              >
                View Hotels ({festival.hotels.length})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && allImages.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 z-10"
          >
            <X className="w-8 h-8" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-6 text-white hover:text-gray-300 p-2"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-6 text-white hover:text-gray-300 p-2"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
          
          <div className="max-w-5xl max-h-[80vh] px-20" onClick={() => nextImage()}>
            <img 
              src={allImages[lightboxIndex]} 
              alt={`${festival.name} - Image ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain cursor-pointer"
            />
            <div className="text-center text-white mt-4">
              <span className="font-bold">{lightboxIndex + 1}</span> / <span>{allImages.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}