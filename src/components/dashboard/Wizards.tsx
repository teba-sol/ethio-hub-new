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
      performers: [] as string[]
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
   });

   const createEmptyRoom = () => ({
     name_en: '',
     name_am: '',
     description_en: '',
     description_am: '',
     capacity: 1,
     pricePerNight: 0,
     availability: 0,
   });

   const createEmptyTransport = () => ({
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

   const handlePublish = async () => {
    const requiredFields: Record<string, any> = {
      startDate: formData.core.startDate,
      endDate: formData.core.endDate,
      address: formData.core.address,
    };

    // Add language-specific required fields based on preference
    if (languagePreference !== 'am') {
      requiredFields.name_en = formData.core.name_en;
      requiredFields.locationName_en = formData.core.locationName_en;
      requiredFields.shortDescription_en = formData.core.shortDescription_en;
      requiredFields.fullDescription_en = formData.core.fullDescription_en;
    }
    if (languagePreference !== 'en') {
      requiredFields.name_am = formData.core.name_am;
      requiredFields.locationName_am = formData.core.locationName_am;
      requiredFields.shortDescription_am = formData.core.shortDescription_am;
      requiredFields.fullDescription_am = formData.core.fullDescription_am;
    }

     const baseMissing = Object.entries(requiredFields)
       .filter(([_, value]) => !value)
       .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));

     // Extended validation for other sections
     let additionalMissing: string[] = [];

     // Validate schedule
     if (!formData.schedule || formData.schedule.length === 0) {
       additionalMissing.push('At least one schedule day is required');
     } else {
       formData.schedule.forEach((day: any, idx: number) => {
         if (languagePreference !== 'am') {
           if (!day.title_en?.trim()) additionalMissing.push(`Day ${day.day} title (English)`);
           if (!day.activities_en?.trim()) additionalMissing.push(`Day ${day.day} activities (English)`);
         }
         if (languagePreference !== 'en') {
           if (!day.title_am?.trim()) additionalMissing.push(`Day ${day.day} title (Amharic)`);
           if (!day.activities_am?.trim()) additionalMissing.push(`Day ${day.day} activities (Amharic)`);
         }
       });
     }

     // Validate hotels
     if (!formData.hotels || formData.hotels.length === 0) {
       additionalMissing.push('At least one hotel is required');
     } else {
       formData.hotels.forEach((hotel: any, hIdx: number) => {
         const num = hIdx + 1;
         if (languagePreference !== 'am' && !hotel.name_en?.trim()) additionalMissing.push(`Hotel ${num} name (English)`);
         if (languagePreference !== 'en' && !hotel.name_am?.trim()) additionalMissing.push(`Hotel ${num} name (Amharic)`);
         if (languagePreference !== 'am' && !hotel.description_en?.trim()) additionalMissing.push(`Hotel ${num} short description (English)`);
         if (languagePreference !== 'en' && !hotel.description_am?.trim()) additionalMissing.push(`Hotel ${num} short description (Amharic)`);
         if (languagePreference !== 'am' && !hotel.fullDescription_en?.trim()) additionalMissing.push(`Hotel ${num} full description (English)`);
         if (languagePreference !== 'en' && !hotel.fullDescription_am?.trim()) additionalMissing.push(`Hotel ${num} full description (Amharic)`);

         if (!hotel.rooms || hotel.rooms.length === 0) {
           additionalMissing.push(`Hotel ${num} must have at least one room`);
         } else {
           hotel.rooms.forEach((room: any, rIdx: number) => {
             const rNum = rIdx + 1;
             if (languagePreference !== 'am' && !room.name_en?.trim()) additionalMissing.push(`Hotel ${num} Room ${rNum} name (English)`);
             if (languagePreference !== 'en' && !room.name_am?.trim()) additionalMissing.push(`Hotel ${num} Room ${rNum} name (Amharic)`);
             if (!room.capacity || room.capacity <= 0) additionalMissing.push(`Hotel ${num} Room ${rNum} capacity`);
             if (room.pricePerNight == null || room.pricePerNight < 0) additionalMissing.push(`Hotel ${num} Room ${rNum} price per night`);
             if (room.availability == null || room.availability <= 0) additionalMissing.push(`Hotel ${num} Room ${rNum} availability`);
           });
         }
       });
     }

     // Validate transportation
     if (!formData.transportation || formData.transportation.length === 0) {
       additionalMissing.push('At least one transportation option is required');
     } else {
       formData.transportation.forEach((trans: any, tIdx: number) => {
         const num = tIdx + 1;
         if (languagePreference !== 'am' && !trans.type_en?.trim()) additionalMissing.push(`Transport ${num} type (English)`);
         if (languagePreference !== 'en' && !trans.type_am?.trim()) additionalMissing.push(`Transport ${num} type (Amharic)`);
         if (trans.availability == null || trans.availability <= 0) additionalMissing.push(`Transport ${num} availability`);
       });
     }

     // Validate pricing
     if (formData.pricing.basePrice == null || formData.pricing.basePrice <= 0) {
       additionalMissing.push('Base ticket price must be greater than 0');
     }

     const allMissing = [...baseMissing, ...additionalMissing];
     if (allMissing.length > 0) {
       alert(`Please fill out all required fields:\n- ${allMissing.join('\n- ')}`);
       return;
     }

    try {
      const response = await apiClient.post('/api/organizer/festivals', {
        name_en: formData.core.name_en,
        name_am: languagePreference === 'am' ? formData.core.name_am : undefined,
        shortDescription_en: formData.core.shortDescription_en,
        shortDescription_am: languagePreference === 'am' ? formData.core.shortDescription_am : undefined,
        fullDescription_en: formData.core.fullDescription_en,
        fullDescription_am: languagePreference === 'am' ? formData.core.fullDescription_am : undefined,
        startDate: formData.core.startDate,
        endDate: formData.core.endDate,
        location: {
          name_en: formData.core.locationName_en,
          name_am: languagePreference === 'am' ? formData.core.locationName_am : undefined,
          address: formData.core.address,
          coordinates: formData.core.coordinates,
        },
        coverImage: formData.core.coverImage,
        gallery: formData.core.gallery,
        schedule: formData.schedule,
        hotels: formData.hotels,
        transportation: formData.transportation,
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-center">{t(s.key)}</span>
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
        <div className="flex items-center gap-4">
          <Button variant="outline" leftIcon={Save}>Save Draft</Button>
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
                    {/* Language Preference Radio Buttons */}
                    <div className="bg-ethio-bg p-6 rounded-2xl">
                      <h3 className="text-lg font-bold text-primary mb-4">{t("organizer.createFestival.languagePreference")}</h3>
                      <p className="text-sm text-gray-600 mb-4">{t("organizer.createFestival.chooseLanguages")}</p>
                      <div className="flex flex-col space-y-3">
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
<span className="font-medium">{t("organizer.createFestival.bothLanguages")}</span>
                                                    <p className="text-xs text-gray-500">{t("organizer.createFestival.showBothFields")}</p>
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
                          label={t("organizer.createFestival.festivalName") + " *"}
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
                          label={t("organizer.createFestival.slug")}
                          value={formData.core.slug}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">{t("organizer.createFestival.festivalType")} *</label>
                          <select
                            value={formData.core.type}
                            onChange={(e) => setFormData({...formData, core: {...formData.core, type: e.target.value as 'Religious' | 'CulturalTraditional' | 'NationalPublicHolidays'}})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                          >
                            <option value="Religious">{t("organizer.createFestival.typeReligious")}</option>
                            <option value="CulturalTraditional">{t("organizer.createFestival.typeCulturalTraditional")}</option>
                            <option value="NationalPublicHolidays">{t("organizer.createFestival.typeNationalPublicHolidays")}</option>
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
                      <div className="p-8 border-2 border-dashed border-gray-100 rounded-[32px] text-center hover:border-primary/20 transition-colors cursor-pointer">
                        <input type="file" className="hidden" id="cover-image-upload" onChange={e => e.target.files && handleFileUpload(e.target.files[0], true)} />
                        <label htmlFor="cover-image-upload" className="cursor-pointer">
                          <Camera className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                          <p className="text-xs font-bold text-gray-400">Upload Cover Image</p>
                        </label>
                      </div>
                      <div className="p-8 border-2 border-dashed border-gray-100 rounded-[32px] text-center hover:border-primary/20 transition-colors cursor-pointer">
                        <input type="file" className="hidden" id="gallery-upload" multiple onChange={e => e.target.files && Array.from(e.target.files).forEach(file => handleFileUpload(file))} />
                        <label htmlFor="gallery-upload" className="cursor-pointer">
                          <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                          <p className="text-xs font-bold text-gray-400">Upload Gallery Photos</p>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="sticky top-8">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 block">Live Preview</label>
                      <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 group">
                        <div className="relative h-64 overflow-hidden">
                          <img src={formData.core.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
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
                    </div>
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
                         schedule: [...formData.schedule, { day: formData.schedule.length + 1, title_en: '', title_am: '', activities_en: '', activities_am: '', performers: [] }]
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
                          <Input
                            label={t("organizer.createFestival.performers")}
                            value={day.performers.join(', ')}
                            onChange={(e) => {
                              const newSchedule = [...formData.schedule];
                              newSchedule[idx].performers = e.target.value.split(',').map(p => p.trim());
                              setFormData({ ...formData, schedule: newSchedule });
                            }}
                          />
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
                               label={t("organizer.createFestival.hotelName") + " *"}
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
label={t("organizer.createFestival.shortDescription") + " *"}
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
label={t("organizer.createFestival.fullDescription") + " *"}
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
                             <Input
                               label={t("organizer.createFestival.coverImage")}
                               placeholder="https://example.com/hotel.jpg"
                               value={hotel.image || ''}
                               onChange={(e) => updateHotel(hotelIdx, 'image', e.target.value)}
                             />
                             <Input
                               label={t("organizer.createFestival.address")}
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
                                         label={t("organizer.createFestival.roomName") + " *"}
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
                                         label={t("organizer.createFestival.capacity")}
                                         type="number"
                                         min="1"
                                         value={room.capacity || 1}
                                         onChange={(e) => updateRoom(hotelIdx, roomIdx, 'capacity', parseInt(e.target.value) || 1)}
                                       />
                                     </div>
                                     <DualLanguageField
                                       label={t("organizer.createFestival.description")}
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
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                       <Input
                                         label={t("organizer.createFestival.pricePerNight") + " *"}
                                         type="number"
                                         min="0"
                                         value={room.pricePerNight || 0}
                                         onChange={(e) => updateRoom(hotelIdx, roomIdx, 'pricePerNight', parseFloat(e.target.value) || 0)}
                                       />
                                       <Input
                                         label={t("organizer.createFestival.availableRooms") + " *"}
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
                               label={t("organizer.createFestival.transportType") + " *"}
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
                               label={t("organizer.createFestival.pricePerUnit")}
                               type="number"
                               min="0"
                               value={transport.price || 0}
                               onChange={(e) => updateTransport(idx, 'price', parseFloat(e.target.value) || 0)}
                             />
                           </div>
                           <DualLanguageField
                             label={t("organizer.createFestival.description")}
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
                             <Input
                               label={t("organizer.createFestival.availableUnits")}
                               type="number"
                               min="0"
                               value={transport.availability || 1}
                               onChange={(e) => updateTransport(idx, 'availability', parseInt(e.target.value) || 1)}
                             />
                             <Input
                               label={t("organizer.createFestival.passengerCapacity")}
                               type="number"
                               min="0"
                               value={transport.capacity || 0}
                               onChange={(e) => updateTransport(idx, 'capacity', parseInt(e.target.value) || 0)}
                             />
                           </div>
                           <Input
                             label={t("organizer.createFestival.imageUrl")}
                             placeholder="https://example.com/transport.jpg"
                             value={transport.image || ''}
                             onChange={(e) => updateTransport(idx, 'image', e.target.value)}
                           />
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
                                 label={t("organizer.createFestival.packageName") + " *"}
                                 englishPlaceholder="e.g. Traditional Feast"
                                 amharicPlaceholder="e.g. ባህላዊ ዓዲ"
                                 englishValue={pkg.name_en || ''}
                                 amharicValue={pkg.name_am || ''}
                                 onEnglishChange={(value) => updateFoodPackage(idx, 'name_en', value)}
                                 onAmharicChange={(value) => updateFoodPackage(idx, 'name_am', value)}
                                 showEnglish={languagePreference !== 'am'}
                                 showAmharic={languagePreference !== 'en'}
                               />
                               <Input
                                 label={t("organizer.createFestival.pricePerPerson")}
                                 type="number"
                                 min="0"
                                 value={pkg.pricePerPerson || 0}
                                 onChange={(e) => updateFoodPackage(idx, 'pricePerPerson', parseFloat(e.target.value) || 0)}
                               />
                             </div>
                             <DualLanguageField
                               label={t("organizer.createFestival.description")}
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
                        <div>
                          <textarea
                            rows={4}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="e.g. Traditional dance performances, Craft workshops..."
                            value={formData.services.culturalServices_en.join(', ')}
                            onChange={(e) => updateServiceArray('culturalServices', 'en', e.target.value)}
                          />
                        </div>
                        <div>
                          <textarea
                            rows={4}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="e.g. የባህል አድራᎎቶች፣ የእጅ ጥበብ ስራቶች..."
                            value={formData.services.culturalServices_am.join(', ')}
                            onChange={(e) => updateServiceArray('culturalServices', 'am', e.target.value)}
                          />
                        </div>
                       <div>
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Amharic Services (comma-separated)</label>
                         <textarea
                           rows={4}
                           className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all mt-2"
                           placeholder="e.g. የባህል አድራጎቶች፣ የእጅ ጥበብ ስራቶች..."
                           value={formData.services.culturalServices_am.join(', ')}
                           onChange={(e) => updateServiceArray('culturalServices', 'am', e.target.value)}
                         />
                       </div>
                     </div>
                   </section>

                   {/* Special Assistance */}
                   <section>
                     <h4 className="text-lg font-bold text-primary mb-4">Special Assistance</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <textarea
                            rows={3}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="e.g. Wheelchair access, Sign language interpreter..."
                            value={formData.services.specialAssistance_en.join(', ')}
                            onChange={(e) => updateServiceArray('specialAssistance', 'en', e.target.value)}
                          />
                        </div>
                        <div>
                          <textarea
                            rows={3}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="e.g. ለአካል ተገዢ መድረሻ፣ የምልክት ቋንቋ ትርጉም..."
                            value={formData.services.specialAssistance_am.join(', ')}
                            onChange={(e) => updateServiceArray('specialAssistance', 'am', e.target.value)}
                          />
                        </div>
                     </div>
                   </section>

                   {/* Extras */}
                   <section>
                     <h4 className="text-lg font-bold text-primary mb-4">Extra Services</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <textarea
                            rows={3}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="e.g. Photography, Souvenir shop, Guided tours..."
                            value={formData.services.extras_en.join(', ')}
                            onChange={(e) => updateServiceArray('extras', 'en', e.target.value)}
                          />
                        </div>
                        <div>
                          <textarea
                            rows={3}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="e.g. ፎቶግራፍ፣ ህዝባዊ መዝነት፣ የመምሪያ ጉዞች..."
                            value={formData.services.extras_am.join(', ')}
                            onChange={(e) => updateServiceArray('extras', 'am', e.target.value)}
                          />
                        </div>
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
                       label={t("organizer.createFestival.cancellationPolicy") + " *"}
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
                       label={t("organizer.createFestival.bookingTerms") + " *"}
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
                       label={t("organizer.createFestival.safetyRules")}
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
                       label={t("organizer.createFestival.ageRestriction")}
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
                   <h3 className="text-2xl font-serif font-bold text-primary">Pricing</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                     <Input
                       label={t("organizer.createFestival.baseTicketPrice") + " *"}
                       type="number"
                       min="0"
                       value={formData.pricing.basePrice || 0}
                       onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, basePrice: parseFloat(e.target.value) || 0 } })}
                     />
                     <Input
                       label={t("organizer.createFestival.vipTicketPrice")}
                       type="number"
                       min="0"
                       value={formData.pricing.vipPrice || 0}
                       onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, vipPrice: parseFloat(e.target.value) || 0 } })}
                     />
                     <Input
                       label={t("organizer.createFestival.earlyBirdDiscount")}
                       type="number"
                       min="0"
                       max="100"
                       value={formData.pricing.earlyBird || 0}
                       onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, earlyBird: parseFloat(e.target.value) || 0 } })}
                     />
                     <Input
                       label={t("organizer.createFestival.groupDiscount")}
                       type="number"
                       min="0"
                       max="100"
                       value={formData.pricing.groupDiscount || 0}
                       onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, groupDiscount: parseFloat(e.target.value) || 0 } })}
                     />
                     <div>
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Currency</label>
                       <select
                         value={formData.pricing.currency}
                         onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, currency: e.target.value } })}
                         className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                       >
                         <option value="ETB">ETB - Ethiopian Birr</option>
                         <option value="USD">USD - US Dollar</option>
                         <option value="EUR">EUR - Euro</option>
                       </select>
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

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* Core Info Summary */}
                     <section className="bg-ethio-bg rounded-2xl p-6">
                       <h4 className="text-lg font-bold text-primary mb-4">Core Information</h4>
                       <div className="space-y-3 text-sm">
                         <div>
                           <span className="font-bold">Festival Name:</span>
                           {languagePreference === 'both' ? (
                             <>
                               <br />EN: {formData.core.name_en || 'Not provided'}
                               <br />AM: {formData.core.name_am || 'Not provided'}
                             </>
                           ) : languagePreference === 'en' ? (
                             formData.core.name_en || 'Not provided'
                           ) : (
                             formData.core.name_am || 'Not provided'
                           )}
                         </div>
                         <div><span className="font-bold">Dates:</span> {formData.core.startDate} - {formData.core.endDate}</div>
                         <div>
                           <span className="font-bold">Location:</span>
                           {languagePreference === 'both' ? (
                             <>
                               <br />EN: {formData.core.locationName_en || 'Not provided'}
                               <br />AM: {formData.core.locationName_am || 'Not provided'}
                             </>
                           ) : languagePreference === 'en' ? (
                             formData.core.locationName_en || 'Not provided'
                           ) : (
                             formData.core.locationName_am || 'Not provided'
                           )}
                         </div>
                         <div><span className="font-bold">Address:</span> {formData.core.address}</div>
                       </div>
                     </section>

                     {/* Schedule Summary */}
                     <section className="bg-ethio-bg rounded-2xl p-6">
                       <h4 className="text-lg font-bold text-primary mb-4">Schedule ({formData.schedule.length} day{formData.schedule.length !== 1 ? 's' : ''})</h4>
                       <ul className="space-y-2 text-sm">
                         {formData.schedule.map((day: any, idx: number) => (
                           <li key={idx} className="border-b border-gray-200 pb-2 last:border-0">
                             <span className="font-bold">Day {day.day}:</span>
                             {languagePreference === 'both' ? (
                               <>
                                 <br />EN Title: {day.title_en || 'Not provided'}
                                 <br />AM Title: {day.title_am || 'Not provided'}
                               </>
                             ) : languagePreference === 'en' ? (
                               day.title_en || 'Not provided'
                             ) : (
                               day.title_am || 'Not provided'
                             )}
                           </li>
                         ))}
                       </ul>
                     </section>

                     {/* Hotels Summary */}
                     <section className="bg-ethio-bg rounded-2xl p-6">
                       <h4 className="text-lg font-bold text-primary mb-4">Hotels ({formData.hotels.length})</h4>
                       <div className="space-y-4 text-sm">
                         {formData.hotels.map((hotel: any, idx: number) => (
                           <div key={idx} className="border-b border-gray-200 pb-3 last:border-0">
                             <div className="font-bold">
                               {languagePreference === 'both' ? (
                                 <>
                                   {hotel.name_en || 'Unnamed'} / {hotel.name_am || 'Unnamed'}
                                 </>
                               ) : languagePreference === 'en' ? (
                                 hotel.name_en || 'Unnamed'
                               ) : (
                                 hotel.name_am || 'Unnamed'
                               )}
                             </div>
                             <div>{hotel.starRating} stars • {hotel.rooms?.length || 0} room type(s)</div>
                           </div>
                         ))}
                       </div>
                     </section>

                     {/* Transport Summary */}
                     <section className="bg-ethio-bg rounded-2xl p-6">
                       <h4 className="text-lg font-bold text-primary mb-4">Transportation ({formData.transportation.length})</h4>
                       <div className="space-y-2 text-sm">
                         {formData.transportation.map((t: any, idx: number) => (
                           <div key={idx} className="border-b border-gray-200 pb-2 last:border-0">
                             <span className="font-bold">
                               {languagePreference === 'both' ? (
                                 <>
                                   {t.type_en || 'Unnamed'} / {t.type_am || 'Unnamed'}
                                 </>
                               ) : languagePreference === 'en' ? (
                                 t.type_en || 'Unnamed'
                               ) : (
                                 t.type_am || 'Unnamed'
                               )}
                             </span>
                             <span className="ml-2 text-gray-500">- {t.availability} units, {t.price} ETB</span>
                           </div>
                         ))}
                       </div>
                     </section>

                     {/* Services Summary */}
                     <section className="bg-ethio-bg rounded-2xl p-6">
                       <h4 className="text-lg font-bold text-primary mb-4">Services</h4>
                       <div className="text-sm space-y-2">
                         <div><span className="font-bold">Food Packages:</span> {formData.services.foodPackages.length}</div>
                         <div><span className="font-bold">Cultural Services:</span> EN: {formData.services.culturalServices_en.length}, AM: {formData.services.culturalServices_am.length}</div>
                         <div><span className="font-bold">Special Assistance:</span> EN: {formData.services.specialAssistance_en.length}, AM: {formData.services.specialAssistance_am.length}</div>
                         <div><span className="font-bold">Extras:</span> EN: {formData.services.extras_en.length}, AM: {formData.services.extras_am.length}</div>
                       </div>
                     </section>

                     {/* Policies Summary */}
                     <section className="bg-ethio-bg rounded-2xl p-6">
                       <h4 className="text-lg font-bold text-primary mb-4">Policies</h4>
                       <div className="text-sm space-y-2">
                         <div><span className="font-bold">Cancellation:</span> {formData.policies.cancellation_en ? 'Provided' : 'Not provided'}</div>
                         <div><span className="font-bold">Terms:</span> {formData.policies.terms_en ? 'Provided' : 'Not provided'}</div>
                         <div><span className="font-bold">Age Restriction:</span> {formData.policies.ageRestriction || 'None'}</div>
                       </div>
                     </section>

                     {/* Pricing Summary */}
                     <section className="bg-ethio-bg rounded-2xl p-6">
                       <h4 className="text-lg font-bold text-primary mb-4">Pricing</h4>
                       <div className="text-sm space-y-1">
                         <div><span className="font-bold">Base Price:</span> {formData.pricing.basePrice} ETB</div>
                         <div><span className="font-bold">VIP Price:</span> {formData.pricing.vipPrice} ETB</div>
                         <div><span className="font-bold">Early Bird:</span> {formData.pricing.earlyBird}%</div>
                         <div><span className="font-bold">Group Discount:</span> {formData.pricing.groupDiscount}%</div>
                       </div>
                     </section>
                   </div>
                 </div>
               )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};