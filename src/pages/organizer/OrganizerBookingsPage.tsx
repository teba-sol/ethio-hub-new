import React, { useState } from 'react';
import { OrganizerBookingsView, BookingDetailView } from '../../components/dashboard/OrganizerSections';

export const OrganizerBookingsPage: React.FC = () => {
  const [viewingBookingId, setViewingBookingId] = useState<string | null>(null);

  if (viewingBookingId) {
    return (
      <BookingDetailView 
        bookingId={viewingBookingId} 
        onBack={() => setViewingBookingId(null)} 
      />
    );
  }

  return (
    <OrganizerBookingsView 
      onViewBooking={(id) => setViewingBookingId(id)} 
    />
  );
};
