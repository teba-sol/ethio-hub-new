"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Car, Users, TrendingUp, AlertCircle, Maximize2,
  Check, ShieldCheck, Clock, Info, Fuel, Settings2
} from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/lib/apiClient';
import { Festival, TransportOption } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedText } from '@/utils/getLocalizedText';
import { Button } from '@/components/UI';

export default function TransportPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const {
    selectedTransport,
    setSelectedTransport,
    transportDays,
    setTransportDays,
    ticketSelection,
    getTransportTotal
  } = useBooking();
  const { language, t } = useLanguage();

  const [festival, setFestival] = useState<Festival | null>(null);
  const [transports, setTransports] = useState<TransportOption[]>([]);
  const [loading, setLoading] = useState(true);
  // Always show transport directly for Standard tickets (no "Add Transport?" modal)
  const wantsTransport = true;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [festRes, availabilityRes] = await Promise.all([
          apiClient.get(`/api/festivals/${eventId}`),
          apiClient.get(`/api/festivals/${eventId}/availability`),
        ]);

        const festivalData = festRes?.festival || festRes;
        if (festivalData) setFestival(festivalData);

        const tier = ticketSelection?.type === 'vip' ? 'vip' : 'standard';
        const vipIncludedTransport = (festivalData as any)?.pricing?.vipIncludedTransport || [];

        const mapped = ((availabilityRes?.transportation || festivalData?.transportation) || []).map((t: any, idx: number) => {
          const currentAvailable = typeof t.available === 'number' ? t.available : (Number(t.availability) || 0);
          return {
            ...t,
            id: t._id || t.id || `transport-${idx}`,
            remaining: currentAvailable,
          };
        }).filter((t: any) => {
          // If VIP, only show included transport if specified
          if (tier === 'vip' && vipIncludedTransport.length > 0) {
            return vipIncludedTransport.includes(t.id);
          }
          return true;
        });
        setTransports(mapped);
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const handleContinue = () => router.push(`/event/${eventId}/checkout`);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Finding available transport...</p>
        </div>
      </div>
    );
  }

  // VIP: Show included transport details (read-only)
  if (ticketSelection?.type === 'vip') {
    const vipIncludedTransport = festival?.pricing?.vipIncludedTransport || [];
    const includedTransport = transports.filter((t: any) => vipIncludedTransport.includes(t.id || t._id));

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100/30">
        <div className="bg-white/90 backdrop-blur-lg border-b border-green-100/50 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-500 hover:text-primary font-bold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
              <Car className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-800">VIP Included</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif font-bold text-primary mb-3">Your Included Transport</h1>
            <p className="text-gray-500">Transport service is included with your VIP ticket.</p>
          </div>

          {includedTransport.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {includedTransport.map((transport: any, index: number) => (
                <div key={index} className="bg-white rounded-2xl border-2 border-green-200 shadow-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Car className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-primary">{transport.type_en || transport.type_am || transport.type}</h3>
                      {transport.capacity && (
                        <p className="text-sm text-gray-500">Capacity: {transport.capacity} passengers</p>
                      )}
                    </div>
                  </div>
                  {transport.features && transport.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {transport.features.map((f: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-green-50 rounded-full text-sm text-green-700">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <p className="text-gray-500">No transport included for this VIP package.</p>
            </div>
          )}

          <div className="mt-10 text-center">
            <button
              onClick={() => router.push(`/event/${eventId}/checkout`)}
              className="px-10 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currency = festival?.pricing?.currency || festival?.currency || 'ETB';
  const currentTransport = selectedTransport && transports.find((t) => t.id === selectedTransport.id);

  // Show transport directly (no "Add Transport?" modal)

  return (
  <div className="min-h-screen bg-gray-50/50">
    {/* Sticky Navigation */}
    <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push(`/event/${eventId}/hotels`)}
          className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Accommodation</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step 3 of 4</span>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-primary rounded-full" />
          </div>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="max-w-3xl mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-black text-gray-900 mb-4">
          Select Your Transport
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed">
          Choose a vehicle that fits your group and comfort needs.
          VIP tickets include selected transport options at no extra cost.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          {transports.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Transport Available</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                The organizer hasn't listed any transport options for this event yet.
              </p>
              <Button onClick={handleContinue}>Continue to Checkout</Button>
            </div>
          ) : (
            transports.map((transport) => {
              const remainingUnits = transport.remaining ?? 0;
              const isSoldOut = remainingUnits <= 0;
              const isSelected = selectedTransport?.id === transport.id;
              const isVipFree = ticketSelection?.type === 'vip' && transport.vipIncluded;

              return (
                <div
                  key={transport.id}
                  onClick={() => !isSoldOut && setSelectedTransport(transport)}
                  className={`relative flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2 ${isSelected
                    ? 'border-primary ring-4 ring-primary/5 shadow-xl translate-x-1'
                    : 'border-transparent hover:border-gray-200 shadow-sm hover:shadow-md'
                    } ${isSoldOut ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                >
                  {/* Visual Perforation (Left) */}
                  <div className="absolute left-[300px] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-100 hidden md:block" />
                  <div className="absolute left-[292px] -top-2 w-4 h-4 bg-gray-50 rounded-full hidden md:block" />
                  <div className="absolute left-[292px] -bottom-2 w-4 h-4 bg-gray-50 rounded-full hidden md:block" />

                  {/* Image Section */}
                  <div className="w-full md:w-[300px] h-64 md:h-auto relative flex-shrink-0">
                    <img
                      src={transport.image || 'https://images.unsplash.com/photo-1449966308865-2d33e1d7a7a3?w=400&h=300&fit=crop'}
                      alt={getLocalizedText(transport, 'type', language)}
                      className="w-full h-full object-cover"
                    />
                    {isVipFree && (
                      <div className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5" /> Included for VIP
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="bg-primary text-white p-3 rounded-full shadow-xl">
                          <Check className="w-8 h-8" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-serif font-black text-gray-900">
                            {getLocalizedText(transport, 'type', language)}
                          </h3>
                          <p className="text-primary font-bold text-sm">{transport.provider || 'Verified Partner'}</p>
                        </div>
                        <div className="text-right">
                          {isVipFree ? (
                            <span className="text-2xl font-black text-emerald-600">Included</span>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="text-2xl font-black text-gray-900">
                                {currency} {transport.price}
                              </span>
                              <span className="text-xs font-bold text-gray-400 uppercase">per day</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                        {getLocalizedText(transport, 'description', language)}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Capacity</p>
                            <p className="text-xs font-bold text-gray-900">{transport.capacity || 5} Seats</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                            <Fuel className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Fuel</p>
                            <p className="text-xs font-bold text-gray-900">Standard</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                            <Settings2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Transmission</p>
                            <p className="text-xs font-bold text-gray-900">Manual/Auto</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Status</p>
                            <p className={`text-xs font-bold ${remainingUnits <= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {remainingUnits} available
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wide">
                        <ShieldCheck className="w-4 h-4" /> Comprehensive Insurance
                      </div>
                      <span className="text-primary font-black text-xs uppercase tracking-widest hover:underline">
                        {isSoldOut ? 'Sold Out' : 'View Full Specs'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div className="pt-10 flex justify-center">
            <button
              onClick={() => router.push(`/event/${eventId}/checkout`)}
              className="text-gray-400 font-bold text-sm hover:text-primary transition-colors flex items-center gap-2"
            >
              No transport needed? <span className="underline decoration-2 underline-offset-4">Skip this step</span>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
              <div className="p-8 pb-4">
                <h3 className="text-lg font-serif font-black text-gray-900 mb-6">Transport Summary</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Duration</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          onClick={() => setTransportDays(num)}
                          className={`py-3 rounded-xl font-bold text-sm transition-all ${transportDays === num
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                          {num}d
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50">
                    {selectedTransport ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 font-medium">Selected Vehicle</span>
                          <span className="text-sm font-black text-gray-900">{getLocalizedText(selectedTransport, 'type', language)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 font-medium">Daily Rate</span>
                          <span className="text-sm font-black text-gray-900">
                            {ticketSelection?.type === 'vip' && selectedTransport.vipIncluded
                              ? 'Included'
                              : `${currency} ${selectedTransport.price}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                          <span className="text-base font-black text-gray-900">Transport Total</span>
                          <span className="text-2xl font-serif font-black text-primary">
                            {getTransportTotal() === 0 ? 'Included' : `${currency} ${getTransportTotal()}`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Car className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">No vehicle selected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 pt-4">
                <Button
                  onClick={handleContinue}
                  className="w-full py-4 shadow-lg shadow-primary/25"
                  disabled={!selectedTransport && transports.length > 0}
                >
                  {selectedTransport ? 'Continue to Checkout' : 'Select a Vehicle'}
                </Button>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-primary" /> 24/7 Driver Support
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> GPS Tracked Fleet
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-1">Travel Tip</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    We recommend booking transport for at least 2 days to fully explore Addis Ababa during the festival.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
