"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Car, Users, TrendingUp, AlertCircle, Maximize2 } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/lib/apiClient';
import { Festival, TransportOption } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedText } from '@/utils/getLocalizedText';

export default function TransportPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const { selectedTransport, transportDays, setTransportDays } = useBooking();
  const { language, t } = useLanguage();

  const [festival, setFestival] = useState<Festival | null>(null);
  const [transports, setTransports] = useState<TransportOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [festRes, availabilityRes] = await Promise.all([
          apiClient.get(`/api/festivals/${eventId}`),
          apiClient.get(`/api/festivals/${eventId}/availability`),
        ]);

        const festivalData = festRes?.festival || festRes;
        if (festivalData) setFestival(festivalData);

        const mapped = ((availabilityRes?.transportation || festivalData?.transportation) || []).map((t: any, idx: number) => ({
          ...t,
          id: t._id || t.id || `transport-${idx}`,
        }));
        setTransports(mapped);
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const handleContinue = () => router.push(`/event/${eventId}/tickets`);

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const currentTransport = selectedTransport && transports.find((t) => t.id === selectedTransport.id);
  const firstTransport = transports[0];
  const displayedRemaining =
    currentTransport?.remaining ??
    currentTransport?.availability ??
    firstTransport?.remaining ??
    firstTransport?.availability;

  return (
    <div className="min-h-screen bg-ethio-bg">
         <div className="bg-white border-b border-gray-100">
           <div className="max-w-7xl mx-auto px-6 py-4">
             <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-primary">
               <ArrowLeft className="w-4 h-4" />
               <span>{t('common.back')}</span>
             </button>
           </div>
         </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-primary mb-4">{t('festival.selectTransport')}</h1>
          <p className="text-gray-500 text-lg">{t('festival.chooseTransport')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
             {transports.length === 0 ? (
               <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 md:col-span-2">
                 <h3 className="text-xl font-bold text-gray-700 mb-2">{t('transport.noTransportAvailable')}</h3>
                 <p className="text-gray-500 mb-4">{t('transport.noTransportOptions')}</p>
                 <button
                   onClick={() => router.push(`/event/${eventId}/tickets`)}
                   className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90"
                 >
                   {t('festival.continueToCheckout')}
                 </button>
               </div>
            ) : (
              transports.map((transport) => {
                const remainingUnits = transport.remaining ?? transport.availability ?? 0;
                const isSoldOut = remainingUnits <= 0;
                const isLowStock = remainingUnits > 0 && remainingUnits <= 3;

                return (
                  <Link
                    key={transport.id}
                    href={`/event/${eventId}/transport/${transport.id}`}
                    className={`block h-full bg-white rounded-2xl overflow-hidden border transition-all ${
                      isSoldOut
                        ? 'border-red-100 opacity-80'
                        : selectedTransport?.id === transport.id
                          ? 'border-primary shadow-lg hover:border-primary'
                          : 'border-gray-100 hover:border-gray-200 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="w-full h-56 flex-shrink-0 relative group">
                        <img
                          src={transport.image || 'https://images.unsplash.com/photo-1449966308865-2d33e1d7a7a3?w=400&h=300&fit=crop'}
                          alt={getLocalizedText(transport, 'type', language)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-primary">{getLocalizedText(transport, 'type', language)}</h3>
                            {transport.provider && <p className="text-gray-500 text-sm">{transport.provider}</p>}
                          </div>
                        <div className="text-right">
                          {transport.vipIncluded && (
                            <span className="inline-block px-2 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full mb-1">VIP FREE</span>
                          )}
                          <span className="text-2xl font-bold text-primary">${transport.price}</span>
                          <span className="text-gray-500 text-sm">/day</span>
                        </div>
                        </div>
                        {transport.description && (
                          <p className="mt-3 text-sm leading-relaxed text-gray-500 line-clamp-3">{getLocalizedText(transport, 'description', language)}</p>
                        )}
                        <div className="mt-5">
                          <h4 className="text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">{t('festival.vehicleSpecifications')}</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div
                              className={`rounded-xl p-3 border ${
                                isSoldOut
                                  ? 'bg-red-50 border-red-100'
                                  : isLowStock
                                    ? 'bg-amber-50 border-amber-100'
                                    : 'bg-emerald-50 border-emerald-100'
                              }`}
                            >
                              <TrendingUp
                                className={`w-6 h-6 mb-2 ${
                                  isSoldOut ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-emerald-600'
                                }`}
                              />
                              <h3
                                className={`font-bold ${
                                  isSoldOut ? 'text-red-700' : isLowStock ? 'text-amber-700' : 'text-emerald-700'
                                }`}
                              >
                                {remainingUnits}
                              </h3>
                               <p
                                 className={`text-sm ${
                                   isSoldOut ? 'text-red-700' : isLowStock ? 'text-amber-700' : 'text-emerald-700'
                                 }`}
                               >
                                 {isSoldOut ? t('transport.soldOut') : isLowStock ? t('transport.limitedUnits') : t('transport.availableUnits')}
                               </p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3">
                              <Car className="w-6 h-6 text-gray-400 mb-2" />
                               <h3 className="font-bold text-gray-900">{getLocalizedText(transport, 'type', language)}</h3>
                               <p className="text-sm text-gray-500">{t('transport.vehicleType')}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3">
                              <Users className="w-6 h-6 text-gray-400 mb-2" />
                              <h3 className="font-bold text-gray-900">{transport.capacity || 5}</h3>
                               <p className="text-sm text-gray-500">{t('transport.passengerCapacity')}</p>
                            </div>
                             <div className="rounded-xl bg-gray-50 p-3">
                               <AlertCircle className="w-6 h-6 text-gray-400 mb-2" />
                               <h3 className="font-bold text-gray-900">{t('transport.fuelType')}</h3>
                               <p className="text-sm text-gray-500">{t('transport.fuelType')}</p>
                             </div>
                             <div className="rounded-xl bg-gray-50 p-3">
                               <Maximize2 className="w-6 h-6 text-gray-400 mb-2" />
                               <h3 className="font-bold text-gray-900">{t('transport.transmission')}</h3>
                               <p className="text-sm text-gray-500">{t('transport.transmission')}</p>
                             </div>
                          </div>
                        </div>
                        <div className="border-t border-gray-100 p-4 bg-gray-50">
                          <span className={`font-medium ${isSoldOut ? 'text-red-600' : 'text-primary'}`}>
                            {isSoldOut ? t('transport.soldOut') : t('transport.viewFullDetails')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
            <button
              onClick={() => router.push(`/event/${eventId}/tickets`)}
              className="w-full mt-4 py-3 text-center text-gray-500 text-sm hover:text-primary md:col-span-2"
            >
              {t('festival.skipTransport')}
            </button>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500">{t('festival.startingFrom')}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-primary">
                      {currentTransport ? currentTransport.price : firstTransport?.price}
                    </span>
                    <span className="text-gray-500">{t('festival.perDay')}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">{t('festival.availableUnits')}</p>
                  <p
                    className={`text-3xl font-bold ${
                      displayedRemaining === 0
                        ? 'text-red-600'
                        : (displayedRemaining ?? 0) <= 3
                          ? 'text-amber-600'
                          : 'text-gray-900'
                    }`}
                  >
                    {displayedRemaining ?? 'Not set'}
                    {displayedRemaining === 0 && <span className="ml-2 text-xs bg-red-100 px-2 py-1 rounded">Sold Out</span>}
                  </p>
                  <div className="mt-3">
                    {(displayedRemaining ?? 0) === 0 && (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                        {t('transport.soldOut')}
                      </span>
                    )}
                    {(displayedRemaining ?? 0) > 0 && (displayedRemaining ?? 0) <= 3 && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                        {t('transport.limitedAvailability', { count: displayedRemaining ?? 0 })}
                      </span>
                    )}
                    {(displayedRemaining ?? 0) > 3 && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        {t('transport.availableUnitsCount', { count: displayedRemaining ?? 0 })}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('transport.numberOfDays')}</label>
                  <select
                    value={transportDays}
                    onChange={(e) => setTransportDays(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                         {num} {num === 1 ? t('festival.dayLabel') : t('festival.days')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-gray-600">$ {(currentTransport?.price || firstTransport?.price) || 0} x {transportDays} {transportDays === 1 ? t('festival.dayLabel') : t('festival.days')}</span>
                    <span className="font-bold text-gray-900">$ {(currentTransport?.price || firstTransport?.price || 0) * transportDays}</span>
                  </div>
                   <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                     <span className="font-medium text-gray-900">{t('common.total')}</span>
                     <span className="text-xl font-bold text-primary">$ {(currentTransport?.price || firstTransport?.price || 0) * transportDays}</span>
                   </div>
                </div>
                <button
                  className="w-full py-3 text-center rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  onClick={handleContinue}
                >
                  {t('common.continueToCheckout')}
                </button>
                <p className="text-center text-xs text-gray-500">{t('festival.freeCancellation')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
