import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Image as ImageIcon, Camera, 
  MapPin, Search, RefreshCw, Plus, Ticket, Star, Hotel, Car,
  Box, DollarSign, CheckCircle2, Trash2, Calendar, Clock,
  Users, Shield, Info, Eye, Save, Globe, Map as MapIcon,
  Utensils, Music, Heart, AlertCircle
} from 'lucide-react';
import { Button, Badge, Input, VerifiedBadge } from '../UI';
import { HotelAccommodation, TransportOption, RoomType } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { DualLanguageField } from '../BilingualInput';
import { useLanguage } from '../../context/LanguageContext';

const MapPickerModal = dynamic(() => import('../MapPickerModal'), { 
  ssr: false 
});

import apiClient from '../../lib/apiClient';

const STEPS = [
  { id: 1, name: 'Core Information', key: 'organizer.createFestival.coreInfo', icon: Info },
  { id: 2, name: 'Schedule', key: 'organizer.createFestival.schedule', icon: Calendar },
  { id: 3, name: 'Hotels', key: 'organizer.createFestival.hotels', icon: Hotel },
  { id: 4, name: 'Transportation', key: 'organizer.createFestival.transportation', icon: Car },
  { id: 5, name: 'Services', key: 'organizer.createFestival.services', icon: Utensils },
  { id: 6, name: 'Policies', key: 'organizer.createFestival.policies', icon: Shield },
  { id: 7, name: 'Pricing', key: 'organizer.createFestival.pricing', icon: DollarSign },
  { id: 8, name: 'Review & Publish', key: 'organizer.createFestival.reviewPublish', icon: Eye },
];

export const FestivalCreationWizard: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [languagePreference, setLanguagePreference] = useState<'both' | 'en' | 'am'>('both');
  const [formData, setFormData] = useState({
    core: {
      name_en: '',
      name_am: '',
      slug: '', 
      type: 'CulturalTraditional' as 'Religious' | 'CulturalTraditional' | 'NationalPublicHolidays',
      startDate: '', 
      endDate: '', 
      totalCapacity: 0,
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
    schedule: [{ 
      day: 1, 
      title_en: '', 
      title_am: '', 
      activities_en: '', 
      activities_am: '', 
      performers: [] as string[],
      image: ''
    }],
    hotels: [] as any[],
    transportation: [] as any[],
    services: { 
      foodPackages: [] as any[], 
      culturalServices_en: [] as string[],
      culturalServices_am: [] as string[],
      specialAssistance_en: [] as string[],
      specialAssistance_am: [] as string[],
      extras_en: [] as string[],
      extras_am: [] as string[]
    },
    policies: { 
      cancellation_en: '', 
      cancellation_am: '',
      terms_en: '', 
      terms_am: '',
      safety_en: '', 
      safety_am: '',
      ageRestriction: '' 
    },
    pricing: { 
      basePrice: 0, 
      vipPrice: 0, 
      currency: 'ETB', 
      earlyBird: 0, 
      groupDiscount: 0 
    },
    ticketTypes: [
      { name_en: 'Standard', name_am: 'ስታንዳርድ', price: 0, quantity: 100, available: 100, benefits: [] },
      { name_en: 'VIP', name_am: 'ቪአይ', price: 0, quantity: 50, available: 50, benefits: [] }
    ]
  });

  // Auto-generate slug from English name
  useEffect(() => {
    const slug = formData.core.name_en.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setFormData(prev => ({ ...prev, core: { ...prev.core, slug } }));
  }, [formData.core.name_en]);

  const nextStep = () => setStep(s => Math.min(s + 1, 8));
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
    starRating: 3,
    image: '',
    facilities: [] as string[],
    rooms: [] as any[],
    hotelServices: [] as any[],
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
    const newHotels = [...formData.hotels];
    newHotels[index] = { ...newHotels[index], [field]: value };
    setFormData(prev => ({ ...prev, hotels: newHotels }));
  };

  const removeHotel = (index: number) => {
    setFormData(prev => ({ ...prev, hotels: prev.hotels.filter((_: any, i: number) => i !== index) }));
  };

  const addRoom = (hotelIndex: number) => {
    const newHotels = [...formData.hotels];
    const hotel = { ...newHotels[hotelIndex], rooms: [...(newHotels[hotelIndex].rooms || [])] };
    hotel.rooms.push(createEmptyRoom());
    newHotels[hotelIndex] = hotel;
    setFormData({ ...formData, hotels: newHotels });
  };

  const updateRoom = (hotelIndex: number, roomIndex: number, field: string, value: any) => {
    const newHotels = [...formData.hotels];
    const rooms = [...newHotels[hotelIndex].rooms];
    rooms[roomIndex] = { ...rooms[roomIndex], [field]: value };
    newHotels[hotelIndex] = { ...newHotels[hotelIndex], rooms };
    setFormData({ ...formData, hotels: newHotels });
  };

  const removeRoom = (hotelIndex: number, roomIndex: number) => {
    const newHotels = [...formData.hotels];
    const rooms = newHotels[hotelIndex].rooms.filter((_: any, i: number) => i !== roomIndex);
    newHotels[hotelIndex] = { ...newHotels[hotelIndex], rooms };
    setFormData({ ...formData, hotels: newHotels });
   };

  // Hotel service handlers
  const addHotelService = (hotelIndex: number) => {
    const newHotels = [...formData.hotels];
    const hotel = { ...newHotels[hotelIndex], hotelServices: [...(newHotels[hotelIndex].hotelServices || [])] };
    hotel.hotelServices.push({ name: '', price: 0, description: '' });
    newHotels[hotelIndex] = hotel;
    setFormData({ ...formData, hotels: newHotels });
  };

  const updateHotelService = (hotelIndex: number, serviceIndex: number, field: string, value: any) => {
    const newHotels = [...formData.hotels];
    const services = [...newHotels[hotelIndex].hotelServices];
    services[serviceIndex] = { ...services[serviceIndex], [field]: value };
    newHotels[hotelIndex] = { ...newHotels[hotelIndex], hotelServices: services };
    setFormData({ ...formData, hotels: newHotels });
  };

  const removeHotelService = (hotelIndex: number, serviceIndex: number) => {
    const newHotels = [...formData.hotels];
    const services = newHotels[hotelIndex].hotelServices.filter((_: any, i: number) => i !== serviceIndex);
    newHotels[hotelIndex] = { ...newHotels[hotelIndex], hotelServices: services };
    setFormData({ ...formData, hotels: newHotels });
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
    const arr = value.split(',').map(v => v.trim()).filter(Boolean);
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

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);

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

  const handleTransportImageUpload = async (transIdx: number, file: File) => {
    if (!file) return;
    const imageUrl = await handleFileUpload(file);
    if (imageUrl) {
      updateTransport(transIdx, 'image', imageUrl);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const response = await apiClient.post('/api/organizer/festivals', {
        ...formData.core,
        name_en: formData.core.name_en,
        name_am: languagePreference === 'am' ? formData.core.name_am : undefined,
        shortDescription_en: formData.core.shortDescription_en,
        shortDescription_am: languagePreference === 'am' ? formData.core.shortDescription_am : undefined,
        fullDescription_en: formData.core.fullDescription_en,
        fullDescription_am: languagePreference === 'am' ? formData.core.fullDescription_am : undefined,
        location: {
          name_en: formData.core.locationName_en,
          name_am: languagePreference === 'am' ? formData.core.locationName_am : undefined,
          address: formData.core.address,
          coordinates: formData.core.coordinates,
        },
        schedule: formData.schedule,
        hotels: formData.hotels,
        transportation: formData.transportation,
        services: formData.services,
        policies: formData.policies,
        pricing: formData.pricing,
        status: 'Draft',
        verificationStatus: 'Draft'
      });

      if (response.success) {
        alert('Festival saved as draft successfully!');
        router.push('/dashboard/organizer/festivals');
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
    if (!formData.core.address) allMissing.push('Address');
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
      const response = await apiClient.post('/api/organizer/festivals', {
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
          address: formData.core.address,
          coordinates: formData.core.coordinates,
        },
        schedule: formData.schedule,
        hotels: formData.hotels,
        transportation: formData.transportation,
        services: formData.services,
        policies: formData.policies,
        pricing: formData.pricing,
        status: 'Draft',
        verificationStatus: 'Pending Approval',
        submittedAt: new Date().toISOString()
      });

      if (response.success) {
        alert('Festival submitted for verification successfully!');
        router.push('/dashboard/organizer/festivals');
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-center">{t(s.key)}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-[2px] flex-1 min-w-[20px] mx-2 ${step > s.id ? 'bg-emerald-500' : 'bg-gray-100'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // const renderStepIndicator = () => (
  //   <div className="flex items-center justify-between mb-12 overflow-x-auto pb-4 scrollbar-hide">
  //     {STEPS.map((s, i) => (
  //       <React.Fragment key={s.id}>
  //         <div 
  //           className={`flex flex-col items-center min-w-[100px] cursor-pointer transition-all ${step >= s.id ? 'text-primary' : 'text-gray-300'}`}
  //           onClick={() => setStep(s.id)}
  //         >
  //           <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 transition-all ${
  //             step === s.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 
  //             step > s.id ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-gray-100'
  //           }`}>
  //             {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
  //           </div>
  //           <span className="text-[10px] font-bold uppercase tracking-wider text-center">{s.name}</span>
  //         </div>
  //         {i < STEPS.length - 1 && (
  //           <div className={`h-[2px] flex-1 min-w-[20px] mx-2 ${step > s.id ? 'bg-emerald-500' : 'bg-gray-100'}`} />
  //         )}
  //       </React.Fragment>
  //     ))}
  //   </div>
  // );

    return (
    <div className="max-w-[1400px] mx-auto pb-20">
      <MapPickerModal 
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialPosition={formData.core.coordinates}
        onLocationSelect={(coords) => {
          setFormData(prev => ({ ...prev, core: { ...prev.core, coordinates: coords } }));
        }}
      />
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onCancel} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div>
             <h2 className="text-3xl font-serif font-bold text-primary">{t("organizer.createFestival.createNewFestival")}</h2>
             <p className="text-gray-400 text-sm">{t("organizer.createFestival.shareHeritage")}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" leftIcon={Save} onClick={handleSaveDraft}>Save Draft</Button>
          <Button onClick={handlePublish} disabled={step !== 8}>Publish Festival</Button>
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
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
                  <div className="lg:col-span-3 space-y-8">
                    {/* Language Preference */}
                    <div className="bg-ethio-bg p-5 rounded-2xl">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-3">Content Language Preference</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-primary transition-colors">
                          <input
                            type="radio"
                            name="languagePreference"
                            value="both"
                            checked={languagePreference === 'both'}
                            onChange={(e) => setLanguagePreference(e.target.value as 'both')}
                            className="w-4 h-4 text-primary"
                          />
                          <div>
                            <span className="font-medium">Bilingual (Both)</span>
                            <p className="text-xs text-gray-500">English + Amharic required</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-primary transition-colors">
                          <input
                            type="radio"
                            name="languagePreference"
                            value="en"
                            checked={languagePreference === 'en'}
                            onChange={(e) => setLanguagePreference(e.target.value as 'en')}
                            className="w-4 h-4 text-primary"
                          />
                          <div>
                            <span className="font-medium">{t("organizer.createFestival.englishOnly")}</span>
                            <p className="text-xs text-gray-500">Only English fields required</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-primary transition-colors">
                          <input
                            type="radio"
                            name="languagePreference"
                            value="am"
                            checked={languagePreference === 'am'}
                            onChange={(e) => setLanguagePreference(e.target.value as 'am')}
                            className="w-4 h-4 text-primary"
                          />
                          <div>
                            <span className="font-medium">{t("organizer.createFestival.amharicOnly")}</span>
                            <p className="text-xs text-gray-500">Only Amharic fields required</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DualLanguageField
                        label="Festival Name *"
                        englishPlaceholder="e.g. Timket 2025"
                        amharicPlaceholder="ቲምኬት 2025"
                        englishValue={formData.core.name_en}
                        amharicValue={formData.core.name_am}
                        onEnglishChange={(value) => setFormData({...formData, core: {...formData.core, name_en: value}})}
                        onAmharicChange={(value) => setFormData({...formData, core: {...formData.core, name_am: value}})}
                        showEnglish={languagePreference !== 'am'}
                        showAmharic={languagePreference !== 'en'}
                      />
                      <Input
                        label="Slug"
                        value={formData.core.slug}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Festival Type *</label>
                        <select
                          value={formData.core.type}
                          onChange={(e) => setFormData({...formData, core: {...formData.core, type: e.target.value as 'Religious' | 'CulturalTraditional' | 'NationalPublicHolidays'}})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                        >
                          <option value="Religious">Religious</option>
                          <option value="CulturalTraditional">Cultural / Traditional</option>
                          <option value="NationalPublicHolidays">National / Public Holidays</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input 
                        label={t("organizer.createFestival.startDate") + " *"} 
                        type="date" 
                        value={formData.core.startDate} 
                        onChange={e => setFormData({...formData, core: {...formData.core, startDate: e.target.value}})} 
                      />
                      <Input 
                        label={t("organizer.createFestival.endDate") + " *"} 
                        type="date" 
                        value={formData.core.endDate} 
                        onChange={e => setFormData({...formData, core: {...formData.core, endDate: e.target.value}})} 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input 
                        label="Total Capacity *"
                        type="number"
                        min="1"
                        placeholder="Maximum number of tourists"
                        value={formData.core.totalCapacity || ''}
                        onChange={e => setFormData({...formData, core: {...formData.core, totalCapacity: parseInt(e.target.value) || 0}})}
                      />
                      <DualLanguageField
                        label={t("organizer.createFestival.locationName") + " *"}
                        englishPlaceholder="e.g. Gondar, Ethiopia"
                        amharicPlaceholder="ጎንዳር ፣ ኢትዮጵያ"
                        englishValue={formData.core.locationName_en}
                        amharicValue={formData.core.locationName_am}
                        onEnglishChange={(value) => setFormData({...formData, core: {...formData.core, locationName_en: value}})}
                        onAmharicChange={(value) => setFormData({...formData, core: {...formData.core, locationName_am: value}})}
                        showEnglish={languagePreference !== 'am'}
                        showAmharic={languagePreference !== 'en'}
                      />
                      <Input 
label={t("organizer.createFestival.address")}
                        placeholder="e.g. Fasil Ghebbi"
                        value={formData.core.address} 
                        onChange={e => setFormData({...formData, core: {...formData.core, address: e.target.value}})} 
                      />
                    </div>

                    <div 
                      onClick={() => setIsMapModalOpen(true)}
                      className="bg-ethio-bg h-48 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400 space-y-2 group hover:border-secondary transition-colors cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute inset-0 opacity-20">
                        <img src="https://picsum.photos/seed/map/800/400" className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="relative z-10 flex flex-col items-center">
                        <MapPin className="w-8 h-8 group-hover:text-secondary transition-colors" />
                        <span className="text-xs font-bold uppercase tracking-widest">Click to open Map Picker</span>
                        <p className="text-[10px]">Lat: {formData.core.coordinates.lat.toFixed(4)}, Lng: {formData.core.coordinates.lng.toFixed(4)}</p>
                      </div>
                    </div>

                    <DualLanguageField
                      label={t("organizer.createFestival.shortDesc") + " *"}
                      englishPlaceholder="Brief summary for listing cards..."
                      amharicPlaceholder="ለዝርዝር ካርዶች አጭር መግለጫ..."
                      englishValue={formData.core.shortDescription_en}
                      amharicValue={formData.core.shortDescription_am}
                      onEnglishChange={(value) => setFormData({...formData, core: {...formData.core, shortDescription_en: value}})}
                      onAmharicChange={(value) => setFormData({...formData, core: {...formData.core, shortDescription_am: value}})}
                      textarea
                      rows={3}
                      showEnglish={languagePreference !== 'am'}
                      showAmharic={languagePreference !== 'en'}
                    />

                    <DualLanguageField
                      label={t("organizer.createFestival.fullDesc") + " *"}
                      englishPlaceholder="Detailed story and information..."
                      amharicPlaceholder="ዝርዝር ታሪክ እና መረጃ..."
                      englishValue={formData.core.fullDescription_en}
                      amharicValue={formData.core.fullDescription_am}
                      onEnglishChange={(value) => setFormData({...formData, core: {...formData.core, fullDescription_en: value}})}
                      onAmharicChange={(value) => setFormData({...formData, core: {...formData.core, fullDescription_am: value}})}
                      textarea
                      rows={6}
                      showEnglish={languagePreference !== 'am'}
                      showAmharic={languagePreference !== 'en'}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Cover Image Upload */}
                      <div className="p-6 border-2 border-dashed border-gray-100 rounded-[32px] text-center hover:border-primary/20 transition-colors">
                        {formData.core.coverImage ? (
                          <div className="relative group">
                            <img src={formData.core.coverImage} alt="Cover" className="w-full h-32 object-cover rounded-2xl" />
                            <button
                              onClick={() => setFormData(prev => ({ ...prev, core: { ...prev.core, coverImage: '' } }))}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <input type="file" className="hidden" id="cover-image-upload" onChange={e => e.target.files && handleFileUpload(e.target.files[0], true)} />
                            <label htmlFor="cover-image-upload" className="cursor-pointer">
                              <Camera className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                              <p className="text-xs font-bold text-gray-400">Upload Cover Image</p>
                            </label>
                          </div>
                        )}
                        {uploadingFile && (
                          <div className="mt-3 text-xs text-gray-500">Uploading...</div>
                        )}
                        {uploadError && !formData.core.coverImage && (
                          <div className="mt-3 p-3 bg-red-50 rounded-xl">
                            <p className="text-xs text-red-600 mb-2">{uploadError}</p>
                            <button
                              onClick={() => {
                                const input = document.getElementById('cover-image-upload') as HTMLInputElement;
                                input?.click();
                              }}
                              className="text-xs text-red-600 underline hover:text-red-800"
                            >
                              Retry Upload
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Gallery Upload */}
                      <div className="p-6 border-2 border-dashed border-gray-100 rounded-[32px] text-center hover:border-primary/20 transition-colors">
                        <input type="file" className="hidden" id="gallery-upload" multiple onChange={e => e.target.files && Array.from(e.target.files).forEach(file => handleFileUpload(file))} />
                        <label htmlFor="gallery-upload" className="cursor-pointer">
                          <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                          <p className="text-xs font-bold text-gray-400">Upload Gallery Photos</p>
                        </label>
                        {uploadingFile && (
                          <div className="mt-3 text-xs text-gray-500">Uploading...</div>
                        )}
                        {uploadError && formData.core.gallery.length === 0 && (
                          <div className="mt-3 p-3 bg-red-50 rounded-xl">
                            <p className="text-xs text-red-600 mb-2">{uploadError}</p>
                            <button
                              onClick={() => {
                                const input = document.getElementById('gallery-upload') as HTMLInputElement;
                                input?.click();
                              }}
                              className="text-xs text-red-600 underline hover:text-red-800"
                            >
                              Retry Upload
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="sticky top-8 space-y-6">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 block">Live Preview</label>
                       <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 group">
                         <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                           {formData.core.coverImage ? (
                             <img src={formData.core.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center">
                               <Camera className="w-12 h-12 text-gray-300" />
                             </div>
                           )}
                           <div className="absolute top-6 left-6"><Badge variant="info" className="backdrop-blur-md bg-white/80">Live Event</Badge></div>
                         </div>
                        <div className="p-8 space-y-4">
                          <h4 className="text-2xl font-serif font-bold text-primary">{formData.core.name_en || 'Festival Title'}</h4>
                          <div className="flex items-center text-gray-400 text-xs gap-4">
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formData.core.startDate || 'Date'}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {formData.core.locationName_en || 'Location'}</span>
                          </div>
                          <p className="text-gray-500 text-sm line-clamp-2">{formData.core.shortDescription_en || 'Your festival description will appear here...'}</p>
                          <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                            <span className="text-primary font-bold">From ${formData.pricing.basePrice}</span>
                            <Button size="sm">View Details</Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Gallery Preview */}
                      {formData.core.gallery.length > 0 && (
                        <div className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100">
                          <h5 className="text-sm font-bold text-gray-700 mb-4">Gallery Preview ({formData.core.gallery.length} photos)</h5>
                          <div className="grid grid-cols-3 gap-3">
                            {formData.core.gallery.map((img: string, idx: number) => (
                              <div key={idx} className="relative group/image h-20 rounded-xl overflow-hidden">
                                <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx + 1}`} />
                                <button
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      core: {
                                        ...prev.core,
                                        gallery: prev.core.gallery.filter((_: any, i: number) => i !== idx)
                                      }
                                    }));
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/image:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Schedule */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-serif font-bold text-primary">{t('organizer.createFestival.dailySchedule')}</h3>
                    <Button 
                      variant="outline" 
                      leftIcon={Plus}
                       onClick={() => setFormData({
                         ...formData, 
                          schedule: [...formData.schedule, { day: formData.schedule.length + 1, title_en: '', title_am: '', activities_en: '', activities_am: '', performers: [], image: '' }]
                       })}
                    >
                      Add Day
                    </Button>
                  </div>
                  <div className="space-y-6">
                    {formData.schedule.map((day, idx) => (
                      <div key={idx} className="flex gap-6 p-6 bg-ethio-bg rounded-2xl">
                        <div className="w-20 h-20 bg-primary rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0">
                          <span className="text-xs font-bold uppercase">Day</span>
                          <span className="text-3xl font-bold">{day.day}</span>
                        </div>
                        <div className="flex-1 space-y-4">
                          <DualLanguageField
                            label={t("organizer.createFestival.dayTitle")}
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
                          />
                          <DualLanguageField
                            label={t("organizer.createFestival.activities")}
                            englishValue={day.activities_en}
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
                          />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {t("organizer.createFestival.performers")}
                                </label>
                                <textarea
                                    value={day.performers.join(', ')}
                                    onChange={(e) => {
                                      const newSchedule = [...formData.schedule];
                                      newSchedule[idx].performers = e.target.value.split(',').map(p => p.trim());
                                      setFormData({ ...formData, schedule: newSchedule });
                                    }}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                    placeholder="Enter Performer"
                                  />
                              </div>
                                <div className="w-48 h-48 mx-auto p-4 border-2 border-dashed border-gray-100 rounded-2xl text-center hover:border-primary/20 transition-colors cursor-pointer flex flex-col items-center justify-center">
                                 <input 
                                   type="file" 
                                   className="hidden" 
                                   id={`schedule-image-${idx}`} 
                                   onChange={e => e.target.files && handleScheduleImageUpload(e.target.files[0], idx)} 
                                 />
                                 {day.image ? (
                                   <div className="w-full h-full flex flex-col">
                                     <img src={day.image} alt="Day" className="w-full flex-1 object-cover rounded-xl mb-1" />
                                     <button
                                       type="button"
                                       onClick={(e) => {
                                         e.preventDefault();
                                         const newSchedule = [...formData.schedule];
                                         newSchedule[idx].image = '';
                                         setFormData({ ...formData, schedule: newSchedule });
                                       }}
                                       className="text-xs text-red-500 hover:text-red-700"
                                     >
                                       Remove Image
                                     </button>
                                   </div>
                                 ) : (
                                   <label htmlFor={`schedule-image-${idx}`} className="cursor-pointer flex flex-col items-center justify-center flex-1">
                                     <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                                     <p className="text-xs font-bold text-gray-400">Day Image (Optional)</p>
                                   </label>
                                 )}
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
                    <h3 className="text-2xl font-serif font-bold text-primary">Partner Hotels</h3>
                    <Button variant="outline" leftIcon={Plus} onClick={addHotel}>Add Hotel</Button>
                  </div>
                  {formData.hotels.length === 0 ? (
                    <div className="text-center p-12 border-2 border-dashed border-gray-100 rounded-2xl">
                      <Hotel className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">No hotels added yet. Add at least one hotel with rooms to continue.</p>
                      <Button variant="outline" leftIcon={Plus} onClick={addHotel}>Add Your First Hotel</Button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {formData.hotels.map((hotel: any, hotelIdx: number) => (
                        <div key={hotelIdx} className="p-8 bg-ethio-bg rounded-2xl border border-gray-100">
                          <div className="flex justify-between items-start mb-6">
                            <h4 className="text-lg font-bold flex items-center gap-2">
                              <Hotel className="w-5 h-5 text-secondary" />
                              Hotel {hotelIdx + 1}
                            </h4>
                            {formData.hotels.length > 1 && (
                              <Button variant="ghost" size="sm" leftIcon={Trash2} onClick={() => removeHotel(hotelIdx)} className="text-red-500">Remove</Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DualLanguageField
                              label="Hotel Name *"
                              englishPlaceholder="e.g. Gondar Heritage Hotel"
                              amharicPlaceholder="e.g. ጎንዳር ሆቴል"
                              englishValue={hotel.name_en || ''}
                              amharicValue={hotel.name_am || ''}
                              onEnglishChange={(value) => updateHotel(hotelIdx, 'name_en', value)}
                              onAmharicChange={(value) => updateHotel(hotelIdx, 'name_am', value)}
                              showEnglish={languagePreference !== 'am'}
                              showAmharic={languagePreference !== 'en'}
                            />
                            <div className="flex items-end gap-4">
                              <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Star Rating</label>
                                <div className="flex items-center gap-1 mt-2">
                                  {[1,2,3,4,5].map(star => (
                                    <Star
                                      key={star}
                                      className={`w-6 h-6 cursor-pointer transition-colors ${star <= (hotel.starRating || 3) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                      onClick={() => updateHotel(hotelIdx, 'starRating', star)}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <DualLanguageField
                            label="Short Description *"
                            textarea
                            rows={3}
                            englishPlaceholder="Brief description of the hotel..."
                            amharicPlaceholder="ለሆቴል አጭር መግለጫ..."
                            englishValue={hotel.description_en || ''}
                            amharicValue={hotel.description_am || ''}
                            onEnglishChange={(value) => updateHotel(hotelIdx, 'description_en', value)}
                            onAmharicChange={(value) => updateHotel(hotelIdx, 'description_am', value)}
                            showEnglish={languagePreference !== 'am'}
                            showAmharic={languagePreference !== 'en'}
                          />
                          <DualLanguageField
                            label="Full Description *"
                            textarea
                            rows={5}
                            englishPlaceholder="Detailed information about the hotel..."
                            amharicPlaceholder="ስለ ሆቴል ዝርዝር መረጃ..."
                            englishValue={hotel.fullDescription_en || ''}
                            amharicValue={hotel.fullDescription_am || ''}
                            onEnglishChange={(value) => updateHotel(hotelIdx, 'fullDescription_en', value)}
                            onAmharicChange={(value) => updateHotel(hotelIdx, 'fullDescription_am', value)}
                            showEnglish={languagePreference !== 'am'}
                            showAmharic={languagePreference !== 'en'}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Hotel Image</label>
                              {hotel.image && (
                                <div className="relative h-32 rounded-xl overflow-hidden">
                                  <img src={hotel.image} className="w-full h-full object-cover" alt="Hotel" />
                                </div>
                              )}
                              <div className="p-4 border-2 border-dashed border-gray-100 rounded-xl text-center hover:border-primary/20 transition-colors cursor-pointer">
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  id={`hotel-image-${hotelIdx}`} 
                                  onChange={e => e.target.files && handleHotelImageUpload(hotelIdx, e.target.files[0])} 
                                />
                                <label htmlFor={`hotel-image-${hotelIdx}`} className="cursor-pointer">
                                  <Camera className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                                  <p className="text-xs text-gray-400">Click to upload hotel image</p>
                                </label>
                              </div>
                            </div>
                            <Input
                              label="Address"
                              placeholder="Hotel address"
                              value={hotel.address || ''}
                              onChange={(e) => updateHotel(hotelIdx, 'address', e.target.value)}
                            />
                          </div>

                          {/* Rooms Management */}
                          <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-lg font-bold">Room Types</h4>
                              <Button variant="outline" size="sm" leftIcon={Plus} onClick={() => addRoom(hotelIdx)}>Add Room Type</Button>
                            </div>
                            {hotel.rooms && hotel.rooms.length > 0 ? (
                              <div className="space-y-4">
                                {hotel.rooms.map((room: any, roomIdx: number) => (
                                  <div key={roomIdx} className="p-6 bg-white rounded-xl border border-gray-100">
                                    <div className="flex justify-between items-start mb-4">
                                      <h5 className="font-medium text-primary">Room {roomIdx + 1}</h5>
                                      {hotel.rooms.length > 1 && (
                                        <Button variant="ghost" size="sm" leftIcon={Trash2} onClick={() => removeRoom(hotelIdx, roomIdx)} className="text-red-500">Remove</Button>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <DualLanguageField
                                        label="Room Name *"
                                        englishPlaceholder="e.g. Deluxe Double"
                                        amharicPlaceholder="e.g. የመልካም ድርሻ"
                                        englishValue={room.name_en || ''}
                                        amharicValue={room.name_am || ''}
                                        onEnglishChange={(value) => updateRoom(hotelIdx, roomIdx, 'name_en', value)}
                                        onAmharicChange={(value) => updateRoom(hotelIdx, roomIdx, 'name_am', value)}
                                        showEnglish={languagePreference !== 'am'}
                                        showAmharic={languagePreference !== 'en'}
                                      />
                                      <Input
                                        label="Capacity (guests)"
                                        type="number"
                                        min="1"
                                        value={room.capacity || 1}
                                        onChange={(e) => updateRoom(hotelIdx, roomIdx, 'capacity', parseInt(e.target.value) || 1)}
                                      />
                                    </div>
                                    <DualLanguageField
                                      label="Description"
                                      textarea
                                      rows={2}
                                      englishPlaceholder="Room features and amenities..."
                                      amharicPlaceholder="የክፍል ባህሪያት..."
                                      englishValue={room.description_en || ''}
                                      amharicValue={room.description_am || ''}
                                      onEnglishChange={(value) => updateRoom(hotelIdx, roomIdx, 'description_en', value)}
                                      onAmharicChange={(value) => updateRoom(hotelIdx, roomIdx, 'description_am', value)}
                                      showEnglish={languagePreference !== 'am'}
                                      showAmharic={languagePreference !== 'en'}
                                     />
                                     <div className="mb-4">
                                       <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Room Tier</label>
                                       <select 
                                         className="mt-2 block w-full rounded-xl border border-gray-100 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                         value={room.tier || 'both'}
                                         onChange={(e) => updateRoom(hotelIdx, roomIdx, 'tier', e.target.value)}
                                       >
                                         <option value="vip">VIP Only</option>
                                         <option value="standard">Standard Only</option>
                                         <option value="both">Both Tiers</option>
                                       </select>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                      <Input
                                        label="Price per Night *"
                                        type="number"
                                        min="0"
                                        value={room.pricePerNight || 0}
                                        onChange={(e) => updateRoom(hotelIdx, roomIdx, 'pricePerNight', parseFloat(e.target.value) || 0)}
                                      />
                                      <Input
                                        label="Available Rooms *"
                                        type="number"
                                        min="0"
                                        value={room.availability || 0}
                                        onChange={(e) => updateRoom(hotelIdx, roomIdx, 'availability', parseInt(e.target.value) || 0)}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-8 border-2 border-dashed border-gray-100 rounded-xl text-gray-400">
                                <p>No room types defined. Add at least one room for this hotel.</p>
                              </div>
                            )}
                          </div>

                          {/* Hotel Services (Pay at Hotel) */}
                          <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-lg font-bold">Hotel Services (Pay at Hotel)</h4>
                              <Button variant="outline" size="sm" leftIcon={Plus} onClick={() => addHotelService(hotelIdx)}>Add Service</Button>
                            </div>
                            {hotel.hotelServices && hotel.hotelServices.length > 0 ? (
                              <div className="space-y-4">
                                {hotel.hotelServices.map((service: any, sIdx: number) => (
                                  <div key={sIdx} className="p-4 bg-white rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <Input
                                      label="Service Name"
                                      placeholder="e.g. Breakfast"
                                      value={service.name || ''}
                                      onChange={(e) => updateHotelService(hotelIdx, sIdx, 'name', e.target.value)}
                                    />
                                    <Input
                                      label="Price"
                                      type="number"
                                      min="0"
                                      placeholder="e.g. 15"
                                      value={service.price || 0}
                                      onChange={(e) => updateHotelService(hotelIdx, sIdx, 'price', parseFloat(e.target.value) || 0)}
                                    />
                                    <div className="flex items-end gap-2">
                                      <Input
                                        label="Service Description"
                                        placeholder="e.g. Per person"
                                        value={service.description || ''}
                                        onChange={(e) => updateHotelService(hotelIdx, sIdx, 'description', e.target.value)}
                                      />
                                      <Button variant="ghost" size="sm" leftIcon={Trash2} onClick={() => removeHotelService(hotelIdx, sIdx)} className="text-red-500 mb-2">Remove</Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-4 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-sm">
                                <p>No services added. These are display-only, tourists pay at the hotel.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Transportation */}
              {step === 4 && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-serif font-bold text-primary">Transportation Options</h3>
                    <Button variant="outline" leftIcon={Plus} onClick={addTransport}>Add Transport Option</Button>
                  </div>
                  {formData.transportation.length === 0 ? (
                    <div className="text-center p-12 border-2 border-dashed border-gray-100 rounded-2xl">
                      <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">No transport options added yet. Add at least one transport option to continue.</p>
                      <Button variant="outline" leftIcon={Plus} onClick={addTransport}>Add Transport Option</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formData.transportation.map((transport: any, idx: number) => (
                        <div key={idx} className="p-8 bg-ethio-bg rounded-2xl border border-gray-100">
                          <div className="flex justify-between items-start mb-6">
                            <h4 className="text-lg font-bold flex items-center gap-2">
                              <Car className="w-5 h-5 text-secondary" />
                              Transport {idx + 1}
                            </h4>
                            {formData.transportation.length > 1 && (
                              <Button variant="ghost" size="sm" leftIcon={Trash2} onClick={() => removeTransport(idx)} className="text-red-500">Remove</Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DualLanguageField
                              label="Transport Type *"
                              englishPlaceholder="e.g. Private Car, Shuttle Bus"
                              amharicPlaceholder="e.g. ፕሪቫት መኪና፣ ሸልቱ ባስ"
                              englishValue={transport.type_en || ''}
                              amharicValue={transport.type_am || ''}
                              onEnglishChange={(value) => updateTransport(idx, 'type_en', value)}
                              onAmharicChange={(value) => updateTransport(idx, 'type_am', value)}
                              showEnglish={languagePreference !== 'am'}
                              showAmharic={languagePreference !== 'en'}
                            />
                            <Input
                              label="Price per Unit"
                              type="number"
                              min="0"
                              value={transport.price || 0}
                              onChange={(e) => updateTransport(idx, 'price', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <DualLanguageField
                            label="Description"
                            textarea
                            rows={3}
                            englishPlaceholder="Describe the transport service..."
                            amharicPlaceholder="የመጓጓዣ አገልግሎት መግለጫ..."
                            englishValue={transport.description_en || ''}
                            amharicValue={transport.description_am || ''}
                            onEnglishChange={(value) => updateTransport(idx, 'description_en', value)}
                            onAmharicChange={(value) => updateTransport(idx, 'description_am', value)}
                            showEnglish={languagePreference !== 'am'}
                            showAmharic={languagePreference !== 'en'}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Transport Image</label>
                              {transport.image && (
                                <div className="relative h-32 rounded-xl overflow-hidden">
                                  <img src={transport.image} className="w-full h-full object-cover" alt="Transport" />
                                </div>
                              )}
                              <div className="p-4 border-2 border-dashed border-gray-100 rounded-xl text-center hover:border-primary/20 transition-colors cursor-pointer">
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  id={`transport-image-${idx}`} 
                                  onChange={e => e.target.files && handleTransportImageUpload(idx, e.target.files[0])} 
                                />
                                <label htmlFor={`transport-image-${idx}`} className="cursor-pointer">
                                  <Camera className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                                  <p className="text-xs text-gray-400">Click to upload transport image</p>
                                </label>
                              </div>
                            </div>
                            <Input
                              label="Passenger Capacity"
                              type="number"
                              min="0"
                              value={transport.capacity || 0}
                              onChange={(e) => updateTransport(idx, 'capacity', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Services */}
              {step === 5 && (
                <div className="space-y-10">
                  <h3 className="text-2xl font-serif font-bold text-primary">Services</h3>
                  
                  {/* Food Packages */}
                  <section>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-bold text-primary">Food & Drink Packages</h4>
                      <Button variant="outline" size="sm" leftIcon={Plus} onClick={addFoodPackage}>Add Package</Button>
                    </div>
                    {formData.services.foodPackages.length === 0 ? (
                      <div className="text-center p-8 border-2 border-dashed border-gray-100 rounded-xl">
                        <p className="text-gray-400 mb-4">No food packages added yet.</p>
                        <Button variant="outline" size="sm" leftIcon={Plus} onClick={addFoodPackage}>Add Package</Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {formData.services.foodPackages.map((pkg: any, idx: number) => (
                          <div key={idx} className="p-6 bg-ethio-bg rounded-2xl border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                              <h5 className="font-medium">Package {idx + 1}</h5>
                              {formData.services.foodPackages.length > 1 && (
                                <Button variant="ghost" size="sm" leftIcon={Trash2} onClick={() => removeFoodPackage(idx)} className="text-red-500">Remove</Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <DualLanguageField
                                label="Package Name *"
                                englishPlaceholder="e.g. Traditional Feast"
                                amharicPlaceholder="e.g. ባህላዊ ድርስ"
                                englishValue={pkg.name_en || ''}
                                amharicValue={pkg.name_am || ''}
                                onEnglishChange={(value) => updateFoodPackage(idx, 'name_en', value)}
                                onAmharicChange={(value) => updateFoodPackage(idx, 'name_am', value)}
                                showEnglish={languagePreference !== 'am'}
                                showAmharic={languagePreference !== 'en'}
                              />
                              <Input
                                label="Price per Person"
                                type="number"
                                min="0"
                                value={pkg.pricePerPerson || 0}
                                onChange={(e) => updateFoodPackage(idx, 'pricePerPerson', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <DualLanguageField
                              label="Description"
                              textarea
                              rows={3}
                              englishPlaceholder="Describe the package..."
                              amharicPlaceholder="ጥቅል መግለጫ..."
                              englishValue={pkg.description_en || ''}
                              amharicValue={pkg.description_am || ''}
                              onEnglishChange={(value) => updateFoodPackage(idx, 'description_en', value)}
                              onAmharicChange={(value) => updateFoodPackage(idx, 'description_am', value)}
                              showEnglish={languagePreference !== 'am'}
                              showAmharic={languagePreference !== 'en'}
                            />
                            <div className="mt-4">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Included Items (comma-separated)</label>
                              <Input
                                placeholder="e.g. Injera, Doro Wat, Tej"
                                value={pkg.items ? pkg.items.join(', ') : ''}
                                onChange={(e) => updateFoodPackageItems(idx, e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Cultural Services */}
                  <section>
                    <h4 className="text-lg font-bold text-primary mb-4">Cultural Services</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {languagePreference !== 'am' && (
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">English Services (comma-separated)</label>
                          <textarea
                            rows={4}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all mt-2"
                            placeholder="e.g. Traditional dance performances, Craft workshops..."
                            value={formData.services.culturalServices_en.join(', ')}
                            onChange={(e) => updateServiceArray('culturalServices', 'en', e.target.value)}
                          />
                        </div>
                      )}
                      {languagePreference !== 'en' && (
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Amharic Services (comma-separated)</label>
                          <textarea
                            rows={4}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all mt-2"
                            placeholder="e.g. የባህል እንቅራት፣ የእጅ ጥበብ ስራቶች..."
                            value={formData.services.culturalServices_am.join(', ')}
                            onChange={(e) => updateServiceArray('culturalServices', 'am', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Special Assistance */}
                  <section>
                    <h4 className="text-lg font-bold text-primary mb-4">Special Assistance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {languagePreference !== 'am' && (
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">English Services (comma-separated)</label>
                          <textarea
                            rows={3}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all mt-2"
                            placeholder="e.g. Wheelchair access, Sign language interpreter..."
                            value={formData.services.specialAssistance_en.join(', ')}
                            onChange={(e) => updateServiceArray('specialAssistance', 'en', e.target.value)}
                          />
                        </div>
                      )}
                      {languagePreference !== 'en' && (
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Amharic Services (comma-separated)</label>
                          <textarea
                            rows={3}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all mt-2"
                            placeholder="e.g. ለአካል ተገዢ መድረሻ፣ የምልክት ቋንቋ ትርጉም..."
                            value={formData.services.specialAssistance_am.join(', ')}
                            onChange={(e) => updateServiceArray('specialAssistance', 'am', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Extras */}
                  <section>
                    <h4 className="text-lg font-bold text-primary mb-4">Extra Services</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {languagePreference !== 'am' && (
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">English Services (comma-separated)</label>
                          <textarea
                            rows={3}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all mt-2"
                            placeholder="e.g. Photography, Souvenir shop, Guided tours..."
                            value={formData.services.extras_en.join(', ')}
                            onChange={(e) => updateServiceArray('extras', 'en', e.target.value)}
                          />
                        </div>
                      )}
                      {languagePreference !== 'en' && (
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Amharic Services (comma-separated)</label>
                          <textarea
                            rows={3}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all mt-2"
                            placeholder="e.g. ፎቶግራፍያ፣ ሱቪኒር መዝጓሪ፣ የመምሪያ ጉዞች..."
                            value={formData.services.extras_am.join(', ')}
                            onChange={(e) => updateServiceArray('extras', 'am', e.target.value)}
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
                  <h3 className="text-2xl font-serif font-bold text-primary">Policies & Terms</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <DualLanguageField
                      label="Cancellation Policy *"
                      textarea
                      rows={5}
                      englishPlaceholder="Explain cancellation terms, refund policy..."
                      amharicPlaceholder="የማቋረጫ ፖሊሲ መግለጫ..."
                      englishValue={formData.policies.cancellation_en || ''}
                      amharicValue={formData.policies.cancellation_am || ''}
                      onEnglishChange={(value) => setFormData({ ...formData, policies: { ...formData.policies, cancellation_en: value } })}
                      onAmharicChange={(value) => setFormData({ ...formData, policies: { ...formData.policies, cancellation_am: value } })}
                      showEnglish={languagePreference !== 'am'}
                      showAmharic={languagePreference !== 'en'}
                    />
                    <DualLanguageField
                      label="Booking Terms *"
                      textarea
                      rows={5}
                      englishPlaceholder="Terms and conditions for bookings..."
                      amharicPlaceholder="ለቦኪንጎች ውሎች እና ውጤቶች..."
                      englishValue={formData.policies.terms_en || ''}
                      amharicValue={formData.policies.terms_am || ''}
                      onEnglishChange={(value) => setFormData({ ...formData, policies: { ...formData.policies, terms_en: value } })}
                      onAmharicChange={(value) => setFormData({ ...formData, policies: { ...formData.policies, terms_am: value } })}
                      showEnglish={languagePreference !== 'am'}
                      showAmharic={languagePreference !== 'en'}
                    />
                    <DualLanguageField
                      label="Safety Rules"
                      textarea
                      rows={5}
                      englishPlaceholder="Safety guidelines and rules..."
                      amharicPlaceholder="የደህንነት መመሪያዎች እና ህጎች..."
                      englishValue={formData.policies.safety_en || ''}
                      amharicValue={formData.policies.safety_am || ''}
                      onEnglishChange={(value) => setFormData({ ...formData, policies: { ...formData.policies, safety_en: value } })}
                      onAmharicChange={(value) => setFormData({ ...formData, policies: { ...formData.policies, safety_am: value } })}
                      showEnglish={languagePreference !== 'am'}
                      showAmharic={languagePreference !== 'en'}
                    />
                    <Input
                      label="Age Restriction"
                      placeholder="e.g. 18+, All ages, etc."
                      value={formData.policies.ageRestriction || ''}
                      onChange={(e) => setFormData({ ...formData, policies: { ...formData.policies, ageRestriction: e.target.value } })}
                    />
                  </div>
                </div>
              )}

              {/* Step 7: Pricing */}
              {step === 7 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-serif font-bold text-primary mb-2">Pricing</h3>
                    <p className="text-gray-500">Set your ticket prices and discounts</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                    {/* Base Price Card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-3xl border border-primary/20 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-primary">Base Ticket Price</h4>
                          <p className="text-xs text-gray-500">Standard admission</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-primary">{formData.pricing.currency}</span>
                        <input
                          type="number"
                          min="0"
                          value={formData.pricing.basePrice || 0}
                          onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, basePrice: parseFloat(e.target.value) || 0 } })}
                          className="flex-1 text-3xl font-bold bg-transparent border-0 outline-none text-primary placeholder-gray-300"
                          placeholder="0"
                        />
                      </div>
                    </motion.div>

                    {/* VIP Price Card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-3xl border border-amber-200 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-800">VIP Ticket Price</h4>
                          <p className="text-xs text-amber-600">Premium experience</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-amber-700">{formData.pricing.currency}</span>
                        <input
                          type="number"
                          min="0"
                          value={formData.pricing.vipPrice || 0}
                          onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, vipPrice: parseFloat(e.target.value) || 0 } })}
                          className="flex-1 text-3xl font-bold bg-transparent border-0 outline-none text-amber-700 placeholder-amber-200"
                          placeholder="0"
                        />
                      </div>
                    </motion.div>

                    {/* Early Bird Discount */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-100/50 p-6 rounded-3xl border border-green-200 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <Ticket className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-green-800">Early Bird Discount</h4>
                          <p className="text-xs text-green-600">Book early and save</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.pricing.earlyBird || 0}
                            onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, earlyBird: parseFloat(e.target.value) || 0 } })}
                            className="flex-1 text-3xl font-bold bg-transparent border-0 outline-none text-green-700"
                            placeholder="0"
                          />
                          <span className="text-3xl font-bold text-green-600">%</span>
                        </div>
                        {formData.pricing.earlyBird > 0 && formData.pricing.basePrice > 0 && (
                          <div className="bg-white/60 rounded-xl p-3">
                            <p className="text-sm text-green-700">
                              Early bird price: <span className="font-bold">{formData.pricing.currency} {(formData.pricing.basePrice * (1 - formData.pricing.earlyBird / 100)).toFixed(2)}</span>
                              <span className="line-through text-gray-400 ml-2">{formData.pricing.currency} {formData.pricing.basePrice}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Group Discount */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-3xl border border-blue-200 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-800">Group Discount</h4>
                          <p className="text-xs text-blue-600">For bulk bookings</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.pricing.groupDiscount || 0}
                            onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, groupDiscount: parseFloat(e.target.value) || 0 } })}
                            className="flex-1 text-3xl font-bold bg-transparent border-0 outline-none text-blue-700"
                            placeholder="0"
                          />
                          <span className="text-3xl font-bold text-blue-600">%</span>
                        </div>
                        {formData.pricing.groupDiscount > 0 && formData.pricing.basePrice > 0 && (
                          <div className="bg-white/60 rounded-xl p-3">
                            <p className="text-sm text-blue-700">
                              Group price: <span className="font-bold">{formData.pricing.currency} {(formData.pricing.basePrice * (1 - formData.pricing.groupDiscount / 100)).toFixed(2)}</span>
                              <span className="line-through text-gray-400 ml-2">{formData.pricing.currency} {formData.pricing.basePrice}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Currency Selector */}
                    <div className="md:col-span-2">
                      <div className="bg-ethio-bg p-6 rounded-3xl border border-gray-100">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-3 block">Currency</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { code: 'ETB', name: 'Ethiopian Birr', flag: '🇪🇹' },
                            { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
                            { code: 'EUR', name: 'Euro', flag: '🇪🇺' }
                          ].map(curr => (
                            <button
                              key={curr.code}
                              onClick={() => setFormData({ ...formData, pricing: { ...formData.pricing, currency: curr.code } })}
                              className={`p-4 rounded-2xl border-2 transition-all hover:border-primary/50 ${
                                formData.pricing.currency === curr.code 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="text-2xl mb-1">{curr.flag}</div>
                              <div className="font-bold text-sm">{curr.code}</div>
                              <div className="text-xs text-gray-500">{curr.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 8: Review & Publish */}
              {step === 8 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-serif font-bold text-primary mb-2">Review & Publish</h3>
                    <p className="text-gray-500">Review your festival details before publishing.</p>
                  </div>

                  {/* Hero Section with Cover Image */}
                  <div className="relative rounded-[48px] overflow-hidden shadow-2xl">
                    <div className="absolute inset-0">
                      <img 
                        src={formData.core.coverImage} 
                        className="w-full h-full object-cover" 
                        alt="Cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                    </div>
                    <div className="relative z-10 p-12 text-white space-y-6">
                      <div className="flex items-center gap-3">
                        <Badge variant="info" className="backdrop-blur-md bg-white/20 text-white border-white/30">Ready to Publish</Badge>
                      </div>
                      <h2 className="text-4xl font-serif font-bold">
                        {languagePreference !== 'am' ? formData.core.name_en : ''}
                        {languagePreference === 'both' && formData.core.name_am && <span className="block text-3xl text-white/80 mt-2">{formData.core.name_am}</span>}
                        {languagePreference === 'am' && formData.core.name_am}
                      </h2>
                      <div className="flex flex-wrap gap-6 text-white/80">
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formData.core.startDate} - {formData.core.endDate}</span>
                        <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {languagePreference !== 'am' ? formData.core.locationName_en : formData.core.locationName_am}</span>
                        <span className="flex items-center gap-2"><Ticket className="w-4 h-4" /> From {formData.pricing.currency} {formData.pricing.basePrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Info Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Core Info Summary */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Info className="w-5 h-5 text-primary" />
                        </div>
                        <h4 className="text-lg font-bold text-primary">Core Information</h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-bold text-gray-600">Festival Name:</span>
                          {languagePreference === 'both' ? (
                            <div className="mt-1">
                              <div className="text-gray-800">EN: {formData.core.name_en || 'Not provided'}</div>
                              <div className="text-gray-600">AM: {formData.core.name_am || 'Not provided'}</div>
                            </div>
                          ) : (
                            <span className="ml-2 text-gray-800">
                              {languagePreference === 'en' ? formData.core.name_en : formData.core.name_am}
                            </span>
                          )}
                        </div>
                        <div><span className="font-bold text-gray-600">Dates:</span> <span className="text-gray-800">{formData.core.startDate} - {formData.core.endDate}</span></div>
                        <div>
                          <span className="font-bold text-gray-600">Location:</span>
                          <span className="ml-2 text-gray-800">
                            {languagePreference === 'both' ? (
                              <div className="mt-1">
                                <div>EN: {formData.core.locationName_en || 'Not provided'}</div>
                                <div>AM: {formData.core.locationName_am || 'Not provided'}</div>
                              </div>
                            ) : (
                              languagePreference === 'en' ? formData.core.locationName_en : formData.core.locationName_am
                            )}
                          </span>
                        </div>
                        <div><span className="font-bold text-gray-600">Address:</span> <span className="text-gray-800">{formData.core.address}</span></div>
                      </div>
                    </motion.div>

                    {/* Schedule Summary */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-secondary" />
                        </div>
                        <h4 className="text-lg font-bold text-primary">Schedule ({formData.schedule.length} day{formData.schedule.length !== 1 ? 's' : ''})</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        {formData.schedule.map((day: any, idx: number) => (
                          <div key={idx} className="p-3 bg-ethio-bg rounded-xl">
                            <div className="font-bold text-primary">Day {day.day}</div>
                            <div className="text-gray-700">
                              {languagePreference === 'both' ? (
                                <>
                                  <div>EN: {day.title_en || 'Not provided'}</div>
                                  <div>AM: {day.title_am || 'Not provided'}</div>
                                </>
                              ) : (
                                languagePreference === 'en' ? day.title_en : day.title_am
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Hotels Summary */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Hotel className="w-5 h-5 text-amber-600" />
                        </div>
                        <h4 className="text-lg font-bold text-primary">Hotels ({formData.hotels.length})</h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        {formData.hotels.map((hotel: any, idx: number) => (
                          <div key={idx} className="p-3 bg-ethio-bg rounded-xl">
                            <div className="font-bold text-gray-800">
                              {languagePreference === 'both' ? (
                                <>{hotel.name_en || 'Unnamed'} / {hotel.name_am || 'Unnamed'}</>
                              ) : (
                                languagePreference === 'en' ? hotel.name_en : hotel.name_am
                              )}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">{hotel.starRating} stars • {hotel.rooms?.length || 0} room type(s)</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Transport Summary */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Car className="w-5 h-5 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-bold text-primary">Transportation ({formData.transportation.length})</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        {formData.transportation.map((t: any, idx: number) => (
                          <div key={idx} className="p-3 bg-ethio-bg rounded-xl flex justify-between items-center">
                            <span className="font-bold text-gray-800">
                              {languagePreference === 'both' ? (
                                <>{t.type_en || 'Unnamed'} / {t.type_am || 'Unnamed'}</>
                              ) : (
                                languagePreference === 'en' ? t.type_en : t.type_am
                              )}
                            </span>
                            <span className="text-gray-500 text-xs">{t.availability} units, {t.price} ETB</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Services Summary */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <Utensils className="w-5 h-5 text-green-600" />
                        </div>
                        <h4 className="text-lg font-bold text-primary">Services</h4>
                      </div>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between p-3 bg-ethio-bg rounded-xl">
                          <span className="font-bold text-gray-600">Food Packages:</span>
                          <span className="text-gray-800">{formData.services.foodPackages.length}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-ethio-bg rounded-xl">
                          <span className="font-bold text-gray-600">Cultural Services:</span>
                          <span className="text-gray-800">EN: {formData.services.culturalServices_en.length}, AM: {formData.services.culturalServices_am.length}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-ethio-bg rounded-xl">
                          <span className="font-bold text-gray-600">Special Assistance:</span>
                          <span className="text-gray-800">EN: {formData.services.specialAssistance_en.length}, AM: {formData.services.specialAssistance_am.length}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-ethio-bg rounded-xl">
                          <span className="font-bold text-gray-600">Extras:</span>
                          <span className="text-gray-800">EN: {formData.services.extras_en.length}, AM: {formData.services.extras_am.length}</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Policies Summary */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                          <Shield className="w-5 h-5 text-red-600" />
                        </div>
                        <h4 className="text-lg font-bold text-primary">Policies</h4>
                      </div>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between p-3 bg-ethio-bg rounded-xl">
                          <span className="font-bold text-gray-600">Cancellation:</span>
                          <span className="text-gray-800">{formData.policies.cancellation_en ? 'Provided' : 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-ethio-bg rounded-xl">
                          <span className="font-bold text-gray-600">Terms:</span>
                          <span className="text-gray-800">{formData.policies.terms_en ? 'Provided' : 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-ethio-bg rounded-xl">
                          <span className="font-bold text-gray-600">Age Restriction:</span>
                          <span className="text-gray-800">{formData.policies.ageRestriction || 'None'}</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Pricing Summary - Full Width */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="lg:col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8 shadow-xl border border-primary/20"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="text-xl font-bold text-primary">Pricing Summary</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center">
                          <div className="text-3xl font-bold text-primary">{formData.pricing.basePrice}</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Base Price ({formData.pricing.currency})</div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center">
                          <div className="text-3xl font-bold text-amber-600">{formData.pricing.vipPrice}</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">VIP Price ({formData.pricing.currency})</div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center">
                          <div className="text-3xl font-bold text-green-600">{formData.pricing.earlyBird}%</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Early Bird</div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center">
                          <div className="text-3xl font-bold text-blue-600">{formData.pricing.groupDiscount}%</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Group Discount</div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-100">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
              step === 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            {step < 8 && (
              <button
                onClick={nextStep}
                className="px-6 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
              >
                Skip this step
              </button>
            )}
            
            {step < 8 ? (
              <Button onClick={nextStep} rightIcon={ChevronRight}>
                Continue
              </Button>
            ) : (
              <Button onClick={handlePublish} leftIcon={CheckCircle2} className="bg-green-600 hover:bg-green-700">
                Publish Festival
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};