"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/lib/apiClient';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  
  const { 
    ticketSelection,
    selectedHotel,
    selectedRoom,
    selectedTransport,
    checkIn,
    checkOut,
    getTicketTotal,
    getHotelTotal,
    getTransportTotal,
    getServiceFee,
    getGrandTotal,
  } = useBooking();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      if (!ticketSelection) {
        router.push(`/event/${eventId}/tickets`);
        return;
      }

      const grandTotal = getGrandTotal();
      const serviceFee = getServiceFee();

      if (!grandTotal || grandTotal <= 0) {
        setError('Invalid total amount. Please check your booking.');
        return;
      }

      try {
        const hasHotel = !!(selectedRoom && checkIn && checkOut);

        const bookingResponse = await apiClient.post('/api/tourist/bookings', {
          festivalId: eventId,
          ticketType: ticketSelection.type,
          quantity: ticketSelection.quantity,
          totalPrice: grandTotal,
          currency: 'USD',
          hasHotelBooking: hasHotel,
          touristServiceFee: serviceFee,
          bookingDetails: {
            ...(selectedRoom ? {
              room: {
                hotelId: selectedHotel?._id || selectedHotel?.id || '',
                roomId: selectedRoom._id || selectedRoom.id,
                hotelName: selectedHotel?.name || '',
                roomName: selectedRoom.name,
                roomPrice: selectedRoom.pricePerNight,
              },
            } : {}),
            ...(selectedTransport ? {
              transport: {
                transportId: selectedTransport._id || selectedTransport.id,
                type: selectedTransport.type,
                price: selectedTransport.price,
              },
            } : {}),
          },
          contactInfo: {
            fullName: 'Guest',
            email: 'guest@email.com',
            phone: '0000000000',
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
              currency: 'ETB',
              email: 'guest@email.com',
              firstName: 'Guest',
              lastName: 'User',
              phone: '0912345678',
              description: `Festival booking`,
            }),
          });
          
          const data = await response.json();
          
          if (data.success && data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else if (data.token) {
            window.location.href = `https://checkout.chapa.co/checkout/payment/${data.token}`;
          } else {
            router.push(`/payment-success?bookingId=${bookingId}&status=success`);
          }
        } else {
          setError('Failed to create booking');
        }
      } catch (e) {
        console.error('Payment error:', e);
        setError('Payment processing failed');
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [eventId, ticketSelection, selectedHotel, selectedRoom, selectedTransport, checkIn, checkOut, getGrandTotal, getServiceFee, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => router.push(`/event/${eventId}/tickets`)}
            className="text-primary hover:underline"
          >
            Go back to tickets
          </button>
        </div>
      </div>
    );
  }

  return null;
}