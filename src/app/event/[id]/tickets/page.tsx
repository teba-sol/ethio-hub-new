"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TicketCard } from '@/components/booking/TicketCard';
import { PriceSummary } from '@/components/booking/PriceSummary';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/lib/apiClient';
import { Festival } from '@/types';

const EARLY_BIRD_WINDOW_HOURS = Number(process.env.NEXT_PUBLIC_EARLY_BIRD_WINDOW_HOURS || 5);

export default function TicketsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  
  const { setEvent, ticketSelection, setTicketSelection } = useBooking();
  
  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const festRes = await apiClient.get(`/api/festivals/${eventId}`);
        const festivalData = festRes?.festival || festRes;
        
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

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const postedAtRaw = (festival as any)?.createdAt || festival?.submittedAt;
  const postedAt = postedAtRaw ? new Date(postedAtRaw) : null;
  const hasValidPostedAt = !!postedAt && !Number.isNaN(postedAt.getTime());
  const earlyBirdExpiresAt = hasValidPostedAt
    ? new Date(postedAt!.getTime() + EARLY_BIRD_WINDOW_HOURS * 60 * 60 * 1000)
    : null;
  const isEarlyBirdAvailable = !earlyBirdExpiresAt || nowMs <= earlyBirdExpiresAt.getTime();

  useEffect(() => {
    if (ticketSelection?.type === 'earlyBird' && !isEarlyBirdAvailable) {
      setTicketSelection(null);
    }
  }, [ticketSelection, isEarlyBirdAvailable, setTicketSelection]);

  const handleSelect = (type: 'vip' | 'standard' | 'earlyBird') => {
    if (type === 'earlyBird' && !isEarlyBirdAvailable) {
      return;
    }

    const basePrice = festival?.baseTicketPrice || 50;
    let price = 0;
    if (type === 'vip') price = festival?.vipTicketPrice || basePrice * 2;
    else if (type === 'earlyBird') price = festival?.earlyBirdPrice || basePrice * 0.9;
    else price = basePrice;
    
    setTicketSelection({ type, price, quantity });
  };

  // Update quantity in context
  useEffect(() => {
    if (ticketSelection && ticketSelection.quantity !== quantity) {
      setTicketSelection({ ...ticketSelection, quantity });
    }
  }, [quantity]);

  const getTicketPrice = (type: 'vip' | 'standard' | 'earlyBird') => {
    const basePrice = festival?.baseTicketPrice || 50;
    if (type === 'vip') return festival?.vipTicketPrice || basePrice * 2;
    if (type === 'earlyBird') return festival?.earlyBirdPrice || basePrice * 0.9;
    return basePrice;
  };

  const TICKET_TYPES = [
    {
      type: 'vip' as const,
      label: 'VIP Experience',
      benefits: [
        'Premium seating near stage',
        'Exclusive access to VIP lounge',
        'Meet & greet with organizers',
        'Complimentary refreshments',
        'Reserved parking',
      ],
    },
    {
      type: 'standard' as const,
      label: 'Standard Entry',
      benefits: [
        'General admissions access',
        'Food court access',
        'Standard viewing area',
      ],
    },
    {
      type: 'earlyBird' as const,
      label: 'Early Bird',
      benefits: [
        'General admissions access',
        'Discounted price',
        'Food court access',
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ethio-bg">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Transport</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-primary mb-4">
            Select Your Tickets
          </h1>
          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket Cards */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TICKET_TYPES.map((ticket) => (
                <TicketCard
                  key={ticket.type}
                  type={ticket.type}
                  label={ticket.label}
                  price={getTicketPrice(ticket.type)}
                  benefits={ticket.benefits}
                  isSelected={ticketSelection?.type === ticket.type}
                  disabled={ticket.type === 'earlyBird' && !isEarlyBirdAvailable}
                  disabledReason={
                    ticket.type === 'earlyBird' && !isEarlyBirdAvailable
                      ? `Early Bird closed. This offer is only available for ${EARLY_BIRD_WINDOW_HOURS} hours after posting.`
                      : undefined
                  }
                  onSelect={() => handleSelect(ticket.type)}
                />
              ))}
             </div>
           </div>

           {/* Price Summary */}
           <div className="lg:col-span-1">
             <div className="sticky top-24">
               <PriceSummary eventId={eventId} />
               {/* Continue to Checkout - Below Price Summary */}
               <button
                 onClick={() => router.push(`/event/${eventId}/checkout`)}
                 disabled={!ticketSelection}
                 className={`w-full mt-6 py-4 rounded-xl font-bold transition-colors ${
                   ticketSelection 
                     ? 'bg-primary text-white hover:bg-primary/90' 
                     : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                 }`}
               >
                 Continue to Checkout
               </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
