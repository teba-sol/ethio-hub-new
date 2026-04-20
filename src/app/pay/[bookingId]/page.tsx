'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CreditCard, Smartphone, Check, ArrowLeft } from 'lucide-react';

export default function SimplePayPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const processPayment = async (payMethod: 'chapa' | 'telebirr') => {
    setProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await fetch('/api/tourist/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookingId: bookingId,
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
            onClick={() => router.push('/tourist/bookings')}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold"
          >
            View My Bookings
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
          <p className="text-gray-500 mb-6">Select your payment method</p>

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