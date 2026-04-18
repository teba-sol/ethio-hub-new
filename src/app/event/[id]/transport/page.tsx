"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Car, Users, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
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
  const [transports, setTransports] = useState<TransportOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTransport, setExpandedTransport] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const festRes = await apiClient.get(`/api/festivals/${eventId}`);
        const festivalData = festRes?.festival || festRes;
        
        if (festivalData) {
          setFestival(festivalData);
          setEvent(festivalData);
        }
        
        setTransports(festivalData?.transportation || []);
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
            <span>{selectedTransport ? 'Back to Hotels' : 'Back to Hotels'}</span>
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
          {/* Transport List */}
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
              transports.map((transport) => (
                <div 
                  key={transport.id} 
                  className={`bg-white rounded-2xl overflow-hidden border transition-all ${
                    selectedTransport?.id === transport.id 
                      ? 'border-primary shadow-lg' 
                      : 'border-gray-100'
                  }`}
                >
                  <div 
                    className="flex cursor-pointer"
                    onClick={() => setExpandedTransport(expandedTransport === transport.id ? null : transport.id)}
                  >
                    <div className="w-48 h-40 flex-shrink-0">
                      <img 
                        src={transport.image || 'https://images.unsplash.com/photo-1449966308865-2d33e1d7a7a3?w=400&h=300&fit=crop'} 
                        alt={transport.type}
                        className="w-full h-full object-cover"
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
                        {transport.features?.slice(0, 3).map((feature, idx) => (
                          <span key={idx} className="bg-gray-50 px-2 py-1 rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                      
                      {selectedTransport?.id === transport.id && (
                        <div className="mt-3 flex items-center gap-2 text-primary text-sm font-medium">
                          <Check className="w-4 h-4" />
                          Selected
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex items-center">
                      {expandedTransport === transport.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedTransport === transport.id && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50">
                      {transport.description && (
                        <p className="text-gray-600 text-sm mb-4">{transport.description}</p>
                      )}
                      
                      {transport.features && transport.features.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 mb-2">Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {transport.features.map((feature, idx) => (
                              <span key={idx} className="text-sm bg-white px-3 py-1 rounded-full border">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Day Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Days
                        </label>
                        <select 
                          value={transportDays}
                          onChange={(e) => setTransportDays(parseInt(e.target.value))}
                          className="w-full md:w-48 px-4 py-3 border border-gray-200 rounded-xl"
                        >
                          {[1,2,3,4,5,6,7].map(num => (
                            <option key={num} value={num}>{num} {num === 1 ? 'day' : 'days'}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedTransport(transport)}
                          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            selectedTransport?.id === transport.id
                              ? 'bg-primary text-white'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          {selectedTransport?.id === transport.id ? 'Selected' : 'Select This Car'}
                        </button>
                        
                        {selectedTransport?.id === transport.id && (
                          <button
                            onClick={() => setSelectedTransport(null)}
                            className="px-6 py-2 rounded-lg font-medium text-gray-500 hover:text-red-500"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* Skip Option */}
            <button
              onClick={() => router.push(`/event/${eventId}/tickets`)}
              className="w-full mt-4 py-3 text-center text-gray-500 text-sm hover:text-primary"
            >
              Skip transport selection →
            </button>
          </div>

          {/* Price Summary Sidebar */}
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