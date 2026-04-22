"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Festival, HotelAccommodation, RoomType, TransportOption, FoodPackage } from '../types';

interface TicketSelection {
  type: 'vip' | 'standard' | 'earlyBird';
  price: number;
  quantity: number;
}

interface BookingContextType {
  // Event
  event: Festival | null;
  setEvent: (event: Festival | null) => void;
  
  // Hotel & Room
  selectedHotel: HotelAccommodation | null;
  selectedRoom: RoomType | null;
  checkIn: Date | null;
  checkOut: Date | null;
    guests: number;
    selectedFoodPackages: FoodPackage[];
    setSelectedHotel: (hotel: HotelAccommodation | null) => void;
    setSelectedRoom: (room: RoomType | null) => void;
    setCheckIn: (date: Date | null) => void;
    setCheckOut: (date: Date | null) => void;
    setGuests: (count: number) => void;
    clearFoodPackages: () => void;
    addFoodPackage: (pkg: FoodPackage) => void;
    removeFoodPackage: (pkgId: string) => void;
    toggleFoodPackage: (pkg: FoodPackage) => void;
  selectFoodPackage: (pkg: FoodPackage) => void;
  
  // Transport
  selectedTransport: TransportOption | null;
  setSelectedTransport: (transport: TransportOption | null) => void;
  transportDays: number;
  setTransportDays: (days: number) => void;
  
  // Tickets
  ticketSelection: TicketSelection | null;
  setTicketSelection: (ticket: TicketSelection | null) => void;
  
  // Pricing
  getTicketTotal: () => number;
  getHotelTotal: () => number;
  getFoodPackageTotal: () => number;
  getTransportTotal: () => number;
  getGrandTotal: () => number;
  
  // Booking ID (after confirmation)
  bookingId: string | null;
  setBookingId: (id: string | null) => void;
  
  // Reset
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Event
  const [event, setEvent] = useState<Festival | null>(null);
  
  // Hotel & Room
  const [selectedHotel, setSelectedHotel] = useState<HotelAccommodation | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(0);
  const [selectedFoodPackages, setSelectedFoodPackages] = useState<FoodPackage[]>([]);
  
  // Transport
  const [selectedTransport, setSelectedTransport] = useState<TransportOption | null>(null);
  const [transportDays, setTransportDays] = useState(1);
  
  // Tickets
  const [ticketSelection, setTicketSelection] = useState<TicketSelection | null>(null);
  
  // Booking ID
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  // Calculate nights for hotel
  const hotelNights = checkIn && checkOut 
    ? Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  
  // Pricing calculations
  const getTicketTotal = () => {
    if (!ticketSelection) return 0;
    return ticketSelection.price * ticketSelection.quantity;
  };
  
  const getHotelTotal = () => {
    if (!selectedRoom || !checkIn || !checkOut) return 0;
    const roomTotal = selectedRoom.pricePerNight * hotelNights * guests;
    const foodTotal = selectedFoodPackages.reduce(
      (sum, pkg) => sum + pkg.pricePerPerson * guests, 0
    );
    return roomTotal + foodTotal;
  };
  
  const getFoodPackageTotal = () => {
    return selectedFoodPackages.reduce(
      (sum, pkg) => sum + pkg.pricePerPerson * guests, 0
    );
  };
  
  const getTransportTotal = () => {
    if (!selectedTransport) return 0;
    return selectedTransport.price * transportDays;
  };
  
  const getGrandTotal = () => {
    return getTicketTotal() + getHotelTotal() + getTransportTotal();
  };
  
  const clearFoodPackages = () => {
    setSelectedFoodPackages([]);
  };
  
  const addFoodPackage = (pkg: FoodPackage) => {
    setSelectedFoodPackages([pkg]);
  };
  
  const removeFoodPackage = (pkgId: string) => {
    setSelectedFoodPackages(prev => prev.filter(p => p.id !== pkgId));
  };
  
  const toggleFoodPackage = (pkg: FoodPackage) => {
    if (selectedFoodPackages.find(p => p.id === pkg.id)) {
      removeFoodPackage(pkg.id);
    } else {
      setSelectedFoodPackages([pkg]);
    }
  };
  
  const selectFoodPackage = (pkg: FoodPackage) => {
    setSelectedFoodPackages([pkg]);
  };
  
  // Clear all selections
  const clearBooking = () => {
    setEvent(null);
    setSelectedHotel(null);
    setSelectedRoom(null);
    setCheckIn(null);
    setCheckOut(null);
    setGuests(0);
    setSelectedFoodPackages([]);
    setSelectedTransport(null);
    setTransportDays(1);
    setTicketSelection(null);
    setBookingId(null);
  };
  
  return (
    <BookingContext.Provider value={{
      event,
      setEvent,
      selectedHotel,
      selectedRoom,
      checkIn,
      checkOut,
      guests,
      selectedFoodPackages,
      setSelectedHotel,
      setSelectedRoom,
      setCheckIn,
      setCheckOut,
      setGuests,
      clearFoodPackages,
      addFoodPackage,
      removeFoodPackage,
      toggleFoodPackage,
      selectFoodPackage,
      selectedTransport,
      setSelectedTransport,
      transportDays,
      setTransportDays,
      ticketSelection,
      setTicketSelection,
      getTicketTotal,
      getHotelTotal,
      getFoodPackageTotal,
      getTransportTotal,
      getGrandTotal,
      bookingId,
      setBookingId,
      clearBooking,
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
