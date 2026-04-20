import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, Star, Wifi, Car, Coffee as CoffeeIcon, Dumbbell, Waves, 
  Utensils, Sparkles, Plane, BedDouble, Check, X, ChevronLeft, ChevronRight,
  Users, Maximize, Clock, Shield, MessageCircle, Facebook, Twitter, Linkedin, 
  Mail, ChevronDown, Calendar, Image, Home, Minus, Plus, Send
} from 'lucide-react';
import { Button, Badge } from './UI';
import { HotelAccommodation, RoomType } from '../types';

interface HotelDetailPageProps {
  hotel: HotelAccommodation;
  onBookRoom?: (room: RoomType, hotel: HotelAccommodation) => void;
}

export const HotelDetailPage: React.FC<HotelDetailPageProps> = ({ hotel, onBookRoom }) => {
  const router = useRouter();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState('');

  const handleCheckAvailability = () => {
    const el = document.getElementById('select-room');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBookRoom = (room: RoomType) => {
    setSelectedRoom(room);
    setBookingModalOpen(true);
    if (onBookRoom) {
      onBookRoom(room, hotel);
    }
  };

  const handleEnquiry = () => {
    alert('Enquiry sent! The hotel will contact you soon.');
    setShowEnquiryModal(false);
    setEnquiryMessage('');
  };

  const nights = checkIn && checkOut && typeof checkIn === 'object' && typeof checkOut === 'object'
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatShortDate = (date: Date | null) => {
    if (!date) return 'Select';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              {Array.from({ length: hotel.starRating || 0 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3">{hotel.name}</h1>
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{hotel.address}</span>
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(hotel.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm ml-2"
              >
                View on map
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden bg-gray-900 h-[400px] md:h-[500px]">
              <img 
                src={hotel.gallery?.[activeImageIndex] || hotel.image} 
                alt={hotel.name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              />
              
              <button 
                onClick={() => setActiveImageIndex(Math.max(0, activeImageIndex - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setActiveImageIndex(Math.min((hotel.gallery?.length || 1) - 1, activeImageIndex + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {(hotel.gallery || []).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === activeImageIndex ? 'bg-white w-6' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>

              <button 
                onClick={() => setLightboxOpen(true)}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <Image className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 mt-2">
              {(hotel.gallery || []).slice(0, 5).map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative rounded-lg overflow-hidden h-20 cursor-pointer group ${
                    idx === 0 ? 'col-span-2 row-span-2 h-full' : ''
                  }`}
                >
                  <img 
                    src={img} 
                    alt=""
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                  {idx === 4 && (hotel.gallery?.length || 0) > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold">+{(hotel.gallery?.length || 0) - 5}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {hotel.fullDescription || hotel.description}
              </p>
            </div>

            <div className="mt-8" id="select-room">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Select Your Room</h2>
              
              <div className="grid grid-cols-1 gap-6">
                {(hotel.rooms || []).map((room, idx) => {
                  const roomId = room.id || `room-${idx}`;
                  const isSelected = selectedRoom?.id === room.id;
                  return (
                    <div 
                      key={roomId} 
                      onClick={() => setSelectedRoom(isSelected ? null : room)}
                      className={`cursor-pointer bg-gray-50 rounded-2xl p-6 border-2 transition-all ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1 relative">
                          <img 
                            src={room.image || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop'} 
                            alt={room.name}
                            className="w-full h-48 md:h-full object-cover rounded-xl"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
                          <p className="text-gray-600 text-sm mb-4">{room.description}</p>
                          <div className="flex flex-wrap gap-3">
                            <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                              <Maximize className="w-3.5 h-3.5" /> {room.sqm || 30} m²
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                              <Users className="w-3.5 h-3.5" /> {room.capacity || 2} Guests
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                              <BedDouble className="w-3.5 h-3.5" /> {room.bedType || 'King Size'}
                            </span>
                          </div>
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {room.amenities.slice(0, 4).map((amenity, idx) => (
                                <span key={idx} className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                                  {amenity}
                                </span>
                              ))}
                              {room.amenities.length > 4 && (
                                <span className="text-xs text-gray-400">+{room.amenities.length - 4} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-1 flex flex-col justify-between">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">${room.pricePerNight}</div>
                            <div className="text-sm text-gray-500">/night</div>
                          </div>
                          {room.availability > 0 && room.availability <= 3 && (
                            <Badge variant="warning" className="mt-2">Only {room.availability} left</Badge>
                          )}
                          <div className="mt-4">
                            {isSelected ? (
                              <span className="flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold">
                                <Check className="w-4 h-4" /> Selected
                              </span>
                            ) : (
                              <span className="block text-center py-3 text-gray-500 text-sm">Click to select</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(!hotel.rooms || hotel.rooms.length === 0) && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <p className="text-gray-500">No rooms available. Please check back later.</p>
                </div>
              )}
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Facilities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(hotel.facilities || []).map((facility, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{facility}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Hotel Rules - Policies</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Check In</h3>
                  <p className="text-2xl font-bold text-gray-900">{hotel.checkInTime || '14:00'}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Check Out</h3>
                  <p className="text-2xl font-bold text-gray-900">{hotel.checkOutTime || '12:00'}</p>
                </div>
              </div>
              {hotel.policies && (
                <p className="mt-4 text-gray-600">{hotel.policies}</p>
              )}
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Location</h2>
              <div className="relative h-64 bg-gray-200 rounded-2xl overflow-hidden">
                <iframe 
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(hotel.address)}&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Reviews</h2>
              <div className="flex items-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-500">/5</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">Not rated</div>
                  <div className="text-sm text-gray-500">From 0 review</div>
                </div>
              </div>
              <p className="text-gray-500 text-center py-8">No reviews yet.</p>
            </div>

            <div className="mt-8 bg-primary rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-serif font-bold mb-4">Why Book With Us?</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-4">
                  <Shield className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">Best Price Guarantee</h3>
                    <p className="text-sm text-white/70">No-hassle best price</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Users className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">24/7 Support</h3>
                    <p className="text-sm text-white/70">Customer care available</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Sparkles className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">Hand-picked Hotels</h3>
                    <p className="text-sm text-white/70">Quality accommodations</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Car className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">Free Insurance</h3>
                    <p className="text-sm text-white/70">Travel protection</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <Facebook className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <Twitter className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <Linkedin className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <Mail className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Check In</span>
                  <button 
                    onClick={() => { setShowDatePicker(!showDatePicker); setShowGuestSelector(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm">{formatShortDate(checkIn)}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Check Out</span>
                  <button 
                    onClick={() => { setShowDatePicker(!showDatePicker); setShowGuestSelector(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm">{formatShortDate(checkOut)}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Guests</span>
                  <button 
                    onClick={() => { setShowGuestSelector(!showGuestSelector); setShowDatePicker(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm">{adults} Adult{adults !== 1 ? 's' : ''}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {showDatePicker && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-2">Select dates</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Check In</p>
                        <input 
                          type="date" 
                          className="w-full p-2 border rounded-lg text-sm"
                          onChange={(e) => setCheckIn(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Check Out</p>
                        <input 
                          type="date" 
                          className="w-full p-2 border rounded-lg text-sm"
                          onChange={(e) => setCheckOut(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {showGuestSelector && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-sm">Adults</p>
                        <p className="text-xs text-gray-500">Age 13+</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-medium">{adults}</span>
                        <button 
                          onClick={() => setAdults(Math.min(10, adults + 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Children</p>
                        <p className="text-xs text-gray-500">Age 0-12</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-medium">{children}</span>
                        <button 
                          onClick={() => setChildren(Math.min(10, children + 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <Button className="w-full py-3" onClick={handleCheckAvailability}>
                  Check Availability
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                {selectedRoom ? (
                  <div className="bg-primary/5 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Selected Room</p>
                    <p className="font-bold text-primary">{selectedRoom.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xl font-bold text-primary">${selectedRoom.pricePerNight}</span>
                      <span className="text-sm text-gray-500">/night</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                    <p className="text-sm text-gray-500">Select a room below to book</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-primary">${selectedRoom?.pricePerNight || hotel.rooms?.[0]?.pricePerNight || 0}</span>
                    <span className="text-gray-500 text-sm"> /night</span>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {selectedRoom?.availability || hotel.rooms?.[0]?.availability || 0} rooms left
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  className="flex-1 py-3" 
                  onClick={() => selectedRoom && handleBookRoom(selectedRoom)}
                  disabled={!selectedRoom}
                >
                  {selectedRoom ? 'Book Now' : 'Select a Room'}
                </Button>
                <Button variant="outline" className="flex-1 py-3" onClick={() => setShowEnquiryModal(true)}>
                  Enquiry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveImageIndex(Math.max(0, activeImageIndex - 1))}
            className="absolute left-6 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
            onClick={() => setActiveImageIndex(Math.min((hotel.gallery?.length || 1) - 1, activeImageIndex + 1))}
            className="absolute right-6 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <img 
            src={hotel.gallery?.[activeImageIndex]} 
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm">
            {activeImageIndex + 1} / {hotel.gallery?.length || 0}
          </div>
        </div>
      )}

      {showEnquiryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Enquiry</h2>
              <button onClick={() => setShowEnquiryModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={enquiryMessage}
              onChange={(e) => setEnquiryMessage(e.target.value)}
              placeholder="Write your enquiry here..."
              className="w-full p-4 border border-gray-200 rounded-xl text-sm mb-4 h-40 resize-none"
            />
            <Button className="w-full py-3 flex items-center justify-center gap-2" onClick={handleEnquiry}>
              <Send className="w-4 h-4" />
              Send Enquiry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
