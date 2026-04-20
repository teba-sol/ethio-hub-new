"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Download, MapPin, Calendar, Hotel, Car, Ticket } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/lib/apiClient';

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const status = searchParams.get('status');
  
  const { ticketSelection, selectedRoom, selectedTransport, clearBooking } = useBooking();
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (bookingId) {
          const res = await apiClient.get(`/api/tourist/bookings?id=${bookingId}`);
          if (res.success && res.bookings?.[0]) {
            setBooking(res.bookings[0]);
          }
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooking();
  }, [bookingId]);

  // Clear booking context on mount
  useEffect(() => {
    return () => clearBooking();
  }, []);

  const isSuccess = status === 'success' || booking?.status === 'confirmed';

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isSuccess) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center p-6">
        <div className="bg-white rounded-[32px] p-10 max-w-lg w-full text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h2>
          <p className="text-gray-500 mb-6">Your payment could not be completed.</p>
          <Link href="/" className="px-6 py-3 bg-primary text-white rounded-xl font-bold">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ethio-bg">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-white rounded-[32px] p-10 shadow-2xl text-center">
          {/* Success Check */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-4xl font-serif font-bold text-primary mb-3">
            Booking Confirmed!
          </h1>
          
          <p className="text-gray-500 mb-8">
            Your booking has been confirmed. A confirmation email has been sent.
          </p>

          {/* Booking ID */}
          <div className="bg-gray-50 rounded-xl p-4 mb-8 inline-block">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Booking ID</p>
            <p className="font-mono font-bold text-primary text-lg">{bookingId?.slice(-8).toUpperCase()}</p>
          </div>

          {/* Booking Summary */}
          <div className="text-left space-y-4 mb-8">
            <h3 className="text-lg font-bold text-primary">Your Booking</h3>
            
            {ticketSelection && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Ticket className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{ticketSelection.type.toUpperCase()} Tickets</p>
                  <p className="text-sm text-gray-500">{ticketSelection.quantity} tickets</p>
                </div>
              </div>
            )}
            
            {selectedRoom && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Hotel className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{selectedRoom.name}</p>
                  <p className="text-sm text-gray-500">Hotel accommodation</p>
                </div>
              </div>
            )}
            
            {selectedTransport && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Car className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{selectedTransport.type}</p>
                  <p className="text-sm text-gray-500">Transportation</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="w-full py-4 px-6 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90">
              <Download className="w-5 h-5" />
              Download Ticket
            </button>
            
            <Link 
              href="/dashboard/tourist/bookings"
              className="w-full py-4 px-6 border-2 border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              View My Bookings
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <Link href="/" className="block mt-6 text-primary hover:underline">
            Browse more events
          </Link>
        </div>
      </div>
    </div>
  );
}