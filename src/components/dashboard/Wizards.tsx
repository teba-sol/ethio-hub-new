import React, { useState, useEffect } from 'react';
import {
  X, ChevronLeft, ChevronRight, Image as ImageIcon, Camera,
  MapPin, Search, RefreshCw, Plus, Ticket, Star, Hotel, Car,
  Box, DollarSign, CheckCircle2, Trash2, Calendar, Clock,
  Users, Shield, Info, Eye, Save, Globe, Map as MapIcon,
  Utensils, Music, Heart, AlertCircle
} from 'lucide-react';
import { Button, Badge, Input, VerifiedBadge } from '../UI';
import { Festival, HotelAccommodation, TransportOption, RoomType } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAutoTranslate } from '../../hooks/useAutoTranslate';
import { BilingualInput } from '../BilingualInput';

const MapPickerModal = dynamic(() => import('../MapPickerModal'), {
  ssr: false
});

import apiClient from '../../lib/apiClient';

// import { useAuth } from '../../context/AuthContext';
// import apiClient from '../../lib/apiClient';

const STEPS = [
  { id: 1, name: 'Core Information', icon: Info },
  { id: 2, name: 'Schedule', icon: Calendar },
  { id: 3, name: 'Hotels', icon: Hotel },
  { id: 4, name: 'Transportation', icon: Car },
  { id: 5, name: 'Services', icon: Utensils },
  { id: 6, name: 'Policies', icon: Shield },
  { id: 7, name: 'Pricing', icon: DollarSign },
  { id: 8, name: 'Review & Publish', icon: Eye },
];

export const FestivalCreationWizard: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    core: {
      name_en: '',
      name_am: '',
      slug: '',
      startDate: '',
      endDate: '',
      locationName_en: '',
      locationName_am: '',
      address: '',
      shortDescription_en: '',
      shortDescription_am: '',
      fullDescription_en: '',
      fullDescription_am: '',
      coverImage: 'https://picsum.photos/seed/ethio-cover/1920/1080',
      gallery: [] as string[],
      coordinates: { lat: 9.0333, lng: 38.7500 }
    },
    schedule: [{ day: 1, title_en: '', title_am: '', activities: '', performers: [] as string[] }],
    hotels: [{
      id: Date.now(),
      name_en: '',
      name_am: '',
      image: '',
      starRating: 5,
      address: '',
      description_en: '',
      description_am: '',
      fullDescription_en: '',
      fullDescription_am: '',
      policies: '',
      checkInTime: '15:00',
      checkOutTime: '12:00',
      facilities: [] as string[],
      gallery: [] as string[],
      rooms: [{
        id: Date.now() + 1,
        name_en: '',
        name_am: '',
        description_en: '',
        description_am: '',
        capacity: 2,
        pricePerNight: 100,
        availability: 5,
        image: '',
        sqm: 30,
        amenities: [] as string[],
        bedType: '',
      }],
    }] as any[],
    transportation: [{
      id: Date.now() + 2,
      type_en: 'Private Car',
      type_am: '',
      capacity: 4,
      price: 50,
      availability: 5,
      description_en: '',
      description_am: '',
      image: '',
      pickupLocations: '',
    }] as any[],
    services: {
      foodPackages: [] as any[],
      culturalServices: [] as string[],
      specialAssistance: [] as string[],
      extras: [] as string[]
    },
    policies: {
      cancellation: '',
      terms: '',
      safety: '',
      ageRestriction: ''
    },
    pricing: {
      basePrice: 0,
      vipPrice: 0,
      currency: 'USD',
      earlyBird: 0,
      groupDiscount: 0
    }
  });

  // Auto-generate slug from English name
  useEffect(() => {
    const slug = formData.core.name_en.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setFormData(prev => ({ ...prev, core: { ...prev.core, slug } }));
  }, [formData.core.name_en]);

  // Auto-translate English to Amharic
  const { translatedText: nameAm } = useAutoTranslate(formData.core.name_en, 'en', 'am');
  const { translatedText: shortDescAm } = useAutoTranslate(formData.core.shortDescription_en, 'en', 'am');
  const { translatedText: fullDescAm } = useAutoTranslate(formData.core.fullDescription_en, 'en', 'am');

  // Update Amharic fields when translation completes
  useEffect(() => {
    if (nameAm && nameAm !== formData.core.name_am) {
      setFormData(prev => ({ ...prev, core: { ...prev.core, name_am: nameAm } }));
    }
  }, [nameAm]);

  useEffect(() => {
    if (shortDescAm && shortDescAm !== formData.core.shortDescription_am) {
      setFormData(prev => ({ ...prev, core: { ...prev.core, shortDescription_am: shortDescAm } }));
    }
  }, [shortDescAm]);

  useEffect(() => {
    if (fullDescAm && fullDescAm !== formData.core.fullDescription_am) {
      setFormData(prev => ({ ...prev, core: { ...prev.core, fullDescription_am: fullDescAm } }));
    }
  }, [fullDescAm]);

  const nextStep = () => setStep(s => Math.min(s + 1, 8));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFileUpload = async (file: File, isCoverImage: boolean = false) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (isCoverImage) {
          setFormData(prev => ({ ...prev, core: { ...prev.core, coverImage: data.url } }));
        } else {
          setFormData(prev => ({ ...prev, core: { ...prev.core, gallery: [...prev.core.gallery, data.url] } }));
        }
      } else {
        alert(`Upload failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('An error occurred during file upload.');
    }
  };

  const parseNumberOrDefault = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const sanitizeAndValidateForPublish = () => {
    const errors: string[] = [];

    const normalizedHotels = (formData.hotels || [])
      .map((hotel: any, hotelIndex: number) => {
        const rooms = (hotel.rooms || []).map((room: any, roomIndex: number) => {
          const availabilityRaw = room?.availability;
          const availability = Number(availabilityRaw);
          const roomLabel = room?.name?.trim() || `Room ${roomIndex + 1}`;
          const hotelLabel = hotel?.name?.trim() || `Hotel ${hotelIndex + 1}`;

          if (availabilityRaw === '' || availabilityRaw === undefined || availabilityRaw === null || Number.isNaN(availability)) {
            errors.push(`${hotelLabel} - ${roomLabel}: room availability is required and must be a number.`);
          } else if (availability <= 0) {
            errors.push(`${hotelLabel} - ${roomLabel}: room availability must be greater than 0.`);
          }

          return {
            ...room,
            name: roomLabel,
            bedType: String(room?.bedType || '').trim() || 'King Size',
            capacity: parseNumberOrDefault(room?.capacity, 2),
            pricePerNight: parseNumberOrDefault(room?.pricePerNight, 0),
            availability: Number.isFinite(availability) ? availability : 0,
            sqm: parseNumberOrDefault(room?.sqm, 30),
            amenities: Array.isArray(room?.amenities) ? room.amenities : [],
          };
        });

        return {
          ...hotel,
          name: String(hotel?.name || '').trim(),
          address: String(hotel?.address || '').trim(),
          rooms,
        };
      })
      .filter((hotel: any) => hotel.name || hotel.rooms.length > 0);

    const hotelsWithRooms = normalizedHotels.filter((hotel: any) => hotel.rooms.length > 0);
    if (hotelsWithRooms.length === 0) {
      errors.push('Add at least one hotel with at least one room before publishing.');
    }

    const normalizedTransportation = (formData.transportation || [])
      .map((transport: any, transportIndex: number) => {
        const availabilityRaw = transport?.availability;
        const availability = Number(availabilityRaw);
        const transportLabel = transport?.type?.trim() || `Transport ${transportIndex + 1}`;

        if (availabilityRaw === '' || availabilityRaw === undefined || availabilityRaw === null || Number.isNaN(availability)) {
          errors.push(`${transportLabel}: car availability is required and must be a number.`);
        } else if (availability <= 0) {
          errors.push(`${transportLabel}: car availability must be greater than 0.`);
        }

        return {
          ...transport,
          type: String(transport?.type || '').trim(),
          capacity: parseNumberOrDefault(transport?.capacity, 4),
          price: parseNumberOrDefault(transport?.price, 0),
          availability: Number.isFinite(availability) ? availability : 0,
          description: String(transport?.description || '').trim(),
          pickupLocations: String(transport?.pickupLocations || '').trim(),
        };
      })
      .filter((transport: any) => transport.type);

    if (normalizedTransportation.length === 0) {
      errors.push('Add at least one transportation option before publishing.');
    }

    return {
      errors,
      sanitizedHotels: hotelsWithRooms,
      sanitizedTransportation: normalizedTransportation,
    };
  };

  const handlePublish = async () => {
    const requiredFields = {
      name_en: formData.core.name_en,
      name_am: formData.core.name_am,
      shortDescription_en: formData.core.shortDescription_en,
      shortDescription_am: formData.core.shortDescription_am,
      fullDescription_en: formData.core.fullDescription_en,
      fullDescription_am: formData.core.fullDescription_am,
      startDate: formData.core.startDate,
      endDate: formData.core.endDate,
      locationName_en: formData.core.locationName_en,
      locationName_am: formData.core.locationName_am,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())); // Prettify the key for display

    if (missingFields.length > 0) {
      alert(`Please fill out all required fields:\n- ${missingFields.join('\n- ' )}`);
      return;
    }

    const { errors, sanitizedHotels, sanitizedTransportation } = sanitizeAndValidateForPublish();
    if (errors.length > 0) {
      alert(`Please fix these issues before publishing:\n- ${errors.join('\n- ')}`);
      return;
    }

    try {
      const response = await apiClient.post('/api/organizer/festivals', {
        name_en: formData.core.name_en,
        name_am: formData.core.name_am,
        shortDescription_en: formData.core.shortDescription_en,
        shortDescription_am: formData.core.shortDescription_am,
        fullDescription_en: formData.core.fullDescription_en,
        fullDescription_am: formData.core.fullDescription_am,
        startDate: formData.core.startDate,
        endDate: formData.core.endDate,
        location: {
          name_en: formData.core.locationName_en,
          name_am: formData.core.locationName_am,
          address: formData.core.address,
          coordinates: formData.core.coordinates,
        },
        coverImage: formData.core.coverImage,
        gallery: formData.core.gallery,
        schedule: formData.schedule,
        hotels: sanitizedHotels,
        transportation: sanitizedTransportation,
        services: formData.services,
        policies: formData.policies,
        pricing: formData.pricing,
      });

      if (response.success) {
        alert('Festival Published Successfully!');
        router.push('/dashboard/organizer/overview');
      } else {
        alert(`Failed to publish festival: ${response.message}`);
      }
    } catch (error) {
      console.error('Error publishing festival:', error);
      alert('An error occurred while publishing the festival.');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-12 overflow-x-auto pb-4 scrollbar-hide">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div 
            className={`flex flex-col items-center min-w-[100px] cursor-pointer transition-all ${step >= s.id ? 'text-primary' : 'text-gray-300'}`}
            onClick={() => setStep(s.id)}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 transition-all ${
              step === s.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 
              step > s.id ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-gray-100'
            }`}>
              {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-center">{s.name}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-[2px] flex-1 min-w-[20px] mx-2 ${step > s.id ? 'bg-emerald-500' : 'bg-gray-100'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto pb-20">
      <MapPickerModal 
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialPosition={formData.core.coordinates}
        onLocationSelect={(coords) => {
          setFormData(prev => ({ ...prev, core: { ...prev.core, coordinates: coords }}));
        }}
      />
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onCancel} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-serif font-bold text-primary">Create New Festival</h2>
            <p className="text-gray-400 text-sm">Share Ethiopia's vibrant heritage with the world.</p>
                  </div>
                </div>
               )}
              
              {/* Step 2: Schedule */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-serif font-bold text-primary">Daily Schedule</h3>
                    <Button 
                      variant="outline" 
                      leftIcon={Plus}
                      onClick={() => setFormData({
                        ...formData, 
                        schedule: [...formData.schedule, { day: formData.schedule.length + 1, title: '', activities: '', performers: [] }]
                      })}
                    >
                      Add Day
                    </Button>
                  </div>
                  <div className="space-y-6">
                    {formData.schedule.map((day, idx) => (
                      <div key={idx} className="bg-ethio-bg/50 p-8 rounded-[32px] border border-gray-100 relative group">
                        <button 
                          className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => setFormData({
                            ...formData,
                            schedule: formData.schedule.filter((_, i) => i !== idx)
                          })}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                          <div className="md:col-span-1">
                            <div className="w-16 h-16 bg-primary text-white rounded-2xl flex flex-col items-center justify-center mb-4">
                              <span className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Day</span>
                              <span className="text-2xl font-serif font-bold">{day.day}</span>
                            </div>
                          </div>
                          <div className="md:col-span-3 space-y-6">
                            <Input 
                              label="Day Title" 
                              placeholder="e.g. Ketera (The Eve)"
                              value={day.title}
                              onChange={e => {
                                const newSchedule = [...formData.schedule];
                                newSchedule[idx].title = e.target.value;
                                setFormData({ ...formData, schedule: newSchedule });
                              }}
                            />
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Activities & Highlights</label>
                              <textarea 
                                className="w-full h-32 p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/10" 
                                placeholder="What happens on this day?"
                                value={day.activities}
                                onChange={e => {
                                  const newSchedule = [...formData.schedule];
                                  newSchedule[idx].activities = e.target.value;
                                  setFormData({ ...formData, schedule: newSchedule });
                                }}
                              />
                            </div>
                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Performers & Groups</label>
                              <div className="flex flex-wrap gap-2">
                                {day.performers.map((p, pIdx) => (
                                  <Badge key={pIdx} variant="info" className="pl-3 pr-1 py-1 flex items-center gap-2">
                                    {p}
                                    <button onClick={() => {
                                      const newSchedule = [...formData.schedule];
                                      newSchedule[idx].performers = newSchedule[idx].performers.filter((_, i) => i !== pIdx);
                                      setFormData({ ...formData, schedule: newSchedule });
                                    }}><X className="w-3 h-3" /></button>
                                  </Badge>
                                ))}
                                <button 
                                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                                  onClick={() => {
                                    const name = prompt('Enter performer name:');
                                    if (name) {
                                      const newSchedule = [...formData.schedule];
                                      newSchedule[idx].performers.push(name);
                                      setFormData({ ...formData, schedule: newSchedule });
                                    }
                                  }}
                                >
                                  <Plus className="w-3 h-3" /> Add Performer
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Hotels */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-serif font-bold text-primary">Accommodation Partners</h3>
                    <Button 
                      variant="outline" 
                      leftIcon={Plus}
                      onClick={() => setFormData({
                        ...formData,
                        hotels: [...formData.hotels, { 
                          id: Date.now(), name: '', image: '', starRating: 5, address: '', description: '', 
                          fullDescription: '', policies: '', checkInTime: '15:00', checkOutTime: '12:00', facilities: [], rooms: [], gallery: [] 
                        }]
                      })}
                    >
                      Add Hotel
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    Room availability is required and must be greater than 0 before publishing.
                  </p>
                  <div className="space-y-12">
                    {formData.hotels.map((hotel, hIdx) => (
                      <div key={hotel.id} className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-sm space-y-8">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-6">
                              <div className="relative group">
                                <div className="w-20 h-20 bg-ethio-bg rounded-3xl flex items-center justify-center text-gray-300 overflow-hidden">
                                  {hotel.image ? <img src={hotel.image} className="w-full h-full object-cover" alt="" /> : <Hotel className="w-8 h-8" />}
                                </div>
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl">
                                  <Camera className="w-6 h-6 text-white" />
                                  <input type="file" className="hidden" accept="image/*" onChange={e => {
                                    if (e.target.files?.[0]) {
                                      const file = e.target.files[0];
                                      const uploadData = new FormData();
                                      uploadData.append('file', file);
                                      fetch('/api/upload', { method: 'POST', body: uploadData })
                                        .then(res => res.json())
                                        .then(data => {
                                          if (data.success) {
                                            const newHotels = [...formData.hotels];
                                            newHotels[hIdx].image = data.url;
                                            setFormData({ ...formData, hotels: newHotels });
                                          }
                                        });
                                    }
                                  }} />
                                </label>
                              </div>
                              <div>
                                <h4 className="text-xl font-serif font-bold text-primary">{hotel.name || 'New Hotel Partner'}</h4>
                                <p className="text-gray-400 text-xs">Configure rooms and details for this partner.</p>
                              </div>
                            </div>
                          <button 
                            className="p-2 text-gray-300 hover:text-red-500"
                            onClick={() => setFormData({
                              ...formData,
                              hotels: formData.hotels.filter((_, i) => i !== hIdx)
                            })}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input 
                            label="Hotel Name" 
                            value={hotel.name}
                            onChange={e => {
                              const newHotels = [...formData.hotels];
                              newHotels[hIdx].name = e.target.value;
                              setFormData({ ...formData, hotels: newHotels });
                            }}
                          />
                          <Input 
                            label="Star Rating" 
                            type="number" 
                            min="1" max="5"
                            value={hotel.starRating}
                            onChange={e => {
                              const newHotels = [...formData.hotels];
                              newHotels[hIdx].starRating = parseInt(e.target.value);
                              setFormData({ ...formData, hotels: newHotels });
                            }}
                          />
                          <Input 
                            label="Address" 
                            value={hotel.address}
                            onChange={e => {
                              const newHotels = [...formData.hotels];
                              newHotels[hIdx].address = e.target.value;
                              setFormData({ ...formData, hotels: newHotels });
                            }}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <Input 
                              label="Check-in Time" 
                              type="time"
                              value={hotel.checkInTime || '15:00'}
                              onChange={e => {
                                const newHotels = [...formData.hotels];
                                newHotels[hIdx].checkInTime = e.target.value;
                                setFormData({ ...formData, hotels: newHotels });
                              }}
                            />
                            <Input 
                              label="Check-out Time" 
                              type="time"
                              value={hotel.checkOutTime || '12:00'}
                              onChange={e => {
                                const newHotels = [...formData.hotels];
                                newHotels[hIdx].checkOutTime = e.target.value;
                                setFormData({ ...formData, hotels: newHotels });
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Full Description</label>
                            <textarea 
                              className="w-full h-24 p-4 bg-ethio-bg border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10" 
                              placeholder="Describe the hotel, amenities, and what makes it special..."
                              value={hotel.fullDescription || ''}
                              onChange={e => {
                                const newHotels = [...formData.hotels];
                                newHotels[hIdx].fullDescription = e.target.value;
                                setFormData({ ...formData, hotels: newHotels });
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Facilities</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['Free WiFi', 'Swimming Pool', 'Gym', 'Spa & Sauna', 'Restaurant', 'Airport Shuttle', 'Free Parking', 'Room Service'].map(facility => (
                              <label key={facility} className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${(hotel.facilities || []).includes(facility) ? 'bg-primary/10 text-primary border border-primary' : 'bg-ethio-bg text-gray-500 border border-transparent hover:bg-gray-100'}`}>
                                <input 
                                  type="checkbox" 
                                  className="hidden"
                                  checked={(hotel.facilities || []).includes(facility)}
                                  onChange={e => {
                                    const newHotels = [...formData.hotels];
                                    const facilities = newHotels[hIdx].facilities || [];
                                    if (e.target.checked) {
                                      newHotels[hIdx].facilities = [...facilities, facility];
                                    } else {
                                      newHotels[hIdx].facilities = facilities.filter((f: string) => f !== facility);
                                    }
                                    setFormData({ ...formData, hotels: newHotels });
                                  }}
                                />
                                <span className="text-xs font-semibold">{facility}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hotel Gallery (Pool, Gym, Restaurant, etc.)</label>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(hotel.gallery || []).map((img: string, gIdx: number) => (
                              <div key={gIdx} className="relative h-24 rounded-2xl overflow-hidden group">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                                <button 
                                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                                  onClick={() => {
                                    const newHotels = [...formData.hotels];
                                    newHotels[hIdx].gallery = newHotels[hIdx].gallery.filter((_: string, i: number) => i !== gIdx);
                                    setFormData({ ...formData, hotels: newHotels });
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <label className="h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                              <Camera className="w-6 h-6 text-gray-400" />
                              <span className="text-[10px] text-gray-400 mt-1">Add Photo</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                multiple
                                onChange={e => {
                                  if (e.target.files) {
                                    Array.from(e.target.files).forEach(file => {
                                      const uploadData = new FormData();
                                      uploadData.append('file', file);
                                      fetch('/api/upload', { method: 'POST', body: uploadData })
                                        .then(res => res.json())
                                        .then(data => {
                                          if (data.success) {
                                            const newHotels = [...formData.hotels];
                                            newHotels[hIdx].gallery = [...(newHotels[hIdx].gallery || []), data.url];
                                            setFormData({ ...formData, hotels: newHotels });
                                          }
                                        });
                                    });
                                  }
                                }} 
                              />
                            </label>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Room Types</label>
                            <button 
                              className="text-xs font-bold text-primary flex items-center gap-1"
                              onClick={() => {
                                const newHotels = [...formData.hotels];
                                newHotels[hIdx].rooms.push({
                                  id: Date.now(), name: '', description: '', capacity: 2, pricePerNight: 100, availability: 5, image: '', sqm: 30, amenities: [], bedType: ''
                                });
                                setFormData({ ...formData, hotels: newHotels });
                              }}
                            >
                              <Plus className="w-3 h-3" /> Add Room Type
                            </button>
                          </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {hotel.rooms.map((room: any, rIdx: number) => (
                              <div key={room.id} className="bg-ethio-bg/50 p-6 rounded-3xl border border-gray-50 relative group">
                                <button 
                                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                  onClick={() => {
                                    const newHotels = [...formData.hotels];
                                    newHotels[hIdx].rooms = newHotels[hIdx].rooms.filter((_: any, i: number) => i !== rIdx);
                                    setFormData({ ...formData, hotels: newHotels });
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <div className="space-y-4">
                                  <div className="flex gap-4 items-start">
                                    <div className="relative group flex-shrink-0">
                                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 border border-gray-100 overflow-hidden">
                                        {room.image ? <img src={room.image} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="w-6 h-6" />}
                                      </div>
                                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                                        <Camera className="w-4 h-4 text-white" />
                                        <input type="file" className="hidden" accept="image/*" onChange={e => {
                                          if (e.target.files?.[0]) {
                                            const file = e.target.files[0];
                                            const uploadData = new FormData();
                                            uploadData.append('file', file);
                                            fetch('/api/upload', { method: 'POST', body: uploadData })
                                              .then(res => res.json())
                                              .then(data => {
                                                if (data.success) {
                                                  const newHotels = [...formData.hotels];
                                                  newHotels[hIdx].rooms[rIdx].image = data.url;
                                                  setFormData({ ...formData, hotels: newHotels });
                                                }
                                              });
                                          }
                                        }} />
                                      </label>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <Input 
                                        label="Room Name" 
                                        className="bg-white"
                                        value={room.name}
                                        onChange={e => {
                                          const newHotels = [...formData.hotels];
                                          newHotels[hIdx].rooms[rIdx].name = e.target.value;
                                          setFormData({ ...formData, hotels: newHotels });
                                        }}
                                      />
                                      <Input 
                                        label="Room Image URL" 
                                        className="bg-white"
                                        placeholder="https://..."
                                        value={room.image || ''}
                                        onChange={e => {
                                          const newHotels = [...formData.hotels];
                                          newHotels[hIdx].rooms[rIdx].image = e.target.value;
                                          setFormData({ ...formData, hotels: newHotels });
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                      label="Bed Type" 
                                      placeholder="e.g. King Size"
                                      className="bg-white"
                                      value={room.bedType || ''}
                                      onChange={e => {
                                        const newHotels = [...formData.hotels];
                                        newHotels[hIdx].rooms[rIdx].bedType = e.target.value;
                                        setFormData({ ...formData, hotels: newHotels });
                                      }}
                                    />
                                    <Input 
                                      label="Capacity" 
                                      type="number"
                                      className="bg-white"
                                      value={room.capacity}
                                      onChange={e => {
                                        const newHotels = [...formData.hotels];
                                        newHotels[hIdx].rooms[rIdx].capacity = parseInt(e.target.value);
                                        setFormData({ ...formData, hotels: newHotels });
                                      }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                      label="Price/Night" 
                                      type="number" 
                                      className="bg-white"
                                      value={room.pricePerNight}
                                      onChange={e => {
                                        const newHotels = [...formData.hotels];
                                        newHotels[hIdx].rooms[rIdx].pricePerNight = parseInt(e.target.value);
                                        setFormData({ ...formData, hotels: newHotels });
                                      }}
                                    />
                                    <Input 
                                      label="Size (sqm)" 
                                      type="number" 
                                      className="bg-white"
                                      placeholder="e.g. 35"
                                      value={room.sqm || ''}
                                      onChange={e => {
                                        const newHotels = [...formData.hotels];
                                        newHotels[hIdx].rooms[rIdx].sqm = parseInt(e.target.value);
                                        setFormData({ ...formData, hotels: newHotels });
                                      }}
                                    />
                                    <Input
                                      label="Room Availability"
                                      type="number"
                                      className="bg-white"
                                      value={room.availability ?? ''}
                                      onChange={e => {
                                        const newHotels = [...formData.hotels];
                                        const value = e.target.value;
                                        newHotels[hIdx].rooms[rIdx].availability = value === '' ? '' : Number(value);
                                        setFormData({ ...formData, hotels: newHotels });
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Room Description</label>
                                    <textarea 
                                      className="w-full h-16 p-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/10" 
                                      placeholder="Describe the room..."
                                      value={room.description || ''}
                                      onChange={e => {
                                        const newHotels = [...formData.hotels];
                                        newHotels[hIdx].rooms[rIdx].description = e.target.value;
                                        setFormData({ ...formData, hotels: newHotels });
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Room Amenities</label>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                      {['Free WiFi', 'Balcony', 'Air Conditioning', 'Mini Bar', 'TV', 'Safe'].map(amenity => (
                                        <label key={amenity} className={`flex items-center gap-1.5 p-2 rounded-lg cursor-pointer transition-all text-xs ${(room.amenities || []).includes(amenity) ? 'bg-primary/10 text-primary border border-primary' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>
                                          <input 
                                            type="checkbox" 
                                            className="hidden"
                                            checked={(room.amenities || []).includes(amenity)}
                                            onChange={e => {
                                              const newHotels = [...formData.hotels];
                                              const amenities = newHotels[hIdx].rooms[rIdx].amenities || [];
                                              if (e.target.checked) {
                                                newHotels[hIdx].rooms[rIdx].amenities = [...amenities, amenity];
                                              } else {
                                                newHotels[hIdx].rooms[rIdx].amenities = amenities.filter((a: string) => a !== amenity);
                                              }
                                              setFormData({ ...formData, hotels: newHotels });
                                            }}
                                          />
                                          <span className="font-semibold">{amenity}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Transportation */}
              {step === 4 && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-serif font-bold text-primary">Transportation Options</h3>
                    <Button 
                      variant="outline" 
                      leftIcon={Plus}
                      onClick={() => setFormData({
                        ...formData,
                        transportation: [...formData.transportation, { 
                          id: Date.now(), type: 'Private Car', capacity: 4, price: 50, availability: 5, description: '', image: '', pickupLocations: '' 
                        }]
                      })}
                    >
                      Add Vehicle
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    Vehicle availability is required and must be greater than 0 before publishing.
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {formData.transportation.map((car, idx) => (
                      <div key={car.id} className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm relative group">
                        <button 
                          className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500"
                          onClick={() => setFormData({
                            ...formData,
                            transportation: formData.transportation.filter((_, i) => i !== idx)
                          })}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="flex gap-6 mb-8">
                          <div className="relative group">
                            <div className="w-24 h-24 bg-ethio-bg rounded-3xl flex items-center justify-center text-gray-300 overflow-hidden">
                              {car.image ? <img src={car.image} className="w-full h-full object-cover" alt="" /> : <Car className="w-10 h-10" />}
                            </div>
                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl">
                              <Camera className="w-6 h-6 text-white" />
                              <input type="file" className="hidden" accept="image/*" onChange={e => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  const uploadFormData = new FormData();
                                  uploadFormData.append('file', file);
                                  fetch('/api/upload', { method: 'POST', body: uploadFormData })
                                    .then(res => res.json())
                                    .then(data => {
                                      if (data.success) {
                                        const newTrans = [...formData.transportation];
                                        newTrans[idx].image = data.url;
                                        setFormData({ ...formData, transportation: newTrans });
                                      }
                                    });
                                }
                              }} />
                            </label>
                          </div>
                          <div className="flex-1 space-y-4">
                            <select 
                              className="w-full bg-ethio-bg border-none rounded-xl py-3 px-4 text-sm font-bold text-primary"
                              value={car.type}
                              onChange={e => {
                                const newTrans = [...formData.transportation];
                                newTrans[idx].type = e.target.value;
                                setFormData({ ...formData, transportation: newTrans });
                              }}
                            >
                              <option>Private Car</option>
                              <option>VIP SUV</option>
                              <option>Minibus</option>
                              <option>Luxury Coach</option>
                              <option>Helicopter Transfer</option>
                            </select>
                            <Input 
                              label="Image URL" 
                              value={car.image}
                              onChange={e => {
                                const newTrans = [...formData.transportation];
                                newTrans[idx].image = e.target.value;
                                setFormData({ ...formData, transportation: newTrans });
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <Input 
                            label="Capacity" 
                            type="number"
                            value={car.capacity}
                            onChange={e => {
                              const newTrans = [...formData.transportation];
                              newTrans[idx].capacity = parseInt(e.target.value);
                              setFormData({ ...formData, transportation: newTrans });
                            }}
                          />
                          <Input 
                            label="Price" 
                            type="number"
                            value={car.price}
                            onChange={e => {
                              const newTrans = [...formData.transportation];
                              newTrans[idx].price = parseInt(e.target.value);
                              setFormData({ ...formData, transportation: newTrans });
                            }}
                          />
                          <Input 
                            label="Available" 
                            type="number"
                            value={car.availability}
                            onChange={e => {
                              const newTrans = [...formData.transportation];
                              const value = e.target.value;
                              newTrans[idx].availability = value === '' ? '' : Number(value);
                              setFormData({ ...formData, transportation: newTrans });
                            }}
                          />
                        </div>
                        <div className="mt-4">
                          <Input 
                            label="Pick-up Locations" 
                            placeholder="e.g. Bole Airport, Hilton Hotel, Meskel Square"
                            value={car.pickupLocations || ''}
                            onChange={e => {
                              const newTrans = [...formData.transportation];
                              newTrans[idx].pickupLocations = e.target.value;
                              setFormData({ ...formData, transportation: newTrans });
                            }}
                          />
                        </div>
                        <div className="mt-4">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Description</label>
                          <textarea 
                            className="w-full h-24 p-4 bg-ethio-bg border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10" 
                            placeholder="Vehicle description, e.g. includes water, air-conditioning..."
                            value={car.description}
                            onChange={e => {
                              const newTrans = [...formData.transportation];
                              newTrans[idx].description = e.target.value;
                              setFormData({ ...formData, transportation: newTrans });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Services */}
              {step === 5 && (
                <div className="space-y-12">
                  <h3 className="text-2xl font-serif font-bold text-primary">Event Services & Add-ons</h3>
                  
                  {/* Food & Drink Packages Section - Enhanced */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/5 text-primary rounded-lg"><Utensils className="w-5 h-5" /></div>
                      <h4 className="font-bold text-primary">Food & Drink Packages</h4>
                    </div>
                    <p className="text-sm text-gray-500">Add meal packages available for this event (can also be booked with hotel rooms)</p>
                    
                    {(!formData.services.foodPackages || formData.services.foodPackages.length === 0) ? (
                      <p className="text-sm text-gray-400 italic">No food packages added yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {(formData.services.foodPackages as any[]).map((pkg: any, pIdx: number) => (
                          <div key={pkg.id} className="bg-ethio-bg/50 p-5 rounded-2xl border border-gray-50 relative group">
                            <button 
                              className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              onClick={() => {
                                const newServices = { ...formData.services };
                                newServices.foodPackages = newServices.foodPackages.filter((_: any, i: number) => i !== pIdx);
                                setFormData({ ...formData, services: newServices });
                              }}
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="space-y-3">
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <label className="text-xs text-gray-500 mb-1 block">Package Name</label>
                                  <select 
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                    value={pkg.name}
                                    onChange={e => {
                                      const newServices = { ...formData.services };
                                      const name = e.target.value;
                                      newServices.foodPackages[pIdx].name = name;
                                      
                                      const presets: Record<string, {desc: string, items: string[]}> = {
                                        'Breakfast Only': { desc: 'Continental breakfast with coffee and tea', items: ['Breakfast', 'Coffee', 'Tea'] },
                                        'Half Board': { desc: 'Breakfast and dinner included', items: ['Breakfast', 'Dinner'] },
                                        'Full Board': { desc: 'All meals included - breakfast, lunch, and dinner', items: ['Breakfast', 'Lunch', 'Dinner'] },
                                        'All Inclusive': { desc: 'Unlimited meals, snacks, and drinks', items: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks'] },
                                        'Ethiopian Feast': { desc: 'Traditional Ethiopian cuisine experience', items: ['Injera', 'Wat', 'Bread', 'Coffee Ceremony'] },
                                      };
                                      if (presets[name]) {
                                        newServices.foodPackages[pIdx].description = presets[name].desc;
                                        newServices.foodPackages[pIdx].items = presets[name].items;
                                      }
                                      setFormData({ ...formData, services: newServices });
                                    }}
                                  >
                                    <option value="">Select package...</option>
                                    <option value="Breakfast Only">Breakfast Only</option>
                                    <option value="Half Board">Half Board</option>
                                    <option value="Full Board">Full Board</option>
                                    <option value="All Inclusive">All Inclusive</option>
                                    <option value="Ethiopian Feast">Ethiopian Feast</option>
                                    <option value="Other">Other (Custom)</option>
                                  </select>
                                </div>
                                <div className="w-28">
                                  <label className="text-xs text-gray-500 mb-1 block">Price/Person</label>
                                  <input 
                                    type="number"
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                    placeholder="$0"
                                    value={pkg.pricePerPerson || ''}
                                    onChange={e => {
                                      const newServices = { ...formData.services };
                                      newServices.foodPackages[pIdx].pricePerPerson = parseInt(e.target.value) || 0;
                                      setFormData({ ...formData, services: newServices });
                                    }}
                                  />
                                </div>
                              </div>
                              
                              {pkg.name === 'Other' && (
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">Custom Package Name</label>
                                  <input 
                                    type="text"
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                    placeholder="e.g., Traditional Coffee Ceremony"
                                    value={pkg.customName || ''}
                                    onChange={e => {
                                      const newServices = { ...formData.services };
                                      newServices.foodPackages[pIdx].name = e.target.value;
                                      setFormData({ ...formData, services: newServices });
                                    }}
                                  />
                                </div>
                              )}
                              
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                                <input 
                                  type="text"
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                  placeholder="Describe what's included..."
                                  value={pkg.description || ''}
                                  onChange={e => {
                                    const newServices = { ...formData.services };
                                    newServices.foodPackages[pIdx].description = e.target.value;
                                    setFormData({ ...formData, services: newServices });
                                  }}
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs text-gray-500 mb-2 block">Included Items</label>
                                <div className="flex flex-wrap gap-2">
                                  {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Coffee', 'Tea', 'Juices', 'Soft Drinks', 'Alcoholic Drinks', 'Injera', 'Wat', 'Bread', 'Coffee Ceremony'].map(item => (
                                    <label key={item} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer text-xs transition-all ${(pkg.items || []).includes(item) ? 'bg-primary/10 text-primary border border-primary' : 'bg-white text-gray-500 border border-gray-200'}`}>
                                      <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={(pkg.items || []).includes(item)}
                                        onChange={e => {
                                          const newServices = { ...formData.services };
                                          const items = newServices.foodPackages[pIdx].items || [];
                                          if (e.target.checked) {
                                            newServices.foodPackages[pIdx].items = [...items, item];
                                          } else {
                                            newServices.foodPackages[pIdx].items = items.filter((i: string) => i !== item);
                                          }
                                          setFormData({ ...formData, services: newServices });
                                        }}
                                      />
                                      <span>{item}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button 
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/90"
                      onClick={() => {
                        const newServices = { ...formData.services };
                        newServices.foodPackages = newServices.foodPackages || [];
                        newServices.foodPackages.push({
                          id: Date.now(),
                          name: '',
                          description: '',
                          pricePerPerson: 0,
                          items: []
                        });
                        setFormData({ ...formData, services: newServices });
                      }}
                    >
                      <Plus className="w-4 h-4" /> Add Food Package
                    </button>
                  </div>

                  {/* Other Services - Simple List */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { key: 'culturalServices', label: 'Cultural Services', icon: Music },
                      { key: 'specialAssistance', label: 'Special Assistance', icon: Heart },
                      { key: 'extras', label: 'Extras & Souvenirs', icon: Box }
                    ].map(section => (
                      <div key={section.key} className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/5 text-primary rounded-lg"><section.icon className="w-5 h-5" /></div>
                          <h4 className="font-bold text-primary">{section.label}</h4>
                        </div>
                        <div className="space-y-3">
                          {(formData.services as any)[section.key].map((item: string, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-ethio-bg rounded-2xl group">
                              <span className="text-sm font-medium text-gray-600">{item}</span>
                              <button 
                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                onClick={() => {
                                  const newServices = { ...formData.services };
                                  (newServices as any)[section.key] = (newServices as any)[section.key].filter((_: any, i: number) => i !== idx);
                                  setFormData({ ...formData, services: newServices });
                                }}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button 
                            className="w-full p-4 border-2 border-dashed border-gray-100 rounded-2xl text-xs font-bold text-gray-400 hover:border-primary/20 hover:text-primary transition-all flex items-center justify-center gap-2"
                            onClick={() => {
                              const val = prompt(`Add ${section.label}:`);
                              if (val) {
                                const newServices = { ...formData.services };
                                (newServices as any)[section.key].push(val);
                                setFormData({ ...formData, services: newServices });
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" /> Add Service
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 6: Policies */}
              {step === 6 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <h3 className="text-2xl font-serif font-bold text-primary">Legal & Policies</h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cancellation Policy</label>
                        <textarea 
                          className="w-full h-32 p-4 bg-ethio-bg border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10" 
                          placeholder="e.g. Full refund up to 30 days before..."
                          value={formData.policies.cancellation}
                          onChange={e => setFormData({...formData, policies: {...formData.policies, cancellation: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Booking Terms</label>
                        <textarea 
                          className="w-full h-32 p-4 bg-ethio-bg border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10" 
                          placeholder="General terms and conditions..."
                          value={formData.policies.terms}
                          onChange={e => setFormData({...formData, policies: {...formData.policies, terms: e.target.value}})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8 pt-16">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Safety Rules</label>
                        <textarea 
                          className="w-full h-32 p-4 bg-ethio-bg border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10" 
                          placeholder="On-site safety guidelines..."
                          value={formData.policies.safety}
                          onChange={e => setFormData({...formData, policies: {...formData.policies, safety: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Age Restriction</label>
                        <textarea 
                          className="w-full h-32 p-4 bg-ethio-bg border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10" 
                          placeholder="e.g. All ages welcome, children under 5 free..."
                          value={formData.policies.ageRestriction}
                          onChange={e => setFormData({...formData, policies: {...formData.policies, ageRestriction: e.target.value}})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Pricing */}
              {step === 7 && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
                  <div className="lg:col-span-3 space-y-8">
                    <h3 className="text-2xl font-serif font-bold text-primary">Ticket Pricing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input 
                        label="Base Ticket Price" 
                        type="number"
                        value={formData.pricing.basePrice}
                        onChange={e => setFormData({...formData, pricing: {...formData.pricing, basePrice: parseInt(e.target.value)}})}
                      />
                      <Input 
                        label="VIP Ticket Price" 
                        type="number"
                        value={formData.pricing.vipPrice}
                        onChange={e => setFormData({...formData, pricing: {...formData.pricing, vipPrice: parseInt(e.target.value)}})}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <select 
                        className="w-full bg-ethio-bg border-none rounded-2xl py-4 px-4 text-sm font-bold text-primary"
                        value={formData.pricing.currency}
                        onChange={e => setFormData({...formData, pricing: {...formData.pricing, currency: e.target.value}})}
                      >
                        <option>USD</option>
                        <option>ETB</option>
                        <option>EUR</option>
                        <option>GBP</option>
                      </select>
                      <Input 
                        label="Early Bird Discount (%)" 
                        type="number"
                        value={formData.pricing.earlyBird}
                        onChange={e => setFormData({...formData, pricing: {...formData.pricing, earlyBird: parseInt(e.target.value)}})}
                      />
                      <Input 
                        label="Group Discount (%)" 
                        type="number"
                        value={formData.pricing.groupDiscount}
                        onChange={e => setFormData({...formData, pricing: {...formData.pricing, groupDiscount: parseInt(e.target.value)}})}
                      />
                    </div>
                    <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100 flex items-start gap-4">
                      <Info className="w-5 h-5 text-emerald-600 mt-1" />
                      <div>
                        <h4 className="font-bold text-emerald-900 text-sm mb-1">Pricing Strategy Tip</h4>
                        <p className="text-emerald-700 text-xs leading-relaxed">Early bird discounts typically increase conversion by 25% in the first week of listing.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <div className="sticky top-8">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 block">Price Breakdown Preview</label>
                      <div className="bg-ethio-dark text-white p-10 rounded-[40px] shadow-2xl space-y-8">
                        <div className="space-y-2">
                          <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Base Ticket</p>
                          <p className="text-4xl font-serif font-bold">{formData.pricing.currency} {formData.pricing.basePrice}</p>
                        </div>
                        <div className="space-y-4 pt-8 border-t border-white/10">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Early Bird Price</span>
                            <span className="text-emerald-400 font-bold">-{formData.pricing.earlyBird}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Group Rate (5+)</span>
                            <span className="text-emerald-400 font-bold">-{formData.pricing.groupDiscount}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">VIP Experience</span>
                            <span className="font-bold">+{formData.pricing.currency} {formData.pricing.vipPrice - formData.pricing.basePrice}</span>
                          </div>
                        </div>
                        <div className="pt-8 border-t border-white/10">
                          <Button className="w-full bg-secondary hover:bg-secondary/90 text-white border-none h-14 rounded-2xl">Preview Checkout</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 8: Review & Publish */}
              {step === 8 && (
                <div className="space-y-16">
                  <div className="text-center max-w-2xl mx-auto space-y-4">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-4xl font-serif font-bold text-primary">Ready to Launch?</h3>
                    <p className="text-gray-500">Review your festival details below. Once published, it will be visible to thousands of travelers worldwide.</p>
                  </div>

                  <div className="space-y-12 border-t border-gray-100 pt-16">
                    {/* Hero Preview */}
                    <div className="relative h-[500px] rounded-[60px] overflow-hidden shadow-2xl">
                      <img src={formData.core.coverImage} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-16 left-16 right-16 flex justify-between items-end">
                        <div className="space-y-4">
                          <Badge className="bg-secondary text-white border-none">Verified Festival</Badge>
                          <h1 className="text-6xl font-serif font-bold text-white">{formData.core.name}</h1>
                          <div className="flex items-center text-white/80 gap-8">
                            <span className="flex items-center gap-2"><Calendar className="w-5 h-5" /> {formData.core.startDate} - {formData.core.endDate}</span>
                            <span className="flex items-center gap-2"><MapPin className="w-5 h-5" /> {formData.core.locationName}</span>
                          </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[32px] border border-white/20 text-white">
                          <p className="text-xs uppercase font-bold opacity-60 mb-1">Starting from</p>
                          <p className="text-4xl font-serif font-bold">{formData.pricing.currency} {formData.pricing.basePrice}</p>
                        </div>
                      </div>
                    </div>

                    {/* Content Preview Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                      <div className="lg:col-span-2 space-y-12">
                        <section className="space-y-6">
                          <h4 className="text-2xl font-serif font-bold text-primary">About the Festival</h4>
                          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{formData.core.fullDescription}</p>
                        </section>

                        <section className="space-y-6">
                          <h4 className="text-2xl font-serif font-bold text-primary">Accommodation Partners</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {formData.hotels.map(hotel => (
                              <div key={hotel.id} className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                                <img src={hotel.image} className="w-full h-48 object-cover" alt="" />
                                <div className="p-6">
                                  <h5 className="font-bold text-primary">{hotel.name}</h5>
                                  <div className="flex text-secondary mb-2">
                                    {[...Array(hotel.starRating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                  </div>
                                  <p className="text-xs text-gray-500">{hotel.address}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>

                      <div className="space-y-8">
                        <div className="bg-ethio-bg p-8 rounded-[40px] space-y-6">
                          <h4 className="font-bold text-primary">Quick Summary</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Days</span>
                              <span className="font-bold">{formData.schedule.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Hotels</span>
                              <span className="font-bold">{formData.hotels.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Transport</span>
                              <span className="font-bold">{formData.transportation.length}</span>
                            </div>
                          </div>
                        </div>
                        <Button size="lg" className="w-full h-16 rounded-2xl" onClick={handlePublish}>Publish Now</Button>
                        <Button variant="outline" size="lg" className="w-full h-16 rounded-2xl" onClick={() => {
                          alert('Saved as draft!');
                          onCancel();
                        }}>Save as Draft</Button>
                        <Button variant="ghost" size="lg" className="w-full h-16 rounded-2xl" onClick={() => setStep(1)}>Edit Details</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-16 pt-10 border-t border-gray-50 flex justify-between items-center">
          <Button 
            variant="ghost" 
            leftIcon={ChevronLeft} 
            onClick={prevStep} 
            disabled={step === 1}
            className="px-8"
          >
            Previous Step
          </Button>
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">Step {step} of 8</p>
            <Button 
              onClick={step === 8 ? handlePublish : nextStep}
              rightIcon={step === 8 ? CheckCircle2 : ChevronRight}
              className="px-12 h-14 rounded-2xl shadow-xl shadow-primary/10"
            >
              {step === 8 ? 'Confirm & Publish' : 'Continue to Next Step'}
            </Button>
          </div>
        </div>
      </div>

      {/* Map Picker Modal */}
      <AnimatePresence>
        {isMapModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMapModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-primary">Select Exact Location</h3>
                  <p className="text-xs text-gray-400">Click on the map to set the festival coordinates</p>
                </div>
                <button onClick={() => setIsMapModalOpen(false)} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative h-[500px] bg-gray-100 cursor-crosshair group" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                // Simple simulation of coordinate mapping
                const lat = 9.0333 + (0.5 - y / rect.height) * 0.1;
                const lng = 38.7500 + (x / rect.width - 0.5) * 0.1;
                setFormData({
                  ...formData,
                  core: {
                    ...formData.core,
                    coordinates: { lat, lng },
                    address: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                  }
                });
              }}>
                <img src="https://picsum.photos/seed/ethiopia-map/1200/800" className="w-full h-full object-cover opacity-80" alt="Map" />
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                
                {/* Simulated Pin */}
                <motion.div 
                  layoutId="map-pin"
                  className="absolute pointer-events-none"
                  style={{ 
                    left: `${((formData.core.coordinates.lng - 38.7500) / 0.1 + 0.5) * 100}%`,
                    top: `${(0.5 - (formData.core.coordinates.lat - 9.0333) / 0.1) * 100}%`
                  }}
                >
                  <div className="relative -translate-x-1/2 -translate-y-full">
                    <MapPin className="w-10 h-10 text-secondary fill-secondary/20 drop-shadow-lg animate-bounce" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 rounded-full blur-[2px]" />
                  </div>
                </motion.div>

                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MapIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Current Selection</p>
                      <p className="text-xs font-bold text-primary">
                        {formData.core.coordinates.lat.toFixed(6)}, {formData.core.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 flex justify-end gap-4">
                <Button variant="outline" onClick={() => setIsMapModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsMapModalOpen(false)}>Confirm Location</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
