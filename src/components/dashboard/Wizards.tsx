import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Image as ImageIcon, Camera, 
  MapPin, Search, RefreshCw, Plus, Minus, Ticket, Star, Hotel, Car,
  Box, DollarSign, CheckCircle2, Trash2, Calendar, Clock,
  Users, Shield, Info, Eye, Save, Globe, Map as MapIcon,
  Utensils, Music, Heart, AlertCircle, Layout, Maximize2,
  Zap, FileText, LayoutGrid
} from 'lucide-react';
import { Button, Badge, Input, Textarea, VerifiedBadge } from '../UI';
import { HotelAccommodation, TransportOption, RoomType } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { DualLanguageField } from '../BilingualInput';
import { DateRangePicker } from '../DateRangePicker';
import { ETHIOPIA_REGIONS } from '../../data/constants';

const MapPickerModal = dynamic(() => import('../MapPickerModal'), { 
  ssr: false 
});

import apiClient from '../../lib/apiClient';

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

const ROOM_FACILITIES = [
  'Flat Screen TV', 'Balcony', 'Free WiFi', 'Air Conditioning', 
  'Mini Bar', 'Coffee Machine', 'Safe Box', 'Bathtub', 'City View'
];

const NumberStepperInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: React.ElementType;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  required?: boolean;
  iconPosition?: 'left' | 'right';
  className?: string;
}> = ({ label, value, onChange, icon: Icon, min = 0, max, step = 1, placeholder, required, className = '' }) => {
  const handleDecrement = () => {
    const newValue = value - step;
    if (min !== undefined && newValue < min) return;
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = value + step;
    if (max !== undefined && newValue > max) return;
    onChange(newValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">{label}</label>}
      <div className="relative flex items-center">
        {Icon && Icon !== DollarSign && (
          <div className="absolute left-4 z-10 pointer-events-none">
            <Icon className="w-5 h-5 text-gray-300" />
          </div>
        )}
        {Icon === DollarSign && (
          <div className="absolute left-4 z-10 pointer-events-none">
            <span className="text-xs font-black text-gray-300">ETB</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={min !== undefined && value <= min}
          className="absolute left-12 p-1.5 rounded-l-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => {
            const val = parseInt(e.target.value) || min;
            if (min !== undefined && val < min) return;
            if (max !== undefined && val > max) return;
            onChange(val);
          }}
          placeholder={placeholder}
          min={min}
          max={max}
          className={`w-full pl-24 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-200 text-sm font-bold text-gray-700 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300 ${Icon ? 'pl-28' : ''}`}
          required={required}
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={max !== undefined && value >= max}
          className="absolute right-1 top-1 bottom-1 px-2.5 rounded-r-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const FestivalCreationWizard: React.FC<{ 
  onCancel: () => void;
  initialData?: any;
  onSave?: (data: any) => Promise<void>;
}> = ({ onCancel, initialData, onSave }) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [hotelMapTarget, setHotelMapTarget] = useState<{ hotelIdx: number } | null>(null);
  const [coreLocationSelected, setCoreLocationSelected] = useState(!!initialData?.location?.coordinates);
  const [languagePreference, setLanguagePreference] = useState<'both' | 'en' | 'am'>('both');
  const [formData, setFormData] = useState({
    core: {
      name_en: initialData?.name_en || initialData?.name || '',
      name_am: initialData?.name_am || initialData?.name || '',
      slug: initialData?.slug || '', 
      type: initialData?.type || 'CulturalTraditional',
      startDate: initialData?.startDate || '', 
      endDate: initialData?.endDate || '', 
      totalCapacity: initialData?.totalCapacity || 0,
      locationName_en: initialData?.location?.name_en || initialData?.location?.name || initialData?.locationName_en || '', 
      locationName_am: initialData?.location?.name_am || initialData?.location?.name || initialData?.locationName_am || '',
      address: initialData?.location?.address || initialData?.address || '',
      region: initialData?.region || '',
      shortDescription_en: initialData?.shortDescription_en || initialData?.shortDescription || '',
      shortDescription_am: initialData?.shortDescription_am || initialData?.shortDescription || '',
      fullDescription_en: initialData?.fullDescription_en || initialData?.fullDescription || '',
      fullDescription_am: initialData?.fullDescription_am || initialData?.fullDescription || '',
      coverImage: initialData?.coverImage || 'https://picsum.photos/seed/ethio-cover/1920/1080',
      gallery: initialData?.gallery || [] as string[],
      coordinates: initialData?.location?.coordinates || initialData?.coordinates || { lat: 9.0333, lng: 38.7500 }
    },
    schedule: (initialData?.schedule && initialData.schedule.length > 0) ? initialData.schedule.map((s: any) => ({
      day: s.day,
      title_en: s.title_en || s.title || '',
      title_am: s.title_am || s.title || '',
      activities_en: s.activities_en || s.activities || '',
      activities_am: s.activities_am || s.activities || '',
      performers: s.performers || []
    })) : [{ 
      day: 1, 
      title_en: '', 
      title_am: '', 
      activities_en: '', 
      activities_am: '', 
      performers: [] as string[] 
    }],
    hotels: initialData?.hotels || [] as any[],
    transportation: initialData?.transportation || [] as any[],
    services: { 
      foodPackages: initialData?.services?.foodPackages || [] as any[], 
      culturalServices_en: initialData?.services?.culturalServices_en || initialData?.services?.culturalServices || [] as string[],
      culturalServices_am: initialData?.services?.culturalServices_am || initialData?.services?.culturalServices || [] as string[],
      specialAssistance_en: initialData?.services?.specialAssistance_en || initialData?.services?.specialAssistance || [] as string[],
      specialAssistance_am: initialData?.services?.specialAssistance_am || initialData?.services?.specialAssistance || [] as string[],
      extras_en: initialData?.services?.extras_en || initialData?.services?.extras || [] as string[],
      extras_am: initialData?.services?.extras_am || initialData?.services?.extras || [] as string[]
    },
    policies: { 
      cancellation_en: initialData?.policies?.cancellation_en || initialData?.policies?.cancellation || initialData?.cancellationPolicy || '', 
      cancellation_am: initialData?.policies?.cancellation_am || initialData?.policies?.cancellation || '',
      terms_en: initialData?.policies?.terms_en || initialData?.policies?.terms || initialData?.bookingTerms || '', 
      terms_am: initialData?.policies?.terms_am || initialData?.policies?.terms || '',
      safety_en: initialData?.policies?.safety_en || initialData?.policies?.safety || initialData?.safetyRules || '', 
      safety_am: initialData?.policies?.safety_am || initialData?.policies?.safety || '',
      ageRestriction: initialData?.policies?.ageRestriction || initialData?.ageRestriction || '' 
    },
    pricing: { 
      basePrice: initialData?.pricing?.basePrice || initialData?.baseTicketPrice || 0, 
      vipPrice: initialData?.pricing?.vipPrice || initialData?.vipTicketPrice || 0, 
      currency: initialData?.pricing?.currency || initialData?.currency || 'ETB', 
      earlyBird: initialData?.pricing?.earlyBird || initialData?.earlyBirdPrice || 0, 
      earlyBirdDeadline: initialData?.pricing?.earlyBirdDeadline || '',
      groupDiscount: initialData?.pricing?.groupDiscount || 0,
      vipIncludedHotels: initialData?.pricing?.vipIncludedHotels || [] as string[],
      vipIncludedTransport: initialData?.pricing?.vipIncludedTransport || [] as string[]
    },
    ticketTypes: (initialData?.ticketTypes && initialData.ticketTypes.length > 0) ? initialData.ticketTypes : [
      { name_en: 'Standard', name_am: 'Standard', price: initialData?.pricing?.basePrice || initialData?.baseTicketPrice || 0, quantity: 100, available: 100, benefits: [] },
      { name_en: 'VIP', name_am: 'VIP', price: initialData?.pricing?.vipPrice || initialData?.vipTicketPrice || 0, quantity: 50, available: 50, benefits: [] }
    ]
  });

  // Auto-generate slug from English name
  useEffect(() => {
    const slug = formData.core.name_en.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setFormData(prev => ({ ...prev, core: { ...prev.core, slug } }));
  }, [formData.core.name_en]);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const containsNumber = (str: string) => /\d/.test(str);

    if (currentStep === 1) {
      if (!formData.core.name_en && languagePreference !== 'am') {
        newErrors.name_en = 'English name is required';
      } else if (formData.core.name_en && containsNumber(formData.core.name_en)) {
        newErrors.name_en = 'Festival name cannot contain numbers';
      }
      
      if (!formData.core.name_am && languagePreference !== 'en') {
        newErrors.name_am = 'Amharic name is required';
      }

      if (!formData.core.startDate) {
        newErrors.startDate = 'Start date is required';
      } else if (new Date(formData.core.startDate) < today) {
        newErrors.startDate = 'Event date must be in the future';
      }

      if (!formData.core.endDate) {
        newErrors.endDate = 'End date is required';
      }

      if (formData.core.startDate && formData.core.endDate && new Date(formData.core.startDate) > new Date(formData.core.endDate)) {
        newErrors.endDate = 'End date must be after start date';
      }

      if (!formData.core.locationName_en && languagePreference !== 'am') newErrors.locationName_en = 'English location is required';
      if (!formData.core.locationName_am && languagePreference !== 'en') newErrors.locationName_am = 'Amharic location is required';
      
      if (formData.core.totalCapacity <= 0) {
        newErrors.totalCapacity = 'Capacity must be greater than zero';
      }
    }

    if (currentStep === 2) {
      if (formData.schedule.length === 0) newErrors.schedule = 'At least one day schedule is required';
      formData.schedule.forEach((day: any, idx: number) => {
        if (!day.title_en && languagePreference !== 'am') newErrors[`schedule_${idx}_title_en`] = 'Title is required';
        if (!day.activities_en && languagePreference !== 'am') newErrors[`schedule_${idx}_activities_en`] = 'Activities are required';
      });
    }

    if (currentStep === 3) {
      if (formData.hotels.length === 0) newErrors.hotels = 'At least one hotel is required';
      formData.hotels.forEach((hotel: any, idx: number) => {
        if (!hotel.name_en && languagePreference !== 'am') newErrors[`hotel_${idx}_name_en`] = 'Name is required';
        if (hotel.rooms.length === 0) newErrors[`hotel_${idx}_rooms`] = 'At least one room type is required';
        hotel.rooms.forEach((room: any, rIdx: number) => {
          if (room.pricePerNight < 0) newErrors[`hotel_${idx}_room_${rIdx}_price`] = 'Price cannot be negative';
          if (room.capacity <= 0) newErrors[`hotel_${idx}_room_${rIdx}_capacity`] = 'Capacity must be positive';
        });
      });
    }

    if (currentStep === 4) {
      formData.transportation.forEach((t: any, idx: number) => {
        if (t.price < 0) newErrors[`transport_${idx}_price`] = 'Price cannot be negative';
      });
    }

    if (currentStep === 6) {
      if (!formData.policies.cancellation_en && languagePreference !== 'am') newErrors.cancellation_en = 'Cancellation policy is required';
      if (!formData.policies.terms_en && languagePreference !== 'am') newErrors.terms_en = 'Booking terms are required';
    }

    if (currentStep === 7) {
      if (!formData.pricing.basePrice || formData.pricing.basePrice <= 0) {
        newErrors.basePrice = 'Base price must be greater than zero';
      }
      if (formData.pricing.vipPrice < 0) newErrors.vipPrice = 'VIP price cannot be negative';
      if (formData.pricing.earlyBird < 0 || formData.pricing.earlyBird > 100) {
        newErrors.earlyBird = 'Discount must be between 0 and 100';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const skipStep = () => {
    // Only allow skipping optional steps (4, 5, 6)
    if ([4, 5, 6].includes(step)) {
      setStep(s => Math.min(s + 1, 8));
      setErrors({}); // Clear errors when skipping
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 8));
    }
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  // Helper creators
  const createEmptyHotel = () => ({
    name_en: '',
    name_am: '',
    description_en: '',
    description_am: '',
    fullDescription_en: '',
    fullDescription_am: '',
    address: '',
    coordinates: { lat: 9.0333, lng: 38.7500 },
    locationSelected: false,
    starRating: 3,
    image: '',
    gallery: [] as string[],
    facilities: [] as string[],
    foodAndDrink: [] as string[],
    propertyType: 'Hotel',
    hotelRules: [] as string[],
    rooms: [] as any[],
    hotelServices: [] as any[],
    foodPackages: [] as any[],
    checkInTime: '12:00 PM',
    checkOutTime: '11:00 AM'
  });

  const createEmptyRoom = () => ({
    tier: 'both',
    name_en: '',
    name_am: '',
    description_en: '',
    description_am: '',
    capacity: 1,
    pricePerNight: 0,
    availability: 0,
    image: '',
    facilities: [] as string[],
  });

  const createEmptyTransport = () => ({
    vipIncluded: false,
    type_en: '',
    type_am: '',
    description_en: '',
    description_am: '',
    price: 0,
    availability: 1,
    capacity: 0,
    image: '',
  });

  const createEmptyFoodPackage = () => ({
    name_en: '',
    name_am: '',
    description_en: '',
    description_am: '',
    pricePerPerson: 0,
    items: [] as string[],
  });

  // Hotel handlers
  const addHotel = () => {
    setFormData(prev => ({ ...prev, hotels: [...prev.hotels, createEmptyHotel()] }));
  };

  const updateHotel = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newHotels = [...prev.hotels];
      newHotels[index] = { ...newHotels[index], [field]: value };
      return { ...prev, hotels: newHotels };
    });
  };

  const removeHotel = (index: number) => {
    setFormData(prev => ({ ...prev, hotels: prev.hotels.filter((_: any, i: number) => i !== index) }));
  };

  const addRoom = (hotelIndex: number) => {
    setFormData(prev => {
      const newHotels = [...prev.hotels];
      const hotel = { ...newHotels[hotelIndex], rooms: [...(newHotels[hotelIndex].rooms || [])] };
      hotel.rooms.push(createEmptyRoom());
      newHotels[hotelIndex] = hotel;
      return { ...prev, hotels: newHotels };
    });
  };

  const updateRoom = (hotelIndex: number, roomIndex: number, field: string, value: any) => {
    setFormData(prev => {
      const newHotels = [...prev.hotels];
      const rooms = [...newHotels[hotelIndex].rooms];
      rooms[roomIndex] = { ...rooms[roomIndex], [field]: value };
      newHotels[hotelIndex] = { ...newHotels[hotelIndex], rooms };
      return { ...prev, hotels: newHotels };
    });
  };

  const removeRoom = (hotelIndex: number, roomIndex: number) => {
    setFormData(prev => {
      const newHotels = [...prev.hotels];
      const rooms = newHotels[hotelIndex].rooms.filter((_: any, i: number) => i !== roomIndex);
      newHotels[hotelIndex] = { ...newHotels[hotelIndex], rooms };
      return { ...prev, hotels: newHotels };
    });
   };

  // Hotel service handlers
  const addHotelService = (hotelIndex: number) => {
    setFormData(prev => {
      const newHotels = [...prev.hotels];
      const hotel = { ...newHotels[hotelIndex], hotelServices: [...(newHotels[hotelIndex].hotelServices || [])] };
      hotel.hotelServices.push({ name: '', price: 0, description: '' });
      newHotels[hotelIndex] = hotel;
      return { ...prev, hotels: newHotels };
    });
  };

  const updateHotelService = (hotelIndex: number, serviceIndex: number, field: string, value: any) => {
    setFormData(prev => {
      const newHotels = [...prev.hotels];
      const services = [...newHotels[hotelIndex].hotelServices];
      services[serviceIndex] = { ...services[serviceIndex], [field]: value };
      newHotels[hotelIndex] = { ...newHotels[hotelIndex], hotelServices: services };
      return { ...prev, hotels: newHotels };
    });
  };

  const removeHotelService = (hotelIndex: number, serviceIndex: number) => {
    setFormData(prev => {
      const newHotels = [...prev.hotels];
      const services = newHotels[hotelIndex].hotelServices.filter((_: any, i: number) => i !== serviceIndex);
      newHotels[hotelIndex] = { ...newHotels[hotelIndex], hotelServices: services };
      return { ...prev, hotels: newHotels };
    });
  };

  // Transport handlers
  const addTransport = () => {
    setFormData(prev => ({ ...prev, transportation: [...prev.transportation, createEmptyTransport()] }));
  };

  const updateTransport = (index: number, field: string, value: any) => {
    const newTransport = [...formData.transportation];
    newTransport[index] = { ...newTransport[index], [field]: value };
    setFormData(prev => ({ ...prev, transportation: newTransport }));
  };

  const removeTransport = (index: number) => {
    setFormData(prev => ({ ...prev, transportation: prev.transportation.filter((_: any, i: number) => i !== index) }));
  };

  // Food package handlers
  const addFoodPackage = () => {
    setFormData(prev => ({
      ...prev,
      services: {
        ...prev.services,
        foodPackages: [...prev.services.foodPackages, createEmptyFoodPackage()]
      }
    }));
  };

  const updateFoodPackage = (index: number, field: string, value: any) => {
    const newPackages = [...formData.services.foodPackages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setFormData(prev => ({ ...prev, services: { ...prev.services, foodPackages: newPackages } }));
  };

  const removeFoodPackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: {
        ...prev.services,
        foodPackages: prev.services.foodPackages.filter((_: any, i: number) => i !== index)
      }
    }));
  };

  const updateFoodPackageItems = (index: number, itemsString: string) => {
    const items = itemsString.split(',').map(item => item.trim()).filter(Boolean);
    const newPackages = [...formData.services.foodPackages];
    newPackages[index] = { ...newPackages[index], items };
    setFormData(prev => ({ ...prev, services: { ...prev.services, foodPackages: newPackages } }));
  };

  // Services list handlers (comma-separated arrays)
  const updateServiceArray = (field: 'culturalServices' | 'specialAssistance' | 'extras', lang: 'en' | 'am', value: string) => {
    // We split by comma but DON'T filter Boolean here to allow typing trailing commas
    const arr = value.split(',').map(v => v.trim());
    const key = `${field}_${lang}`;
    setFormData(prev => {
      const newServices = { ...prev.services };
      (newServices as any)[key] = arr;
      return { ...prev, services: newServices };
    });
  };

  // Helper to get display text based on language preference
  const getDisplayText = (en: string, am: string) => {
    if (languagePreference === 'both') return { primary: en, secondary: am, showBoth: true };
    if (languagePreference === 'en') return { primary: en, secondary: '', showBoth: false };
    if (languagePreference === 'am') return { primary: am, secondary: '', showBoth: false };
    return { primary: en, secondary: '', showBoth: false };
  };

  const handleFileUpload = async (file: File, isCover?: boolean, retryCount = 0): Promise<string> => {
    if (!file) return '';
    
    setUploadingFile(true);
    setUploadError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'festivals');
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        const imageUrl = data.url;
        if (isCover) {
          setFormData(prev => ({ ...prev, core: { ...prev.core, coverImage: imageUrl } }));
        } else {
          setFormData(prev => ({ ...prev, core: { ...prev.core, gallery: [...prev.core.gallery, imageUrl] } }));
        }
        return imageUrl;
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Upload failed';
      setUploadError(errorMsg);
      console.error('Upload failed:', error);
      
      // Auto-retry logic (max 2 retries)
      if (retryCount < 2) {
        console.log(`Retrying upload... attempt ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return handleFileUpload(file, isCover, retryCount + 1);
      }
      
      return '';
    } finally {
      setUploadingFile(false);
    }
  };

  const handleHotelImageUpload = async (hotelIdx: number, file: File) => {
    if (!file) return;
    const imageUrl = await handleFileUpload(file);
    if (imageUrl) {
      updateHotel(hotelIdx, 'image', imageUrl);
    }
  };

  const handleHotelGalleryUpload = async (hotelIdx: number, file: File) => {
    if (!file) return;
    const imageUrl = await handleFileUpload(file);
    if (imageUrl) {
      setFormData(prev => {
        const newHotels = [...prev.hotels];
        newHotels[hotelIdx].gallery = [...(newHotels[hotelIdx].gallery || []), imageUrl];
        return { ...prev, hotels: newHotels };
      });
    }
  };

  const handleRoomImageUpload = async (hotelIdx: number, roomIdx: number, file: File) => {
    if (!file) return;
    const imageUrl = await handleFileUpload(file);
    if (imageUrl) {
      updateRoom(hotelIdx, roomIdx, 'image', imageUrl);
    }
  };

  const addHotelFoodPackage = (hotelIdx: number) => {
    setFormData(prev => {
      const newHotels = [...prev.hotels];
      const hotel = { ...newHotels[hotelIdx] };
      hotel.foodPackages = [...(hotel.foodPackages || []), createEmptyFoodPackage()];
      newHotels[hotelIdx] = hotel;
      return { ...prev, hotels: newHotels };
    });
  };

  const updateHotelFoodPackage = (hotelIdx: number, pkgIdx: number, field: string, value: any) => {
    setFormData(prev => {
      const newHotels = [...prev.hotels];
      const newPackages = [...newHotels[hotelIdx].foodPackages];
      newPackages[pkgIdx] = { ...newPackages[pkgIdx], [field]: value };
      newHotels[hotelIdx].foodPackages = newPackages;
      return { ...prev, hotels: newHotels };
    });
  };

  const removeHotelFoodPackage = (hotelIdx: number, pkgIdx: number) => {
    setFormData(prev => {
      const newHotels = [...prev.hotels];
      newHotels[hotelIdx].foodPackages = newHotels[hotelIdx].foodPackages.filter((_: any, i: number) => i !== pkgIdx);
      return { ...prev, hotels: newHotels };
    });
  };

  const handleTransportImageUpload = async (transIdx: number, file: File) => {
    if (!file) return;
    const imageUrl = await handleFileUpload(file);
    if (imageUrl) {
      updateTransport(transIdx, 'image', imageUrl);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const dataToSave = {
        ...formData.core,
        name_en: formData.core.name_en,
        name_am: formData.core.name_am,
        shortDescription_en: formData.core.shortDescription_en,
        shortDescription_am: formData.core.shortDescription_am,
        fullDescription_en: formData.core.fullDescription_en,
        fullDescription_am: formData.core.fullDescription_am,
        region: formData.core.region,
        location: {
          name_en: formData.core.locationName_en,
          name_am: formData.core.locationName_am,
          address: `${formData.core.locationName_en || formData.core.locationName_am}`, // Use location name as address since manual text field is removed
          coordinates: formData.core.coordinates,
        },
        schedule: formData.schedule,
        hotels: formData.hotels,
        transportation: formData.transportation,
        services: formData.services,
        policies: formData.policies,
        pricing: formData.pricing,
        ticketTypes: formData.ticketTypes,
        status: 'Draft',
        verificationStatus: initialData?.verificationStatus || 'Draft'
      };

      let response;
      if (initialData?.id || initialData?._id) {
        response = await apiClient.put(`/api/organizer/festivals/${initialData.id || initialData._id}`, dataToSave);
      } else {
        response = await apiClient.post('/api/organizer/festivals', dataToSave);
      }

      if (response.success) {
        alert('Festival saved as draft successfully!');
        if (onSave) {
          await onSave(response.festival);
        } else {
          router.push('/dashboard/organizer/festivals');
        }
      } else {
        alert(`Failed to save draft: ${response.message}`);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('An error occurred while saving the draft.');
    }
  };

  const handlePublish = async () => {
    const allMissing: string[] = [];

    // Core Validation - Only require one language for text fields
    if (!formData.core.name_en && !formData.core.name_am) allMissing.push('Festival Name (English or Amharic)');
    if (!formData.core.startDate) allMissing.push('Start Date');
    if (!formData.core.endDate) allMissing.push('End Date');
    if (!formData.core.locationName_en && !formData.core.locationName_am) allMissing.push('Location Name (English or Amharic)');
    if (!formData.core.coordinates) allMissing.push('Specific Location on Map');
    if (!formData.core.shortDescription_en && !formData.core.shortDescription_am) allMissing.push('Short Description (English or Amharic)');
    if (!formData.core.fullDescription_en && !formData.core.fullDescription_am) allMissing.push('Full Description (English or Amharic)');

    // Validate pricing
    if (formData.pricing.basePrice == null || formData.pricing.basePrice <= 0) {
      allMissing.push('Base ticket price must be greater than 0');
    }

    if (allMissing.length > 0) {
      alert(`Please fill out all required fields:\n- ${allMissing.join('\n- ')}`);
      return;
    }

    try {
      const dataToPublish = {
        ...formData.core,
        name_en: formData.core.name_en,
        name_am: formData.core.name_am,
        shortDescription_en: formData.core.shortDescription_en,
        shortDescription_am: formData.core.shortDescription_am,
        fullDescription_en: formData.core.fullDescription_en,
        fullDescription_am: formData.core.fullDescription_am,
        location: {
          name_en: formData.core.locationName_en,
          name_am: formData.core.locationName_am,
          address: `${formData.core.locationName_en || formData.core.locationName_am}`, // Use location name as address since manual text field is removed
          coordinates: formData.core.coordinates,
        },
        schedule: formData.schedule,
        hotels: formData.hotels,
        transportation: formData.transportation,
        services: formData.services,
        policies: formData.policies,
        pricing: formData.pricing,
        ticketTypes: formData.ticketTypes,
        status: 'Draft',
        verificationStatus: 'Pending Approval',
        submittedAt: new Date().toISOString()
      };

      let response;
      if (initialData?.id || initialData?._id) {
        response = await apiClient.put(`/api/organizer/festivals/${initialData.id || initialData._id}`, dataToPublish);
      } else {
        response = await apiClient.post('/api/organizer/festivals', dataToPublish);
      }

       if (response.success) {
        alert(initialData ? 'Festival updated successfully!' : 'Festival submitted for verification successfully!');
        if (onSave) {
          await onSave(response.festival);
        } else {
          router.push('/dashboard/organizer/festivals');
        }
      } else {
        alert(`Failed to publish festival: ${response.message}`);
      }
    } catch (error) {
      console.error('Error publishing festival:', error);
      alert('An error occurred while publishing the festival.');
    }
  };

  const renderStepIndicator = () => (
    <div className="bg-white p-2 rounded-[24px] border border-gray-100 shadow-sm mb-12 flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {STEPS.map((s) => (
        <button
          key={s.id}
          onClick={() => setStep(s.id)}
          className={`
            flex items-center gap-3 px-6 py-3.5 rounded-xl transition-all duration-300 flex-shrink-0
            ${step === s.id 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
              : step > s.id 
                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                : 'bg-transparent text-gray-400 hover:bg-gray-50'}
          `}
        >
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center transition-colors
            ${step === s.id ? 'bg-white/20' : step > s.id ? 'bg-emerald-100' : 'bg-gray-100'}
          `}>
            {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest leading-none opacity-60 mb-1">Step 0{s.id}</p>
            <p className="text-xs font-bold whitespace-nowrap">{s.name}</p>
          </div>
        </button>
      ))}
    </div>
  );

   return (
    <div className="max-w-[1400px] mx-auto pb-20">
      <MapPickerModal 
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          setHotelMapTarget(null);
        }}
        initialPosition={hotelMapTarget ? (formData.hotels[hotelMapTarget.hotelIdx]?.coordinates || { lat: 9.0333, lng: 38.7500 }) : (formData.core.coordinates || { lat: 9.0333, lng: 38.7500 })}
        onLocationSelect={(coords) => {
          if (hotelMapTarget) {
            updateHotel(hotelMapTarget.hotelIdx, 'coordinates', coords);
            updateHotel(hotelMapTarget.hotelIdx, 'locationSelected', true);
            setHotelMapTarget(null);
          } else {
            setFormData(prev => ({ ...prev, core: { ...prev.core, coordinates: coords } }));
            setCoreLocationSelected(true);
          }
          setIsMapModalOpen(false);
        }}
      />
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onCancel} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-serif font-bold text-primary">{initialData ? 'Edit Festival' : 'Create New Festival'}</h2>
            <p className="text-gray-400 text-sm">{initialData ? 'Update your festival details below.' : "Share Ethiopia's vibrant heritage with the world."} <span className="text-primary font-bold ml-2">Fields marked with * are required.</span></p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" leftIcon={Save} onClick={handleSaveDraft}>{initialData ? 'Save Changes' : 'Save Draft'}</Button>
          <Button onClick={handlePublish} disabled={step !== 8}>{initialData ? 'Save Changes' : 'Publish Festival'}</Button>
        </div>
      </header>

      {renderStepIndicator()}

      <div className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-xl min-h-[600px] flex flex-col">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Core Information */}
              {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Header Info */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="w-full">
                        <select
                          value={languagePreference}
                          onChange={(e) => setLanguagePreference(e.target.value as 'both' | 'en' | 'am')}
                          className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-[14px] focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-200 text-sm font-medium shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300"
                        >
                          <option value="en">English</option>
                          <option value="am">Amharic</option>
                          <option value="both">Both Languages</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Festival Name *</label>
                        <DualLanguageField
                          hideLabel
                          englishPlaceholder="Meskel Festival"
                          amharicPlaceholder="መስቀል በዓል"
                          englishValue={formData.core.name_en}
                          amharicValue={formData.core.name_am}
                          onEnglishChange={(value) => setFormData(prev => ({...prev, core: {...prev.core, name_en: value}}))}
                          onAmharicChange={(value) => setFormData(prev => ({...prev, core: {...prev.core, name_am: value}}))}
                          showEnglish={languagePreference !== 'am'}
                          showAmharic={languagePreference !== 'en'}
                          className={errors.name_en || errors.name_am ? 'ring-1 ring-red-500 rounded-xl' : ''}
                        />
                        {(errors.name_en || errors.name_am) && (
                          <p className="text-xs text-red-500 ml-1 mt-1">{errors.name_en || errors.name_am}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Slug</label>
                          <Input
                            placeholder="auto-generated-url-slug"
                            hideLabel
                            value={formData.core.slug}
                            readOnly
                            className="bg-gray-50 border-dashed"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Festival Type *</label>
                          <select
                            value={formData.core.type}
                            onChange={(e) => setFormData(prev => ({...prev, core: {...prev.core, type: e.target.value as any}}))}
                            className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-[14px] focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-200 text-sm font-medium shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300"
                          >
                            <option value="CulturalTraditional">Cultural / Traditional *</option>
                            <option value="Religious">Religious *</option>
                            <option value="NationalPublicHolidays">National / Public Holidays *</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Region / Origin *</label>
                        <select
                          value={formData.core.region}
                          onChange={(e) => setFormData(prev => ({...prev, core: {...prev.core, region: e.target.value}}))}
                          className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-[14px] focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-200 text-sm font-medium shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300"
                        >
                          <option value="">Select Region</option>
                          {ETHIOPIA_REGIONS.map(region => (
                            <option key={region.id} value={region.id}>{region.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Professional Date Range Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Start Date *</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <input 
                            type="date"
                            value={formData.core.startDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setFormData(prev => ({...prev, core: {...prev.core, startDate: e.target.value}}))}
                            className={`
                              block w-full rounded-[14px] border border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3.5 text-sm transition-all duration-200
                              focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none
                              shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:bg-white
                              ${errors.startDate ? 'border-red-500 bg-red-50' : ''}
                            `}
                          />
                        </div>
                        {errors.startDate && <p className="text-xs text-red-500 ml-1 mt-1">{errors.startDate}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">End Date *</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <input 
                            type="date"
                            value={formData.core.endDate}
                            min={formData.core.startDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setFormData(prev => ({...prev, core: {...prev.core, endDate: e.target.value}}))}
                            className={`
                              block w-full rounded-[14px] border border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3.5 text-sm transition-all duration-200
                              focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none
                              shadow-[0_2px_4_rgba(0,0,0,0.02)] hover:border-gray-300 hover:bg-white
                              ${errors.endDate ? 'border-red-500 bg-red-50' : ''}
                            `}
                          />
                        </div>
                        {errors.endDate && <p className="text-xs text-red-500 ml-1 mt-1">{errors.endDate}</p>}
                      </div>
                    </div>

                    {/* Descriptions */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Short Description *</label>
                        <DualLanguageField
                          hideLabel
                          englishPlaceholder="Brief summary of the festival..."
                          amharicPlaceholder="የበዓሉ አጭር መግለጫ..."
                          englishValue={formData.core.shortDescription_en}
                          amharicValue={formData.core.shortDescription_am}
                          onEnglishChange={(value) => setFormData(prev => ({...prev, core: {...prev.core, shortDescription_en: value}}))}
                          onAmharicChange={(value) => setFormData(prev => ({...prev, core: {...prev.core, shortDescription_am: value}}))}
                          textarea
                          rows={2}
                          showEnglish={languagePreference !== 'am'}
                          showAmharic={languagePreference !== 'en'}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Full Description *</label>
                        <DualLanguageField
                          hideLabel
                          englishPlaceholder="Detailed description of the festival, including history, traditions, and what to expect..."
                          amharicPlaceholder="የበዓሉ ዝርዝር መግለጫ፣ ታሪክ፣ ባህሎች እና ምን እንደሚጠብቅዎት ያካትታል..."
                          englishValue={formData.core.fullDescription_en}
                          amharicValue={formData.core.fullDescription_am}
                          onEnglishChange={(value) => setFormData(prev => ({...prev, core: {...prev.core, fullDescription_en: value}}))}
                          onAmharicChange={(value) => setFormData(prev => ({...prev, core: {...prev.core, fullDescription_am: value}}))}
                          textarea
                          rows={5}
                          showEnglish={languagePreference !== 'am'}
                          showAmharic={languagePreference !== 'en'}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <DualLanguageField
                          label="Total Capacity"
                          hideLabel
                          type="number"
                          englishPlaceholder="capacity"
                          amharicPlaceholder="የስቀል"
                          englishValue={String(formData.core.totalCapacity || '')}
                          amharicValue={String(formData.core.totalCapacity || '')}
                          onEnglishChange={(value) => setFormData(prev => ({...prev, core: {...prev.core, totalCapacity: parseInt(value) || 0}}))}
                          onAmharicChange={(value) => setFormData(prev => ({...prev, core: {...prev.core, totalCapacity: parseInt(value) || 0}}))}
                          icon={Users}
                          showEnglish={languagePreference !== 'am'}
                          showAmharic={languagePreference !== 'en'}
                          className={errors.totalCapacity ? 'ring-1 ring-red-500 rounded-xl' : ''}
                        />
                        {errors.totalCapacity && (
                          <p className="text-xs text-red-500 ml-1 mt-1">{errors.totalCapacity}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <DualLanguageField
                          label="Location Name"
                          hideLabel
                          englishPlaceholder="e.g., Meskel Square"
                          amharicPlaceholder="ለምሳሌ፦ መስቀል አደባባይ"
                          englishValue={formData.core.locationName_en}
                          amharicValue={formData.core.locationName_am}
                          onEnglishChange={(value) => setFormData(prev => ({...prev, core: {...prev.core, locationName_en: value}}))}
                          onAmharicChange={(value) => setFormData(prev => ({...prev, core: {...prev.core, locationName_am: value}}))}
                          showEnglish={languagePreference !== 'am'}
                          showAmharic={languagePreference !== 'en'}
                          className={errors.locationName_en || errors.locationName_am ? 'ring-1 ring-red-500 rounded-xl' : ''}
                        />
                        {(errors.locationName_en || errors.locationName_am) && (
                          <p className="text-xs text-red-500 ml-1 mt-1">{errors.locationName_en || errors.locationName_am}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Specific Location on Map *</label>
                       <button 
                         type="button"
                         onClick={() => setIsMapModalOpen(true)}
                         className={`w-full group relative overflow-hidden rounded-[32px] border-2 border-dashed transition-all duration-300 p-8 text-center ${coreLocationSelected 
                             ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300' 
                             : 'bg-gray-50/50 border-gray-200 hover:border-primary/30 hover:bg-white'}`}
                       >
                         <div className="relative z-10 flex flex-col items-center gap-3">
                           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${coreLocationSelected ? 'bg-emerald-100 text-emerald-600 scale-110' : 'bg-white text-gray-400 group-hover:text-primary group-hover:scale-110 shadow-sm'}`}>
                             <MapPin className={`w-8 h-8 ${coreLocationSelected ? 'animate-bounce' : ''}`} />
                           </div>
                           <div>
                             <p className={`text-lg font-bold ${coreLocationSelected ? 'text-emerald-700' : 'text-gray-800'}`}>
                               {coreLocationSelected ? 'Location Marked Successfully' : 'Select Exact Spot on Map'}
                             </p>
                             <p className="text-sm text-gray-400 mt-1">
                               {coreLocationSelected 
                                 ? `Lat: ${formData.core.coordinates.lat.toFixed(6)}, Lng: ${formData.core.coordinates.lng.toFixed(6)}`
                                 : 'Click to open map and pin the precise festival grounds'}
                             </p>
                           </div>
                           {coreLocationSelected && (
                             <div className="mt-2 flex items-center gap-2 px-4 py-1.5 bg-emerald-100/50 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600">
                               <CheckCircle2 className="w-3 h-3" /> Pin Set
                             </div>
                           )}
                         </div>
                         <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       </button>
                    </div>
                  </div>

                  {/* Media Section on the Right */}
                  <div className="space-y-8">
                    <div className="sticky top-8 space-y-8">
                      {/* Upload Card */}
                      <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100 space-y-6">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Festival Media</h4>
                        
                        {/* Cover Image Upload */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Cover Image *</label>
                          <div className="relative group aspect-video rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-primary/20 transition-all">
                            {formData.core.coverImage ? (
                              <>
                                <img src={formData.core.coverImage} alt="Cover" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      document.getElementById('cover-image-upload')?.click();
                                    }}
                                    className="p-2 bg-white text-primary rounded-full hover:scale-110 transition-transform"
                                  >
                                    <RefreshCw className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormData(prev => ({ ...prev, core: { ...prev.core, coverImage: '' } }));
                                    }}
                                    className="p-2 bg-white text-red-500 rounded-full hover:scale-110 transition-transform"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <label htmlFor="cover-image-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                <Camera className="w-8 h-8 text-gray-300 mb-2" />
                                <span className="text-xs font-bold text-gray-400">Upload Cover Image</span>
                              </label>
                            )}
                            <input type="file" className="hidden" id="cover-image-upload" onChange={e => e.target.files && handleFileUpload(e.target.files[0], true)} />
                          </div>
                        </div>

                        {/* Gallery Upload */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Gallery Photos</label>
                            <label htmlFor="gallery-upload" className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1">
                              <Plus className="w-3 h-3" /> Add Photos
                            </label>
                          </div>
                          <input type="file" className="hidden" id="gallery-upload" multiple onChange={e => e.target.files && Array.from(e.target.files).forEach(file => handleFileUpload(file))} />
                          
                          <div className="grid grid-cols-3 gap-2">
                            {formData.core.gallery.map((img: string, idx: number) => (
                              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden">
                                <img src={img} className="w-full h-full object-cover" alt="" />
                                <button
                                  onClick={() => setFormData(prev => ({ ...prev, core: { ...prev.core, gallery: prev.core.gallery.filter((_, i) => i !== idx) } }))}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <label htmlFor="gallery-upload" className="aspect-square rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-primary/20 transition-all">
                              <ImageIcon className="w-5 h-5 text-gray-200" />
                            </label>
                          </div>
                        </div>

                        {uploadingFile && (
                          <div className="flex items-center justify-center gap-2 py-2 bg-primary/5 rounded-xl">
                            <RefreshCw className="w-3 h-3 text-primary animate-spin" />
                            <span className="text-xs font-bold text-primary uppercase">Uploading...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Schedule */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-primary">Daily Schedule</h3>
                      <p className="text-gray-400 text-sm mt-1">Plan the activities for each day of the festival. *</p>
                    </div>
                    <Button 
                      variant="outline" 
                      leftIcon={Plus}
                      onClick={() => setFormData(prev => ({
                        ...prev, 
                        schedule: [...prev.schedule, { day: prev.schedule.length + 1, title_en: '', title_am: '', activities_en: '', activities_am: '', performers: [] }]
                      }))}
                    >
                      Add Day
                    </Button>
                  </div>

                  {errors.schedule && (
                    <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{errors.schedule}</p>
                  )}

                  <div className="space-y-6">
                    {formData.schedule.map((day, idx) => (
                      <div key={idx} className="flex gap-8 p-8 bg-gray-50/30 border border-gray-100 rounded-[32px] hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all relative group">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex flex-col items-center justify-center text-primary flex-shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-widest">Day</span>
                            <span className="text-2xl font-bold">{day.day}</span>
                          </div>
                          {formData.schedule.length > 1 && (
                            <button 
                              onClick={() => setFormData(prev => ({ ...prev, schedule: prev.schedule.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })) }))}
                              className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex-1 space-y-6">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Day Title *</label>
                            <DualLanguageField
                              hideLabel
                              englishPlaceholder="e.g., Opening Ceremony"
                              amharicPlaceholder="ለምሳሌ፦ የመክፈቻ ሥነ-ሥርዓት"
                              englishValue={day.title_en}
                              amharicValue={day.title_am}
                              onEnglishChange={(value) => {
                                const newSchedule = [...formData.schedule];
                                newSchedule[idx].title_en = value;
                                setFormData({ ...formData, schedule: newSchedule });
                              }}
                              onAmharicChange={(value) => {
                                const newSchedule = [...formData.schedule];
                                newSchedule[idx].title_am = value;
                                setFormData({ ...formData, schedule: newSchedule });
                              }}
                              showEnglish={languagePreference !== 'am'}
                              showAmharic={languagePreference !== 'en'}
                              className={errors[`schedule_${idx}_title_en`] ? 'ring-1 ring-red-500 rounded-xl' : ''}
                            />
                            {errors[`schedule_${idx}_title_en`] && (
                              <p className="text-xs text-red-500 ml-1 mt-1">{errors[`schedule_${idx}_title_en`]}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Activities *</label>
                            <DualLanguageField
                              hideLabel
                              englishPlaceholder="Detailed activities, timings, and highlights for the day..."
                              amharicValue={day.activities_am}
                              onEnglishChange={(value) => {
                                const newSchedule = [...formData.schedule];
                                newSchedule[idx].activities_en = value;
                                setFormData({ ...formData, schedule: newSchedule });
                              }}
                              onAmharicChange={(value) => {
                                const newSchedule = [...formData.schedule];
                                newSchedule[idx].activities_am = value;
                                setFormData({ ...formData, schedule: newSchedule });
                              }}
                              textarea
                              rows={3}
                              showEnglish={languagePreference !== 'am'}
                              showAmharic={languagePreference !== 'en'}
                              className={errors[`schedule_${idx}_activities_en`] ? 'ring-1 ring-red-500 rounded-xl' : ''}
                            />
                            {errors[`schedule_${idx}_activities_en`] && (
                              <p className="text-xs text-red-500 ml-1 mt-1">{errors[`schedule_${idx}_activities_en`]}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <DualLanguageField
                              label="Performers / Guests"
                              hideLabel
                              englishPlaceholder="e.g., Teddy Afro, Traditional Dancers, Local Bands (comma-separated)"
                              amharicPlaceholder="ለምሳሌ፦ ተዲ አፍሮ፣ ባህላዊ አዳማጭዎች፣ አገርያዊ ባንዶች (በኮማ የሚለያዩ)"
                              englishValue={day.performers.join(', ')}
                              amharicValue={day.performers.join(', ')}
                              onEnglishChange={(value) => {
                                const newSchedule = [...formData.schedule];
                                newSchedule[idx].performers = value.split(',').map(p => p.trim());
                                setFormData({ ...formData, schedule: newSchedule });
                              }}
                              onAmharicChange={(value) => {
                                const newSchedule = [...formData.schedule];
                                newSchedule[idx].performers = value.split(',').map(p => p.trim());
                                setFormData({ ...formData, schedule: newSchedule });
                              }}
                              showEnglish={languagePreference !== 'am'}
                              showAmharic={languagePreference !== 'en'}
                             />
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
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-primary">Partner Hotels</h3>
                      <p className="text-gray-400 text-sm mt-1">Add accommodation options for your guests. *</p>
                    </div>
                    <Button 
                      variant="outline" 
                      leftIcon={Plus} 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addHotel();
                      }}
                    >
                      Add Hotel
                    </Button>
                  </div>
                  
                  {errors.hotels && (
                    <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{errors.hotels}</p>
                  )}

                  {formData.hotels.length === 0 ? (
                    <div className="text-center p-16 border-2 border-dashed border-gray-100 rounded-[40px] bg-gray-50/30">
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6">
                        <Hotel className="w-10 h-10 text-gray-200" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-400 mb-2">No Hotels Added Yet</h4>
                      <p className="text-sm text-gray-400 mb-8 max-w-xs mx-auto">Add at least one partner hotel with room types to help guests plan their stay. *</p>
                      <Button 
                        variant="outline" 
                        leftIcon={Plus} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addHotel();
                        }}
                      >
                        Add Your First Hotel
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      {formData.hotels.map((hotel: any, hotelIdx: number) => (
                        <div key={hotelIdx} className="p-10 bg-gray-50/30 rounded-[48px] border border-gray-100 relative overflow-hidden group/hotel hover:bg-white hover:shadow-2xl transition-all duration-500">
                          {/* Top Right Actions */}
                          <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover/hotel:opacity-100 transition-opacity">
                            <button 
                              onClick={() => removeHotel(hotelIdx)}
                              className="p-3 bg-white text-red-500 rounded-2xl border border-red-50 hover:bg-red-50 transition-colors shadow-sm"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="flex flex-col lg:flex-row gap-10">
                            {/* Left: Image Uploaders */}
                            <div className="w-full lg:w-72 space-y-6">
                              <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Hotel Image *</label>
                                <div className="relative group/hotel-img aspect-square rounded-3xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-primary/20 transition-all">
                                  {hotel.image ? (
                                    <>
                                      <img src={hotel.image} className="w-full h-full object-cover" alt="" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/hotel-img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <label htmlFor={`hotel-img-${hotelIdx}`} className="p-2 bg-white text-primary rounded-full cursor-pointer hover:scale-110 transition-transform">
                                          <RefreshCw className="w-4 h-4" />
                                        </label>
                                      </div>
                                    </>
                                  ) : (
                                    <label htmlFor={`hotel-img-${hotelIdx}`} className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                      <Camera className="w-8 h-8 text-gray-300 mb-2" />
                                      <span className="text-xs font-bold text-gray-400 uppercase">Upload Photo</span>
                                    </label>
                                  )}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    id={`hotel-img-${hotelIdx}`} 
                                    onChange={e => e.target.files && handleHotelImageUpload(hotelIdx, e.target.files[0])} 
                                  />
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Media Gallery</label>
                                  <label htmlFor={`hotel-gallery-${hotelIdx}`} className="p-1 text-primary hover:bg-primary/5 rounded-lg cursor-pointer">
                                    <Plus className="w-4 h-4" />
                                  </label>
                                </div>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  id={`hotel-gallery-${hotelIdx}`} 
                                  multiple 
                                  onChange={e => e.target.files && Array.from(e.target.files).forEach(f => handleHotelGalleryUpload(hotelIdx, f))} 
                                />
                                <div className="grid grid-cols-3 gap-2">
                                  {(hotel.gallery || []).map((img: string, gIdx: number) => (
                                    <div key={gIdx} className="relative aspect-square rounded-xl overflow-hidden group/gallery">
                                      <img src={img} className="w-full h-full object-cover" alt="" />
                                      <button 
                                        onClick={() => {
                                          const newHotels = [...formData.hotels];
                                          newHotels[hotelIdx].gallery = hotel.gallery.filter((_: any, i: number) => i !== gIdx);
                                          setFormData({ ...formData, hotels: newHotels });
                                        }}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/gallery:opacity-100 transition-opacity"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  ))}
                                  <label htmlFor={`hotel-gallery-${hotelIdx}`} className="aspect-square rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-primary/20 transition-all">
                                    <ImageIcon className="w-4 h-4 text-gray-200" />
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Right: Hotel Info */}
                            <div className="flex-1 space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Hotel Name *</label>
                                  <DualLanguageField
                                    hideLabel
                                    englishPlaceholder="e.g., Hilton Addis Ababa"
                                    amharicPlaceholder="ለምሳሌ፦ ሂልተን አዲስ አበባ"
                                    englishValue={hotel.name_en || ''}
                                    amharicValue={hotel.name_am || ''}
                                    onEnglishChange={(value) => updateHotel(hotelIdx, 'name_en', value)}
                                    onAmharicChange={(value) => updateHotel(hotelIdx, 'name_am', value)}
                                    showEnglish={languagePreference !== 'am'}
                                    showAmharic={languagePreference !== 'en'}
                                    className={errors[`hotel_${hotelIdx}_name_en`] ? 'ring-1 ring-red-500 rounded-xl' : ''}
                                  />
                                  {errors[`hotel_${hotelIdx}_name_en`] && (
                                    <p className="text-xs text-red-500 ml-1 mt-1">{errors[`hotel_${hotelIdx}_name_en`]}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 bg-gray-50/50 px-6 rounded-2xl border border-gray-100">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Star Rating</label>
                                  <div className="flex items-center gap-1">
                                    {[1,2,3,4,5].map(star => (
                                      <Star
                                        key={star}
                                        className={`w-5 h-5 cursor-pointer transition-colors ${star <= (hotel.starRating || 3) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                                        onClick={() => updateHotel(hotelIdx, 'starRating', star)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Location on Map *</label>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setHotelMapTarget({ hotelIdx });
                                    setIsMapModalOpen(true);
                                  }}
                                  className={`
                                    w-full group relative overflow-hidden rounded-[24px] border-2 border-dashed transition-all duration-300
                                    ${hotel.locationSelected 
                                      ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300' 
                                      : 'bg-gray-50/50 border-gray-200 hover:border-primary/30 hover:bg-white'}
                                    p-6 text-center
                                  `}
                                >
                                  <div className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`
                                      w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500
                                      ${hotel.locationSelected ? 'bg-emerald-100 text-emerald-600 scale-110' : 'bg-white text-gray-400 group-hover:text-primary group-hover:scale-110 shadow-sm'}
                                    `}>
                                      <MapPin className={`w-6 h-6 ${hotel.locationSelected ? 'animate-bounce' : ''}`} />
                                    </div>
                                    <div>
                                      <p className={`text-base font-bold ${hotel.locationSelected ? 'text-emerald-700' : 'text-gray-800'}`}>
                                        {hotel.locationSelected ? 'Location Marked Successfully' : 'Select Location on Map'}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {hotel.locationSelected 
                                          ? `Lat: ${hotel.coordinates.lat.toFixed(6)}, Lng: ${hotel.coordinates.lng.toFixed(6)}`
                                          : 'Click to open map and pin the hotel location'}
                                      </p>
                                    </div>
                                    {hotel.locationSelected && (
                                      <div className="mt-1 flex items-center gap-2 px-3 py-1 bg-emerald-100/50 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                        <CheckCircle2 className="w-3 h-3" /> Pin Set
                                      </div>
                                    )}
                                  </div>
                                  <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                </button>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Description *</label>
                                <DualLanguageField
                                  hideLabel
                                  textarea
                                  rows={3}
                                  englishPlaceholder="Describe the hotel, its amenities, and unique features..."
                                  amharicPlaceholder="የሆቴሉን፣ አገልግሎቶቹን እና ልዩ ባህሪያቱን ይግለጹ..."
                                  englishValue={hotel.description_en || ''}
                                  amharicValue={hotel.description_am || ''}
                                  onEnglishChange={(value) => updateHotel(hotelIdx, 'description_en', value)}
                                  onAmharicChange={(value) => updateHotel(hotelIdx, 'description_am', value)}
                                  showEnglish={languagePreference !== 'am'}
                                  showAmharic={languagePreference !== 'en'}
                                />
                              </div>

                              {/* New Hotel Facilities & Info Section */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                <div className="space-y-4">
                                  <div className="space-y-2 group">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 transition-colors group-focus-within:text-primary">Property Type</label>
                                    <select
                                      value={hotel.propertyType || 'Hotel'}
                                      onChange={(e) => updateHotel(hotelIdx, 'propertyType', e.target.value)}
                                      className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-[14px] focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-200 text-sm shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300"
                                    >
                                      <option value="Hotel">Hotel</option>
                                      <option value="Resort">Resort</option>
                                      <option value="Lodge">Lodge</option>
                                      <option value="Guest House">Guest House</option>
                                      <option value="Apartment">Apartment</option>
                                    </select>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Check-in</label>
                                      <Input 
                                        hideLabel
                                        value={hotel.checkInTime || '12:00 PM'} 
                                        onChange={(e) => updateHotel(hotelIdx, 'checkInTime', e.target.value)}
                                        placeholder="12:00 PM"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Check-out</label>
                                      <Input 
                                        hideLabel
                                        value={hotel.checkOutTime || '11:00 AM'} 
                                        onChange={(e) => updateHotel(hotelIdx, 'checkOutTime', e.target.value)}
                                        placeholder="11:00 AM"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Facilities</label>
                                    <Textarea
                                      rows={2}
                                      placeholder="e.g., Free WiFi, Swimming Pool, Gym, Spa (comma-separated)"
                                      value={(hotel.facilities || []).join(', ')}
                                      onChange={(e) => updateHotel(hotelIdx, 'facilities', e.target.value.split(',').map(v => v.trim()))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Food & Drink</label>
                                    <Textarea
                                      rows={2}
                                      placeholder="e.g., Breakfast Buffet, Restaurant, Bar, Room Service (comma-separated)"
                                      value={(hotel.foodAndDrink || []).join(', ')}
                                      onChange={(e) => updateHotel(hotelIdx, 'foodAndDrink', e.target.value.split(',').map(v => v.trim()))}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 pt-4 border-t border-gray-100">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Hotel Rules & Policies</label>
                                <Textarea
                                  rows={2}
                                  placeholder="e.g., No smoking in rooms, No pets, 24-hour front desk (comma-separated)"
                                  value={(hotel.hotelRules || []).join(', ')}
                                  onChange={(e) => updateHotel(hotelIdx, 'hotelRules', e.target.value.split(',').map(v => v.trim()))}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Rooms Management Section */}
                          <div className="mt-12 pt-10 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-8">
                              <div>
                                <h4 className="text-xl font-bold text-primary">Room Types *</h4>
                                <p className="text-gray-400 text-xs">Define different types of rooms available in this hotel.</p>
                              </div>
                              <Button variant="outline" size="sm" leftIcon={Plus} onClick={() => addRoom(hotelIdx)}>Add Room Type</Button>
                            </div>
                            
                            {errors[`hotel_${hotelIdx}_rooms`] && (
                              <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 mb-6">{errors[`hotel_${hotelIdx}_rooms`]}</p>
                            )}
                            
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {(hotel.rooms || []).map((room: any, roomIdx: number) => (
                                <div key={roomIdx} className="group/room relative bg-gray-50/30 rounded-[32px] border border-gray-100 p-8 transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20">
                                  {/* Delete Button */}
                                  <button 
                                    onClick={() => removeRoom(hotelIdx, roomIdx)}
                                    className="absolute -top-3 -right-3 w-10 h-10 bg-white text-red-500 rounded-full shadow-lg border border-red-50 flex items-center justify-center opacity-0 group-hover/room:opacity-100 transition-all hover:bg-red-50 z-20"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>

                                  <div className="flex flex-col gap-8">
                                    {/* Room Header: Image and Name */}
                                    <div className="flex gap-6 items-start">
                                      <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer relative group/room-img flex-shrink-0 shadow-sm">
                                        {room.image ? (
                                          <>
                                            <img src={room.image} className="w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/room-img:opacity-100 transition-opacity flex items-center justify-center">
                                              <label htmlFor={`room-img-${hotelIdx}-${roomIdx}`} className="p-2 bg-white text-primary rounded-full cursor-pointer hover:scale-110 transition-transform">
                                                <RefreshCw className="w-4 h-4" />
                                              </label>
                                            </div>
                                          </>
                                        ) : (
                                          <label htmlFor={`room-img-${hotelIdx}-${roomIdx}`} className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                                            <Camera className="w-8 h-8 text-gray-200 mb-2" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Add Photo</span>
                                          </label>
                                        )}
                                        <input 
                                          type="file" 
                                          className="hidden" 
                                          id={`room-img-${hotelIdx}-${roomIdx}`} 
                                          onChange={e => e.target.files && handleRoomImageUpload(hotelIdx, roomIdx, e.target.files[0])} 
                                        />
                                      </div>

                                      <div className="flex-1 space-y-4">
                                        <div className="space-y-2">
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Room Name *</label>
                                          <DualLanguageField
                                            hideLabel
                                            englishPlaceholder="e.g., Deluxe Suite"
                                            amharicPlaceholder="ለምሳሌ፦ ዴሉክስ ስዊት"
                                            englishValue={room.name_en || ''}
                                            amharicValue={room.name_am || ''}
                                            onEnglishChange={(value) => updateRoom(hotelIdx, roomIdx, 'name_en', value)}
                                            onAmharicChange={(value) => updateRoom(hotelIdx, roomIdx, 'name_am', value)}
                                            showEnglish={languagePreference !== 'am'}
                                            showAmharic={languagePreference !== 'en'}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Room Tier</label>
                                          <select 
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-bold text-gray-600 shadow-sm"
                                            value={room.tier || 'both'}
                                            onChange={(e) => updateRoom(hotelIdx, roomIdx, 'tier', e.target.value)}
                                          >
                                            <option value="both">All Tiers (Standard & VIP)</option>
                                            <option value="vip">VIP Only (Included in Package)</option>
                                            <option value="standard">Standard Only</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Room Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                      {room.tier !== 'vip' ? (
                                        <NumberStepperInput
                                          label="Price / Night *"
                                          value={room.pricePerNight || 0}
                                          onChange={(value) => updateRoom(hotelIdx, roomIdx, 'pricePerNight', value)}
                                          icon={DollarSign}
                                          min={0}
                                          placeholder="e.g., 150"
                                          required
                                          className={errors[`hotel_${hotelIdx}_room_${roomIdx}_price`] ? 'ring-1 ring-red-500 rounded-xl' : ''}
                                        />
                                      ) : (
                                        <div className="space-y-2">
                                          <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">VIP Pricing</label>
                                          <div className="px-4 py-3.5 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                                            <VerifiedBadge className="w-4 h-4 text-amber-600" />
                                            <span className="text-[10px] text-amber-800 font-black uppercase">Included</span>
                                          </div>
                                        </div>
                                      )}
                                      <NumberStepperInput
                                        label="Capacity *"
                                        value={room.capacity || 1}
                                        onChange={(value) => updateRoom(hotelIdx, roomIdx, 'capacity', value)}
                                        icon={Users}
                                        min={1}
                                        required
                                      />
                                      <NumberStepperInput
                                        label="Availability *"
                                        value={room.availability || 0}
                                        onChange={(value) => updateRoom(hotelIdx, roomIdx, 'availability', value)}
                                        icon={Hotel}
                                        min={1}
                                        required
                                      />
                                      <NumberStepperInput
                                        label="Size (sqm)"
                                        value={room.sqm || 30}
                                        onChange={(value) => updateRoom(hotelIdx, roomIdx, 'sqm', value)}
                                        icon={Maximize2}
                                        min={1}
                                      />
                                    </div>

                                    {/* Amenities Grid */}
                                    <div className="space-y-4 pt-6 border-t border-gray-100">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Room Amenities</label>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {['Free WiFi', 'Air Conditioning', 'Mini Bar', 'Flat-screen TV', 'Safe', 'Coffee Machine', 'Jacuzzi', 'Bathtub', 'Balcony', 'City View'].map(facility => {
                                          const isChecked = (room.amenities || []).includes(facility);
                                          return (
                                            <label 
                                              key={facility} 
                                              className={`
                                                flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group/fac
                                                ${isChecked 
                                                  ? 'bg-primary/5 border-primary/20 text-primary shadow-sm' 
                                                  : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'}
                                              `}
                                            >
                                              <div className={`
                                                w-5 h-5 rounded flex items-center justify-center transition-all
                                                ${isChecked ? 'bg-primary text-white scale-110' : 'bg-gray-100 text-transparent'}
                                              `}>
                                                <CheckCircle2 className="w-3 h-3" />
                                              </div>
                                              <input 
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                  const current = room.amenities || [];
                                                  const next = e.target.checked 
                                                    ? [...current, facility] 
                                                    : current.filter((f: string) => f !== facility);
                                                  updateRoom(hotelIdx, roomIdx, 'amenities', next);
                                                }}
                                                className="hidden"
                                              />
                                              <span className="text-[10px] font-bold uppercase tracking-wider">{facility}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Food Packages */}
                          <div className="mt-12 pt-10 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                              <div>
                                <h4 className="text-xl font-bold text-primary">Dining Packages</h4>
                                <p className="text-gray-400 text-xs">Food and drink packages offered by this hotel.</p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                leftIcon={Plus} 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addHotelFoodPackage(hotelIdx);
                                }}
                              >
                                Add Package
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {(hotel.foodPackages || []).map((pkg: any, pIdx: number) => (
                                <div key={pIdx} className="p-6 bg-white border border-gray-100 rounded-3xl relative group/pkg">
                                  <button 
                                    onClick={() => removeHotelFoodPackage(hotelIdx, pIdx)}
                                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 rounded-xl opacity-0 group-hover/pkg:opacity-100 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Package Name *</label>
                                      <DualLanguageField
                                        hideLabel
                                        englishPlaceholder="e.g., Full Board"
                                        amharicPlaceholder="ለምሳሌ፦ ሙሉ ቦርድ"
                                        englishValue={pkg.name_en || ''}
                                        amharicValue={pkg.name_am || ''}
                                        onEnglishChange={(value) => updateHotelFoodPackage(hotelIdx, pIdx, 'name_en', value)}
                                        onAmharicChange={(value) => updateHotelFoodPackage(hotelIdx, pIdx, 'name_am', value)}
                                        showEnglish={languagePreference !== 'am'}
                                        showAmharic={languagePreference !== 'en'}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Price per Person *</label>
                                      <Input
                                        placeholder="e.g., 50"
                                        hideLabel
                                        type="number"
                                        min="0"
                                        value={pkg.pricePerPerson || ''}
                                        onChange={(e) => updateHotelFoodPackage(hotelIdx, pIdx, 'pricePerPerson', parseFloat(e.target.value) || 0)}
                                        icon={() => <span className="text-[10px] font-black text-gray-400">ETB</span>}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Included Items</label>
                                    <Input
                                      placeholder="e.g., Breakfast, Lunch, Dinner, Coffee (comma-separated)"
                                      hideLabel
                                      value={pkg.items ? pkg.items.join(', ') : ''}
                                      onChange={(e) => updateHotelFoodPackage(hotelIdx, pIdx, 'items', e.target.value.split(',').map(v => v.trim()))}
                                      icon={Utensils}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-primary">Transportation Options</h3>
                      <p className="text-gray-400 text-sm mt-1">Provide transport services for your guests.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      leftIcon={Plus} 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addTransport();
                      }}
                    >
                      Add Transport
                    </Button>
                  </div>
                  {formData.transportation.length === 0 ? (
                    <div className="text-center p-16 border-2 border-dashed border-gray-100 rounded-[40px] bg-gray-50/30">
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6">
                        <Car className="w-10 h-10 text-gray-200" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-400 mb-2">No Transport Options</h4>
                      <p className="text-sm text-gray-400 mb-8 max-w-xs mx-auto">Help guests move around by adding shuttle services, private cars, or bus options.</p>
                      <Button 
                        variant="outline" 
                        leftIcon={Plus} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addTransport();
                        }}
                      >
                        Add Transport Option
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formData.transportation.map((transport: any, idx: number) => (
                        <div key={idx} className="p-10 bg-gray-50/30 rounded-[40px] border border-gray-100 relative group/trans hover:bg-white hover:shadow-2xl transition-all duration-500">
                          <button 
                            onClick={() => removeTransport(idx)}
                            className="absolute top-8 right-8 p-3 bg-white text-red-500 rounded-2xl border border-red-50 opacity-0 group-hover/trans:opacity-100 transition-all hover:bg-red-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>

                          <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left: Transport Image */}
                            <div className="w-full lg:w-48">
                              <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Vehicle Image</label>
                                <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-primary/20 transition-all group/trans-img">
                                  {transport.image ? (
                                    <>
                                      <img src={transport.image} className="w-full h-full object-cover" alt="" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/trans-img:opacity-100 transition-opacity flex items-center justify-center">
                                        <label htmlFor={`trans-img-${idx}`} className="p-2 bg-white text-primary rounded-full cursor-pointer">
                                          <RefreshCw className="w-4 h-4" />
                                        </label>
                                      </div>
                                    </>
                                  ) : (
                                    <label htmlFor={`trans-img-${idx}`} className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-center p-4">
                                      <Car className="w-8 h-8 text-gray-300 mb-2" />
                                      <span className="text-xs font-bold text-gray-400 uppercase">Upload Photo</span>
                                    </label>
                                  )}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    id={`trans-img-${idx}`} 
                                    onChange={e => e.target.files && handleTransportImageUpload(idx, e.target.files[0])} 
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Right: Transport Details */}
                            <div className="flex-1 space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Transport Type *</label>
                                  <DualLanguageField
                                    hideLabel
                                    englishPlaceholder="e.g., Private Minibus"
                                    amharicPlaceholder="ለምሳሌ፦ የግል ሚኒባስ"
                                    englishValue={transport.type_en || ''}
                                    amharicValue={transport.type_am || ''}
                                    onEnglishChange={(value) => updateTransport(idx, 'type_en', value)}
                                    onAmharicChange={(value) => updateTransport(idx, 'type_am', value)}
                                    showEnglish={languagePreference !== 'am'}
                                    showAmharic={languagePreference !== 'en'}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   {transport.vipIncluded !== true && (
                                     <div className="space-y-2">
                                       <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Price *</label>
                                       <Input
                                         placeholder="e.g., 30"
                                         hideLabel
                                         type="number"
                                         min="0"
                                         value={transport.price || ''}
                                         onChange={(e) => updateTransport(idx, 'price', parseFloat(e.target.value) || 0)}
                                         icon={() => <span className="text-[10px] font-black text-gray-400">ETB</span>}
                                         className={`pl-12 ${errors[`transport_${idx}_price`] ? 'border-red-500 bg-red-50' : ''}`}
                                       />
                                       {errors[`transport_${idx}_price`] && (
                                         <p className="text-xs text-red-500 ml-1 mt-1">{errors[`transport_${idx}_price`]}</p>
                                       )}
                                     </div>
                                   )}
                                   <div className="space-y-2">
                                     {transport.vipIncluded === true && (
                                       <p className="text-xs font-semibold text-amber-600 ml-1 mb-1">VIP Transport</p>
                                     )}
                                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Capacity</label>
                                     <Input
                                       placeholder={transport.vipIncluded === true ? "Auto-set to VIP ticket count" : "e.g., 15"}
                                       hideLabel
                                       type="number"
                                       min="0"
                                       value={transport.capacity || ''}
                                       onChange={(e) => updateTransport(idx, 'capacity', parseInt(e.target.value) || 0)}
                                       icon={Users}
                                       disabled={transport.vipIncluded === true}
                                       className="pl-12"
                                     />
                                     {transport.vipIncluded === true && (
                                       <p className="text-xs text-amber-600/60 ml-1 mt-1">Capacity auto-set to VIP ticket count (shared among VIP holders)</p>
                                     )}
                                   </div>
                                 </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Description *</label>
                                <DualLanguageField
                                  hideLabel
                                  textarea
                                  rows={2}
                                  englishPlaceholder="Describe the service, amenities, pickup/drop-off points..."
                                  amharicPlaceholder="አገልግሎቱን፣ አመቺነቶችን፣ የመሳፈሪያ/የማረፊያ ቦታዎችን ይግለጹ..."
                                  englishValue={transport.description_en || ''}
                                  amharicValue={transport.description_am || ''}
                                  onEnglishChange={(value) => updateTransport(idx, 'description_en', value)}
                                  onAmharicChange={(value) => updateTransport(idx, 'description_am', value)}
                                  showEnglish={languagePreference !== 'am'}
                                  showAmharic={languagePreference !== 'en'}
                                />
                              </div>

                              <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 rounded-2xl border border-primary/10">
                                <input
                                  type="checkbox"
                                  id={`vip-included-${idx}`}
                                  checked={transport.vipIncluded || false}
                                  onChange={(e) => updateTransport(idx, 'vipIncluded', e.target.checked)}
                                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                />
                                <label htmlFor={`vip-included-${idx}`} className="text-xs font-semibold text-primary uppercase tracking-wider cursor-pointer">
                                  Free for VIP ticket holders
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Services */}
              {step === 5 && (
                <div className="space-y-12">
                  <div className="text-center">
                    <h3 className="text-3xl font-serif font-bold text-primary mb-2">Additional Services</h3>
                    <p className="text-gray-500">Enhance your guest's experience with optional cultural services and aid.</p>
                  </div>
                  
                  {/* Cultural Services */}
                  <section className="bg-gray-50/30 p-8 rounded-[40px] border border-gray-100 hover:bg-white transition-all">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                        <Music className="w-6 h-6" />
                      </div>
                      <h4 className="text-lg font-bold text-primary">Cultural Experiences</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {languagePreference !== 'am' && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">English</label>
                          <Textarea
                            hideLabel
                            rows={4}
                            placeholder="e.g., Traditional Coffee Ceremony, Cultural Dance Workshop, Guided Heritage Tour (comma-separated)"
                            value={(formData.services.culturalServices_en || []).join(', ')}
                            onChange={(e) => updateServiceArray('culturalServices', 'en', e.target.value)}
                          />
                        </div>
                      )}
                      {languagePreference !== 'en' && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">አማርኛ</label>
                          <Textarea
                            hideLabel
                            rows={4}
                            placeholder="ለምሳሌ፦ ባህላዊ ቡና ማብሰያ፣ የባህል ዳንስ አውደ ጥናት፣ በአመራር የሚደረግ የቅርስ ጉብኝት (በነጠላ ሰረዝ ይለዩ)"
                            value={(formData.services.culturalServices_am || []).join(', ')}
                            onChange={(e) => updateServiceArray('culturalServices', 'am', e.target.value)}
                            dir="auto"
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Special Assistance */}
                  <section className="bg-gray-50/30 p-8 rounded-[40px] border border-gray-100 hover:bg-white transition-all">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <Heart className="w-6 h-6" />
                      </div>
                      <h4 className="text-lg font-bold text-primary">Special Assistance</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {languagePreference !== 'am' && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">English</label>
                          <Textarea
                            hideLabel
                            rows={4}
                            placeholder="e.g., Wheelchair Access, Sign Language Interpreter, Medical Assistance (comma-separated)"
                            value={(formData.services.specialAssistance_en || []).join(', ')}
                            onChange={(e) => updateServiceArray('specialAssistance', 'en', e.target.value)}
                          />
                        </div>
                      )}
                      {languagePreference !== 'en' && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">አማርኛ</label>
                          <Textarea
                            hideLabel
                            rows={4}
                            placeholder="ለምሳሌ፦ ዊልቼር መድረሻ፣ የምልክት ቋንቋ አስተርጓሚ፣ የህክምና እርዳታ (በነጠላ ሰረዝ ይለዩ)"
                            value={(formData.services.specialAssistance_am || []).join(', ')}
                            onChange={(e) => updateServiceArray('specialAssistance', 'am', e.target.value)}
                            dir="auto"
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Extras */}
                  <section className="bg-gray-50/30 p-8 rounded-[40px] border border-gray-100 hover:bg-white transition-all">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <Plus className="w-6 h-6" />
                      </div>
                      <h4 className="text-lg font-bold text-primary">Other Extras</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {languagePreference !== 'am' && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">English</label>
                          <Textarea
                            hideLabel
                            rows={4}
                            placeholder="e.g., Photography Pass, Souvenir Package, VIP Lounge Access (comma-separated)"
                            value={(formData.services.extras_en || []).join(', ')}
                            onChange={(e) => updateServiceArray('extras', 'en', e.target.value)}
                          />
                        </div>
                      )}
                      {languagePreference !== 'en' && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">አማርኛ</label>
                          <Textarea
                            hideLabel
                            rows={4}
                            placeholder="ለምሳሌ፦ የፎቶግራፍ ፓስ፣ የመታሰቢያ ጥቅል፣ የቪአይፒ ላውንጅ መድረሻ (በነጠላ ሰረዝ ይለዩ)"
                            value={(formData.services.extras_am || []).join(', ')}
                            onChange={(e) => updateServiceArray('extras', 'am', e.target.value)}
                            dir="auto"
                          />
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {/* Step 6: Policies */}
              {step === 6 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-serif font-bold text-primary mb-2">Policies & Terms</h3>
                    <p className="text-gray-500">Define the rules and expectations for your festival attendees.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="bg-gray-50/30 p-6 rounded-[32px] border border-gray-100 hover:bg-white transition-all">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Cancellation Policy *</label>
                        <DualLanguageField
                          hideLabel
                          textarea
                          rows={4}
                          englishPlaceholder="Cancellation terms, refund policy, deadlines..."
                          amharicValue={formData.policies.cancellation_am || ''}
                          onEnglishChange={(value) => setFormData(prev => ({ ...prev, policies: { ...prev.policies, cancellation_en: value } }))}
                          onAmharicChange={(value) => setFormData(prev => ({ ...prev, policies: { ...prev.policies, cancellation_am: value } }))}
                          showEnglish={languagePreference !== 'am'}
                          showAmharic={languagePreference !== 'en'}
                          className={errors.cancellation_en ? 'ring-1 ring-red-500 rounded-xl' : ''}
                        />
                        {errors.cancellation_en && (
                          <p className="text-xs text-red-500 ml-1 mt-2">{errors.cancellation_en}</p>
                        )}
                      </div>
                      <div className="bg-gray-50/30 p-6 rounded-[32px] border border-gray-100 hover:bg-white transition-all">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Booking Terms *</label>
                        <DualLanguageField
                          hideLabel
                          textarea
                          rows={4}
                          englishPlaceholder="Booking conditions, payment terms, modifications..."
                          amharicValue={formData.policies.terms_am || ''}
                          onEnglishChange={(value) => setFormData(prev => ({ ...prev, policies: { ...prev.policies, terms_en: value } }))}
                          onAmharicChange={(value) => setFormData(prev => ({ ...prev, policies: { ...prev.policies, terms_am: value } }))}
                          showEnglish={languagePreference !== 'am'}
                          showAmharic={languagePreference !== 'en'}
                          className={errors.terms_en ? 'ring-1 ring-red-500 rounded-xl' : ''}
                        />
                        {errors.terms_en && (
                          <p className="text-xs text-red-500 ml-1 mt-2">{errors.terms_en}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50/30 p-6 rounded-[32px] border border-gray-100 hover:bg-white transition-all">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Safety Rules</label>
                        <DualLanguageField
                          hideLabel
                          textarea
                          rows={4}
                          englishPlaceholder="Safety guidelines, emergency procedures, prohibited items..."
                          amharicValue={formData.policies.safety_am || ''}
                          onEnglishChange={(value) => setFormData({ ...formData, policies: { ...formData.policies, safety_en: value } })}
                          onAmharicChange={(value) => setFormData({ ...formData, policies: { ...formData.policies, safety_am: value } })}
                          showEnglish={languagePreference !== 'am'}
                          showAmharic={languagePreference !== 'en'}
                        />
                      </div>
                      <div className="bg-gray-50/30 p-6 rounded-[32px] border border-gray-100 hover:bg-white transition-all">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Age Restriction</label>
                        <Input
                          hideLabel
                          placeholder="e.g., 18+, All ages, Family-friendly"
                          value={formData.policies.ageRestriction || ''}
                          onChange={(e) => setFormData({ ...formData, policies: { ...formData.policies, ageRestriction: e.target.value } })}
                          icon={Users}
                          className="pl-12"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Step 7: Pricing */}
              {step === 7 && (
                <div className="space-y-12">
                  <div className="text-center">
                    <h3 className="text-3xl font-serif font-bold text-primary mb-2">Pricing & Discounts</h3>
                    <p className="text-gray-500">Distribute your <strong>{formData.core.totalCapacity || 0} total capacity</strong> between ticket tiers. *</p>
                  </div>

                  {/* Capacity Allocation Summary */}
                  <div className="max-w-3xl mx-auto bg-gray-50/80 backdrop-blur-sm p-6 rounded-[32px] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Capacity</p>
                        <p className="text-2xl font-black text-primary">{formData.core.totalCapacity || 0}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center gap-2 px-8">
                      {(() => {
                        const stdQty = formData.ticketTypes?.find((t: any) => t.name_en === 'Standard' || t.name === 'Standard')?.quantity || 0;
                        const vipQty = formData.ticketTypes?.find((t: any) => t.name_en === 'VIP' || t.name === 'VIP')?.quantity || 0;
                        const total = formData.core.totalCapacity || 0;
                        const allocated = stdQty + vipQty;
                        const stdPercent = total > 0 ? (stdQty / total) * 100 : 0;
                        const vipPercent = total > 0 ? (vipQty / total) * 100 : 0;
                        
                        return (
                          <div className="w-full space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span className="text-primary">Standard ({stdQty})</span>
                              <span className="text-amber-600">VIP ({vipQty})</span>
                              <span className={allocated > total ? 'text-red-500' : 'text-gray-400'}>
                                {allocated > total ? `Over Capacity (+${allocated - total})` : `Remaining (${total - allocated})`}
                              </span>
                            </div>
                            <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden flex">
                              <div style={{ width: `${stdPercent}%` }} className="h-full bg-primary transition-all duration-500" />
                              <div style={{ width: `${vipPercent}%` }} className="h-full bg-amber-500 transition-all duration-500" />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Early Bird Section */}
                  <div className="max-w-3xl mx-auto mb-8">
                    <div className="bg-white p-8 rounded-[32px] border border-emerald-100 shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                      <div className="relative">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                            <Zap className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-800">Early Bird Offer</h4>
                            <p className="text-sm text-gray-400">Encourage early bookings with special pricing</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Early Bird Price</label>
                            <div className="flex items-center gap-3 px-4 py-3.5 bg-emerald-50/30 rounded-[14px] border border-emerald-100 focus-within:bg-white focus-within:border-emerald-300 transition-all">
                              <span className="text-xs font-black text-emerald-600">ETB</span>
                              <input
                                type="number"
                                min="0"
                                value={formData.pricing.earlyBirdPrice || ''}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  pricing: { ...prev.pricing, earlyBirdPrice: parseFloat(e.target.value) || 0 }
                                }))}
                                className="flex-1 text-lg font-bold bg-transparent border-0 outline-none text-emerald-700 placeholder-emerald-200"
                                placeholder="e.g., 50"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Early Bird Deadline</label>
                            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50/30 rounded-[14px] border border-emerald-100 focus-within:bg-white focus-within:border-emerald-300 transition-all">
                              <Calendar className="w-5 h-5 text-emerald-600" />
                              <input
                                type="date"
                                value={formData.pricing.earlyBirdDeadline || ''}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  pricing: { ...prev.pricing, earlyBirdDeadline: e.target.value }
                                }))}
                                className="flex-1 text-lg font-bold bg-transparent border-0 outline-none text-emerald-700"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Standard Ticket Card */}
                    <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                      <div className="relative">
                        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
                          <Ticket className="w-8 h-8 text-primary" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 mb-1">Standard Ticket</h4>
                        <p className="text-sm text-gray-400 mb-6">Pay as you go - rooms & transport sold separately</p>
                        
                        {/* Standard Ticket Quantity */}
                        <div className="mb-6 space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Ticket Quantity *</label>
                          <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-50/50 rounded-[14px] border border-gray-200 focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                            <Users className="w-5 h-5 text-primary" />
                            <input
                              type="number"
                              min="0"
                              max={formData.core.totalCapacity || 0}
                              value={(() => {
                                const stdTicket = formData.ticketTypes?.find((t: any) => t.name_en === 'Standard' || t.name === 'Standard');
                                return stdTicket?.quantity || 0;
                              })()}
                              onChange={(e) => {
                                const newQty = parseInt(e.target.value) || 0;
                                const total = formData.core.totalCapacity || 0;
                                const vipQty = formData.ticketTypes?.find((t: any) => t.name_en === 'VIP' || t.name === 'VIP')?.quantity || 0;
                                
                                const cappedQty = Math.min(newQty, total - vipQty);
                                
                                let found = false;
                                const newTicketTypes = formData.ticketTypes?.map((t: any) => {
                                  if (t.name_en === 'Standard' || t.name === 'Standard') {
                                    found = true;
                                    return { ...t, quantity: cappedQty, available: cappedQty };
                                  }
                                  return t;
                                }) || [];
                                
                                if (!found) {
                                  newTicketTypes.push({ 
                                    name_en: 'Standard', 
                                    name_am: 'Standard', 
                                    price: formData.pricing.basePrice || 0, 
                                    quantity: cappedQty, 
                                    available: cappedQty, 
                                    benefits: [] 
                                  });
                                }
                                setFormData(prev => ({ ...prev, ticketTypes: newTicketTypes }));
                              }}
                              className="flex-1 text-xl font-bold bg-transparent border-0 outline-none text-primary"
                              placeholder="0"
                            />
                            <span className="text-xs font-bold text-gray-400">/ {formData.core.totalCapacity || 0} total</span>
                          </div>
                        </div>

                        {/* Standard Price */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Price per Ticket *</label>
                          <div className={`flex items-center gap-3 px-4 py-3.5 bg-gray-50/50 rounded-[14px] border border-gray-200 focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all ${errors.basePrice ? 'border-red-500 bg-red-50' : ''}`}>
                            <span className="text-xs font-black text-primary">ETB</span>
                            <input
                              type="number"
                              min="1"
                              value={formData.pricing.basePrice || ''}
                              onChange={(e) => {
                                const newPrice = parseFloat(e.target.value) || 0;
                                const newTicketTypes = formData.ticketTypes?.map((t: any) => 
                                  (t.name_en === 'Standard' || t.name === 'Standard')
                                    ? { ...t, price: newPrice }
                                    : t
                                ) || [];
                                setFormData(prev => ({ 
                                  ...prev, 
                                  pricing: { ...prev.pricing, basePrice: newPrice },
                                  ticketTypes: newTicketTypes
                                }));
                              }}
                              className="flex-1 text-xl font-bold bg-transparent border-0 outline-none text-primary placeholder-gray-300"
                              placeholder="0"
                            />
                            <span className="text-sm text-gray-400">/ticket</span>
                          </div>
                          {errors.basePrice && (
                            <p className="text-xs text-red-500 ml-1 mt-1">{errors.basePrice}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* VIP Ticket Card */}
                    <div className="bg-white p-10 rounded-[48px] border border-amber-100 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                      <div className="relative">
                        <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center mb-6">
                          <Star className="w-8 h-8 text-amber-600 fill-amber-600" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 mb-1">VIP Ticket</h4>
                        <p className="text-sm text-gray-400 mb-6">All-inclusive package with hotel & transport</p>
                        
                        {/* VIP Ticket Quantity */}
                        <div className="mb-6 space-y-2">
                          <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider ml-1">VIP Ticket Quantity *</label>
                          <div className="flex items-center gap-3 px-4 py-3.5 bg-amber-50/30 rounded-[14px] border border-amber-100 focus-within:bg-white focus-within:border-amber-300 focus-within:ring-4 focus-within:ring-amber-100 transition-all">
                            <Ticket className="w-5 h-5 text-amber-700" />
                            <input
                              type="number"
                              min="0"
                              max={formData.core.totalCapacity || 0}
                              value={(() => {
                                const vipTicket = formData.ticketTypes?.find((t: any) => t.name_en === 'VIP' || t.name === 'VIP');
                                return vipTicket?.quantity || 0;
                              })()}
                              onChange={(e) => {
                                const newQty = parseInt(e.target.value) || 0;
                                const total = formData.core.totalCapacity || 0;
                                const stdQty = formData.ticketTypes?.find((t: any) => t.name_en === 'Standard' || t.name === 'Standard')?.quantity || 0;
                                
                                const cappedQty = Math.min(newQty, total - stdQty);

                                let found = false;
                                const newTicketTypes = formData.ticketTypes?.map((t: any) => {
                                  if (t.name_en === 'VIP' || t.name === 'VIP') {
                                    found = true;
                                    return { ...t, quantity: cappedQty, available: cappedQty };
                                  }
                                  return t;
                                }) || [];
                                
                                if (!found) {
                                  newTicketTypes.push({ 
                                    name_en: 'VIP', 
                                    name_am: 'VIP', 
                                    price: formData.pricing.vipPrice || 0, 
                                    quantity: cappedQty, 
                                    available: cappedQty, 
                                    benefits: [] 
                                  });
                                }
                                
                                const newHotels = formData.hotels.map((hotel: any) => ({
                                  ...hotel,
                                  rooms: (hotel.rooms || []).map((room: any) => 
                                    room.tier === 'vip' 
                                      ? { ...room, availability: cappedQty }
                                      : room
                                  )
                                }));
                                
                                const newTransport = formData.transportation.map((t: any) => 
                                  t.vipIncluded 
                                    ? { ...t, capacity: cappedQty }
                                    : t
                                );
                                
                                setFormData(prev => ({ 
                                  ...prev, 
                                  ticketTypes: newTicketTypes,
                                  hotels: newHotels,
                                  transportation: newTransport
                                }));
                              }}
                              className="flex-1 text-xl font-bold bg-transparent border-0 outline-none text-amber-700"
                              placeholder="0"
                            />
                            <span className="text-xs font-bold text-amber-600/60">/ {formData.core.totalCapacity || 0} total</span>
                          </div>
                          <p className="text-xs text-amber-600/60 ml-1">1 VIP ticket = 1 room + transport included</p>
                        </div>

                        {/* VIP Price (All-Inclusive) */}
                         <div className="space-y-2">
                           <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider ml-1">VIP Price (All-Inclusive) *</label>
                           <div className={`flex items-center gap-3 px-4 py-3.5 bg-amber-50/30 rounded-[14px] border border-amber-100 focus-within:bg-white focus-within:border-amber-300 focus-within:ring-4 focus-within:ring-amber-100 transition-all`}>
                            <span className="text-xs font-black text-amber-700">ETB</span>
                            <input
                              type="number"
                              min="0"
                              value={formData.pricing.vipPrice || ''}
                              onChange={(e) => {
                                const newPrice = parseFloat(e.target.value) || 0;
                                const newTicketTypes = formData.ticketTypes?.map((t: any) => 
                                  (t.name_en === 'VIP' || t.name === 'VIP')
                                    ? { ...t, price: newPrice }
                                    : t
                                ) || [];
                                setFormData(prev => ({ 
                                  ...prev, 
                                  pricing: { ...prev.pricing, vipPrice: newPrice },
                                  ticketTypes: newTicketTypes
                                }));
                              }}
                              className="flex-1 text-xl font-bold bg-transparent border-0 outline-none text-amber-700 placeholder-amber-200"
                              placeholder="0"
                            />
                            <span className="text-sm text-amber-600 font-medium">all-inclusive</span>
                          </div>
                          {errors.vipPrice && (
                            <p className="text-xs text-red-500 ml-1 mt-1">{errors.vipPrice}</p>
                          )}
                        </div>
                        
                        {/* VIP Package Configuration */}
                        <div className="mt-8 space-y-6 pt-6 border-t border-amber-100">
                          <div className="space-y-3">
                            <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider ml-1">Included VIP Hotels (User Chooses 1)</label>
                            <div className="flex flex-wrap gap-2">
                              {formData.hotels.map((hotel: any, idx: number) => {
                                const hotelId = hotel.id || `hotel-${idx}`;
                                const isIncluded = (formData.pricing.vipIncludedHotels || []).includes(hotelId);
                                return (
                                  <button
                                    key={hotelId}
                                    onClick={() => {
                                      const current = formData.pricing.vipIncludedHotels || [];
                                      const next = isIncluded 
                                        ? current.filter((id: string) => id !== hotelId)
                                        : [...current, hotelId];
                                      setFormData(prev => ({ ...prev, pricing: { ...prev.pricing, vipIncludedHotels: next } }))
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                      isIncluded 
                                        ? 'bg-amber-100 border-amber-300 text-amber-800' 
                                        : 'bg-white border-gray-200 text-gray-400 hover:border-amber-200'
                                    }`}
                                  >
                                    {hotel.name_en || `Hotel ${idx + 1}`}
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-xs text-amber-600/60 font-medium ml-1">VIP ticket holders will choose one from these hotels.</p>
                          </div>
                          
                          <div className="space-y-3">
                            <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider ml-1">Included VIP Transport (User Chooses 1)</label>
                            <div className="flex flex-wrap gap-2">
                              {formData.transportation.map((transport: any, idx: number) => {
                                const transportId = transport.id || `transport-${idx}`;
                                const isIncluded = (formData.pricing.vipIncludedTransport || []).includes(transportId);
                                return (
                                  <button
                                    key={transportId}
                                    onClick={() => {
                                      const current = formData.pricing.vipIncludedTransport || [];
                                      const next = isIncluded 
                                        ? current.filter((id: string) => id !== transportId)
                                        : [...current, transportId];
                                      setFormData(prev => ({ ...prev, pricing: { ...prev.pricing, vipIncludedTransport: next } }))
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                      isIncluded 
                                        ? 'bg-amber-100 border-amber-300 text-amber-800' 
                                        : 'bg-white border-gray-200 text-gray-400 hover:border-amber-200'
                                    }`}
                                  >
                                    {transport.type_en || `Transport ${idx + 1}`}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 8: Review & Publish */}
              {step === 8 && (
                <div className="space-y-12">
                  <div className="text-center">
                    <h3 className="text-3xl font-serif font-bold text-primary mb-2">Review & Publish</h3>
                    <p className="text-gray-500">Please review your festival details before submitting for verification.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Summary */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Core Details Card */}
                      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                          </div>
                          <h4 className="text-xl font-bold text-gray-800">Core Festival Details</h4>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Festival Name</p>
                              <p className="text-lg font-bold text-gray-800">{formData.core.name_en || formData.core.name_am}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Capacity</p>
                              <p className="text-lg font-bold text-gray-800">{formData.core.totalCapacity} Persons</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Date</p>
                              <p className="text-sm font-bold text-gray-800">{formData.core.startDate} - {formData.core.endDate}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Location</p>
                              <p className="text-sm font-bold text-gray-800">{formData.core.locationName_en || formData.core.locationName_am}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Specific Location (Map)</p>
                            <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-emerald-500" />
                              {formData.core.coordinates 
                                ? `Lat: ${formData.core.coordinates.lat.toFixed(6)}, Lng: ${formData.core.coordinates.lng.toFixed(6)}`
                                : 'No location selected'}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Description</p>
                            <p className="text-sm text-gray-500 italic leading-relaxed">
                              "{formData.core.shortDescription_en || formData.core.shortDescription_am}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Schedule Summary */}
                      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <Calendar className="w-6 h-6" />
                          </div>
                          <h4 className="text-xl font-bold text-gray-800">Event Schedule</h4>
                        </div>
                        <div className="space-y-4">
                          {formData.schedule.map((day, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-amber-600 shadow-sm">
                                  D{i+1}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800">{day.title_en || day.title_am}</p>
                                  <p className="text-xs text-gray-400">{day.performers.length} Performers</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Logistics Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl">
                           <h5 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                             <Hotel className="w-5 h-5 text-indigo-500" /> Accommodation
                           </h5>
                           <div className="space-y-3">
                             {formData.hotels.map((h, i) => (
                               <div key={i} className="text-xs p-3 bg-gray-50 rounded-xl">
                                 <p className="font-bold text-gray-800">{h.name_en || h.name_am}</p>
                                 <p className="text-gray-400">{h.rooms?.length || 0} Room Types</p>
                               </div>
                             ))}
                           </div>
                         </div>
                         <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl">
                           <h5 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                             <Car className="w-5 h-5 text-blue-500" /> Transportation
                           </h5>
                           <div className="space-y-3">
                             {formData.transportation.map((t, i) => (
                               <div key={i} className="text-xs p-3 bg-gray-50 rounded-xl">
                                 <p className="font-bold text-gray-800">{t.type_en || t.type_am}</p>
                                 <p className="text-gray-400">{t.vipIncluded ? 'VIP Package' : `ETB ${t.price}`}</p>
                               </div>
                             ))}
                           </div>
                         </div>
                      </div>
                    </div>

                    {/* Sidebar Summary */}
                    <div className="space-y-8">
                      {/* Pricing Summary Card */}
                      <div className="bg-[#1a1c23] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <h4 className="text-lg font-bold mb-8 flex items-center gap-2">
                          <span className="text-primary font-black text-xs">ETB</span> Pricing Summary
                        </h4>
                        
                        <div className="space-y-6">
                          {formData.pricing.earlyBirdPrice > 0 && (
                            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                              <div>
                                <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Early Bird</p>
                                <p className="text-2xl font-black">ETB {formData.pricing.earlyBirdPrice}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-gray-500">Deadline</p>
                                <p className="text-xs font-bold">{formData.pricing.earlyBirdDeadline}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between items-center pb-4 border-b border-white/10">
                            <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Regular</p>
                              <p className="text-2xl font-black">ETB {formData.pricing.basePrice}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest">VIP (All-In)</p>
                              <p className="text-2xl font-black text-amber-500">ETB {formData.pricing.vipPrice}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Services Summary */}
                      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl">
                         <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                           <LayoutGrid className="w-5 h-5 text-primary" /> Services Included
                         </h4>
                         <div className="space-y-4">
                           <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cultural</p>
                             <div className="flex flex-wrap gap-2">
                               {(formData.services.culturalServices_en || []).map((s, i) => (
                                 <span key={i} className="px-2 py-1 bg-gray-50 text-xs font-bold rounded-lg">{s}</span>
                               ))}
                             </div>
                           </div>
                           <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Special Assistance</p>
                             <div className="flex flex-wrap gap-2">
                               {(formData.services.specialAssistance_en || []).map((s, i) => (
                                 <span key={i} className="px-2 py-1 bg-gray-50 text-xs font-bold rounded-lg">{s}</span>
                               ))}
                             </div>
                           </div>
                         </div>
                      </div>

                      {/* Final Actions */}
                      <div className="flex flex-col justify-center space-y-6">
                        <div className="p-8 bg-amber-50 rounded-[32px] border border-amber-100">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-100 rounded-lg">
                              <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-amber-800 mb-1">Verification Required</h5>
                              <p className="text-xs text-amber-700/70 leading-relaxed">Your festival will be reviewed by our team before it becomes visible to tourists. This usually takes 24-48 hours.</p>
                            </div>
                          </div>
                        </div>

                        <Button 
                          size="lg" 
                          className="w-full h-16 rounded-[24px] text-lg font-black shadow-xl shadow-primary/20"
                          onClick={handlePublish}
                        >
                          Submit for Verification
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
          <Button
            variant="outline"
            leftIcon={ChevronLeft}
            onClick={prevStep}
            disabled={step === 1}
          >
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            {[4, 5, 6].includes(step) && (
              <button 
                onClick={skipStep}
                className="px-6 py-2 text-sm font-bold text-gray-400 hover:text-primary transition-colors"
              >
                Skip for now
              </button>
            )}
            <Button
              rightIcon={step === 8 ? CheckCircle2 : ChevronRight}
              onClick={step === 8 ? handlePublish : nextStep}
              className={step === 8 ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500' : ''}
            >
              {step === 8 ? (initialData ? 'Save Changes' : 'Complete & Submit') : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};




