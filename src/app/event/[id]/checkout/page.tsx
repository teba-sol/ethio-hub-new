"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Smartphone, Lock, Check } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  
  const { user, isAuthenticated } = useAuth();
  const {
    ticketSelection,
    selectedHotel,
    selectedRoom,
    checkIn,
    checkOut,
    selectedTransport,
    getTicketTotal,
    getHotelTotal,
    getTransportTotal,
    getServiceFee,
    getGrandTotal,
    setBookingId,
    clearBooking,
  } = useBooking();
  
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'chapa' | 'telebirr' | null>(null);
  const [hasHotel] = useState(() => !!(selectedRoom && checkIn && checkOut));

  const hotelNights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const grandTotal = getGrandTotal();
  const serviceFee = getServiceFee();
  const baseTotal = getTicketTotal() + getHotelTotal() + getTransportTotal();

  const handlePayment = async () => {
    if (!selectedMethod) return;
    
    if (!grandTotal || grandTotal <= 0) {
      alert('Invalid total amount. Please check your booking.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create booking first
      const bookingResponse = await apiClient.post('/api/tourist/bookings', {
        festivalId: eventId,
        ticketType: ticketSelection?.type,
        quantity: ticketSelection?.quantity,
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
          fullName: user?.name || 'Guest',
          email: user?.email || 'guest@email.com',
          phone: '0000000000',
        },
      });

      if (bookingResponse.success && bookingResponse.booking?._id) {
        const bookingId = bookingResponse.booking._id;
        console.log('Booking created:', bookingId);
        setBookingId(bookingId);
        
        // Store in session storage for recovery
        try {
          sessionStorage.setItem('pendingBooking', bookingId);
        } catch (e) {
          console.log('Session storage not available');
        }
        
        if (selectedMethod === 'chapa') {
          // Initialize Chapa payment
          console.log('Initializing Chapa payment for:', bookingId, 'amount:', grandTotal);
          
          const response = await fetch('/api/payment/chapa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: bookingId,
              amount: Number(grandTotal),
              currency: 'ETB',
              email: user?.email || 'guest@email.com',
              firstName: String(user?.name?.split(' ')[0] || 'Guest'),
              lastName: String(user?.name?.split(' ')[1] || 'User'),
              phone: '0912345678',
              description: `Festival booking`,
            }),
          });
          
          const data = await response.json();
          console.log('Chapa init response:', data);
          
          if (data.success) {
            // Mark booking as paid immediately (before redirect)
            try {
              const confirmResponse = await fetch('/api/tourist/bookings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookingId: bookingId,
                  action: 'confirm',
                  paymentMethod: 'chapa',
                  paymentStatus: 'paid'
                }),
              });
              const confirmData = await confirmResponse.json();
              if (!confirmResponse.ok || !confirmData.success) {
                alert(confirmData.message || 'The selected room or car is no longer available.');
                setLoading(false);
                return;
              }
              console.log('Booking confirmed as paid');
            } catch (e) {
              console.log('Confirm error:', e);
            }
            
            // If we have a checkout URL, go to Chapa, otherwise show success
            if (data.checkoutUrl) {
              window.location.href = data.checkoutUrl;
            } else {
              // No checkout URL - show success directly
              router.push(`/pay-result?status=success&bookingId=${bookingId}`);
            }
          } else {
            // If Chapa fails, show error
            console.error('Chapa error:', data);
            alert(data.message || 'Payment failed. Please try again.');
            setLoading(false);
          }
        } else {
          // Telebirr - simulate
          router.push(`/confirmation/${bookingId}?status=success`);
        }
      } else {
        alert('Failed to create booking');
      }
    } catch (e) {
      console.error('Payment error:', e);
    } finally {
      setLoading(false);
    }
  };

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
            <span>Back to Tickets</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-serif font-bold text-primary mb-4">
          Complete Your Booking
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            
            <div className="space-y-4">
              {ticketSelection && (
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{ticketSelection.type.toUpperCase()} Tickets</p>
                    <p className="text-sm text-gray-500">{ticketSelection.quantity} × ${ticketSelection.price}</p>
                  </div>
                  <span className="font-bold">${getTicketTotal()}</span>
                </div>
              )}
              
              {selectedRoom && (
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{selectedRoom.name}</p>
                    <p className="text-sm text-gray-500">{hotelNights} night{hotelNights > 1 ? 's' : ''}</p>
                  </div>
                  <span className="font-bold">${getHotelTotal()}</span>
                </div>
              )}
              
              {selectedTransport && (
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{selectedTransport.type}</p>
                  </div>
                  <span className="font-bold">${getTransportTotal()}</span>
                </div>
              )}
              
              {serviceFee > 0 && (
                <div className="flex justify-between text-green-600">
                  <div>
                    <p className="font-medium">Service Fee (5%)</p>
                    <p className="text-xs text-gray-400">Platform processing fee</p>
                  </div>
                  <span className="font-bold">+${serviceFee}</span>
                </div>
              )}
              
              <div className="border-t pt-4 flex justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-primary">${grandTotal}</span>
              </div>
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold mb-4">Payment Method</h3>
            
            <div className="space-y-4">
              <button
                onClick={() => setSelectedMethod('chapa')}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  selectedMethod === 'chapa' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Chapa</p>
                  <p className="text-sm text-gray-500">Pay with card, telebirr, bank</p>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedMethod('telebirr')}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  selectedMethod === 'telebirr' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Telebirr</p>
                  <p className="text-sm text-gray-500">Pay with Telebirr</p>
                </div>
              </button>
            </div>
            
            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={!selectedMethod || loading}
              className={`w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                selectedMethod && !loading
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay ${grandTotal}
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-400 text-center mt-4 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Secure encrypted payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
