'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CreditCard, Smartphone, Check, ArrowLeft } from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [method, setMethod] = useState<'chapa' | 'telebirr' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/tourist/bookings?id=${bookingId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setBooking(data.bookings?.[0]);
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (payMethod: 'chapa' | 'telebirr') => {
    setMethod(payMethod);
    setProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await fetch('/api/tourist/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking._id,
          action: 'confirm',
          paymentMethod: payMethod,
          paymentStatus: 'paid'
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setDone(true);
      }
    } catch (e) {
      console.error('Payment error:', e);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Booking not found</p>
          <a href="/" className="text-primary underline">Go Home</a>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center p-6">
        <div className="bg-white rounded-[32px] p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Payment Complete!</h1>
          <p className="text-gray-500 mb-6">Your booking has been confirmed.</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ethio-bg">
      <div className="max-w-md mx-auto p-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-[32px] p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-primary mb-2">Complete Payment</h1>
          <p className="text-gray-500 mb-6">Booking: {booking.festival?.name}</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Tickets</span>
              <span className="font-bold">{booking.quantity}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>Total</span>
              <span>{booking.currency} {booking.totalPrice}</span>
            </div>
          </div>

          {!processing ? (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => processPayment('chapa')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 hover:border-primary transition-all"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <span className="font-bold">Chapa</span>
              </button>
              
              <button 
                onClick={() => processPayment('telebirr')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 hover:border-secondary transition-all"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-bold">Telebirr</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Processing payment...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}