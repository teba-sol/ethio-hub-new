"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Users, Ticket, ArrowRight, Star } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Full-width Hero */}
      <div className="relative h-[65vh] min-h-[500px]">
        <img 
          src={festival.coverImage} 
          alt={festival.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        
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
      
      {/* Content Below */}
      <div className="bg-ethio-bg text-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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
              <p className="text-4xl font-bold text-primary">
                {Math.ceil((new Date(festival.endDate).getTime() - new Date(festival.startDate).getTime()) / (1000 * 60 * 60 * 24))}
              </p>
              <p className="text-gray-500 text-sm">days</p>
            </div>
          </div>
          
          {/* Gallery */}
          {festival.gallery && festival.gallery.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {festival.gallery.slice(0, 8).map((image, idx) => (
                  <div key={idx} className="aspect-video rounded-xl overflow-hidden">
                    <img 
                      src={image} 
                      alt={`${festival.name} gallery ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* About */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">About This Experience</h2>
            <p className="text-gray-600 leading-relaxed max-w-3xl">{festival.fullDescription}</p>
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
    </div>
  );
}