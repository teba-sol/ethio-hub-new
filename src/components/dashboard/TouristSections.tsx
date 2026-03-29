import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MapIcon, Ticket, ShoppingCart, Heart, User as UserIcon,
  Search, Plus, Package, Calendar, CreditCard, ChevronRight,
  ShieldCheck, HelpCircle, FileText, Mail
} from 'lucide-react';
import { Button, Input, Badge } from '../UI';
import { useAuth } from '../../context/AuthContext';

// Mock Data
const MOCK_ORDERS = [
  { id: 'ORD-7829', date: 'Oct 24, 2023', items: 'Handwoven Gabi, Coffee Set', total: 145.00, status: 'Delivered', image: 'https://images.unsplash.com/photo-1584555613497-9ecf9dd06f68?q=80&w=200' },
  { id: 'ORD-9921', date: 'Nov 02, 2023', items: 'Leather Crossbody Bag', total: 85.50, status: 'Shipped', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=200' },
  { id: 'ORD-1102', date: 'Nov 15, 2023', items: 'Silver Coptic Cross', total: 210.00, status: 'Processing', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=200' },
];

const MOCK_BOOKINGS = [
  { id: 'BKG-5542', event: 'Timket Festival 2024', date: 'Jan 19, 2024', location: 'Gondar, Ethiopia', tickets: 2, status: 'Confirmed', image: 'https://images.unsplash.com/photo-1566998826769-e58f276226b9?q=80&w=200' },
  { id: 'BKG-3321', event: 'Meskel Celebration', date: 'Sep 27, 2023', location: 'Addis Ababa', tickets: 1, status: 'Completed', image: 'https://images.unsplash.com/photo-1533551030643-dca0a68d8311?q=80&w=200' },
];

const MOCK_PAYMENTS = [
  { id: 'TXN-8821', date: 'Nov 15, 2023', description: 'Order #ORD-1102', amount: 210.00, method: 'Visa ending in 4242', status: 'Success' },
  { id: 'TXN-7732', date: 'Nov 02, 2023', description: 'Order #ORD-9921', amount: 85.50, method: 'Chapa', status: 'Success' },
  { id: 'TXN-6619', date: 'Oct 24, 2023', description: 'Order #ORD-7829', amount: 145.00, method: 'Telebirr', status: 'Success' },
  { id: 'TXN-5520', date: 'Sep 15, 2023', description: 'Booking #BKG-3321', amount: 50.00, method: 'Mastercard ending in 8821', status: 'Success' },
];

export const TouristBookingsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const filteredBookings = MOCK_BOOKINGS.filter(booking => {
    const matchesSearch = booking.event.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          booking.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
              <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0">
                <img src={booking.image} alt={booking.event} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-primary">{booking.event}</h3>
                    <Badge variant={booking.status === 'Confirmed' ? 'success' : 'info'}>{booking.status}</Badge>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm mt-2 gap-4">
                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {booking.date}</span>
                    <span className="flex items-center"><MapIcon className="w-4 h-4 mr-1" /> {booking.location}</span>
                  </div>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <div className="text-sm font-medium text-gray-600">
                    <span className="text-primary font-bold">{booking.tickets}</span> Ticket(s)
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedBooking(booking)}>View Ticket</Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <p className="text-gray-500">No bookings found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Professional Ticket Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedBooking(null)}>
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            
            {/* Ticket Container */}
            <div className="bg-white rounded-[32px] shadow-2xl relative max-h-[80vh] overflow-y-auto overflow-x-hidden">
              
              {/* Decorative Circles for "Ticket" look */}
              <div className="absolute top-[65%] -left-4 w-8 h-8 bg-[#7f7f7f] rounded-full z-10"></div>
              <div className="absolute top-[65%] -right-4 w-8 h-8 bg-[#7f7f7f] rounded-full z-10"></div>

              {/* Header Image */}
              <div className="h-56 relative rounded-t-[32px] overflow-hidden">
                <img src={selectedBooking.image} alt={selectedBooking.event} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-8">
                  <div className="w-full">
                    <div className="flex justify-between items-end mb-2">
                       <Badge size="sm" variant={selectedBooking.status === 'Confirmed' ? 'success' : 'info'} className="border-none shadow-lg backdrop-blur-md bg-white/20 text-white">
                        {selectedBooking.status}
                      </Badge>
                      <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg">
                         <Ticket className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white leading-tight font-serif">{selectedBooking.event}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedBooking(null)} 
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-all"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              {/* Ticket Body */}
              <div className="p-8 pb-10 bg-white">
                <div className="grid grid-cols-2 gap-y-8 gap-x-4 mb-8">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5">Date</p>
                    <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                      <Calendar className="w-4 h-4 text-secondary" />
                      {selectedBooking.date}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5">Time</p>
                    <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                      <Package className="w-4 h-4 text-secondary" />
                      09:00 AM
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5">Location</p>
                    <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                      <MapIcon className="w-4 h-4 text-secondary" />
                      {selectedBooking.location}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5">Guest</p>
                    <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                      <UserIcon className="w-4 h-4 text-secondary" />
                      Tourist User
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5">Admit</p>
                    <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                      <Ticket className="w-4 h-4 text-secondary" />
                      {selectedBooking.tickets} Person(s)
                    </div>
                  </div>
                </div>

                {/* Perforated Line */}
                <div className="border-t-2 border-dashed border-gray-200 -mx-8 mb-8 relative"></div>

                {/* QR Code Section */}
                <div className="flex flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                     <p className="text-xs text-gray-400 mb-1">Booking Reference</p>
                     <p className="font-mono text-xl font-bold text-primary tracking-wider">{selectedBooking.id}</p>
                     <p className="text-[10px] text-gray-400 mt-2">Scan this code at the entrance</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm shrink-0">
                    <div className="w-24 h-24 bg-gray-900 rounded-lg flex items-center justify-center text-white">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 opacity-50"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><rect x="14" y="14" width="3" height="3"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-gray-50 p-6 flex gap-3 border-t border-gray-100 rounded-b-[32px]">
                <Button className="flex-1 shadow-lg shadow-primary/20 rounded-xl" leftIcon={Package}>Download</Button>
                <Button variant="outline" className="flex-1 bg-white rounded-xl" leftIcon={Calendar}>Calendar</Button>
              </div>
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

  const filteredOrders = MOCK_ORDERS.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.items.toLowerCase().includes(searchTerm.toLowerCase());
    // In a real app, we would parse the date and compare. 
    // For this mock, we'll just return true for time filter as dates are strings.
    return matchesSearch;
  });

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
            <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                <img src={order.image} alt="Product" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-primary text-lg">{order.id}</h3>
                    <p className="text-sm text-gray-500">{order.date}</p>
                  </div>
                  <Badge variant={order.status === 'Delivered' ? 'success' : order.status === 'Shipped' ? 'info' : 'warning'}>
                    {order.status}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-4">{order.items}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <span className="font-bold text-primary">${order.total.toFixed(2)}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => setTrackingOrder(order)}>Track Order</Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedOrder(order)}>View Details</Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <p className="text-gray-500">No orders found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif font-bold text-primary">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Plus className="w-6 h-6 rotate-45 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                  <img src={selectedOrder.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-primary">{selectedOrder.id}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.date}</p>
                  <Badge size="sm" variant={selectedOrder.status === 'Delivered' ? 'success' : selectedOrder.status === 'Shipped' ? 'info' : 'warning'} className="mt-1">
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 mb-1">Items</h4>
                  <p className="text-sm text-gray-600">{selectedOrder.items}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 mb-1">Shipping Address</h4>
                    <p className="text-sm text-gray-600">
                      John Doe<br />
                      123 Bole Road<br />
                      Addis Ababa, Ethiopia
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 mb-1">Payment Method</h4>
                    <p className="text-sm text-gray-600">Visa ending in 4242</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <span className="font-bold text-xl text-primary">${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={() => { setSelectedOrder(null); setTrackingOrder(selectedOrder); }}>Track Order</Button>
                <Button variant="outline" className="flex-1">Download Invoice</Button>
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

  const filteredPayments = MOCK_PAYMENTS.filter(payment => {
    const matchesSearch = payment.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 font-mono font-medium text-gray-600">{payment.id}</td>
                    <td className="p-6 text-gray-600">{payment.date}</td>
                    <td className="p-6 font-medium text-primary">{payment.description}</td>
                    <td className="p-6 text-gray-500 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> {payment.method}
                    </td>
                    <td className="p-6 font-bold text-primary">${payment.amount.toFixed(2)}</td>
                    <td className="p-6">
                      <Badge variant="success" className="bg-green-50 text-green-600 border-green-100">{payment.status}</Badge>
                    </td>
                    <td className="p-6">
                      <Button size="sm" variant="outline" className="text-xs">Download Receipt</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    No payments found matching your criteria.
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
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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
      <h2 className="text-3xl font-serif font-bold text-primary">Account Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-primary mb-6">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Full Name" defaultValue={user?.name || "Tourist User"} />
              <Input label="Email Address" defaultValue={user?.email || "tourist@example.com"} disabled />
              <Input label="Phone Number" defaultValue="+251 911 234 567" />
              <Input label="Country" defaultValue="United States" />
            </div>
            <div className="mt-8 flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-primary mb-6">Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-bold text-primary">Password</p>
                  <p className="text-xs text-gray-500">Last changed 3 months ago</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>Update</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-bold text-primary">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                <img src={user?.profileImage || "https://ui-avatars.com/api/?name=Tourist"} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <Button variant="outline" size="sm" className="text-xs">Change Photo</Button>
            </div>
          </section>
          
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-4">Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-600">Email Notifications</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-600">SMS Alerts</span>
                <input type="checkbox" className="toggle" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-600">Newsletter</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </label>
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
