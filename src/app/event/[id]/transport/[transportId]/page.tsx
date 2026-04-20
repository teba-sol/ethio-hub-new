"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Car, Users, Star, Check, ChevronLeft, ChevronRight, X,
  Shield, Clock, Calendar, MapPin, Phone, Mail, Globe, Fuel, Gauge,
  CarFront, Wind, Bluetooth, Wifi, Usb, Music, Briefcase, Map,
  Facebook, Twitter, Linkedin, Mail as MailIcon
} from 'lucide-react';
import { Button } from '@/components/UI';
import { useBooking } from '@/context/BookingContext';
import { PriceSummary } from '@/components/booking/PriceSummary';
import apiClient from '@/lib/apiClient';

export default function TransportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const transportIndex = params?.transportId ? parseInt(params.transportId as string) : 0;
  
  const { 
    selectedTransport, 
    setSelectedTransport,
    transportDays,
    setTransportDays
  } = useBooking();
  
  const [festival, setFestival] = useState<any>(null);
  const [transport, setTransport] = useState<any>(null);
  const [allTransports, setAllTransports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const festRes = await apiClient.get(`/api/festivals/${eventId}`);
        const festivalData = festRes?.festival || festRes;
        
        if (festivalData) {
          setFestival(festivalData);
          
          const transports = festivalData.transportation || [];
          setAllTransports(transports);
          
          const selected = transports[transportIndex] || transports[0];
          console.log('Transport index:', transportIndex, 'selected:', selected);
          
          if (selected) {
            setTransport(selected);
            setSelectedTransport(selected);
          }
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId, transportIndex]);

  const handleSelect = () => {
    if (selectedTransport?.id === transport?.id) {
      setSelectedTransport(null);
    } else if (transport) {
      setSelectedTransport(transport);
    }
  };

  const handleContinue = () => {
    router.push(`/event/${eventId}/tickets`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!transport) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Transport not found</p>
          <Button onClick={() => router.push(`/event/${eventId}/transport`)}>
            Back to Transport
          </Button>
        </div>
      </div>
    );
  }

  const gallery = transport.image ? [transport.image] : [];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button 
            onClick={() => router.push(`/event/${eventId}/transport`)}
            className="flex items-center gap-2 text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Transport</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 h-[300px] md:h-[450px]">
                {gallery.length > 0 ? (
                  <img 
                    src={gallery[activeImageIndex]} 
                    alt={transport.type}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setLightboxOpen(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Car className="w-16 h-16 text-gray-400" />
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
                  </>
                )}
              </div>
            </div>

            <div>
              {transport.provider && (
                <p className="text-sm text-gray-500 mb-2">{transport.provider}</p>
              )}
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">{transport.type}</h1>
              
              {transport.capacity && (
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">{transport.capacity} Seats</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">About This Transport</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {transport.description || 'No description available for this transport service.'}
              </p>
            </div>

            {transport.features && Array.isArray(transport.features) && transport.features.length > 0 && (
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">Features & Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {transport.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Check className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">Vehicle Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <CarFront className="w-6 h-6 text-gray-400 mb-2" />
                  <h3 className="font-bold text-gray-900">{transport.type}</h3>
                  <p className="text-sm text-gray-500">Vehicle Type</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <Users className="w-6 h-6 text-gray-400 mb-2" />
                  <h3 className="font-bold text-gray-900">{transport.capacity || 5}</h3>
                  <p className="text-sm text-gray-500">Passenger Capacity</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <Fuel className="w-6 h-6 text-gray-400 mb-2" />
                  <h3 className="font-bold text-gray-900">Petrol/Diesel</h3>
                  <p className="text-sm text-gray-500">Fuel Type</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <Gauge className="w-6 h-6 text-gray-400 mb-2" />
                  <h3 className="font-bold text-gray-900">Automatic</h3>
                  <p className="text-sm text-gray-500">Transmission</p>
                </div>
              </div>
            </div>

            {transport.pickupLocations && Array.isArray(transport.pickupLocations) && transport.pickupLocations.length > 0 && (
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">Pickup Locations</h2>
                <div className="space-y-3">
                  {transport.pickupLocations.map((location: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="text-gray-700">{location}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-gray-500 text-sm">Starting from</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-primary">${transport.price}</span>
                    <span className="text-gray-500">/day</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Days
                  </label>
                  <select 
                    value={transportDays}
                    onChange={(e) => setTransportDays(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  >
                    {[1,2,3,4,5,6,7].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'day' : 'days'}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">${transport.price} x {transportDays} days</span>
                    <span className="font-bold text-gray-900">${transport.price * transportDays}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="text-xl font-bold text-primary">${transport.price * transportDays}</span>
                  </div>
                </div>

                <Button 
                  className="w-full py-3" 
                  onClick={handleSelect}
                  variant={selectedTransport?.id === transport.id ? 'outline' : 'primary'}
                >
                  {selectedTransport?.id === transport.id ? 'Remove Selection' : 'Select This Car'}
                </Button>

                <Button 
                  className="w-full py-3" 
                  onClick={handleContinue}
                  disabled={!selectedTransport}
                >
                  Continue to Tickets
                </Button>

                <p className="text-center text-xs text-gray-500">
                  Free cancellation up to 24h before pickup
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightboxOpen && gallery.length > 0 && (
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
    </div>
  );
}