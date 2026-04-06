import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, Star, Wifi, Car, Coffee, 
  Dumbbell, Waves, Utensils, Sparkles, Plane,
  Maximize, BedDouble, Check, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button, Badge } from '../UI';
import { HotelAccommodation, RoomType } from '../types';

const MOCK_HOTEL: HotelAccommodation = {
  id: '1',
  name: 'Sheraton Addis',
  image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
  address: 'Taitu Street, Addis Ababa, Ethiopia',
  starRating: 5,
  description: 'Experience unparalleled luxury at Sheraton Addis, a prestigious five-star hotel nestled in the heart of Ethiopia\'s vibrant capital. Our hotel offers a perfect blend of contemporary elegance and authentic Ethiopian hospitality, creating an unforgettable retreat for discerning travelers. Featuring stunning architecture, world-class amenities, and exceptional service, Sheraton Addis stands as a beacon of refinement in Addis Ababa. Whether you are visiting for business or leisure, our meticulously designed rooms and suites provide a sanctuary of comfort, while our diverse dining options, state-of-the-art fitness facilities, and serene spa create an immersive experience that celebrates the rich heritage of Ethiopia.',
  policies: 'Check-in: 3:00 PM | Check-out: 12:00 PM | Cancellation policy: Free cancellation until 24 hours before check-in',
  checkInTime: '15:00',
  checkOutTime: '12:00',
  roomTypes: [
    {
      id: '1',
      name: 'Deluxe Room',
      description: 'Spacious room with city view, modern amenities and comfortable bedding',
      capacity: 2,
      pricePerNight: 250,
      availabilityCount: 5,
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop',
      sqm: 35
    },
    {
      id: '2',
      name: 'Executive Suite',
      description: 'Luxurious suite with separate living area, panoramic views and premium services',
      capacity: 3,
      pricePerNight: 450,
      availabilityCount: 3,
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074&auto=format&fit=crop',
      sqm: 65
    },
    {
      id: '3',
      name: 'Presidential Suite',
      description: 'Ultimate luxury with butler service, private terrace and exclusive amenities',
      capacity: 4,
      pricePerNight: 850,
      availabilityCount: 1,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop',
      sqm: 120
    }
  ]
};

const GALLERY_IMAGES = [
  { id: 1, category: 'Rooms', url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop' },
  { id: 2, category: 'Rooms', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074&auto=format&fit=crop' },
  { id: 3, category: 'Swimming Pool', url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2070&auto=format&fit=crop' },
  { id: 4, category: 'Gym', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop' },
  { id: 5, category: 'Restaurant', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop' },
  { id: 6, category: 'Exterior', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop' },
  { id: 7, category: 'Restaurant', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2074&auto=format&fit=crop' },
  { id: 8, category: 'Swimming Pool', url: 'https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?q=80&w=2070&auto=format&fit=crop' }
];

const FACILITIES = [
  { icon: Wifi, label: 'Free WiFi' },
  { icon: Waves, label: 'Swimming Pool' },
  { icon: Dumbbell, label: 'Fitness Center' },
  { icon: Sparkles, label: 'Spa & Sauna' },
  { icon: Utensils, label: 'Restaurant' },
  { icon: Plane, label: 'Airport Shuttle' },
  { icon: Car, label: 'Free Parking' },
  { icon: Coffee, label: 'Room Service' }
];

export const HotelDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray((params as any)?.id) ? (params as any).id[0] : (params as any)?.id;
  
  const [hotel, setHotel] = useState<HotelAccommodation>(MOCK_HOTEL);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredImages = selectedCategory === 'All' 
    ? GALLERY_IMAGES 
    : GALLERY_IMAGES.filter(img => img.category === selectedCategory);

  const categories = ['All', 'Rooms', 'Swimming Pool', 'Gym', 'Restaurant', 'Exterior'];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[65vh] min-h-[500px]">
        <img 
          src={hotel.image} 
          alt={hotel.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="absolute top-8 left-8 flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-full text-white font-semibold text-sm hover:bg-white/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">{hotel.name}</h1>
            <div className="flex items-center gap-2 text-white/90 mb-6">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">{hotel.address}</span>
            </div>
            <p className="text-white/80 text-lg max-w-2xl mb-8 line-clamp-2">{hotel.description}</p>
            <div className="flex flex-wrap gap-4">
              <Button className="px-8 py-3 text-lg font-semibold rounded-xl">
                Book Now
              </Button>
              <Button variant="outline" className="px-8 py-3 text-lg font-semibold rounded-xl border-white text-white hover:bg-white hover:text-gray-900">
                Check Availability
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Booking Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isSticky ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="bg-white shadow-lg border-b border-gray-100 py-4 px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={hotel.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <h3 className="font-bold text-gray-900">{hotel.name}</h3>
                <div className="flex items-center gap-1">
                  {Array.from({ length: hotel.starRating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <span className="text-2xl font-bold text-primary">${hotel.roomTypes[0]?.pricePerNight}</span>
                <span className="text-gray-500 text-sm"> /night</span>
              </div>
              <Button className="px-6 py-2.5 rounded-xl font-semibold">
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Image Gallery */}
        <section>
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">Photo Gallery</h2>
          
          {/* Category Tabs */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredImages.map((img, idx) => (
              <div 
                key={img.id}
                onClick={() => openLightbox(idx)}
                className="relative h-48 md:h-64 rounded-2xl overflow-hidden cursor-pointer group"
              >
                <img 
                  src={img.url} 
                  alt={img.category}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
              </div>
            ))}
          </div>
        </section>

        {/* Room Section */}
        <section>
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">Available Rooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotel.roomTypes.map((room) => (
              <div 
                key={room.id}
                className={`bg-white rounded-3xl overflow-hidden shadow-sm border transition-all hover:shadow-xl ${selectedRoom?.id === room.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100'}`}
              >
                <div className="relative h-56">
                  <img 
                    src={room.image} 
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  {room.availabilityCount <= 2 && (
                    <Badge variant="warning" className="absolute top-4 left-4">
                      Only {room.availabilityCount} left
                    </Badge>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">${room.pricePerNight}</span>
                      <span className="text-gray-500 text-sm">/night</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{room.description}</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                      <Maximize className="w-3.5 h-3.5" /> {room.sqm} m²
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                      <BedDouble className="w-3.5 h-3.5" /> {room.capacity} Guest{room.capacity > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                      <Wifi className="w-3.5 h-3.5" /> Free WiFi
                    </span>
                  </div>
                  <Button 
                    className="w-full mt-4"
                    variant={selectedRoom?.id === room.id ? 'primary' : 'outline'}
                    onClick={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)}
                  >
                    {selectedRoom?.id === room.id ? 'Selected' : 'Select Room'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Facilities Section */}
        <section className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">Hotel Facilities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FACILITIES.map((facility, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-primary/5 transition-colors"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <facility.icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-800">{facility.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Description Section */}
        <section className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6">About This Hotel</h2>
          <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
            <p>{hotel.description}</p>
            <p className="mt-4">
              Our dedicated staff is committed to ensuring your stay is nothing short of extraordinary. 
              From the moment you step into our elegant lobby, you will be greeted with warm Ethiopian hospitality 
              and world-class service that defines the Sheraton experience.
            </p>
            <p className="mt-4">
              Perfectly located to explore the cultural treasures of Addis Ababa, our hotel serves as an ideal 
              base for both business travelers and leisure guests seeking to discover the rich heritage of Ethiopia.
            </p>
          </div>
          <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
            <h3 className="font-bold text-gray-900 mb-4">Hotel Policies</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Check-in: {hotel.checkInTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Check-out: {hotel.checkOutTime}</span>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>{hotel.policies}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Booking CTA */}
        <section className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-10 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl font-serif font-bold mb-2">Ready to Book?</h2>
              <p className="text-white/80">Experience luxury at {hotel.name}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-3xl font-bold">${selectedRoom ? selectedRoom.pricePerNight : hotel.roomTypes[0]?.pricePerNight}</span>
                <span className="text-white/80"> /night</span>
              </div>
              <Button className="px-10 py-4 text-lg font-bold rounded-2xl bg-white text-primary hover:bg-gray-100">
                {selectedRoom ? `Book ${selectedRoom.name}` : 'Book Now'}
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <button 
            onClick={prevImage}
            className="absolute left-6 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-6 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <img 
            src={filteredImages[lightboxIndex].url} 
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm">
            {lightboxIndex + 1} / {filteredImages.length} • {filteredImages[lightboxIndex].category}
          </div>
        </div>
      )}
    </div>
  );
};