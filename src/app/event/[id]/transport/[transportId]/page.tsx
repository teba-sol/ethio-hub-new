"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Car,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Fuel,
  Gauge,
  CarFront,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/UI';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/lib/apiClient';
import { TransportOption } from '@/types';

export default function TransportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const transportId = params?.transportId as string;

  const {
    selectedTransport,
    setSelectedTransport,
    transportDays,
    setTransportDays,
  } = useBooking();

  const [transport, setTransport] = useState<TransportOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [festRes, availabilityRes] = await Promise.all([
          apiClient.get(`/api/festivals/${eventId}`),
          apiClient.get(`/api/festivals/${eventId}/availability`),
        ]);

        const festivalData = festRes?.festival || festRes;
        const transports = ((availabilityRes?.transportation || festivalData?.transportation) || []).map((item: any, index: number) => ({
          ...item,
          id: item._id || item.id || `transport-${index}`,
          displayId: index,
        }));

        const selected =
          transports.find((item: any) => String(item.id) === transportId) ||
          transports.find((item: any) => String(item.displayId) === transportId) ||
          transports[0] ||
          null;

        setTransport(selected);
        if (selected && (selected.remaining ?? selected.availability ?? 0) > 0) {
          setSelectedTransport(selected);
        } else if (selectedTransport?.id === selected?.id) {
          setSelectedTransport(null);
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, transportId, selectedTransport?.id, setSelectedTransport]);

  const isCurrentTransportSelected = !!selectedTransport && selectedTransport.id === transport?.id;
  const remainingUnits = transport?.remaining ?? transport?.availability ?? 0;
  const isSoldOut = remainingUnits <= 0;

  const handleSelect = () => {
    if (!transport || isSoldOut) return;

    if (isCurrentTransportSelected) {
      setSelectedTransport(null);
    } else {
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
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">{transport.type}</h1>
                {isSoldOut ? (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Sold out</span>
                ) : remainingUnits <= 3 ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Only {remainingUnits} left</span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{remainingUnits} available</span>
                )}
              </div>

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

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Availability</p>
                  <p className={`mt-1 text-2xl font-bold ${isSoldOut ? 'text-red-600' : remainingUnits <= 3 ? 'text-amber-600' : 'text-gray-900'}`}>
                    {remainingUnits}
                  </p>
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
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'day' : 'days'}
                      </option>
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
                  disabled={isSoldOut}
                  variant={isCurrentTransportSelected ? 'outline' : 'primary'}
                >
                  {isSoldOut ? 'Sold Out' : isCurrentTransportSelected ? 'Remove Selection' : 'Select This Car'}
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
