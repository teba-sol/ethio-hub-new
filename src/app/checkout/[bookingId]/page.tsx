'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const bookingId = params?.bookingId as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/tourist/bookings?id=${bookingId}`, {
        credentials: 'include'
      });
      const data = await res.json();

      if (data.success && data.bookings?.length > 0) {
        setBooking(data.bookings[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const payWithChapa = async () => {
    if (!booking) return;

    setProcessing(true);

    try {
      const res = await fetch('/api/payment/chapa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking._id,
          amount: booking.totalPrice,
          currency: 'ETB', // Always use ETB for Chapa
          email: booking.contactInfo?.email,
          firstName: booking.contactInfo?.fullName || 'User',
          lastName: 'User',
          phone: booking.contactInfo?.phone || '0912345678'
        })
      });

      const data = await res.json();

      console.log('Chapa init:', data);

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // 🔥 REDIRECT
      } else {
        showNotification(data.message || 'Payment failed', 'error');
        setProcessing(false);
      }
    } catch (e) {
      console.error(e);
      setProcessing(false);
    }
  };

  if (loading) return <p className="p-10 text-center">Loading...</p>;

  if (!booking) return <p className="p-10 text-center">Booking not found</p>;

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl w-[400px] shadow">
        <button onClick={() => router.back()} className="mb-4 flex gap-2">
          <ArrowLeft /> Back
        </button>

        <h2 className="text-xl font-bold mb-4">
          {booking.festival?.name || 'Booking'}
        </h2>

        <p className="mb-2">Tickets: {booking.quantity}</p>
        <p className="mb-6 font-bold">
          {booking.currency} {booking.totalPrice}
        </p>

        <button
          onClick={payWithChapa}
          disabled={processing}
          className="w-full bg-green-600 text-white py-3 rounded-lg"
        >
          {processing ? 'Redirecting...' : 'Pay with Chapa'}
        </button>
      </div>
    </div>
  );
}