import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MapIcon, Ticket, ShoppingCart, Heart, User as UserIcon,
  Search, Plus, Package, Calendar, CreditCard, ChevronRight,
  ShieldCheck, HelpCircle, FileText, Mail, X, User, Phone,
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Button, Input, Badge } from '../UI';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import apiClient from '../../lib/apiClient';

// Mock Data
interface PaymentData {
  _id: string;
  product?: { name?: string; _id?: string; images?: string[] };
  paymentStatus?: string;
  status?: string;
  totalPrice?: number;
  paymentMethod?: string;
  paymentRef?: string;
  paymentDate?: string;
  updatedAt?: string;
  createdAt?: string;
  artisan?: { name?: string; email?: string };
  artisanProfile?: { businessName?: string; userId?: { email?: string } };
  quantity?: number;
  contactInfo?: { fullName?: string; email?: string; phone?: string };
  ticketType?: string;
  bookingDetails?: {
    room?: { hotelName?: string; roomPrice?: number; hotelRefCode?: string; roomId?: string };
    transport?: { type?: string; price?: number; transportRefCode?: string; transportId?: string };
  };
}

const MOCK_BOOKINGS = [
  { id: 'BKG-5542', event: 'Timket Festival 2024', date: 'Jan 19, 2024', location: 'Gondar, Ethiopia', tickets: 2, status: 'Confirmed', image: 'https://images.unsplash.com/photo-1566998826769-e58f276226b9?q=80&w=200' },
  { id: 'BKG-3321', event: 'Meskel Celebration', date: 'Sep 27, 2023', location: 'Addis Ababa', tickets: 1, status: 'Completed', image: 'https://images.unsplash.com/photo-1533551030643-dca0a68d8311?q=80&w=200' },
];

export const TouristBookingsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await apiClient.get('/api/tourist/bookings');
        console.log('Bookings API response:', response);
        if (response.success) {
          setBookings(response.bookings || []);
        } else {
          setError(response.message || 'Failed to fetch bookings');
        }
      } catch (err: any) {
        console.error('Bookings fetch error:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(bookingId);
    try {
      const response = await apiClient.put('/api/tourist/bookings', {
        bookingId,
        action: 'cancel'
      });
      if (response.success) {
        setBookings(prev => prev.map((b: any) => 
          b._id === bookingId ? { ...b, status: 'cancelled' } : b
        ));
        setSelectedBooking(null);
      } else {
        alert(response.message || 'Failed to cancel booking');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success" className="capitalize">{status}</Badge>;
      case 'pending':
        return <Badge variant="info" className="capitalize">{status}</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="capitalize">{status}</Badge>;
      case 'completed':
        return <Badge variant="success" className="capitalize">{status}</Badge>;
      default:
        return <Badge className="capitalize">{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter((booking: any) => {
    const eventName = booking.festival?.name || '';
    const matchesSearch = eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-serif font-bold text-primary">My Festival Passes</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              placeholder="Search bookings..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <select 
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10 w-full sm:w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      
      <div className="grid gap-6">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking: any) => (
            <div key={booking._id} className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
              <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0">
                <img 
                  src={booking.festival?.coverImage || 'https://images.unsplash.com/photo-1566998826769-e58f276226b9?q=80&w=200'} 
                  alt={booking.festival?.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-primary">{booking.festival?.name || 'Festival'}</h3>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="flex items-center text-gray-500 text-sm mt-2 gap-4">
                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> 
                      {booking.festival?.startDate ? new Date(booking.festival.startDate).toLocaleDateString() : 'Date TBD'}
                    </span>
                    <span className="flex items-center"><MapIcon className="w-4 h-4 mr-1" /> {booking.festival?.locationName || 'Location TBD'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <div className="text-sm font-medium text-gray-600">
                    <span className="text-primary font-bold">{booking.quantity}</span> Ticket(s) • 
                    <span className="text-primary font-bold ml-1">ETB {booking.totalPrice}</span>
                    <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full capitalize">{booking.ticketType}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedBooking(booking)}>View Details</Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <p className="text-gray-500">No bookings found.</p>
            <Link href="/festivals" className="text-primary underline mt-2 inline-block">Browse Festivals</Link>
          </div>
        )}
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedBooking(null)}>
          <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-300 bg-white rounded-[32px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedBooking(null)} className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full">
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div className="h-40 relative">
              <img src={selectedBooking.festival?.coverImage || 'https://images.unsplash.com/photo-1566998826769-e58f276226b9?q=80&w=400'} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                <h3 className="text-white font-bold text-xl">{selectedBooking.festival?.name}</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Booking ID</p>
                  <p className="font-mono text-sm font-bold">#{selectedBooking._id?.slice(-8).toUpperCase()}</p>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div><p className="text-xs text-gray-400 uppercase">Event Date</p><p className="font-bold text-sm">{selectedBooking.festival?.startDate ? new Date(selectedBooking.festival.startDate).toLocaleDateString() : 'TBD'}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Location</p><p className="font-bold text-sm truncate">{selectedBooking.festival?.locationName || 'TBD'}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Ticket Type</p><p className="font-bold text-sm capitalize">{selectedBooking.ticketType}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Quantity</p><p className="font-bold text-sm">{selectedBooking.quantity} Ticket(s)</p></div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <p className="text-xs text-gray-400 uppercase">Contact Information</p>
                <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-gray-400" /><span className="font-medium">{selectedBooking.contactInfo?.fullName || 'N/A'}</span></div>
                <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span className="font-medium">{selectedBooking.contactInfo?.email || 'N/A'}</span></div>
                <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span className="font-medium">{selectedBooking.contactInfo?.phone || 'N/A'}</span></div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <p className="text-xs text-gray-400 uppercase font-bold">Price Breakdown</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {selectedBooking.ticketType === 'standard' ? 'Standard Ticket' : 
                     selectedBooking.ticketType === 'vip' ? 'VIP Ticket' : 'Early Bird Ticket'} 
                    (x{selectedBooking.quantity})
                  </span>
                  <span className="font-bold">ETB {(selectedBooking.ticketPrice || 0).toLocaleString()}</span>
                </div>
                
                {selectedBooking.hotelName && (
                  <div className="flex flex-col border-t border-gray-100 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Hotel: {selectedBooking.hotelName}</span>
                      <span className="font-bold">ETB {(selectedBooking.roomPrice || 0).toLocaleString()}</span>
                    </div>
                    {(selectedBooking.hotelRefCode || selectedBooking.bookingDetails?.room?.hotelRefCode) && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase w-fit mt-1">
                        Ref: {selectedBooking.hotelRefCode || selectedBooking.bookingDetails?.room?.hotelRefCode}
                      </span>
                    )}
                  </div>
                )}
                
                {selectedBooking.transportType && (
                  <div className="flex flex-col border-t border-gray-100 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Transport: {selectedBooking.transportType}</span>
                      <span className="font-bold">ETB {(selectedBooking.transportPrice || 0).toLocaleString()}</span>
                    </div>
                    {(selectedBooking.transportRefCode || selectedBooking.bookingDetails?.transport?.transportRefCode) && (
                      <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold uppercase w-fit mt-1">
                        Ref: {selectedBooking.transportRefCode || selectedBooking.bookingDetails?.transport?.transportRefCode}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-2">
                  <span className="font-bold text-primary uppercase text-xs">Total Paid</span>
                  <span className="font-bold text-xl text-primary underline decoration-primary/30 decoration-2 underline-offset-4">
                    ETB {selectedBooking.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-400">
                <span>Booked on: {new Date(selectedBooking.createdAt).toLocaleDateString()}</span>
                <span className={`capitalize ${selectedBooking.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>Payment: {selectedBooking.paymentStatus}</span>
              </div>
               
              {selectedBooking.status === 'confirmed' && selectedBooking.paymentStatus === 'paid' && (
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => window.print()}>
                  Download Receipt
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TouristOrdersView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'bank' | 'telebirr'>('telebirr');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [telebirrNumber, setTelebirrNumber] = useState('');
  const [refundProof, setRefundProof] = useState<File | null>(null);
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiClient.get('/api/tourist/orders');
        if (response.success) {
          setOrders(response.orders || []);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();

    // Check for highlight parameter
    const params = new URLSearchParams(window.location.search);
    const highlight = params.get('highlight');
    if (highlight) {
      setHighlightOrderId(highlight);
      setTimeout(() => {
        const element = document.getElementById(`order-${highlight}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-primary');
          setTimeout(() => element.classList.remove('ring-2', 'ring-primary'), 3000);
        }
      }, 500);
    }
  }, []);

  const filteredOrders = orders.filter(order => {
    const orderId = order._id?.slice(-8).toUpperCase() || '';
    const productName = order.product?.name || '';
    const matchesSearch = orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          productName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getOrderStatusBadge = (status: string, paymentStatus: string, refundRequest?: any) => {
    if (refundRequest) {
      const styles: Record<string, { variant: string; label: string }> = {
        'pending': { variant: 'warning', label: 'Refund Requested' },
        'processing': { variant: 'info', label: 'Refund Processing' },
        'completed': { variant: 'success', label: 'Refund Completed' },
        'rejected': { variant: 'error', label: 'Refund Rejected' },
      };
      const style = styles[refundRequest.status] || { variant: 'secondary', label: 'Refund Update' };
      return <Badge variant={style.variant as any} className="capitalize">{style.label}</Badge>;
    }

    const statusStyles: Record<string, { variant: string; label: string }> = {
      'Awaiting Payment': { variant: 'info', label: 'Paid' },
      'Pending': { variant: 'warning', label: 'Pending' },
      'Paid': { variant: 'info', label: 'Paid - Preparing' },
      'Ready for Pickup': { variant: 'purple', label: 'Ready for Pickup' },
      'Shipped': { variant: 'primary', label: 'In Transit' },
      'Delivered': { variant: 'success', label: 'Delivered' },
      'Returned': { variant: 'secondary', label: 'Returned' },
      'Cancelled': { variant: 'error', label: 'Cancelled' },
    };

    if (paymentStatus === 'refunded') {
      return <Badge variant="error" className="capitalize">Refunded</Badge>;
    }

    const normalizedStatus = status === 'Awaiting Payment' ? 'Paid' : status;
    const style = statusStyles[normalizedStatus] || { variant: 'secondary', label: normalizedStatus };
    return <Badge variant={style.variant as any} className="capitalize">{style.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-serif font-bold text-primary">My Craft Orders</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              placeholder="Search orders..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <select 
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10 w-full sm:w-auto"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option>All Time</option>
            <option>Last 30 Days</option>
            <option>Last 6 Months</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div id={`order-${order._id}`} key={order._id} className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                <img src={order.product?.images?.[0] || '/placeholder-product.jpg'} alt="Product" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-primary text-lg">#{order._id?.slice(-8).toUpperCase()}</h3>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  {getOrderStatusBadge(order.status, order.paymentStatus, order.refundRequest)}
                </div>
                <p className="text-gray-600 text-sm mb-4">{order.product?.name || 'Product'}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <span className="font-bold text-primary">ETB {order.totalPrice?.toLocaleString()}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedOrder(order)}>View Details</Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <p className="text-gray-500">No orders found.</p>
            <Link href="/products" className="text-primary underline mt-2 inline-block">Browse Products</Link>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif font-bold text-primary">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Plus className="w-6 h-6 rotate-45 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                  <img src={selectedOrder.product?.images?.[0] || '/placeholder-product.jpg'} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-primary">#{selectedOrder._id?.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-gray-500">{new Date(selectedOrder.createdAt).toLocaleString('en-ET', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  {getOrderStatusBadge(selectedOrder.status, selectedOrder.paymentStatus, selectedOrder.refundRequest)}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 mb-1">Product</h4>
                  <p className="text-sm text-gray-600 font-medium">{selectedOrder.product?.name || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Quantity: {selectedOrder.quantity} x ETB {(selectedOrder.product?.discountPrice || selectedOrder.product?.price)?.toLocaleString()}</p>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-gray-900 mb-1">Artisan</h4>
                  <p className="text-sm text-gray-600">{selectedOrder.artisan?.name || selectedOrder.artisanProfile?.businessName || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.artisan?.email || selectedOrder.artisanProfile?.userId?.email || 'N/A'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 mb-1">Payment Method</h4>
                    <p className="text-sm text-gray-600 capitalize">{selectedOrder.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 mb-1">Payment Status</h4>
                    <p className="text-sm text-gray-600 capitalize">{selectedOrder.paymentStatus || 'pending'}</p>
                  </div>
                </div>

                {selectedOrder.contactInfo && (
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 mb-1">Contact Information</h4>
                    <p className="text-sm text-gray-600">{selectedOrder.contactInfo.fullName}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.contactInfo.email}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.contactInfo.phone}</p>
                  </div>
                )}

                {selectedOrder.shippingFee > 0 && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <h4 className="font-bold text-sm text-emerald-800 mb-2">Shipping Details</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-700">Shipping Fee:</span>
                      <span className="font-bold text-emerald-800">ETB {selectedOrder.shippingFee}</span>
                    </div>
                    {selectedOrder.distanceKm > 0 && (
                      <p className="text-xs text-emerald-600 mt-1">Distance: {selectedOrder.distanceKm} km</p>
                    )}
                    {selectedOrder.deliveryGuyInfo && (
                      <div className="mt-3 pt-2 border-t border-emerald-100">
                        <p className="text-xs font-bold text-emerald-700 mb-1">Delivery Person</p>
                        <p className="text-sm text-emerald-800">{selectedOrder.deliveryGuyInfo.name}</p>
                        <p className="text-xs text-emerald-600">{selectedOrder.deliveryGuyInfo.phone}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Product Total:</span>
                    <span className="font-medium">ETB {selectedOrder.totalPrice?.toLocaleString()}</span>
                  </div>
                  {selectedOrder.shippingFee > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Shipping:</span>
                      <span className="font-medium">ETB {selectedOrder.shippingFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-900">Total Paid</span>
                    <span className="font-bold text-xl text-primary">ETB {(selectedOrder.totalPrice + (selectedOrder.shippingFee || 0))?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

                {selectedOrder.refundRequest && (
                  <div className={`p-4 rounded-xl border ${
                    selectedOrder.refundRequest.status === 'completed' ? 'bg-emerald-50 border-emerald-100' :
                    selectedOrder.refundRequest.status === 'rejected' ? 'bg-red-50 border-red-100' :
                    selectedOrder.refundRequest.status === 'processing' ? 'bg-blue-50 border-blue-100' :
                    'bg-amber-50 border-amber-100'
                  }`}>
                    <h4 className={`font-bold text-sm mb-1 ${
                      selectedOrder.refundRequest.status === 'completed' ? 'text-emerald-800' :
                      selectedOrder.refundRequest.status === 'rejected' ? 'text-red-800' :
                      selectedOrder.refundRequest.status === 'processing' ? 'text-blue-800' :
                      'text-amber-800'
                    }`}>Refund Status: {selectedOrder.refundRequest.status.charAt(0).toUpperCase() + selectedOrder.refundRequest.status.slice(1)}</h4>
                    <p className={`text-sm ${
                      selectedOrder.refundRequest.status === 'completed' ? 'text-emerald-600' :
                      selectedOrder.refundRequest.status === 'rejected' ? 'text-red-600' :
                      selectedOrder.refundRequest.status === 'processing' ? 'text-blue-600' :
                      'text-amber-600'
                    }`}>
                      {selectedOrder.refundRequest.status === 'completed' ? 'The refund has been successfully disbursed to your account.' :
                       selectedOrder.refundRequest.status === 'rejected' ? 'Your refund request was rejected by the admin.' :
                       selectedOrder.refundRequest.status === 'processing' ? 'Admin is currently processing your refund payment.' :
                       'Your refund request has been received and is awaiting review.'}
                    </p>
                    {selectedOrder.refundRequest.adminNotes && (
                      <div className="mt-2 pt-2 border-t border-black/5">
                        <p className="text-xs font-bold opacity-50 uppercase">Admin Note</p>
                        <p className="text-sm italic">{selectedOrder.refundRequest.adminNotes}</p>
                      </div>
                    )}
                  </div>
                )}

              <div className="flex gap-3 pt-2">
                {selectedOrder?.refundRequest ? (
                  <Button
                    variant="outline"
                    className={`flex-1 cursor-not-allowed ${
                      selectedOrder.refundRequest.status === 'completed' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' :
                      selectedOrder.refundRequest.status === 'rejected' ? 'border-red-200 text-red-600 bg-red-50' :
                      'border-amber-200 text-amber-600 bg-amber-50'
                    }`}
                    disabled
                  >
                    Refund {selectedOrder.refundRequest.status.charAt(0).toUpperCase() + selectedOrder.refundRequest.status.slice(1)}
                  </Button>
                ) : selectedOrder?.status !== 'Delivered' ? (
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setShowRefundModal(true);
                      setRefundReason('');
                      setRefundMethod('telebirr');
                      setBankName('');
                      setAccountNumber('');
                      setTelebirrNumber('');
                      setRefundProof(null);
                      setRefundError('');
                    }}
                  >
                    Request Refund
                  </Button>
                ) : null}
                <Button variant="outline" className="flex-1" onClick={() => window.print()}>Download Receipt</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {showRefundModal && selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRefundModal(false); }}
        >
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-serif font-bold text-primary">Request Refund</h3>
                <p className="text-sm text-gray-500">Order #{selectedOrder._id?.slice(-8).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45 text-gray-500" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="font-bold text-gray-800">{selectedOrder.product?.name}</p>
                <p className="text-sm text-gray-500">Amount: <span className="font-bold text-primary">ETB {selectedOrder.totalPrice?.toLocaleString()}</span></p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Refund</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                >
                  <option value="">Select a reason...</option>
                  <option value="Item not as described">Item not as described</option>
                  <option value="Item damaged or broken">Item damaged or broken</option>
                  <option value="Delivery took too long">Delivery took too long</option>
                  <option value="Wrong item received">Wrong item received</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Refund Payment Method</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRefundMethod('telebirr')}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      refundMethod === 'telebirr'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    Telebirr
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundMethod('bank')}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      refundMethod === 'bank'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    Bank Transfer
                  </button>
                </div>
              </div>

              {refundMethod === 'telebirr' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Telebirr Number</label>
                  <input
                    type="tel"
                    value={telebirrNumber}
                    onChange={(e) => setTelebirrNumber(e.target.value)}
                    placeholder="09xxxxxxxx"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              )}

              {refundMethod === 'bank' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Commercial Bank of Ethiopia"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="xxxxxxxxxxxx"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Upload Proof (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setRefundProof(e.target.files?.[0] || null)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                />
                <p className="text-xs text-gray-400 mt-1">Screenshot of what you received vs what you ordered</p>
              </div>

              {refundError && (
                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{refundError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRefundModal(false)}
                  disabled={submittingRefund}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 border-red-600"
                  onClick={async () => {
                    if (!refundReason) {
                      setRefundError('Please select a reason for the refund.');
                      return;
                    }
                    if (refundMethod === 'telebirr' && !telebirrNumber) {
                      setRefundError('Please enter your Telebirr number.');
                      return;
                    }
                    if (refundMethod === 'bank' && (!bankName || !accountNumber)) {
                      setRefundError('Please enter your bank details.');
                      return;
                    }
                    setSubmittingRefund(true);
                    setRefundError('');
                    try {
                      const formData = new FormData();
                      formData.append('orderId', selectedOrder._id);
                      formData.append('reason', refundReason);
                      formData.append('refundMethod', refundMethod);
                      if (refundMethod === 'telebirr') {
                        formData.append('telebirrNumber', telebirrNumber);
                      } else {
                        formData.append('bankName', bankName);
                        formData.append('accountNumber', accountNumber);
                      }
                      if (refundProof) {
                        formData.append('image', refundProof);
                      }

                      const res = await fetch('/api/tourist/refund', {
                        method: 'POST',
                        credentials: 'include',
                        body: formData,
                      });
                      const data = await res.json();
                      if (data.success) {
                        setShowRefundModal(false);
                        setSelectedOrder({ ...selectedOrder, status: 'Returned' });
                        const updatedOrders = orders.map(o =>
                          o._id === selectedOrder._id ? { ...o, status: 'Returned' } : o
                        );
                        setOrders(updatedOrders);
                      } else {
                        setRefundError(data.message || 'Failed to submit refund request.');
                      }
                    } catch (err: any) {
                      setRefundError(err?.message || 'Error submitting refund request.');
                    } finally {
                      setSubmittingRefund(false);
                    }
                  }}
                  isLoading={submittingRefund}
                >
                  Submit Refund Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Track Order Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setTrackingOrder(null)}>
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-serif font-bold text-primary">Track Order</h3>
                <p className="text-sm text-gray-500">{trackingOrder.id}</p>
              </div>
              <button onClick={() => setTrackingOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Plus className="w-6 h-6 rotate-45 text-gray-500" />
              </button>
            </div>

            <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              <div className="relative">
                <div className="absolute -left-[29px] w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <h4 className="font-bold text-primary">Order Delivered</h4>
                <p className="text-xs text-gray-500">Oct 26, 2023 - 2:30 PM</p>
                <p className="text-sm text-gray-600 mt-1">Package delivered to recipient.</p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-[29px] w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <h4 className="font-bold text-primary">Out for Delivery</h4>
                <p className="text-xs text-gray-500">Oct 26, 2023 - 8:15 AM</p>
                <p className="text-sm text-gray-600 mt-1">Driver is on the way.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[29px] w-6 h-6 rounded-full bg-gray-200 border-4 border-white shadow-sm"></div>
                <h4 className="font-bold text-gray-400">Shipped</h4>
                <p className="text-xs text-gray-400">Oct 25, 2023 - 4:00 PM</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[29px] w-6 h-6 rounded-full bg-gray-200 border-4 border-white shadow-sm"></div>
                <h4 className="font-bold text-gray-400">Order Confirmed</h4>
                <p className="text-xs text-gray-400">Oct 24, 2023 - 10:23 AM</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-primary">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Estimated Delivery</p>
                  <p className="font-bold text-primary">Arrived on Oct 26</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TouristPaymentsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        let allPayments: any[] = [];
        
        // Fetch event bookings
        try {
          const bookingsResponse: any = await apiClient.get('/api/tourist/bookings');
          if (bookingsResponse.success && bookingsResponse.bookings) {
            const paidBookings = bookingsResponse.bookings
              .filter((b: any) => b.status === 'confirmed' || b.paymentStatus === 'paid')
              .map((b: any) => ({
                _id: b._id,
                paymentRef: b.paymentRef,
                paymentDate: b.paymentDate || b.updatedAt,
                product: { name: b.festival?.name_en || b.festival?.name || 'Event' },
                totalPrice: b.totalPrice,
                paymentMethod: b.paymentMethod,
                status: b.status,
                paymentStatus: b.paymentStatus,
                receipt: b.receipt,
                bookingDetails: b.bookingDetails,
                ticketType: b.ticketType,
              }));
            allPayments = [...allPayments, ...paidBookings];
          }
        } catch (e) {
          console.log('No bookings found');
        }
        
        // Also fetch regular orders
        try {
          const ordersResponse: any = await apiClient.get('/api/tourist/orders');
          if (ordersResponse.success && ordersResponse.orders) {
            const paidOrders = ordersResponse.orders.filter((order: any) => 
              order.paymentStatus === 'paid' || order.status === 'confirmed'
            );
            allPayments = [...allPayments, ...paidOrders];
          }
        } catch (e) {
          console.log('No orders found');
        }
        
        setPayments(allPayments);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching payments:', error);
        setError('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const orderId = `#${payment._id?.slice(-8).toUpperCase()}` || '';
    const productName = payment.product?.name || '';
    const matchesSearch = orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          productName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-serif font-bold text-primary">Payment History</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              placeholder="Search payments..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <select 
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10 w-full sm:w-auto"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option>All Time</option>
            <option>Last 30 Days</option>
            <option>Last 6 Months</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-6 font-bold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th className="p-6 font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-6 font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="p-6 font-bold text-gray-500 uppercase tracking-wider">Method</th>
                <th className="p-6 font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="p-6 font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-6 font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 font-mono font-medium text-gray-600">{payment.paymentRef || payment._id?.slice(-8).toUpperCase()}</td>
                    <td className="p-6 text-gray-600">{new Date(payment.paymentDate || payment.updatedAt || payment.createdAt || Date.now()).toLocaleDateString()}</td>
                    <td className="p-6 font-medium text-primary">
                      <div>{payment.product?.name || 'Event'}</div>
                      {payment.ticketType && (
                        <div className="text-xs text-amber-600 font-medium">{payment.ticketType?.toUpperCase()} Ticket</div>
                      )}
                      {payment.bookingDetails?.room?.hotelName && (
                        <div className="text-xs text-blue-600">Hotel: {payment.bookingDetails.room.hotelName}</div>
                      )}
                      {payment.bookingDetails?.transport?.type && (
                        <div className="text-xs text-purple-600">Transport: {payment.bookingDetails.transport.type}</div>
                      )}
                    </td>
                    <td className="p-6 text-gray-500 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> <span className="capitalize">{payment.paymentMethod || 'N/A'}</span>
                    </td>
                    <td className="p-6 font-bold text-primary">ETB {payment.totalPrice?.toLocaleString()}</td>
                    <td className="p-6">
                      <Badge variant="success" className="bg-green-50 text-green-600 border-green-100">Success</Badge>
                    </td>
                    <td className="p-6">
                      <Link href={`/payment-success?orderId=${payment._id}&status=success`} target="_blank">
                        <Button size="sm" variant="outline" className="text-xs">View Receipt</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    No payments found. Complete a purchase to see your payment history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const TouristSettingsView: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  // Get profile from user context
  const touristProfile = (user as any)?.touristProfile;
  
  // Initialize form from user context - no loading state
  const [profileForm, setProfileForm] = React.useState(() => ({
    name: user?.name || '',
    phone: touristProfile?.phone || '',
    country: touristProfile?.country || '',
    nationality: touristProfile?.nationality || '',
    dateOfBirth: touristProfile?.dateOfBirth || '',
    profileImage: touristProfile?.profileImage || ''
  }));
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        const newImageUrl = data.url;
        setProfileForm(prev => ({ ...prev, profileImage: newImageUrl }));
        
        // Save the profile image immediately to the backend
        const saveResponse = await fetch('/api/tourist/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...profileForm,
            profileImage: newImageUrl
          }),
          credentials: 'include'
        });
        
        const saveData = await saveResponse.json();
        if (saveData.success) {
          updateUser({
            ...user,
            touristProfile: {
              ...(user as any)?.touristProfile,
              profileImage: newImageUrl
            }
          } as any);
          triggerSuccess('Profile image updated successfully!');
        } else {
          setErrorMessage(saveData.message || 'Failed to save profile image');
        }
      } else {
        setErrorMessage('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setErrorMessage('');
    
    try {
      const bodyData = {
        name: profileForm.name,
        phone: profileForm.phone,
        country: profileForm.country,
        nationality: profileForm.nationality,
        dateOfBirth: profileForm.dateOfBirth || null,
        profileImage: profileForm.profileImage || null
      };
      
      const response = await fetch('/api/tourist/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        updateUser({
          name: profileForm.name,
          touristProfile: {
            phone: profileForm.phone,
            country: profileForm.country,
            nationality: profileForm.nationality,
            dateOfBirth: profileForm.dateOfBirth,
            profileImage: profileForm.profileImage
          }
        } as any);
        
        triggerSuccess('Profile saved successfully!');
      } else {
        setErrorMessage(data.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus('loading');
    setErrorMessage('');

    // Basic validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus('error');
      setErrorMessage('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordStatus('error');
      setErrorMessage('Password must be at least 8 characters');
      return;
    }

    // Mock API call
    setTimeout(() => {
      setPasswordStatus('success');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus('idle');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }, 2000);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Success Message Pop-out */}
      {showSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">{successMessage}</span>
          </div>
        </div>
      )}

      <h2 className="text-3xl font-serif font-bold text-primary">{t('settings.accountSettings')}</h2>
      
      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-auto p-1 hover:bg-red-100 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-primary mb-6">{t('settings.profileInformation')}</h3>
            <form onSubmit={handleProfileSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label={t('settings.fullName')}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                />
                <Input label={t('settings.emailAddress')} value={user?.email || ""} disabled />
                <Input 
                  label={t('settings.phoneNumber')}
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  placeholder="+251 911 234 567"
                />
                <Input 
                  label={t('settings.country')}
                  value={profileForm.country}
                  onChange={(e) => setProfileForm({...profileForm, country: e.target.value})}
                  placeholder="Ethiopia"
                />
                <Input 
                  label={t('settings.nationality')}
                  value={profileForm.nationality}
                  onChange={(e) => setProfileForm({...profileForm, nationality: e.target.value})}
                  placeholder="Ethiopian"
                />
                <Input 
                  label={t('settings.dateOfBirth')}
                  type="date"
                  value={profileForm.dateOfBirth}
                  onChange={(e) => setProfileForm({...profileForm, dateOfBirth: e.target.value})}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.profilePhoto')}</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                      {uploadingImage ? 'Uploading...' : t('settings.chooseImage')}
                    </button>
                    {profileForm.profileImage && (
                      <span className="text-sm text-green-600">{t('settings.imageUploaded')}</span>
                    )}
                  </div>
                  {profileForm.profileImage && (
                    <div className="mt-4 w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                      <img src={profileForm.profileImage} alt={t('settings.preview')} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : t('settings.saveChanges')}
                </Button>
              </div>
            </form>
          </section>

          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-primary mb-6">{t('settings.security')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-bold text-primary">{t('settings.password')}</p>
                  <p className="text-xs text-gray-500">{t('settings.lastChanged')}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>{t('settings.update')}</Button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                <img src={profileForm.profileImage || "https://ui-avatars.com/api/?name=" + encodeURIComponent(profileForm.name || 'Tourist')} alt={t('settings.profile')} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-gray-500">{t('settings.uploadPhoto')}</p>
            </div>
          </section>
        </div>
      </div>

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-primary">Update Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Plus className="w-6 h-6 rotate-45 text-gray-500" />
              </button>
            </div>

            {passwordStatus === 'success' ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-primary">Password Updated!</h4>
                <p className="text-gray-500 text-sm">Your password has been successfully changed.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Current Password</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    required
                  />
                </div>

                {passwordStatus === 'error' && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={passwordStatus === 'loading'}>
                    {passwordStatus === 'loading' ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const TouristHelpView: React.FC = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <h2 className="text-3xl font-serif font-bold text-primary">Help Center</h2>
    
    <div className="bg-primary text-white p-6 md:p-10 rounded-[40px] shadow-xl relative overflow-hidden">
      <div className="relative z-10 max-w-xl">
        <h3 className="text-2xl font-bold mb-4">How can we assist you today?</h3>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search for articles, guides, and FAQs..." 
            className="w-full bg-white/10 border border-white/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/50 focus:bg-white/20 transition-all outline-none"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
        </div>
      </div>
      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none hidden md:block">
        <HelpCircle className="w-64 h-64 -mb-12 -mr-12" />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {[
        { icon: Package, title: 'Orders & Shipping', desc: 'Track packages, returns, and delivery info.' },
        { icon: Ticket, title: 'Bookings & Events', desc: 'Manage tickets, cancellations, and schedules.' },
        { icon: UserIcon, title: 'Account & Profile', desc: 'Login issues, password reset, and settings.' },
        { icon: CreditCard, title: 'Payments & Billing', desc: 'Refunds, charges, and payment methods.' },
        { icon: ShieldCheck, title: 'Trust & Safety', desc: 'Authenticity guarantee and secure shopping.' },
        { icon: Mail, title: 'Contact Support', desc: 'Reach out to our 24/7 customer service.' },
      ].map((item, i) => (
        <div key={i} className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
            <item.icon className="w-6 h-6 text-gray-400 group-hover:text-white" />
          </div>
          <h4 className="font-bold text-lg text-primary mb-2">{item.title}</h4>
          <p className="text-sm text-gray-500">{item.desc}</p>
        </div>
      ))}
    </div>

    <div className="bg-white p-6 md:p-10 rounded-[40px] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
      <div>
        <h3 className="text-xl font-bold text-primary mb-2">Still need help?</h3>
        <p className="text-gray-500">Our support team is available 24/7 to assist you.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Button variant="outline" className="w-full sm:w-auto">Chat with Us</Button>
        <Button className="w-full sm:w-auto">Email Support</Button>
      </div>
    </div>
  </div>
);