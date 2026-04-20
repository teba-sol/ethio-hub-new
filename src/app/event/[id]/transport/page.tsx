"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Car, Users, Check } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { PriceSummary } from '@/components/booking/PriceSummary';
import apiClient from '@/lib/apiClient';
import { Festival, TransportOption } from '@/types';

export default function TransportPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  
  const { 
    setEvent, 
    selectedTransport, 
    setSelectedTransport,
    transportDays,
    setTransportDays
  } = useBooking();
  
  const [festival, setFestival] = useState<Festival | null>(null);
  const [transports, setTransports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const festRes = await apiClient.get(`/api/festivals/${eventId}`);
        const festivalData = festRes?.festival || festRes;
        
        if (festivalData) {
          setFestival(festivalData);
          setEvent(festivalData);
        }
        
        const rawTransport = festivalData?.transportation || [];
        const mapped = rawTransport.map((t: any, idx: number) => ({
          ...t,
          displayId: idx,
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

  const handleContinue = () => {
    router.push(`/event/${eventId}/tickets`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ethio-bg">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-primary mb-4">
            Select Transportation
          </h1>
          <p className="text-gray-500 text-lg">
            Choose transport for your journey to {festival?.locationName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {transports.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Transport Available</h3>
                <p className="text-gray-500 mb-4">
                  This event has no transport options listed. You can skip this step.
                </p>
                <button
                  onClick={() => router.push(`/event/${eventId}/tickets`)}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90"
                >
                  Continue to Tickets →
                </button>
              </div>
            ) : (
              transports.map((transport, index) => (
                <Link
                  key={transport.displayId}
                  href={`/event/${eventId}/transport/${transport.displayId}`}
                  className={`block bg-white rounded-2xl overflow-hidden border transition-all hover:border-gray-200 hover:shadow-lg ${
                    selectedTransport?.id === transport.id 
                      ? 'border-primary shadow-lg' 
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex">
                    <div className="w-48 h-40 flex-shrink-0 relative group">
                      <img 
                        src={transport.image || 'https://images.unsplash.com/photo-1449966308865-2d33e1d7a7a3?w=400&h=300&fit=crop'} 
                        alt={transport.type}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-primary">{transport.type}</h3>
                          {transport.provider && (
                            <p className="text-gray-500 text-sm">{transport.provider}</p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary">${transport.price}</span>
                          <span className="text-gray-500 text-sm">/day</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-gray-500 text-sm">
                        {transport.capacity && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {transport.capacity} seats
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <span className="text-primary font-medium">View Full Details →</span>
                  </div>
                </Link>
              ))
            )}
            
            <button
              onClick={() => router.push(`/event/${eventId}/tickets`)}
              className="w-full mt-4 py-3 text-center text-gray-500 text-sm hover:text-primary"
            >
              Skip transport selection →
            </button>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <PriceSummary eventId={eventId} />
              
              <button
                onClick={handleContinue}
                className="w-full mt-4 py-4 rounded-xl font-bold text-lg bg-primary text-white hover:bg-primary/90"
              >
                Continue to Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}