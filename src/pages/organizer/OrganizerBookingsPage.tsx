import React, { useState, useEffect } from 'react';
import { OrganizerBookingsView, BookingDetailView } from '../../components/dashboard/OrganizerSections';
import apiClient from '../../lib/apiClient';

export const OrganizerBookingsPage: React.FC = () => {
  const [viewingBooking, setViewingBooking] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await apiClient.get('/api/organizer/bookings');
        if (response.success) {
          setBookings(response.bookings);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
      }
    };
    fetchBookings();
  }, []);

  const handleViewBooking = (id: string) => {
    const booking = bookings.find(b => b._id === id);
    setViewingBooking(booking);
  };

  if (viewingBooking) {
    return (
      <BookingDetailView 
        booking={viewingBooking} 
        onBack={() => setViewingBooking(null)} 
      />
    );
  }

  return (
    <OrganizerBookingsView 
      onViewBooking={handleViewBooking} 
    />
  );
};

export default OrganizerBookingsPage;
