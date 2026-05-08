"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Ticket, Hotel, Car, User, Printer, Home } from "lucide-react";

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams()!;
  const printRef = useRef<HTMLDivElement>(null);
  
  // Get booking info from URL params - passed from checkout
  const bookingId = searchParams.get("bookingId") || "";
  const status = searchParams.get("status") || "";
  
  const [bookingData, setBookingData] = useState({
    eventName: searchParams.get("eventName") || "",
    ticketType: searchParams.get("ticketType") || "",
    totalAmount: searchParams.get("totalAmount") || "0",
    hotelName: searchParams.get("hotelName") || "",
    roomName: searchParams.get("roomName") || "",
    transportType: searchParams.get("transportType") || "",
    transportPrice: searchParams.get("transportPrice") || "0",
    guestName: searchParams.get("guestName") || "Guest",
    guestEmail: searchParams.get("guestEmail") || "guest@email.com",
    guestPhone: searchParams.get("guestPhone") || "",
    txRef: searchParams.get("tx_ref") || ""
  });

  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // If we only got bookingId and status (e.g. from Chapa return_url), fetch the rest
    if (bookingId && !searchParams.get("totalAmount")) {
      setLoading(true);
      fetch('/api/tourist/bookings')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.bookings) {
            const b = data.bookings.find((b: any) => b._id === bookingId);
            if (b) {
              setBookingData({
                eventName: b.festival?.name || b.festival?.name_en || "EthioHub Event",
                ticketType: b.ticketType || "Standard",
                totalAmount: b.totalPrice?.toString() || "0",
                hotelName: b.hotelName || "",
                roomName: b.roomName || "",
                transportType: b.transportType || "",
                transportPrice: b.transportPrice?.toString() || "0",
                guestName: b.contactInfo?.fullName || "Guest",
                guestEmail: b.contactInfo?.email || "guest@email.com",
                guestPhone: b.contactInfo?.phone || "",
                txRef: b.paymentRef || searchParams.get("tx_ref") || ""
              });
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [bookingId, searchParams]);
  
  // Show success if bookingId exists
  const isSuccess = !!bookingId || status === "success";

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount?: string) => `ETB ${(parseFloat(amount || "0") || 0).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8" ref={printRef}>
        {isSuccess ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Payment Successful!</h1>
            <p className="text-gray-600 mb-6 text-center">
              Your booking is confirmed.
              {bookingId && <span className="block text-sm mt-1">Reference: {bookingId.slice(-8).toUpperCase()}</span>}
            </p>
            
            {/* Printable Receipt */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left print:border print:border-gray-300 print:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> BOOKING RECEIPT
                </h3>
                <button 
                  onClick={handlePrint}
                  className="print:hidden flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
              
              {/* EthioHub Header */}
              <div className="text-center pb-3 border-b border-gray-200 mb-3">
                <p className="text-xl font-serif font-bold text-primary">EthioHub</p>
                <p className="text-xs text-gray-500">Your Ethiopian Experience Partner</p>
              </div>
              
              {/* Event Info */}
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-xs text-gray-500 uppercase">Event</p>
                <p className="font-medium text-primary">{bookingData.eventName || 'EthioHub Event'}</p>
              </div>
              
              {/* Ticket Type */}
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-xs text-gray-500 uppercase">Ticket Type</p>
                <p className="font-medium text-amber-600 text-lg">{(bookingData.ticketType || 'Standard').toUpperCase()} TICKET</p>
              </div>
              
              {/* Hotel Info */}
              {bookingData.hotelName && (
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><Hotel className="w-3 h-3" /> Hotel Booking</p>
                  <p className="font-medium text-blue-600">{bookingData.hotelName}</p>
                  {bookingData.roomName && <p className="text-sm text-gray-600">Room Type: {bookingData.roomName}</p>}
                </div>
              )}
              
              {/* Transport Info */}
              {bookingData.transportType && (
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><Car className="w-3 h-3" /> Transport</p>
                  <p className="font-medium text-purple-600">{bookingData.transportType}</p>
                  {bookingData.transportPrice !== "0" && <p className="text-sm text-gray-600">{formatCurrency(bookingData.transportPrice)}</p>}
                </div>
              )}
              
              {/* User Info */}
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><User className="w-3 h-3" /> Guest Information</p>
                <p className="font-medium">{bookingData.guestName}</p>
                <p className="text-sm text-gray-600">{bookingData.guestEmail}</p>
                {bookingData.guestPhone && <p className="text-sm text-gray-600">{bookingData.guestPhone}</p>}
              </div>
              
              {/* Total */}
              <div className="flex justify-between items-center pt-2">
                <p className="font-bold text-gray-800">TOTAL PAID</p>
                <p className="font-bold text-xl text-primary">{formatCurrency(bookingData.totalAmount)}</p>
              </div>
               
              {/* Payment Reference */}
              <div className="text-center pt-4 mt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400">Payment Reference: {bookingData.txRef || (isMounted ? 'Confirmed' : '...')}</p>
                <p className="text-xs text-gray-400">Date: {isMounted ? new Date().toLocaleDateString() : '...'}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 print:hidden">
              <Link href="/dashboard/tourist/bookings" className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                View My Bookings
              </Link>
              <Link href="/" className="border border-primary text-primary px-6 py-3 rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                <Home className="w-4 h-4" /> Return Home
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">!</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Issue</h1>
            <p className="text-gray-600 mb-6">
              There was an issue. Please check your booking status.
            </p>
            <Link href="/dashboard/tourist/bookings" className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
              View My Bookings
            </Link>
          </>
        )}
      </div>
    </div>
  );
}