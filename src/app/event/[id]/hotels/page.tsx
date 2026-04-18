"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Users, Star, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { PriceSummary } from '@/components/booking/PriceSummary';
import apiClient from '@/lib/apiClient';
import { Festival, HotelAccommodation, RoomType } from '@/types';

export default function HotelsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  
  const { 
    setEvent, 
    selectedHotel, 
    setSelectedHotel,
    selectedRoom,
    setSelectedRoom,
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    guests,
    setGuests
  } = useBooking();
  
  const [festival, setFestival] = useState<Festival | null>(null);
  const [hotels, setHotels] = useState<HotelAccommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedHotel, setExpandedHotel] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const festRes = await apiClient.get(`/api/festivals/${eventId}`);
        const festivalData = festRes?.festival || festRes;
        
        if (festivalData) {
          setFestival(festivalData);
          setEvent(festivalData);
        }
        
        if (festivalData?.hotels && festivalData.hotels.length > 0) {
          setHotels(festivalData.hotels);
        } else {
          setHotels(festivalData?.hotels || []);
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId]);

  const handleSelectRoom = (hotel: HotelAccommodation, room: RoomType) => {
    setSelectedHotel(hotel);
    setSelectedRoom(room);
  };

  const handleContinue = () => {
    if (selectedRoom) {
      router.push(`/event/${eventId}/transport`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // No hotels available
  if (hotels.length === 0) {
    return (
      <div className="min-h-screen bg-ethio-bg">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-500 hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Event</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-serif font-bold text-primary mb-4">
              Accommodations
            </h1>
            <p className="text-gray-500 text-lg">
              No partner accommodations available for this event.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-yellow-800 mb-2">Contact Organizer for Bookings</h3>
            <p className="text-yellow-700 mb-4">
              This event organizer has not yet added partner accommodations. 
              Please contact them directly for booking assistance.
            </p>
            <button
              onClick={() => router.push(`/event/${eventId}/transport`)}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90"
            >
              Continue to Transport & Tickets →
            </button>
          </div>

          <div className="mt-8">
            <PriceSummary eventId={eventId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ethio-bg">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Event</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-primary mb-4">
            Select Your Accommodation
          </h1>
          <p className="text-gray-500 text-lg">
            Choose from vetted partner hotels near {festival?.locationName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hotel List */}
          <div className="lg:col-span-2 space-y-4">
            {hotels.map((hotel) => (
              <div 
                key={hotel.id} 
                className={`bg-white rounded-2xl overflow-hidden border transition-all ${
                  selectedHotel?.id === hotel.id 
                    ? 'border-primary shadow-lg' 
                    : 'border-gray-100'
                }`}
              >
                <div 
                  className="flex cursor-pointer"
                  onClick={() => setExpandedHotel(expandedHotel === hotel.id ? null : hotel.id)}
                >
                  <div className="w-48 h-40 flex-shrink-0">
                    <img 
                      src={hotel.image} 
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-primary">{hotel.name}</h3>
                          {hotel.starRating && (
                            <span className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              {hotel.starRating}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{hotel.address}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary">
                          ${hotel.rooms?.[0]?.pricePerNight || 'N/A'}
                        </span>
                        <span className="text-gray-500 text-sm">/night</span>
                      </div>
                    </div>
                    
                    {hotel.facilities && hotel.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {hotel.facilities.slice(0, 4).map((facility, idx) => (
                          <span key={idx} className="text-xs bg-gray-50 px-2 py-1 rounded-full text-gray-600">
                            {facility}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {selectedHotel?.id === hotel.id && selectedRoom && (
                      <div className="mt-3 flex items-center gap-2 text-primary text-sm font-medium">
                        <Check className="w-4 h-4" />
                        {selectedRoom.name} selected
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex items-center">
                    {expandedHotel === hotel.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Expanded Room Details */}
                {expandedHotel === hotel.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    <h4 className="font-bold text-gray-700 mb-4">Select a Room</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {hotel.rooms?.map((room) => (
                        <div 
                          key={room.id}
                          onClick={() => handleSelectRoom(hotel, room)}
                          className={`p-4 bg-white rounded-xl border cursor-pointer transition-all ${
                            selectedRoom?.id === room.id
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-gray-200 hover:border-primary'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-bold text-primary">{room.name}</h5>
                              <p className="text-gray-500 text-sm">{room.bedType} bed</p>
                            </div>
                            <span className="text-lg font-bold text-primary">${room.pricePerNight}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Users className="w-4 h-4" />
                            Up to {room.capacity} guests
                          </div>
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {room.amenities.slice(0, 3).map((amenity, idx) => (
                                <span key={idx} className="text-xs text-gray-500">{amenity}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Date Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                        <input 
                          type="date" 
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setCheckIn(e.target.value ? new Date(e.target.value) : null)}
                          value={checkIn ? new Date(checkIn).toISOString().split('T')[0] : ''}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                        <input 
                          type="date" 
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                          min={checkIn ? new Date(checkIn).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                          onChange={(e) => setCheckOut(e.target.value ? new Date(e.target.value) : null)}
                          value={checkOut ? new Date(checkOut).toISOString().split('T')[0] : ''}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                        <select 
                          value={guests}
                          onChange={(e) => setGuests(parseInt(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                        >
                          {[1,2,3,4,5,6].map(num => (
                            <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Clear Selection */}
                    {selectedHotel?.id === hotel.id && (
                      <button
                        onClick={() => {
                          setSelectedHotel(null);
                          setSelectedRoom(null);
                        }}
                        className="text-gray-500 hover:text-red-500 text-sm flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Clear selection
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Price Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <PriceSummary eventId={eventId} />
              
              <button
                onClick={handleContinue}
                disabled={!selectedRoom}
                className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-colors ${
                  selectedRoom 
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue to Transport
              </button>
              
              <button
                onClick={() => router.push(`/event/${eventId}/transport`)}
                className="w-full mt-3 py-3 text-center text-gray-500 text-sm hover:text-primary"
              >
                Skip hotel selection →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}