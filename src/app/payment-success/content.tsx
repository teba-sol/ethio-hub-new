"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Ticket, Hotel, Car, User, Printer, Home } from "lucide-react";

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams()!;
  const printRef = useRef<HTMLDivElement>(null);

  // Get booking/order info from URL params - passed from checkout or Chapa
  const bookingId = searchParams.get("bookingId") || "";
  const orderId = searchParams.get("orderId") || "";
  const status = searchParams.get("status") || "";
  const paymentStatus = searchParams.get("payment") || "";
  const type = orderId ? "order" : "booking";

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
    txRef: searchParams.get("tx_ref") || "",
    shippingFee: "0"
  });

  const [orderItems, setOrderItems] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [countdown, setCountdown] = useState(12);

  useEffect(() => {
    setIsMounted(true);
    
    // Auto redirect timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect
          window.location.href = orderId ? "/products" : "/dashboard/tourist/bookings";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId]);

  useEffect(() => {
    const txRefFromUrl = searchParams.get("tx_ref") || searchParams.get("txRef") || "";
    const isCart = searchParams.get("cart") === "true" || searchParams.get("amp;cart") === "true" || !!txRefFromUrl;

    // If we only got orderId/txRef and status, fetch order details
    if ((orderId || txRefFromUrl) && !searchParams.get("totalAmount")) {
      setLoading(true);
      const fetchUrl = txRefFromUrl
        ? `/api/tourist/orders?txRef=${txRefFromUrl}`
        : `/api/tourist/orders?id=${orderId}`;

      fetch(fetchUrl, { credentials: 'include' })
        .then(res => res.ok ? res.json() : Promise.reject(res.status))
        .then(data => {
          if (data.success) {
            if (isCart && data.orders && data.orders.length > 0) {
              setOrderItems(data.orders);
              const o = data.orders[0];
              const subtotal = data.orders.reduce((sum: number, ord: any) => sum + ord.totalPrice, 0);
              const totalShipping = data.orders.reduce((sum: number, ord: any) => sum + ord.shippingFee, 0);
              
              setBookingData({
                eventName: `${data.orders.length} Products in Bag`,
                ticketType: "Multiple Items",
                totalAmount: (subtotal + totalShipping).toString(),
                hotelName: "",
                roomName: "",
                transportType: "",
                transportPrice: "0",
                guestName: o.contactInfo?.fullName || "Customer",
                guestEmail: o.contactInfo?.email || "customer@email.com",
                guestPhone: o.contactInfo?.phone || "",
                txRef: o.paymentRef || txRefFromUrl,
                shippingFee: totalShipping.toString(),
              });
            } else if (data.order) {
              const o = data.order;
              setOrderItems([o]);
              setBookingData({
                eventName: o.product?.name || "EthioHub Product",
                ticketType: `Quantity: ${o.quantity}`,
                totalAmount: (o.totalPrice + (o.shippingFee || 0)).toString(),
                hotelName: "",
                roomName: "",
                transportType: "",
                transportPrice: "0",
                guestName: o.contactInfo?.fullName || "Customer",
                guestEmail: o.contactInfo?.email || "customer@email.com",
                guestPhone: o.contactInfo?.phone || "",
                txRef: o.paymentRef || txRefFromUrl,
                shippingFee: (o.shippingFee || 0).toString()
              });
            }
          }
        })
        .catch(err => console.error("Error fetching order:", err))
        .finally(() => setLoading(false));
    }

    // If we only got bookingId and status (e.g. from Chapa return_url), fetch the rest
    if (bookingId && !searchParams.get("totalAmount")) {
      setLoading(true);
      fetch(`/api/tourist/bookings/${bookingId}`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : Promise.reject(res.status))
        .then(data => {
          const b = data.booking || (data.bookings ? data.bookings.find((b: any) => b._id === bookingId) : null);
          if (b) {
            setBookingData({
              eventName: b.festival?.name || b.festival?.name_en || b.receipt?.eventName || "EthioHub Event",
              ticketType: b.ticketType || b.ticketTypeName || "Standard",
              totalAmount: (b.totalPrice || b.receipt?.totalPaid || 0).toString(),
              hotelName: b.bookingDetails?.room?.hotelName || b.receipt?.hotel?.name || "",
              roomName: b.bookingDetails?.room?.roomName || b.receipt?.hotel?.roomType || "",
              transportType: b.bookingDetails?.transport?.type || b.receipt?.transport?.type || "",
              transportPrice: (b.bookingDetails?.transport?.price || b.receipt?.transport?.price || 0).toString(),
              guestName: b.contactInfo?.fullName || b.receipt?.userInfo?.fullName || "Guest",
              guestEmail: b.contactInfo?.email || b.receipt?.userInfo?.email || "guest@email.com",
              guestPhone: b.contactInfo?.phone || b.receipt?.userInfo?.phone || "",
              txRef: b.paymentRef || searchParams.get("tx_ref") || "",
              shippingFee: "0"
            });
          }
        })
        .catch(() => {
          // Fallback: try fetching all bookings list
          fetch('/api/tourist/bookings', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.success && data.bookings) {
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
                    txRef: b.paymentRef || searchParams.get("tx_ref") || "",
                    shippingFee: "0"
                  });
                }
              }
            })
            .finally(() => setLoading(false));
          return;
        })
        .finally(() => setLoading(false));
    }
  }, [bookingId, orderId, searchParams]);

  // Show success if bookingId/orderId exists or status is success
  const isSuccess = !!bookingId || !!orderId || status === "success" || paymentStatus === "success";

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount?: string) => `ETB ${(parseFloat(amount || "0") || 0).toLocaleString('en-US')}`;

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
              Your {type} is confirmed.
              {bookingId && <span className="block text-sm mt-1">Reference: {bookingId.slice(-8).toUpperCase()}</span>}
              {orderId && <span className="block text-sm mt-1">Order Ref: {orderId.slice(-8).toUpperCase()}</span>}
            </p>

            <div className="mb-6 text-center">
              <span className="px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100">
                Redirecting in {countdown} seconds...
              </span>
            </div>

            {/* Printable Receipt */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left print:border print:border-gray-300 print:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> {type.toUpperCase()} RECEIPT
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

              {/* Product/Event Info */}
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-xs text-gray-500 uppercase">{type === 'order' ? 'Product' : 'Event'}</p>
                <p className="font-medium text-primary">{bookingData.eventName || (type === 'order' ? 'EthioHub Product' : 'EthioHub Event')}</p>
              </div>

              {/* Details / Items List */}
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-2">{type === 'order' ? 'Items Purchased' : 'Ticket Type'}</p>
                
                {type === 'order' && orderItems.length > 0 ? (
                  <div className="space-y-3">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4 bg-white p-2 rounded-lg border border-gray-100">
                        <div>
                          <p className="font-bold text-sm text-primary line-clamp-1">{item.product?.name || 'Product'}</p>
                          <p className="text-[10px] text-gray-500 uppercase">Qty: {item.quantity} × {formatCurrency(item.unitPrice?.toString())}</p>
                        </div>
                        <p className="font-black text-xs text-secondary whitespace-nowrap">{formatCurrency(item.totalPrice?.toString())}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-medium text-amber-600 text-lg">
                    {(bookingData.ticketType || 'Standard').toUpperCase() + (type === 'booking' ? ' TICKET' : '')}
                  </p>
                )}
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
                <p className="text-xs text-gray-500 uppercase flex items-center gap-1"><User className="w-3 h-3" /> {type === 'order' ? 'Customer' : 'Guest'} Information</p>
                <p className="font-medium">{bookingData.guestName}</p>
                <p className="text-sm text-gray-600">{bookingData.guestEmail}</p>
                {bookingData.guestPhone && <p className="text-sm text-gray-600">{bookingData.guestPhone}</p>}
              </div>

              {/* Pricing Details for Products */}
              {type === 'order' && parseFloat(bookingData.shippingFee) > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-gray-500">Items Subtotal</p>
                    <p className="font-medium text-gray-700">
                      {formatCurrency((parseFloat(bookingData.totalAmount) - parseFloat(bookingData.shippingFee)).toString())}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-gray-500">Shipping Fee</p>
                    <p className="font-medium text-gray-700">{formatCurrency(bookingData.shippingFee)}</p>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
                <p className="font-bold text-gray-800">TOTAL PAID</p>
                <p className="font-bold text-xl text-primary">{formatCurrency(bookingData.totalAmount)}</p>
              </div>

              {/* Payment Reference */}
              <div className="text-center pt-4 mt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400">Payment Reference: {bookingData.txRef || (isMounted ? 'Confirmed' : '...')}</p>
                <p className="text-xs text-gray-400">Date: {isMounted ? new Date().toLocaleDateString('en-US') : '...'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 print:hidden">
              <Link 
                href={type === 'order' ? "/products" : "/dashboard/tourist/bookings"} 
                className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                {type === 'order' ? "Continue Shopping" : "View My Bookings"}
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
              There was an issue. Please check your {type} status.
            </p>
            <Link 
              href={type === 'order' ? "/products" : "/dashboard/tourist/bookings"} 
              className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              {type === 'order' ? "Return to Products" : "View My Bookings"}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}