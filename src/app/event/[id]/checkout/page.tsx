"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import apiClient from '@/lib/apiClient';
import { ArrowLeft, CreditCard, ShieldCheck, Info, CheckCircle2, Ticket, Car, MapPin, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/UI';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { 
    event,
    ticketSelection,
    selectedHotel,
    selectedRoom,
    selectedTransport,
    checkIn,
    checkOut,
    guests,
    getTicketTotal,
    getHotelTotal,
    getTransportTotal,
    getGrandTotal,
    transportDays
  } = useBooking();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hotelNights = checkIn && checkOut 
    ? Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handlePayment = async () => {
    if (!ticketSelection) {
      router.push(`/event/${eventId}/tickets`);
      return;
    }

    const grandTotal = getGrandTotal();

    if (!grandTotal || grandTotal <= 0) {
      setError('Invalid total amount. Please check your booking.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const hasHotel = !!(selectedRoom && checkIn && checkOut);

      const bookingResponse = await apiClient.post('/api/tourist/bookings', {
        festivalId: eventId,
        ticketType: ticketSelection.type,
        quantity: ticketSelection.quantity,
        totalPrice: grandTotal,
        currency: event?.pricing?.currency || 'ETB',
        hasHotelBooking: hasHotel,
        touristServiceFee: 0,
        bookingDetails: {
          ...(selectedRoom ? {
            room: {
              hotelId: selectedHotel?._id || selectedHotel?.id || '',
              roomId: selectedRoom._id || selectedRoom.id,
              hotelName: selectedHotel?.name || '',
              roomName: selectedRoom.name,
              roomPrice: selectedRoom.pricePerNight,
              nights: hotelNights,
              guests: guests || 1
            },
          } : {}),
          ...(selectedTransport ? {
            transport: {
              transportId: selectedTransport._id || selectedTransport.id,
              type: selectedTransport.type,
              price: selectedTransport.price,
              days: transportDays
            },
          } : {}),
        },
        contactInfo: {
          fullName: user?.name || 'Guest',
          email: user?.email || 'guest@email.com',
          phone: '0912345678',
        },
      });

      if (bookingResponse.success && bookingResponse.booking?._id) {
        const bookingId = bookingResponse.booking._id;
        
        const response = await fetch('/api/payment/chapa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: bookingId,
            amount: Number(grandTotal),
            currency: event?.pricing?.currency || 'ETB',
            email: user?.email || 'guest@email.com',
            firstName: (user?.name || 'Guest').split(' ')[0],
            lastName: (user?.name || 'User').split(' ')[1] || 'User',
            phone: '0912345678',
            description: `Booking for ${event?.name_en || event?.name || 'Event'}`,
          }),
        });
        
        const data = await response.json();
        
        if (data.success && data.booking?._id) {
          const bookingId = data.booking._id;
          
          // Build URL with all booking details
          const params = new URLSearchParams();
          params.set('bookingId', bookingId);
          params.set('status', 'success');
          params.set('eventName', event?.name_en || event?.name || 'Event');
          params.set('ticketType', ticketSelection?.type || 'Standard');
          params.set('totalAmount', grandTotal.toString());
          
          if (selectedRoom && checkIn && checkOut) {
            params.set('hotelName', selectedHotel?.name || '');
            params.set('roomName', selectedRoom.name);
          }
          
          if (selectedTransport) {
            params.set('transportType', selectedTransport.type);
            params.set('transportPrice', selectedTransport.price.toString());
          }
          
          params.set('guestName', user?.name || 'Guest');
          params.set('guestEmail', user?.email || 'guest@email.com');
          
          // Redirect to success page with booking details in URL
          router.push(`/payment-success?${params.toString()}`);
        } else if (data.success && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          setError('Payment initialization failed. Please try again.');
        }
      } else {
        setError(bookingResponse.message || 'Failed to create booking');
      }
    } catch (e) {
      console.error('Payment error:', e);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!ticketSelection) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No ticket selection found.</p>
          <Button onClick={() => router.push(`/event/${eventId}/tickets`)}>
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  const currency = event?.pricing?.currency || 'ETB';

  return (
    <div className="min-h-screen bg-ethio-bg pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button 
            onClick={() => {
              if (selectedHotel) {
                router.push(`/event/${eventId}/hotels/${selectedHotel._id || selectedHotel.id}`);
              } else {
                router.push(`/event/${eventId}`);
              }
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium text-sm">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">Review Your Booking</h1>
          <p className="text-gray-500">Please review your selections before proceeding to secure payment.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Ticket className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Ticket Details</h2>
              </div>
              <div className="flex justify-between items-start py-4 border-t border-gray-50">
                <div>
                  <p className="font-bold text-primary capitalize">{ticketSelection.type} Experience</p>
                  <p className="text-sm text-gray-500">{ticketSelection.quantity} × {currency} {ticketSelection.price}</p>
                </div>
                <p className="font-bold text-gray-900">{currency} {getTicketTotal()}</p>
              </div>
              {ticketSelection.type === 'vip' && (
                <div className="bg-amber-50 rounded-xl p-4 mt-2">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">VIP Perks Included:</p>
                  <ul className="grid grid-cols-1 gap-2">
                    {(event?.vipPerks || ['Priority Entry', 'VIP Lounge', 'Meet & Greet']).map((perk, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-amber-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Accommodation Info */}
            {selectedRoom && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Accommodation</h2>
                </div>
                <div className="space-y-4 py-4 border-t border-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{selectedHotel?.name}</p>
                      <p className="text-sm text-gray-500">{selectedRoom.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {hotelNights} night{hotelNights !== 1 ? 's' : ''} • {guests || 1} guest{guests !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {ticketSelection.type === 'vip' ? 'Included' : `${currency} ${getHotelTotal()}`}
                      </p>
                      {ticketSelection.type === 'vip' && hotelNights > 1 && (
                        <p className="text-[10px] text-emerald-600 font-bold">1st Night Free</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transport Info */}
            {selectedTransport && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Car className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Transport</h2>
                </div>
                <div className="flex justify-between items-start py-4 border-t border-gray-50">
                  <div>
                    <p className="font-bold text-gray-900">{selectedTransport.type}</p>
                    <p className="text-sm text-gray-500">{transportDays} day{transportDays !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {(ticketSelection.type === 'vip' && selectedTransport.vipIncluded) ? 'Included' : `${currency} ${getTransportTotal()}`}
                    </p>
                    {(ticketSelection.type === 'vip' && selectedTransport.vipIncluded) && (
                      <p className="text-[10px] text-emerald-600 font-bold">Free for VIP</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-primary/20 shadow-xl shadow-primary/5 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-50">Order Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tickets</span>
                  <span>{currency} {getTicketTotal()}</span>
                </div>
                {selectedRoom && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Accommodation</span>
                    <span>{getHotelTotal() === 0 ? 'Included' : `${currency} ${getHotelTotal()}`}</span>
                  </div>
                )}
                {selectedTransport && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Transport</span>
                    <span>{getTransportTotal() === 0 ? 'Included' : `${currency} ${getTransportTotal()}`}</span>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary">{currency} {getGrandTotal()}</span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                isLoading={isProcessing}
                className="w-full py-4 shadow-lg shadow-primary/20"
                leftIcon={CreditCard}
              >
                Secure Payment
              </Button>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Secure SSL Encryption
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  Hotel services paid in-person at hotel
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}