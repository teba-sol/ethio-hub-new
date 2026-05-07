import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Users, DollarSign, ShieldCheck, TrendingUp, 
  ArrowRight, Activity, Ticket, Star, Briefcase, Layers, 
  Plus, Download, Landmark, ArrowUpRight, ChevronRight,
  Pause, Play, Archive, Trash2, MapPin, Search, Printer,
  Share2, Receipt, CalendarClock, MoreVertical, X,
  CheckCircle2, XCircle, Percent, Edit3, Globe,
  Hotel, Car, Box, AlertCircle, Info, RefreshCw, MessageSquare,
  Utensils, Heart, Image as ImageIcon, Mail, Phone, CreditCard, QrCode,
  History, UserCheck, UserMinus, FileText, ChevronLeft, Eye,
  LayoutGrid, CalendarDays, BarChart2, MoreHorizontal, Bell, AlertTriangle, Filter, ArrowUpDown,
  HelpCircle, Lightbulb, BarChart, Map, Clock, Camera, ZoomIn, Maximize2, Check, Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Festival, HotelAccommodation, Review, TransportOption, RoomType, FoodPackage } from '../../types';
import { Button, Badge, VerifiedBadge, Input, Textarea } from '../UI';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedText } from '../../utils/getLocalizedText';
import { MOCK_FESTIVALS } from '../../data/constants';
import { 
  CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis
} from 'recharts';

import apiClient from '../../lib/apiClient';
import { getImageUrl as getCloudImageUrl } from '../../lib/cloudinary';

const REVENUE_DATA = [];
const SNAPSHOT_DATA = [];
const NOTIFICATIONS = [];
const ENGAGEMENT_DATA = [];

const MOCK_REVIEWS: Review[] = [
  { id: 'rev-1', userId: 'u1', userName: 'Abebe Bikila', userImage: 'https://picsum.photos/seed/abebe/100/100', targetId: 'f1', targetName: 'Timket 2025 (Epiphany)', rating: 5, comment: 'An absolutely breathtaking experience.', date: 'Jan 22, 2025', isVerified: true },
];

import { 
  normalizeSchedule, 
  normalizeHotels, 
  normalizeTransportation, 
  normalizeServices, 
  normalizePolicies 
} from '../../lib/festivalNormalization';
import { FestivalCreationWizard } from './Wizards';

export const EventDetailPanel: React.FC<{ eventId: string; onBack: () => void }> = ({ eventId, onBack }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('core');
  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Add these with your other useState declarations
const [uploadingImage, setUploadingImage] = useState(false);
const [imageUploadType, setImageUploadType] = useState<'cover' | 'gallery'>('cover');
const [imageIndex, setImageIndex] = useState<number | null>(null);

const getImageUrl = (path: string | undefined | null) => {
    if (!path || path === '') return 'https://images.unsplash.com/photo-1533174072545-7a4b6dad2cf7?w=800&h=400&fit=crop';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/uploads/')) {
      const baseUrl = window.location.origin;
      return `${baseUrl}${path}`;
    }
    if (path.startsWith('ethio-hub/')) {
      return getCloudImageUrl(path, { width: 800, height: 400 });
    }
    return path;
  };

  const getGalleryImageUrl = (path: string | undefined | null) => {
    if (!path || path === '') return 'https://images.unsplash.com/photo-1547467132-55d7a6a5d507?w=400&h=400&fit=crop';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/uploads/')) {
      const baseUrl = window.location.origin;
      return `${baseUrl}${path}`;
    }
    if (path.startsWith('ethio-hub/')) {
      return getCloudImageUrl(path, { width: 400, height: 400 });
    }
    return path;
  };
  
  // Add this function inside your component
const handleImageUpload = async (file: File, type: 'cover' | 'gallery', index?: number) => {
  setUploadingImage(true);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await response.json();

    if (data.success) {
      const imageUrl = data.url;

      if (type === 'cover') {
        handleInputChange('coverImage', imageUrl);
      } else if (type === 'gallery' && index !== undefined) {
        const newGallery = [...(editData.gallery || [])];
        newGallery[index] = imageUrl;
        handleInputChange('gallery', newGallery);
      } else if (type === 'gallery' && index === undefined) {
        const newGallery = [...(editData.gallery || []), imageUrl];
        handleInputChange('gallery', newGallery);
      }
    }
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Failed to upload image');
  } finally {
    setUploadingImage(false);
  }
};

  useEffect(() => {
  const fetchFestival = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/organizer/festivals/${eventId}`);
      console.log('FULL API RESPONSE:', response); // Debug
      
      if (response.success) {
        console.log('FESTIVAL DATA:', {
          coverImage: response.festival.coverImage,
          gallery: response.festival.gallery,
          fullData: response.festival
        });
        
        setFestival(response.festival);
        setEditData(JSON.parse(JSON.stringify(response.festival)));
      } else {
        setError(response.message || 'Failed to fetch festival details.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'An unexpected error occurred.');
    }
    setLoading(false);
  };

  fetchFestival();
}, [eventId]);

   const handleSaveChanges = async () => {
     setSaving(true);
     try {
       // Normalize data before saving
       const isDraft = editData.verificationStatus === 'Draft' || !editData.verificationStatus;
       const dataToSave = { 
         ...editData,
         hotels: normalizeHotels(editData.hotels, isDraft),
         transportation: normalizeTransportation(editData.transportation, isDraft),
         schedule: normalizeSchedule(editData.schedule, isDraft),
         services: normalizeServices(editData.services, isDraft),
         policies: normalizePolicies(editData.policies)
       };

       // If this is an approved event being edited, mark it for reverification
       if (festival.verificationStatus === 'Approved') {
         dataToSave.isEditedAfterApproval = true;
         dataToSave.verificationStatus = 'Pending Approval';
         dataToSave.status = 'Draft';
         dataToSave.isVerified = false;
       }

       console.log('Saving festival data:', JSON.stringify(dataToSave, null, 2));
       const response = await apiClient.put(`/api/organizer/festivals/${eventId}`, dataToSave);
       console.log('Save response:', response);
       if (response.success) {
         setFestival(response.festival || dataToSave);
         setEditData(response.festival || dataToSave);
         setIsEditing(false);
         alert('Event updated successfully!');
       } else {
         alert(response.message || 'Failed to update event');
       }
     } catch (err: any) {
       alert(err.message || 'An error occurred while saving');
     } finally {
       setSaving(false);
     }
   };

  const handleCancelEdit = () => {
    setEditData(JSON.parse(JSON.stringify(festival)));
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleArrayChange = (parent: string, index: number, field: string, value: any) => {
    setEditData((prev: any) => {
      const newArray = [...(prev[parent] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [parent]: newArray };
    });
  };

  const handleAddArrayItem = (parent: string, newItem: any) => {
    setEditData((prev: any) => ({
      ...prev,
      [parent]: [...(prev[parent] || []), newItem]
    }));
  };

  const handleRemoveArrayItem = (parent: string, index: number) => {
    setEditData((prev: any) => ({
      ...prev,
      [parent]: prev[parent].filter((_: any, i: number) => i !== index)
    }));
  };

  const parseNumberInput = (value: string, fallback = 0) => {
    if (value.trim() === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const hasMeaningfulRoomData = (room: RoomType) => {
    if (!room || typeof room !== 'object') return false;

    const textFields = ['name', 'name_en', 'name_am', 'description', 'description_en', 'description_am', 'image', 'bedType'] as const;
    const hasText = textFields.some((field) => String((room as any)[field] || '').trim().length > 0);

    const numericFields = ['capacity', 'pricePerNight', 'availability', 'sqm'] as const;
    const hasNumeric = numericFields.some((field) => {
      const value = Number((room as any)[field]);
      return Number.isFinite(value) && value > 0;
    });

    const hasAmenities = Array.isArray(room.amenities) && room.amenities.length > 0;
    return hasText || hasNumeric || hasAmenities;
  };

  const handleDeleteEvent = async () => {
    if (!eventId || deleting) return;
    
    setDeleting(true);
    try {
      const response = await apiClient.delete(`/api/organizer/festivals/${eventId}`);
      
      if (response.success) {
        router.push('/dashboard/organizer');
      } else {
        setError(response.message || 'Failed to delete event');
        setShowDeleteConfirm(false);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const TABS = [
    { id: 'core', label: 'Core Information', icon: Info },
    { id: 'schedule', label: 'Experience & Schedule', icon: Calendar },
    { id: 'hotels', label: 'Hotels & Rooms', icon: Hotel },
    { id: 'transport', label: 'Transportation', icon: Car },
    { id: 'services', label: 'Services', icon: Utensils },
    { id: 'policies', label: 'Policies', icon: ShieldCheck },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-700">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-medium">Loading event details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-2xl max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <AlertCircle className="w-8 h-8" />
          <div>
            <h4 className="font-bold text-lg">Error Loading Event</h4>
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const handleWizardSave = async (updatedFestival: any) => {
    setFestival(updatedFestival);
    setIsEditing(false);
    alert('Event updated successfully!');
  };

  if (isEditing) {
    return (
      <FestivalCreationWizard 
        onCancel={() => setIsEditing(false)} 
        initialData={festival}
        onSave={handleWizardSave}
      />
    );
  }

   const currentData = (isEditing ? editData : festival) as any;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Top Section */}
      <header className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center">
          <div className="w-full lg:w-72 h-48 rounded-[32px] overflow-hidden shadow-lg flex-shrink-0 relative group">
  <img 
    src={getImageUrl(currentData?.coverImage)}
    className="w-full h-full object-cover" 
    alt={currentData?.name || 'Event'} 
  />
    {/* Cover image displayed here - debug removed */}
  {isEditing && (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <label className="cursor-pointer bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        Change Cover
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleImageUpload(e.target.files[0], 'cover');
            }
          }}
        />
      </label>
    </div>
  )}
</div>
           <div className="flex-1 space-y-4">
             <div className="flex flex-wrap items-center gap-3">
               <button onClick={onBack} className="p-2 bg-ethio-bg rounded-xl text-primary hover:bg-primary hover:text-white transition-all mr-2">
                 <ChevronLeft className="w-5 h-5" />
               </button>
               <Badge variant="secondary" className="bg-secondary/10 text-secondary border-none">
                 {currentData.status === 'Completed' || new Date(currentData.endDate) < new Date() ? 'Completed' : 
                  currentData.status === 'Published' ? 'Published' : 'Draft'}
               </Badge>
               {currentData.isVerified && <VerifiedBadge />}
               {/* Verification Status Badge */}
               <span className="px-3 py-1 rounded-full text-xs font-medium">
                 {currentData.verificationStatus === 'Pending Approval' && (
                   <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                     Pending Review
                   </Badge>
                 )}
                 {currentData.verificationStatus === 'Under Review' && (
                   <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500">
                     Under Review
                   </Badge>
                 )}
                 {currentData.verificationStatus === 'Approved' && (
                   <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500">
                     Approved
                   </Badge>
                 )}
                 {currentData.verificationStatus === 'Rejected' && (
                 <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500">
                   Rejected
                 </Badge>
               )}
               </span>
             </div>

             {currentData.verificationStatus === 'Rejected' && (
               <div className="p-4 bg-red-50 border border-red-100 rounded-2xl mb-4">
                 <div className="flex items-start gap-3">
                   <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                   <div>
                     <p className="text-xs font-bold text-red-600 uppercase mb-1">Rejection Reason</p>
                     <p className="text-sm text-red-700">{currentData.rejectionReason || 'Your event was not approved. Please review the details, make necessary changes, and resubmit.'}</p>
                   </div>
                 </div>
               </div>
             )}
            
            {isEditing ? (
              <input
                type="text"
                value={currentData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-4xl lg:text-5xl font-serif font-bold text-primary bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full"
              />
            ) : (
              <h1 className="text-4xl lg:text-5xl font-serif font-bold text-primary">{currentData.name}</h1>
            )}
            
            <div className="flex flex-wrap items-center gap-6 text-gray-400 text-sm font-bold uppercase tracking-widest">
              {isEditing ? (
                <>
                  <input
                    type="date"
                    value={new Date(currentData.startDate).toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm"
                  />
                  <span>—</span>
                  <input
                    type="date"
                    value={new Date(currentData.endDate).toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm"
                  />
                  <input
                    type="text"
                    value={currentData.location?.name || ''}
                    onChange={(e) => handleNestedChange('location', 'name', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm"
                    placeholder="Location name"
                  />
                </>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-secondary" /> 
                    {new Date(currentData.startDate).toLocaleDateString()} — {new Date(currentData.endDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-secondary" /> 
                    {currentData.location?.name}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 w-full lg:w-auto">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1 lg:flex-none" 
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1 lg:flex-none" 
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <>
                {(() => {
                  const isRejected = currentData.verificationStatus === 'Rejected';
                  const isPending = currentData.verificationStatus === 'Pending Approval' || currentData.verificationStatus === 'Pending Review';
                  const isDraft = currentData.status === 'Draft';
                  const isCompleted = currentData.status === 'Completed' || new Date(currentData.endDate) < new Date();
                  const isPublished = !isRejected && !isPending && !isDraft && !isCompleted;

                  if (isPublished || isCompleted) return null;

                  return (
                    <>
                      {isRejected && !isEditing && (
                        <Button 
                          variant="secondary" 
                          className="flex-1 lg:flex-none" 
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/organizer/festivals/${eventId}/submit`, { method: 'POST' });
                              const data = await res.json();
                              if (data.success) {
                                setFestival({ ...festival!, verificationStatus: 'Pending Approval', submittedAt: new Date().toISOString() });
                                setEditData({ ...editData!, verificationStatus: 'Pending Approval', submittedAt: new Date().toISOString() });
                                alert('Event resubmitted for review');
                              } else {
                                alert(data.message || 'Failed to resubmit');
                              }
                            } catch (err) {
                              alert('Error resubmitting event');
                            }
                          }}
                        >
                          Resubmit for Review
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="flex-1 lg:flex-none" 
                        onClick={() => setIsEditing(true)} 
                        leftIcon={Edit3}
                      >
                        Edit Event
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 lg:flex-none text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300" 
                        onClick={() => setShowDeleteConfirm(true)}
                        leftIcon={Trash2}
                      >
                        Delete Event
                      </Button>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-white text-gray-400 hover:bg-ethio-bg hover:text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm min-h-[600px]">
        
        {/* ==================== CORE INFO TAB ==================== */}
        {activeTab === 'core' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-500">
            <div className="space-y-10">
              <section className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
                  <Info className="w-5 h-5 text-secondary" /> Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 ml-1">Festival Name</p>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-sm font-bold text-primary">{currentData.name}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 ml-1">Status</p>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <Badge variant={currentData.status === 'Published' ? 'success' : 'secondary'} size="sm">
                        {currentData.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 ml-1">Start Date</p>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-secondary" />
                      <p className="text-sm font-bold text-primary">{new Date(currentData.startDate).toDateString()}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 ml-1">End Date</p>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-secondary" />
                      <p className="text-sm font-bold text-primary">{new Date(currentData.endDate).toDateString()}</p>
                    </div>
                  </div>
                </div>
              </section>
              
              <section className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-secondary" /> Location & Address
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Location Name</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.location?.name || ''}
                        onChange={(e) => handleNestedChange('location', 'name', e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-bold text-primary">{currentData.location?.name}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Physical Address</p>
                    {isEditing ? (
                      <Textarea
                        hideLabel
                        value={currentData.location?.address || ''}
                        onChange={(e) => handleNestedChange('location', 'address', e.target.value)}
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm font-bold text-primary">{currentData.location?.address || 'No specific address provided'}</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
            
            <div className="space-y-10">
              <section className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
                  <Activity className="w-5 h-5 text-secondary" /> Descriptions
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Short Description</p>
                    {isEditing ? (
                      <Textarea
                        hideLabel
                        value={currentData.shortDescription}
                        onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed">{currentData.shortDescription}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Full Description</p>
                    {isEditing ? (
                      <Textarea
                        hideLabel
                        value={currentData.fullDescription}
                        onChange={(e) => handleInputChange('fullDescription', e.target.value)}
                        rows={6}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{currentData.fullDescription}</p>
                    )}
                  </div>
                </div>
              </section>
              
              <section className="space-y-4">
  <h3 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
    <ImageIcon className="w-5 h-5 text-secondary" /> Media Gallery
  </h3>
  
  <div className="grid grid-cols-3 gap-4">
    {(currentData.gallery && currentData.gallery.length > 0) ? 
      currentData.gallery.map((imgUrl: string, i: number) => (
        <div key={`gallery-${i}`} className="aspect-square rounded-2xl overflow-hidden bg-ethio-bg border border-gray-100 relative group">
          <img 
            src={getGalleryImageUrl(imgUrl)} 
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" 
            alt={`Gallery image ${i + 1}`} 
          />
          {isEditing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                <label className="cursor-pointer bg-white text-primary p-2 rounded-lg text-xs font-bold">
                  <Edit3 className="w-3 h-3" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleImageUpload(e.target.files[0], 'gallery', i);
                      }
                    }}
                  />
                </label>
                <button
                  onClick={() => {
                    const newGallery = currentData.gallery.filter((_: string, idx: number) => idx !== i);
                    handleInputChange('gallery', newGallery);
                  }}
                  className="bg-red-500 text-white p-2 rounded-lg text-xs font-bold"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )) : 
      <p className='text-sm text-gray-400 col-span-3 text-center py-8'>No gallery images uploaded yet.</p>
    }
  </div>
  
  {isEditing && (
    <label className="inline-flex items-center gap-2 text-sm text-primary font-bold mt-2 cursor-pointer hover:text-secondary transition-colors">
      <Plus className="w-4 h-4" />
      Add Gallery Images
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            Array.from(e.target.files).forEach(file => {
              handleImageUpload(file, 'gallery');
            });
          }
        }}
      />
    </label>
  )}
</section>
            </div>
          </div>
        )}

        {/* ==================== SCHEDULE TAB ==================== */}
        {activeTab === 'schedule' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold text-primary">Experience & Daily Schedule</h3>
              {isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleAddArrayItem('schedule', { 
                    day: (currentData.schedule?.length || 0) + 1, 
                    title: '', 
                    activities: '', 
                    performers: [] 
                  })}
                >
                  + Add Day
                </Button>
              )}
            </div>
            <div className="space-y-6">
              {(currentData.schedule || []).map((day: any, idx: number) => (
                <div key={idx} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 relative hover:shadow-md transition-all group">
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveArrayItem('schedule', idx)}
                      className="absolute top-6 right-6 p-2 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="w-20 h-20 bg-primary text-white rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">Day</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={day.day}
                        onChange={(e) => handleArrayChange('schedule', idx, 'day', parseNumberInput(e.target.value))}
                        className="text-2xl font-serif font-bold bg-transparent text-white text-center w-12 outline-none"
                      />
                    ) : (
                      <span className="text-3xl font-serif font-bold">{day.day}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-6">
                    <div>
                      {isEditing ? (
                        <Input
                          placeholder="Day Title (e.g. Grand Opening Ceremony) *"
                          hideLabel
                          value={day.title}
                          onChange={(e) => handleArrayChange('schedule', idx, 'title', e.target.value)}
                          className="text-xl font-bold"
                        />
                      ) : (
                        <h4 className="text-2xl font-serif font-bold text-primary">{day.title || 'Special Celebration Day'}</h4>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Activities</label>
                        {isEditing ? (
                          <Textarea
                            hideLabel
                            value={day.activities}
                            onChange={(e) => handleArrayChange('schedule', idx, 'activities', e.target.value)}
                            rows={3}
                            placeholder="Describe the main activities for this day..."
                          />
                        ) : (
                          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                            {day.activities || 'Traditional ceremonies and community gathering.'}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Performers & Guests</label>
                        {isEditing ? (
                          <Input
                            hideLabel
                            placeholder="Comma separated list of performers..."
                            value={day.performers?.join(', ') || ''}
                            onChange={(e) => handleArrayChange('schedule', idx, 'performers', e.target.value.split(',').map((p: string) => p.trim()))}
                            icon={Users}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 min-h-[60px] content-start">
                            {(day.performers && day.performers.length > 0) ? (
                              day.performers.map((p: string, i: number) => (
                                <Badge key={`performer-${i}`} variant="outline" className="bg-white border-primary/20 text-primary py-1.5 px-3">
                                  {p}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">No performers listed</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== HOTELS TAB ==================== */}
       {activeTab === 'hotels' && (
  <div className="space-y-12 animate-in fade-in duration-700">
    {/* Header */}
    <div className="flex justify-between items-end border-b border-gray-100 pb-6">
      <div>
        <h3 className="text-3xl font-serif font-bold text-primary mb-2">Accommodation Partners</h3>
        <p className="text-gray-500 text-sm">Curated luxury stays for an unforgettable Ethiopian experience</p>
      </div>
      {isEditing && (
        <Button 
          variant="outline" 
          size="sm" 
        onClick={() => handleAddArrayItem('hotels', { 
  id: `hotel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: '', 
            starRating: 5, 
            address: '', 
            description: '', 
            fullDescription: '',
            policies: '',
            checkInTime: '14:00',
            checkOutTime: '12:00',
            facilities: [],
            image: '', 
            gallery: [],
            rooms: []
          })}
          className="rounded-full border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300"
        >
          + Add Hotel
        </Button>
      )}
    </div>

    {/* Hotels Grid */}
    <div className="space-y-16">
      {(currentData.hotels || []).map((hotel: any, idx: number) => (
        <div 
          key={idx} 
          className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
        >
          {/* Delete Button */}
          {isEditing && (
            <button
              onClick={() => handleRemoveArrayItem('hotels', idx)}
              className="absolute top-6 right-6 z-20 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg text-red-500 hover:text-red-700 hover:bg-white transition-all duration-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Main Image Section with Overlay */}
          <div className="relative h-[400px] lg:h-[500px] overflow-hidden">
            {isEditing ? (
              <>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id={`hotel-image-${idx}`}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        const data = await res.json();
                        if (data.success) {
                          handleArrayChange('hotels', idx, 'image', data.url);
                        }
                      } catch (err) {
                        console.error('Upload failed:', err);
                      }
                    }
                  }}
                />
                <label 
                  htmlFor={`hotel-image-${idx}`} 
                  className="cursor-pointer w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-500"
                >
                  {hotel.image ? (
                    <img 
                      src={getImageUrl(hotel.image)} 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                      alt={hotel.name} 
                    />
                  ) : (
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mb-3 mx-auto" />
                      <span className="text-sm text-gray-500 font-medium">Upload hero image</span>
                    </div>
                  )}
                </label>
              </>
            ) : (
              <>
                <img 
                  src={getImageUrl(hotel.image)} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                  alt={hotel.name} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </>
            )}
            
            {/* Hotel Badge */}
            <div className="absolute top-6 left-6 z-10">
              <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex text-secondary">
                    {[...Array(hotel.starRating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-primary">★★★★★</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hotel Info Section */}
          <div className="p-8 lg:p-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="space-y-2 flex-1">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={hotel.name}
                      onChange={(e) => handleArrayChange('hotels', idx, 'name', e.target.value)}
                      className="text-3xl lg:text-4xl font-serif font-bold text-primary w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mb-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Hotel name"
                    />
                    <input
                      type="number"
                      value={hotel.starRating}
                      onChange={(e) => handleArrayChange('hotels', idx, 'starRating', parseNumberInput(e.target.value))}
                      className="w-24 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      min={1}
                      max={5}
                    />
                  </>
                ) : (
                  <>
                    <h4 className="text-3xl lg:text-4xl font-serif font-bold text-primary">{hotel.name}</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex text-secondary">
                        {[...Array(hotel.starRating || 5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{hotel.starRating} Star Hotel</span>
                    </div>
                  </>
                )}
              </div>
              <Badge className="bg-gradient-to-r from-secondary to-secondary/80 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md">
                Partnered
              </Badge>
            </div>

            {/* Description */}
            {isEditing ? (
              <>
                <textarea
                  value={hotel.description || ''}
                  onChange={(e) => handleArrayChange('hotels', idx, 'description', e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  rows={2}
                  placeholder="Short description"
                />
                <textarea
                  value={hotel.fullDescription || ''}
                  onChange={(e) => handleArrayChange('hotels', idx, 'fullDescription', e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  rows={4}
                  placeholder="Full description (detailed info about the hotel)"
                />
              </>
            ) : (
              <p className="text-gray-600 leading-relaxed">{hotel.description || 'Premium accommodation with traditional Ethiopian hospitality and modern amenities.'}</p>
            )}

            {!isEditing && hotel.fullDescription && (
              <p className="text-gray-500 text-sm leading-relaxed">{hotel.fullDescription}</p>
            )}

            {/* Facilities */}
            {isEditing ? (
              <div className="pt-4">
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">Facilities</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Free WiFi', 'Swimming Pool', 'Fitness Center', 'Spa & Sauna', 'Restaurant', 'Airport Shuttle', 'Free Parking', 'Room Service', 'Laundry Service', 'Meeting Rooms', 'Minibar', 'Bar'].map((facility) => (
                    <label key={facility} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(hotel.facilities || []).includes(facility)}
                        onChange={(e) => {
                          const facilities = hotel.facilities || [];
                          if (e.target.checked) {
                            handleArrayChange('hotels', idx, 'facilities', [...facilities, facility]);
                          } else {
                            handleArrayChange('hotels', idx, 'facilities', facilities.filter((f: string) => f !== facility));
                          }
                        }}
                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{facility}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              hotel.facilities?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {hotel.facilities.map((f: string, fi: number) => (
                    <span key={fi} className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">{f}</span>
                  ))}
                </div>
              )
            )}

            {/* Check In/Out Times */}
            {isEditing ? (
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">Check In Time</p>
                  <input
                    type="time"
                    value={hotel.checkInTime || '14:00'}
                    onChange={(e) => handleArrayChange('hotels', idx, 'checkInTime', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">Check Out Time</p>
                  <input
                    type="time"
                    value={hotel.checkOutTime || '12:00'}
                    onChange={(e) => handleArrayChange('hotels', idx, 'checkOutTime', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            ) : (
              (hotel.checkInTime || hotel.checkOutTime) && (
                <div className="flex flex-wrap gap-4 pt-4">
                  {hotel.checkInTime && (
                    <div className="bg-primary/5 px-4 py-2 rounded-xl">
                      <span className="text-xs text-gray-500 block">Check-in</span>
                      <strong className="text-primary text-sm">{hotel.checkInTime}</strong>
                    </div>
                  )}
                  {hotel.checkOutTime && (
                    <div className="bg-primary/5 px-4 py-2 rounded-xl">
                      <span className="text-xs text-gray-500 block">Check-out</span>
                      <strong className="text-primary text-sm">{hotel.checkOutTime}</strong>
                    </div>
                  )}
                </div>
              )
            )}

            {/* Address */}
            <div className="pt-4 border-t border-gray-100">
              {isEditing ? (
                <input
                  type="text"
                  value={hotel.address || ''}
                  onChange={(e) => handleArrayChange('hotels', idx, 'address', e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Address"
                />
              ) : (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                  <p className="text-gray-600 text-sm">{hotel.address}</p>
                </div>
              )}
            </div>

            {/* Policies */}
            {isEditing ? (
              <div className="pt-4">
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">Hotel Policies</p>
                <textarea
                  value={hotel.policies || ''}
                  onChange={(e) => handleArrayChange('hotels', idx, 'policies', e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  rows={3}
                  placeholder="Cancellation policy, house rules, etc."
                />
              </div>
            ) : hotel.policies && (
              <div className="pt-4">
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">Policies</p>
                <p className="text-sm text-gray-600">{hotel.policies}</p>
              </div>
            )}

            {/* Gallery */}
            <div className="pt-4">
              <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Photo Gallery
              </p>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(hotel.gallery || []).map((img: string, gi: number) => (
                      <div key={gi} className="relative group/gallery overflow-hidden rounded-xl aspect-square">
                        <img 
                          src={getGalleryImageUrl(img)} 
                          alt={`Gallery ${gi + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => {
                            const newGallery = (hotel.gallery || []).filter((_: string, i: number) => i !== gi);
                            handleArrayChange('hotels', idx, 'gallery', newGallery);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id={`hotel-gallery-${idx}`}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch('/api/upload', { method: 'POST', body: formData });
                          const data = await res.json();
                          if (data.success) {
                            handleArrayChange('hotels', idx, 'gallery', [...(hotel.gallery || []), data.url]);
                          }
                        } catch (err) {
                          console.error('Gallery upload failed:', err);
                        }
                      }
                    }}
                  />
                  <label 
                    htmlFor={`hotel-gallery-${idx}`}
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">Add gallery image</span>
                  </label>
                </div>
              ) : (
                hotel.gallery && hotel.gallery.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {hotel.gallery.slice(0, 4).map((img: string, gi: number) => (
                      <div key={gi} className="relative group/gallery overflow-hidden rounded-xl aspect-square">
                        <img 
                          src={getGalleryImageUrl(img)} 
                          alt={`Gallery ${gi + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/gallery:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ))}
                    {hotel.gallery.length > 4 && (
                      <div className="relative rounded-xl bg-gray-900 flex items-center justify-center aspect-square">
                        <span className="text-white text-2xl font-bold">+{hotel.gallery.length - 4}</span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Rooms Section */}
          <div className="bg-gradient-to-br from-gray-50 to-white p-8 lg:p-10 border-t border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <div>
                <p className="text-xs font-semibold uppercase text-secondary tracking-wider mb-1">Stay Options</p>
                <h5 className="text-2xl font-serif font-bold text-primary">Available Rooms</h5>
              </div>
              {isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const newRooms = [...(hotel.rooms || []), { 
                      id: `room-${Date.now()}`,
                      name: '', 
                      description: '',
                      image: '', 
                      bedType: 'King Size', 
                      capacity: 2, 
                      pricePerNight: 0, 
                      availability: 5,
                      sqm: 30,
                      amenities: []
                    }];
                    handleArrayChange('hotels', idx, 'rooms', newRooms);
                  }}
                  className="rounded-full border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300"
                >
                  + Add Room
                </Button>
              )}
            </div>

            {hotel.rooms && hotel.rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotel.rooms.map((room: any, rIdx: number) => (
                  <div 
                    key={rIdx} 
                    className="group/room bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                  >
                    {/* Room Image & Badges */}
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={getImageUrl(room.image)} 
                        className="w-full h-full object-cover transform group-hover/room:scale-110 transition-transform duration-700" 
                        alt={room.name} 
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <Badge className={`px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md uppercase tracking-widest text-[10px] font-black ${
                          room.tier === 'vip' ? 'bg-amber-500/90 text-white' : 
                          room.tier === 'standard' ? 'bg-primary/90 text-white' : 
                          'bg-white/90 text-primary'
                        }`}>
                          {room.tier === 'vip' ? 'VIP Tier' : room.tier === 'standard' ? 'Standard Tier' : 'All Tiers'}
                        </Badge>
                      </div>
                      <div className="absolute top-4 right-4">
                        <div className={`px-4 py-2 rounded-2xl shadow-lg backdrop-blur-md flex flex-col items-center ${
                          (room.remaining ?? room.availability ?? 0) > 0 ? 'bg-white/90 text-emerald-600' : 'bg-red-500/90 text-white'
                        }`}>
                          <span className="text-lg font-black leading-none">{room.remaining ?? room.availability ?? 0}</span>
                          <span className="text-[8px] font-bold uppercase tracking-tighter">Remaining</span>
                        </div>
                      </div>
                    </div>

                    {/* Room Info */}
                    <div className="p-8 space-y-6">
                      <div className="space-y-1">
                        <h6 className="text-2xl font-serif font-bold text-primary leading-tight">{room.name}</h6>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-widest flex items-center gap-2">
                          <Hotel className="w-3 h-3" />
                          {room.bedType || 'King Size Bed'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 py-6 border-y border-gray-50">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Capacity</p>
                          <div className="flex items-center gap-2 text-primary">
                            <Users className="w-4 h-4" />
                            <span className="font-bold">{room.capacity} Persons</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            {room.tier === 'vip' ? 'Included in VIP' : 'Price / Night'}
                          </p>
                          {room.tier !== 'vip' ? (
                            <div className="flex items-center gap-1 text-secondary">
                              <span className="text-lg font-black">{currentData.pricing?.currency || '$'}</span>
                              <span className="text-2xl font-black">{room.pricePerNight?.toLocaleString() || '0'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-amber-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="font-bold text-sm">VIP Included</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Amenities</p>
                        <div className="flex flex-wrap gap-2">
                          {(room.amenities || []).slice(0, 4).map((a: string, ai: number) => (
                            <span key={ai} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-xl border border-gray-100 flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-emerald-500" />
                              {a}
                            </span>
                          ))}
                          {room.amenities?.length > 4 && (
                            <span className="px-3 py-1.5 bg-primary/5 text-primary text-[10px] font-bold rounded-xl">
                              +{room.amenities.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {room.description && (
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 italic">
                          "{room.description}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <Hotel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No rooms available for this hotel yet.</p>
                {isEditing && <p className="text-xs text-gray-400 mt-2">Click "Add Room" to start adding room types</p>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        {/* ==================== TRANSPORT TAB ==================== */}
        {/* ==================== TRANSPORT TAB ==================== */}
{activeTab === 'transport' && (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="flex justify-between items-center">
      <h3 className="text-2xl font-serif font-bold text-primary">Transportation & Transfers</h3>
      {isEditing && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleAddArrayItem('transportation', { 
            id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
            type: '', 
            price: 0, 
            description: '', 
            image: '', 
            availability: 5, 
            capacity: 4, 
            pickupLocations: '' 
          })}
        >
          + Add Transport
        </Button>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {(currentData.transportation || []).map((transport: any, idx: number) => (
        <div key={idx} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-all flex gap-8 relative">
          {isEditing && (
            <button
              onClick={() => handleRemoveArrayItem('transportation', idx)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-700 z-10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div className="w-32 h-32 rounded-3xl overflow-hidden flex-shrink-0 relative group">
            {isEditing ? (
              <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                {transport.image ? (
                  <img 
                    src={getImageUrl(transport.image)} 
                    className="w-full h-full object-cover" 
                    alt={transport.type} 
                  />
                ) : (
                  <Car className="w-8 h-8 text-gray-400" />
                )}
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="bg-white text-primary px-2 py-1 rounded-lg text-[10px] font-bold">
                    Change
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const formData = new FormData();
                        formData.append('file', e.target.files[0]);
                        try {
                          const res = await fetch('/api/upload', { method: 'POST', body: formData });
                          const data = await res.json();
                          if (data.success) {
                            const newTransport = [...editData.transportation];
                            newTransport[idx] = { ...newTransport[idx], image: data.url };
                            handleInputChange('transportation', newTransport);
                          }
                        } catch (err) {
                          console.error('Upload failed:', err);
                        }
                      }
                    }}
                  />
                </label>
              </div>
            ) : (
              <img 
                src={getImageUrl(transport.image)} 
                className="w-full h-full object-cover" 
                alt={transport.type} 
              />
            )}
          </div>
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={transport.type}
                    onChange={(e) => handleArrayChange('transportation', idx, 'type', e.target.value)}
                    className="text-xl font-serif font-bold text-primary bg-gray-50 border border-gray-200 rounded-lg p-2 w-full"
                    placeholder="Transport type"
                  />
                ) : (
                  <h4 className="text-xl font-serif font-bold text-primary">{transport.type}</h4>
                )}
                {transport.vipIncluded && (
                  <Badge className="mt-2 bg-amber-100 text-amber-700 border-amber-200">VIP Included</Badge>
                )}
              </div>
              <div className="text-right">
                {isEditing ? (
                  <input
                    type="number"
                    value={transport.availability}
                    onChange={(e) => handleArrayChange('transportation', idx, 'availability', parseNumberInput(e.target.value))}
                    className="w-20 p-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                ) : (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-100 bg-emerald-50">
                    {transport.remaining ?? transport.availability ?? 0} Units
                  </Badge>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <textarea
                value={transport.description || ''}
                onChange={(e) => handleArrayChange('transportation', idx, 'description', e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                rows={2}
                placeholder="Description"
              />
            ) : (
              <p className="text-sm text-gray-500">{transport.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-6 py-6 border-y border-gray-50">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Capacity</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={transport.capacity}
                    onChange={(e) => handleArrayChange('transportation', idx, 'capacity', parseNumberInput(e.target.value))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    disabled={transport.vipIncluded}
                  />
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold text-primary">{transport.capacity} Passengers</p>
                    <p className="text-[10px] text-gray-500">
                      {transport.initialAvailability ?? transport.availability ?? 0} total, {transport.bookedCount ?? 0} booked
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">
                  {transport.vipIncluded ? 'Included in VIP' : 'Price'}
                </p>
                {isEditing ? (
                  <input
                    type="number"
                    value={transport.price}
                    onChange={(e) => handleArrayChange('transportation', idx, 'price', parseNumberInput(e.target.value))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    disabled={transport.vipIncluded}
                  />
                ) : (
                  transport.vipIncluded ? (
                    <p className="font-bold text-amber-600 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> VIP Included
                    </p>
                  ) : (
                    <p className="font-bold text-secondary">{currentData.pricing?.currency || 'ETB'} {transport.price}/trip</p>
                  )
                )}
              </div>
            </div>
            
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Pickup Locations</p>
              {isEditing ? (
                <textarea
                  value={transport.pickupLocations || ''}
                  onChange={(e) => handleArrayChange('transportation', idx, 'pickupLocations', e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  rows={2}
                  placeholder="Pickup locations"
                />
              ) : (
                <p className="text-sm text-gray-500">{transport.pickupLocations}</p>
              )}
            </div>
            
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Features</p>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {['AC', 'WiFi', 'GPS', 'USB Charging', 'Leather Seats', 'Refreshments', 'Professional Driver', 'Luggage Space'].map((feature) => (
                    <label key={feature} className="flex items-center gap-1 text-[10px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(transport.features || []).includes(feature)}
                        onChange={(e) => {
                          const current = transport.features || [];
                          const next = e.target.checked 
                            ? [...current, feature] 
                            : current.filter((f: string) => f !== feature);
                          handleArrayChange('transportation', idx, 'features', next);
                        }}
                        className="w-3 h-3 text-primary rounded border-gray-300"
                      />
                      <span className="text-gray-600">{feature}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(transport.features || []).map((feature: string, fi: number) => (
                    <span key={fi} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{feature}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        {/* ==================== SERVICES TAB ==================== */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-500">
            <section className="bg-ethio-bg/30 p-10 rounded-[40px] space-y-6">
              <h3 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
                <Utensils className="w-5 h-5 text-secondary" /> Food & Cultural Packages
              </h3>
              <div className="space-y-4">
                {(currentData.services?.foodPackages || []).map((item: any, i: number) => {
                  const pkgName = typeof item === 'string' ? item : (item.name || item.description || 'Package');
                  const pkgId = typeof item === 'object' ? item.id : i;
                  return (
                  <div key={pkgId} className="bg-white p-4 rounded-2xl shadow-sm relative space-y-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {isEditing ? (
                        <select
                          value={typeof item === 'object' ? item.name : ''}
                          onChange={(e) => {
                            const newPackages = [...(currentData.services?.foodPackages || [])];
                            const name = e.target.value;
                            const presets: Record<string, {desc: string, items: string[], price: number}> = {
                              'Breakfast Only': { desc: 'Continental breakfast with coffee and tea', items: ['Breakfast', 'Coffee', 'Tea'], price: 20 },
                              'Half Board': { desc: 'Breakfast and dinner included', items: ['Breakfast', 'Dinner'], price: 40 },
                              'Full Board': { desc: 'All meals included - breakfast, lunch, and dinner', items: ['Breakfast', 'Lunch', 'Dinner'], price: 60 },
                              'All Inclusive': { desc: 'Unlimited meals, snacks, and drinks', items: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks'], price: 80 },
                              'Ethiopian Feast': { desc: 'Traditional Ethiopian cuisine experience', items: ['Injera', 'Wat', 'Bread', 'Coffee Ceremony'], price: 50 },
                            };
                            if (typeof newPackages[i] === 'object') {
                              newPackages[i] = { 
                                ...newPackages[i], 
                                name: name,
                                description: presets[name]?.desc || newPackages[i].description,
                                items: presets[name]?.items || newPackages[i].items,
                                pricePerPerson: presets[name]?.price || newPackages[i].pricePerPerson || 0
                              };
                            } else {
                              newPackages[i] = { id: Date.now(), name, description: presets[name]?.desc || '', items: presets[name]?.items || [], pricePerPerson: presets[name]?.price || 0 };
                            }
                            handleNestedChange('services', 'foodPackages', newPackages);
                          }}
                          className="flex-1 text-sm font-bold text-primary bg-transparent border-b border-gray-200 focus:outline-none"
                        >
                          <option value="">Select package...</option>
                          <option value="Breakfast Only">Breakfast Only</option>
                          <option value="Half Board">Half Board</option>
                          <option value="Full Board">Full Board</option>
                          <option value="All Inclusive">All Inclusive</option>
                          <option value="Ethiopian Feast">Ethiopian Feast</option>
                          <option value="Other">Other (Custom)</option>
                        </select>
                      ) : (
                        <span className="text-sm font-bold text-primary">{pkgName}</span>
                      )}
                      {isEditing && (
                        <button
                          onClick={() => {
                            const newPackages = (currentData.services?.foodPackages || []).filter((_: any, idx: number) => idx !== i);
                            handleNestedChange('services', 'foodPackages', newPackages);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {/* Show price when not editing */}
                    {(!isEditing) && (
                      <div className="flex items-center gap-2 ml-7">
                        {typeof item === 'object' && item.pricePerPerson > 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            ${item.pricePerPerson}/person
                          </span>
                        )}
                        {typeof item === 'object' && item.items?.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {item.items.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Show price input when editing */}
                    {isEditing && typeof item === 'object' && (
                      <div className="flex items-center gap-2 ml-7">
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.pricePerPerson || ''}
                          onChange={(e) => {
                            const newPackages = [...(currentData.services?.foodPackages || [])];
                            newPackages[i] = { ...newPackages[i], pricePerPerson: parseNumberInput(e.target.value) };
                            handleNestedChange('services', 'foodPackages', newPackages);
                          }}
                          className="text-xs bg-transparent border border-gray-200 rounded px-2 py-1 w-20"
                        />
                        <span className="text-xs text-gray-500">per person</span>
                      </div>
                    )}
                  </div>
                  );
                })}
                {isEditing && (
                  <button
                    onClick={() => {
                      const newPackages = [...(currentData.services?.foodPackages || []), { id: Date.now(), name: 'Breakfast Only', description: 'Continental breakfast with coffee and tea', pricePerPerson: 20, items: ['Breakfast', 'Coffee', 'Tea'] }];
                      handleNestedChange('services', 'foodPackages', newPackages);
                    }}
                    className="w-full py-3 border-2 border-dashed border-primary/30 rounded-xl text-sm text-primary font-bold hover:bg-primary/5 transition-colors"
                  >
                    + Add Food Package
                  </button>
                )}
              </div>
            </section>

            <section className="bg-ethio-bg/30 p-10 rounded-[40px] space-y-6">
              <h3 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
                <Heart className="w-5 h-5 text-secondary" /> Cultural Services
              </h3>
              <div className="space-y-4">
                 {(currentData.services?.culturalServices || []).map((item: string, i: number) => (
                   <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm relative">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newServices = [...(currentData.services?.culturalServices || [])];
                          newServices[i] = e.target.value;
                          handleNestedChange('services', 'culturalServices', newServices);
                        }}
                        className="flex-1 text-sm font-bold text-primary bg-transparent border-b border-gray-200 focus:outline-none"
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary">{item}</span>
                    )}
                    {isEditing && (
                      <button
                        onClick={() => {
                          const newServices = (currentData.services?.culturalServices || []).filter((_: string, idx: number) => idx !== i);
                          handleNestedChange('services', 'culturalServices', newServices);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={() => {
                      const newServices = [...(currentData.services?.culturalServices || []), ''];
                      handleNestedChange('services', 'culturalServices', newServices);
                    }}
                    className="text-sm text-primary font-bold mt-2"
                  >
                    + Add Cultural Service
                  </button>
                )}
              </div>
            </section>

            <section className="bg-ethio-bg/30 p-10 rounded-[40px] space-y-6">
              <h3 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary" /> Special Assistance
              </h3>
              <div className="space-y-4">
                {(currentData.services?.specialAssistance || []).map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm relative">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newAssistance = [...(currentData.services?.specialAssistance || [])];
                          newAssistance[i] = e.target.value;
                          handleNestedChange('services', 'specialAssistance', newAssistance);
                        }}
                        className="flex-1 text-sm font-bold text-primary bg-transparent border-b border-gray-200 focus:outline-none"
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary">{item}</span>
                    )}
                    {isEditing && (
                      <button
                        onClick={() => {
                          const newAssistance = (currentData.services?.specialAssistance || []).filter((_: string, idx: number) => idx !== i);
                          handleNestedChange('services', 'specialAssistance', newAssistance);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={() => {
                      const newAssistance = [...(currentData.services?.specialAssistance || []), ''];
                      handleNestedChange('services', 'specialAssistance', newAssistance);
                    }}
                    className="text-sm text-primary font-bold mt-2"
                  >
                    + Add Special Assistance
                  </button>
                )}
              </div>
            </section>

            <section className="bg-ethio-bg/30 p-10 rounded-[40px] space-y-6">
              <h3 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
                <Star className="w-5 h-5 text-secondary" /> Extra Services
              </h3>
              <div className="space-y-4">
                {(currentData.services?.extras || []).map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm relative">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newExtras = [...(currentData.services?.extras || [])];
                          newExtras[i] = e.target.value;
                          handleNestedChange('services', 'extras', newExtras);
                        }}
                        className="flex-1 text-sm font-bold text-primary bg-transparent border-b border-gray-200 focus:outline-none"
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary">{item}</span>
                    )}
                    {isEditing && (
                      <button
                        onClick={() => {
                          const newExtras = (currentData.services?.extras || []).filter((_: string, idx: number) => idx !== i);
                          handleNestedChange('services', 'extras', newExtras);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={() => {
                      const newExtras = [...(currentData.services?.extras || []), ''];
                      handleNestedChange('services', 'extras', newExtras);
                    }}
                    className="text-sm text-primary font-bold mt-2"
                  >
                    + Add Extra Service
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ==================== POLICIES TAB ==================== */}
        {activeTab === 'policies' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <h3 className="text-2xl font-serif font-bold text-primary">Policies & Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                <h4 className="font-bold text-primary flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-secondary" /> Cancellation Policy
                </h4>
                {isEditing ? (
                  <textarea
                    value={currentData.policies?.cancellation || ''}
                    onChange={(e) => handleNestedChange('policies', 'cancellation', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {currentData.policies?.cancellation || 'No cancellation policy specified.'}
                  </p>
                )}
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                <h4 className="font-bold text-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-secondary" /> Safety Rules
                </h4>
                {isEditing ? (
                  <textarea
                    value={currentData.policies?.safety || ''}
                    onChange={(e) => handleNestedChange('policies', 'safety', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {currentData.policies?.safety || 'No safety rules specified.'}
                  </p>
                )}
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                <h4 className="font-bold text-primary flex items-center gap-2">
                  <Users className="w-4 h-4 text-secondary" /> Age Restrictions
                </h4>
                {isEditing ? (
                  <textarea
                    value={currentData.policies?.ageRestriction || ''}
                    onChange={(e) => handleNestedChange('policies', 'ageRestriction', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {currentData.policies?.ageRestriction || 'No age restrictions specified.'}
                  </p>
                )}
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                <h4 className="font-bold text-primary flex items-center gap-2">
                  <Info className="w-4 h-4 text-secondary" /> Terms & Conditions
                </h4>
                {isEditing ? (
                  <textarea
                    value={currentData.policies?.terms || ''}
                    onChange={(e) => handleNestedChange('policies', 'terms', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {currentData.policies?.terms || 'No terms and conditions specified.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== PRICING TAB ==================== */}
{activeTab === 'pricing' && (
  <div className="space-y-10 animate-in fade-in duration-500">
    <h3 className="text-2xl font-serif font-bold text-primary">Pricing & Ticket Tiers</h3>
    
    {/* Currency & Global Settings */}
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Currency</p>
          {isEditing ? (
            <select
              value={currentData.pricing?.currency || 'ETB'}
              onChange={(e) => handleNestedChange('pricing', 'currency', e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            >
              <option>ETB - Ethiopian Birr</option>
              <option>USD - US Dollar</option>
              <option>EUR - Euro</option>
            </select>
          ) : (
            <p className="text-sm font-bold text-primary">{currentData.pricing?.currency || 'ETB'}</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Total Capacity</p>
          {isEditing ? (
            <input
              type="number"
              value={currentData.capacity || 1000}
              onChange={(e) => handleInputChange('capacity', parseNumberInput(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          ) : (
            <p className="text-sm font-bold text-primary">{currentData.capacity?.toLocaleString()} people</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Early Bird Deadline</p>
          {isEditing ? (
            <input
              type="date"
              value={currentData.pricing?.earlyBirdDeadline?.split('T')[0] || ''}
              onChange={(e) => handleNestedChange('pricing', 'earlyBirdDeadline', e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          ) : (
            <p className="text-sm font-bold text-primary">
              {currentData.pricing?.earlyBirdDeadline ? new Date(currentData.pricing.earlyBirdDeadline).toDateString() : 'No early bird'}
            </p>
          )}
        </div>
      </div>
    </div>

    {/* STANDARD TICKET CARD */}
    <div className="bg-white p-8 rounded-[40px] border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-1.5 rounded-full mb-4">
            <Ticket className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] font-black uppercase text-gray-600 tracking-wider">TIER 1 • STANDARD</span>
          </div>
          <h4 className="text-2xl font-serif font-bold text-primary mb-2">Standard Ticket</h4>
          <p className="text-sm text-gray-500">Pay as you go - rooms & transport sold separately</p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Price Per Ticket</p>
          {isEditing ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-48 md:w-auto">
              <span className="text-xl font-bold text-primary">{currentData.pricing?.currency || 'ETB'}</span>
              <input
                type="number"
                value={currentData.pricing?.standardPrice || 0}
                onChange={(e) => handleNestedChange('pricing', 'standardPrice', parseNumberInput(e.target.value))}
                className="flex-1 text-2xl font-bold text-primary bg-transparent border-0 outline-none min-w-0"
              />
            </div>
          ) : (
            <p className="text-3xl font-bold text-primary">
              {currentData.pricing?.currency || 'ETB'} {currentData.pricing?.standardPrice?.toLocaleString() || '0'}
            </p>
          )}
        </div>
      </div>
      
      {/* Standard Ticket Benefits */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 bg-gray-50 rounded-2xl">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> General Admission
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Standard Seating
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Access to All Days
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Clock className="w-4 h-4 text-amber-500" /> Early Bird Available
        </div>
      </div>
      
      {/* Standard: Hotel & Transport are OPTIONAL (extra fee) */}
      <div className="border-t border-gray-100 pt-6">
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-400" />
          Standard ticket holders pay separately for hotels & transport based on availability
        </p>
      </div>
    </div>

    {/* VIP TICKET CARD */}
    <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 p-8 rounded-[40px] border-2 border-secondary/30 shadow-lg hover:shadow-xl transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-secondary/20 px-4 py-1.5 rounded-full mb-4">
            <Star className="w-4 h-4 text-secondary fill-current" />
            <span className="text-[10px] font-black uppercase text-secondary tracking-wider">TIER 2 • PREMIUM</span>
          </div>
          <h4 className="text-2xl font-serif font-bold text-primary mb-2">VIP Ticket</h4>
          <p className="text-sm text-gray-600">All-inclusive premium experience</p>
        </div>
        <div className="text-left md:text-right">
          {isEditing ? (
            <>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Price (All Inclusive)</p>
              <div className="flex items-center gap-2 bg-white border border-secondary/30 rounded-xl px-4 py-3 w-48 md:w-auto">
                <span className="text-xl font-bold text-secondary">{currentData.pricing?.currency || 'ETB'}</span>
                <input
                  type="number"
                  value={currentData.pricing?.vipPrice || 0}
                  onChange={(e) => handleNestedChange('pricing', 'vipPrice', parseNumberInput(e.target.value))}
                  className="flex-1 text-2xl font-bold text-secondary bg-transparent border-0 outline-none min-w-0"
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Package Type</p>
              <p className="text-xl font-bold text-secondary">All Inclusive</p>
              <p className="text-xs text-gray-400 mt-1">Hotel + Transport included</p>
            </>
          )}
        </div>
      </div>
      
      {/* VIP Ticket Count & Remaining */}
      {!isEditing && (() => {
        const vipTicket = currentData.ticketTypes?.find((t) => t.name_en === 'VIP' || t.name === 'VIP');
        const total = vipTicket?.quantity || 0;
        const remaining = vipTicket?.available || total;
        return (
          <div className="mb-6 p-4 bg-white/60 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-primary">VIP Tickets</p>
                <p className="text-xs text-gray-500">1 ticket = 1 room + transport</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-secondary">{remaining}<span className="text-sm font-normal text-gray-400"> / {total}</span></p>
                <p className="text-[10px] text-gray-400">Remaining</p>
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* VIP Benefits */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 p-6 bg-white/60 rounded-2xl">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CheckCircle2 className="w-4 h-4 text-secondary" /> Priority Entry
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CheckCircle2 className="w-4 h-4 text-secondary" /> VIP Lounge
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CheckCircle2 className="w-4 h-4 text-secondary" /> Meet & Greet
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CheckCircle2 className="w-4 h-4 text-secondary" /> Drinks Included
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Hotel className="w-4 h-4 text-secondary" /> Hotel (1 night)
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Car className="w-4 h-4 text-secondary" /> Transport
        </div>
      </div>

      {/* VIP Settings - Which hotels/transport are available for VIP choice */}
      {isEditing && (
        <div className="border-t border-secondary/20 pt-6 mt-4">
          <p className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-secondary" />
            VIP Package Configuration
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* VIP Hotel Selection */}
            <div className="bg-white p-5 rounded-2xl">
              <p className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">
                VIP Included Hotels (user chooses 1)
              </p>
              <div className="space-y-2">
                {(currentData.pricing?.vipIncludedHotels || []).map((hotelId: string, idx: number) => {
                  const hotel = currentData.hotels?.find((h: any) => h.id === hotelId);
                  return (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                      <span className="text-sm font-medium text-primary">{hotel?.name || hotelId}</span>
                      <button
                        onClick={() => {
                          const newList = (currentData.pricing?.vipIncludedHotels || []).filter((_: string, i: number) => i !== idx);
                          handleNestedChange('pricing', 'vipIncludedHotels', newList);
                        }}
                        className="text-red-500 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const currentList = currentData.pricing?.vipIncludedHotels || [];
                      handleNestedChange('pricing', 'vipIncludedHotels', [...currentList, e.target.value]);
                    }
                  }}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  defaultValue=""
                >
                  <option value="">-- Add hotel to VIP package --</option>
                  {(currentData.hotels || []).map((hotel: any) => (
                    <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* VIP Transport Selection */}
            <div className="bg-white p-5 rounded-2xl">
              <p className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">
                VIP Included Transport (user chooses 1)
              </p>
              <div className="space-y-2">
                {(currentData.pricing?.vipIncludedTransport || []).map((transportId: string, idx: number) => {
                  const transport = currentData.transportation?.find((t: any) => t.id === transportId);
                  return (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                      <span className="text-sm font-medium text-primary">{transport?.type || transportId}</span>
                      <button
                        onClick={() => {
                          const newList = (currentData.pricing?.vipIncludedTransport || []).filter((_: string, i: number) => i !== idx);
                          handleNestedChange('pricing', 'vipIncludedTransport', newList);
                        }}
                        className="text-red-500 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const currentList = currentData.pricing?.vipIncludedTransport || [];
                      handleNestedChange('pricing', 'vipIncludedTransport', [...currentList, e.target.value]);
                    }
                  }}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  defaultValue=""
                >
                  <option value="">-- Add transport to VIP package --</option>
                  {(currentData.transportation || []).map((transport: any) => (
                    <option key={transport.id} value={transport.id}>{transport.type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Non-editing mode: Show what's included */}
      {!isEditing && currentData.pricing?.vipIncludedHotels?.length > 0 && (
        <div className="border-t border-secondary/20 pt-6 mt-4">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Hotel className="w-3 h-3" />
            VIP includes choice of: {(currentData.pricing?.vipIncludedHotels || []).map((id: string) => {
              const hotel = currentData.hotels?.find((h: any) => h.id === id);
              return hotel?.name;
            }).filter(Boolean).join(', ')}
          </p>
        </div>
      )}
    </div>

    {/* Early Bird Settings */}
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
      <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-secondary" />
        Early Bird Discount
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Standard Early Bird (%)</p>
          {isEditing ? (
            <input
              type="number"
              value={currentData.pricing?.standardEarlyBird || 0}
              onChange={(e) => handleNestedChange('pricing', 'standardEarlyBird', parseNumberInput(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          ) : (
            <p className="text-sm font-bold text-primary">{currentData.pricing?.standardEarlyBird || 0}% off</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">VIP Early Bird (%)</p>
          {isEditing ? (
            <input
              type="number"
              value={currentData.pricing?.vipEarlyBird || 0}
              onChange={(e) => handleNestedChange('pricing', 'vipEarlyBird', parseNumberInput(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          ) : (
            <p className="text-sm font-bold text-primary">{currentData.pricing?.vipEarlyBird || 0}% off</p>
          )}
        </div>
      </div>
    </div>

    {/* Group Discount */}
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
      <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-secondary" />
        Group Discount
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Minimum Group Size</p>
          {isEditing ? (
            <input
              type="number"
              value={currentData.pricing?.groupMinSize || 10}
              onChange={(e) => handleNestedChange('pricing', 'groupMinSize', parseNumberInput(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          ) : (
            <p className="text-sm font-bold text-primary">{currentData.pricing?.groupMinSize || 10}+ people</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Group Discount (%)</p>
          {isEditing ? (
            <input
              type="number"
              value={currentData.pricing?.groupDiscount || 0}
              onChange={(e) => handleNestedChange('pricing', 'groupDiscount', parseNumberInput(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          ) : (
            <p className="text-sm font-bold text-primary">{currentData.pricing?.groupDiscount || 0}% off</p>
          )}
        </div>
      </div>
    </div>
  </div>
)}
        {/* ==================== REVIEWS TAB ==================== */}
        {activeTab === 'reviews' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold text-primary">Customer Feedback</h3>
              <div className="flex items-center gap-4">
                <div className="flex text-secondary">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                </div>
                <span className="text-xl font-bold text-primary">4.9 / 5.0</span>
              </div>
            </div>
            <div className="space-y-6">
              {/* Reviews come from your API - this is display only */}
              <div className="text-center py-20 bg-ethio-bg/30 rounded-[40px]">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Reviews will appear here from attendees.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export const OrganizerOverview: React.FC<{ onManageEvent?: (id: string) => void; onCreate?: () => void }> = ({ onManageEvent: propOnManageEvent, onCreate: propOnCreate }) => {
  const [view, setView] = useState('overview'); // 'overview', 'eventDetail', 'createEvent'
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const router = useRouter();

  const handleManageEvent = (id: string) => {
    if (propOnManageEvent) {
      propOnManageEvent(id);
    } else {
      setSelectedEventId(id);
      setView('eventDetail');
    }
  };

  const handleCreate = () => {
    if (propOnCreate) {
      propOnCreate();
    } else {
      router.push('/dashboard/organizer/festivals/create');
    }
  };

  const handleBack = () => {
    setSelectedEventId(null);
    setView('overview');
  };

  if (view === 'eventDetail' && selectedEventId) {
    return <EventDetailPanel eventId={selectedEventId} onBack={handleBack} />;
  }

// The rest of the component is the overview itself
  const onManageEvent = handleManageEvent;
  const onCreate = propOnCreate || handleCreate;
  const { user } = useAuth();
  const navigate = (to: string) => router.push(to);
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, festivalsRes] = await Promise.all([
          fetch('/api/organizer/analytics'),
          fetch('/api/organizer/festivals')
        ]);
        
        const analyticsData = await analyticsRes.json();
        const festivalsData = await festivalsRes.json();
        
        console.log('Analytics response:', analyticsData);
        
        if (analyticsData.success) {
          setAnalytics(analyticsData.analytics);
          console.log('Revenue from API:', analyticsData.analytics?.revenue?.total);
        }
        if (festivalsData.success) {
          setFestivals(festivalsData.festivals || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const publishedFestivals = useMemo(() => {
    return (festivals || [])
      .filter(f => f.verificationStatus === 'Approved')
      .sort((a, b) => new Date(b.submittedAt || b.createdAt || 0).getTime() - new Date(a.submittedAt || a.createdAt || 0).getTime());
  }, [festivals]);

  const recentPublishedEvent = publishedFestivals[0] || null;

  const activeListings = publishedFestivals.length;
  const totalCapacity = publishedFestivals.reduce((acc, f) => acc + (Number(f.totalCapacity) || 0), 0);
  const recentEventBookings = recentPublishedEvent ? (recentPublishedEvent.ticketsSold || 0) : 0;

  // Process Booking Trend Data - Filter for recent event if possible, otherwise use global but label it
  const bookingTrendData = useMemo(() => {
    // If the API provided specific chart data for the recent event, we'd use it here.
    // For now, we use the trend data and ensure it's presented as the recent event's trend.
    if (!analytics?.charts?.bookingsByDay) return [];
    
    return Object.entries(analytics.charts.bookingsByDay).map(([date, count]) => {
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      return { day: dayName, bookings: count };
    });
  }, [analytics?.charts?.bookingsByDay]);

  // Process Visitor Locations
  const visitorLocations = useMemo(() => {
    if (!analytics?.visitorLocations || analytics.visitorLocations.length === 0) return [];
    
    return analytics.visitorLocations.map((loc: any) => ({
      city: loc.country,
      visitors: `${loc.percentage}%`
    }));
  }, [analytics?.visitorLocations]);

  // Process Latest Alerts
  const latestAlerts = useMemo(() => {
    if (!analytics?.latestAlerts || analytics.latestAlerts.length === 0) return [];
    
    return analytics.latestAlerts.map((alert: any) => {
      const date = new Date(alert.time);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.round(diffMs / 60000);
      const diffHr = Math.round(diffMs / 3600000);
      const diffDay = Math.round(diffMs / 86400000);
      
      let timeStr = 'Just now';
      if (diffDay > 0) timeStr = `${diffDay}d ago`;
      else if (diffHr > 0) timeStr = `${diffHr}h ago`;
      else if (diffMin > 0) timeStr = `${diffMin}m ago`;
      
      return {
        id: alert.id,
        type: alert.type,
        message: alert.message,
        time: timeStr
      };
    });
  }, [analytics?.latestAlerts]);
  
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `ETB ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `ETB ${(amount / 1000).toFixed(1)}K`;
    return `ETB ${amount}`;
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000) return num.toLocaleString();
    return num.toString();
  };
  
  const myEvents = festivals;
  const activePublishedEvents = publishedFestivals.slice(0, 3);
  const hasEvents = myEvents.length > 0;
  const [showSupport, setShowSupport] = useState(false);
  const [showTips, setShowTips] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
       {/* Header with Notifications */}
       <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
           <h1 className="text-4xl font-serif font-bold text-primary">Welcome, <span className="text-secondary italic">{user?.name}</span></h1>
           <p className="text-gray-500 text-sm">Manage your cultural celebrations.</p>
         </div>
         <div className="flex items-center gap-4">
            <Button onClick={onCreate} leftIcon={Plus}>Create Festival</Button>
         </div>
       </header>

       {/* Quick Action Shortcuts */}
       <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          <button onClick={() => navigate('/dashboard/organizer/bookings')} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all whitespace-nowrap group">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><FileText className="w-4 h-4" /></div>
            <span className="text-sm font-bold text-primary">View Bookings</span>
          </button>
          <button onClick={() => navigate('/dashboard/organizer/reviews')} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all whitespace-nowrap group">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><Star className="w-4 h-4" /></div>
            <span className="text-sm font-bold text-primary">Check Reviews</span>
          </button>
          <button onClick={() => navigate('/dashboard/organizer/analytics')} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all whitespace-nowrap group">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><BarChart className="w-4 h-4" /></div>
            <span className="text-sm font-bold text-primary">Analytics Snapshot</span>
          </button>
       </div>

{/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
          { label: 'Active Listings', val: activeListings.toString(), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Capacity', val: formatNumber(totalCapacity), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Recent Event Bookings', val: formatNumber(recentEventBookings), icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat: any, i) => (
          <div key={`stat-${i}`} className="bg-white p-8 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm relative group">
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p><p className="text-2xl font-bold text-primary">{stat.val}</p></div>
            <div className={`p-4 ${stat.bg} rounded-[20px]`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
          </div>
        ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
             {/* Upcoming Events Timeline */}
             <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h3 className="text-lg font-serif font-bold text-primary mb-6 flex items-center gap-2"><CalendarClock className="w-5 h-5 text-secondary" /> Upcoming Timeline</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                   {myEvents.slice(0, 5).map((ev: any, i: number) => (
                      <div key={ev._id || i} className="min-w-[200px] p-4 bg-ethio-bg/30 rounded-2xl border border-gray-50 flex gap-4 items-center cursor-pointer hover:bg-ethio-bg/50 transition-colors" onClick={() => onManageEvent(ev._id || ev.id)}>
                         <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm text-primary font-bold leading-tight">
                            <span className="text-[10px] uppercase text-gray-400">{ev.startDate ? new Date(ev.startDate).toLocaleString('en-US', { month: 'short' }) : 'TBD'}</span>
                            <span className="text-lg">{ev.startDate ? new Date(ev.startDate).getDate() : '--'}</span>
                         </div>
                         <div>
                            <p className="text-sm font-bold text-primary line-clamp-1">{ev.name}</p>
                            <p className="text-[10px] text-gray-500">{ev.location?.name || ev.locationName || 'No location'}</p>
                         </div>
                      </div>
                   ))}
                   {myEvents.length === 0 && <p className="text-sm text-gray-400 italic">No upcoming events. Create your first festival!</p>}
                </div>
             </section>

             {/* Quick Analytics Snapshot */}
             <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-blue-600" /> 
                     {recentPublishedEvent ? `7-Day Booking Trend: ${recentPublishedEvent.name}` : '7-Day Booking Trend'}
                   </h3>
                   {bookingTrendData.length > 0 && (
                     <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100">
                       Real-time Data
                     </Badge>
                   )}
                </div>
                <div className="h-48 w-full">
                  {bookingTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={bookingTrendData}>
                        <defs>
                          <linearGradient id="colorSnapshot" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                        <Area type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSnapshot)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-sm text-gray-400">No booking data yet</p>
                    </div>
                  )}
                </div>
             </section>

             {/* Engagement Metrics */}
             <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                   <h4 className="font-bold text-primary mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-600" /> Top Visitor Locations</h4>
                   <div className="space-y-3">
                      {visitorLocations.length > 0 ? (
                        visitorLocations.map((loc, i) => (
                           <div key={loc.city || i} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{loc.city}</span>
                              <div className="flex items-center gap-2 w-1/2">
                                 <div className="h-1.5 bg-gray-100 rounded-full flex-1 overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{width: loc.visitors}}></div>
                                 </div>
                                 <span className="text-xs font-bold text-primary w-8 text-right">{loc.visitors}</span>
                              </div>
                           </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic py-4">No location data available yet.</p>
                      )}
                   </div>
                </div>
                <div 
                  className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all group"
                  onClick={() => analytics?.mostBookedEvent && onManageEvent(analytics.mostBookedEvent.id)}
                >
                   <h4 className="font-bold text-primary mb-4 flex items-center gap-2"><Ticket className="w-4 h-4 text-purple-600" /> Most Booked Event</h4>
                   {analytics?.mostBookedEvent ? (
                     <div className="space-y-4">
                        <div className="h-32 rounded-2xl overflow-hidden relative">
                           <img src={analytics.mostBookedEvent.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                           <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg">{analytics.mostBookedEvent.bookings} Bookings</div>
                        </div>
                        <div>
                           <p className="font-bold text-primary group-hover:text-secondary transition-colors">{analytics.mostBookedEvent.name}</p>
                           <p className="text-xs text-gray-500 mt-1">{analytics.mostBookedEvent.bookings} tourists booked this event</p>
                        </div>
                     </div>
                   ) : <p className="text-sm text-gray-400 italic py-4">No booking data yet.</p>}
                </div>
             </section>

             {/* Existing My Events List */}
             {!hasEvents || activePublishedEvents.length === 0 ? (
                <section className="bg-white p-12 rounded-[48px] border border-gray-100 text-center space-y-8"><div className="w-24 h-24 bg-ethio-bg rounded-[32px] flex items-center justify-center mx-auto"><Briefcase className="w-10 h-10 text-gray-300" /></div><h3 className="text-3xl font-serif font-bold text-primary">Ready to showcase your heritage?</h3><Button size="lg" onClick={onCreate}>List Your First Festival</Button></section>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-xl font-serif font-bold text-primary">Your Active Events</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myEvents.slice(0, 4).map((fest, index) => (
                       <div key={fest.id || `fest-${index}`} onClick={() => onManageEvent(fest.id)} className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm cursor-pointer group hover:shadow-md transition-all">
                         <div className="h-44 overflow-hidden">
                           {fest.coverImage ? (
                             <img src={fest.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                           ) : (
                             <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                               <Calendar className="w-12 h-12 text-gray-400" />
                             </div>
                           )}
                         </div>
                         <div className="p-6"><h4 className="text-xl font-serif font-bold text-primary group-hover:text-secondary transition-colors">{fest.name}</h4><p className="text-[10px] text-gray-400 uppercase font-bold">{fest.locationName}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Right Column (Sidebar) */}
          <aside className="space-y-8">
             {/* Notifications Panel */}
             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-serif font-bold text-primary">Latest Alerts</h3>
                   <button onClick={() => navigate('/dashboard/organizer/bookings')} className="text-xs font-bold text-secondary hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                   {latestAlerts.length > 0 ? (
                     latestAlerts.map(notif => (
                        <div key={notif.id} className="flex gap-3 items-start p-3 bg-gray-50 rounded-2xl border border-gray-100">
                           <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${notif.type === 'booking' ? 'bg-blue-500' : notif.type === 'review' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                           <div>
                              <p className="text-sm font-bold text-primary leading-tight">{notif.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                           </div>
                        </div>
                     ))
                   ) : (
                     <p className="text-sm text-gray-400 italic py-4">No recent alerts.</p>
                   )}
                </div>
             </div>

             {/* Existing Mission Control */}
             <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8"><h3 className="text-xl font-serif font-bold text-primary">Mission Control</h3><div className="space-y-3">{[{ id: 'create', label: 'Launch New Listing', icon: Plus, action: onCreate }].map(action => (<button key={action.id} onClick={action.action} className="w-full flex items-center justify-between p-4 bg-ethio-bg rounded-2xl transition-all group"><div className="flex items-center gap-4"><div className="p-2 bg-white rounded-xl group-hover:bg-primary group-hover:text-white"><action.icon className="w-4 h-4" /></div><span className="text-[11px] font-bold text-primary uppercase">{action.label}</span></div><ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-primary" /></button>))}</div></div>

             {/* Community / Support */}
             <div className="bg-gradient-to-br from-primary to-ethio-black p-8 rounded-[40px] text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                   <h3 className="text-xl font-serif font-bold">Need Help?</h3>
                   <p className="text-sm text-white/80">Check our organizer guide for tips on maximizing your event success.</p>
                   <div className="space-y-3">
                      <button 
                        onClick={() => setShowSupport(true)}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors backdrop-blur-sm"
                      >
                         <HelpCircle className="w-4 h-4" /> Contact Support
                      </button>
                      <button 
                        onClick={() => setShowTips(true)}
                        className="w-full py-3 bg-white text-primary rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                      >
                         <Lightbulb className="w-4 h-4" /> Organizer Tips
                      </button>
                   </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl"></div>
             </div>
          </aside>
       </div>

       {/* Support Modal */}
       {showSupport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSupport(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8 space-y-6 animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold text-primary">Contact Support</h3>
              <button onClick={() => setShowSupport(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Subject</label>
                <Input placeholder="How can we help?" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Message</label>
                <textarea className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary h-32 text-sm" placeholder="Describe your issue..."></textarea>
              </div>
              <Button className="w-full">Send Message</Button>
            </div>
          </div>
        </div>
       )}

       {/* Tips Modal */}
       {showTips && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTips(false)}>
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 space-y-6 animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold text-primary">Organizer Tips</h3>
              <button onClick={() => setShowTips(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {[
                { title: 'High Quality Photos', desc: 'Events with 5+ high-res photos get 40% more bookings.' },
                { title: 'Detailed Descriptions', desc: 'Include cultural significance and what to expect.' },
                { title: 'Early Bird Pricing', desc: 'Offer discounts for bookings made 30 days in advance.' },
                { title: 'Engage with Reviews', desc: 'Responding to reviews builds trust with potential attendees.' }
              ].map((tip, i) => (
                <div key={i} className="flex gap-4 p-4 bg-ethio-bg/50 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-secondary font-bold text-lg">{i+1}</div>
                  <div>
                    <h4 className="font-bold text-primary">{tip.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={() => setShowTips(false)}>Got it, thanks!</Button>
          </div>
        </div>
       )}
    </div>
  );
};

const MOCK_BOOKINGS = [
  {
    id: 'BK-8821',
    guest: {
      name: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      phone: '+251 911 223 344',
      specialRequests: 'Late check-in requested. Vegetarian meals preferred.'
    },
    event: {
      name: 'Timket 2025 (Epiphany)',
      dates: 'Jan 19 - Jan 21, 2025',
      ticketType: 'VIP Experience',
      quantity: 2,
      pricePerTicket: 750,
      subtotal: 1500
    },
    accommodation: {
      hotelName: 'Haile Resort Gondar',
      roomCategory: 'Executive Suite',
      area: 45,
      beds: '1 King Size',
      checkIn: 'Jan 18, 2025',
      checkOut: 'Jan 22, 2025',
      pricePerNight: 2200,
      nights: 4,
      subtotal: 8800
    },
    transport: {
      vehicleType: 'Luxury SUV',
      capacity: 4,
      pickupDate: 'Jan 18, 2025',
      pricePerDay: 1200,
      units: 1,
      subtotal: 4800
    },
    payment: {
      ticketTotal: 1500,
      hotelTotal: 8800,
      transportTotal: 4800,
      discount: 500,
      grandTotal: 14600,
      method: 'Visa Ending in 4242',
      transactionId: 'TXN-9928331',
      date: 'Dec 15, 2024',
      status: 'Paid'
    },
    status: 'Confirmed',
    checkedIn: false,
    attended: false
  },
  {
    id: 'BK-8822',
    guest: {
      name: 'Michael Chen',
      email: 'm.chen@tech.com',
      phone: '+1 415 555 0123',
      specialRequests: 'None'
    },
    event: {
      name: 'Meskel Festival',
      dates: 'Sep 27 - Sep 28, 2025',
      ticketType: 'General Admission',
      quantity: 1,
      pricePerTicket: 250,
      subtotal: 250
    },
    accommodation: null,
    transport: null,
    payment: {
      ticketTotal: 250,
      hotelTotal: 0,
      transportTotal: 0,
      discount: 0,
      grandTotal: 250,
      method: 'Mastercard Ending in 8812',
      transactionId: 'TXN-9928335',
      date: 'Jan 10, 2025',
      status: 'Paid'
    },
    status: 'Pending',
    checkedIn: false,
    attended: false
  }
];

export const BookingDetailView: React.FC<{ booking: any; onBack: () => void }> = ({ booking, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to ${newStatus} this booking?`)) return;
    setUpdating(true);
    try {
      const response = await apiClient.put('/api/organizer/bookings', {
        bookingId: booking._id,
        status: newStatus
      });
      if (response.success) {
        booking.status = newStatus;
        alert(`Booking ${newStatus} successfully`);
      } else {
        alert(response.message || 'Failed to update booking');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating booking');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white border border-gray-100 rounded-xl text-primary hover:bg-primary hover:text-white transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-serif font-bold text-primary">Booking #{booking._id?.slice(-8).toUpperCase()}</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Manage guest details and fulfillment</p>
          </div>
        </div>
        <div className="flex gap-3">
          {/* Unnecessary buttons removed */}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs */}
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: Info },
              { id: 'payment', label: 'Payment Details', icon: CreditCard },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-primary'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Guest Info */}
              <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                  <Users className="w-5 h-5 text-secondary" /> Guest Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Full Name</p>
                    <p className="text-sm font-bold text-primary">{booking.contactInfo?.fullName || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Email Address</p>
                    <p className="text-sm font-bold text-primary flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-300" /> {booking.contactInfo?.email || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Phone Number</p>
                    <p className="text-sm font-bold text-primary flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-300" /> {booking.contactInfo?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Booking Date & Time</p>
                    <p className="text-sm font-bold text-primary">
                      {new Date(booking.createdAt).toLocaleDateString()} at {new Date(booking.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  {booking.specialRequests && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Special Requests</p>
                      <p className="text-sm text-gray-600 italic">"{booking.specialRequests}"</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Event Ticket & Detailed Booking Information */}
              <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-secondary" /> Detailed Booking Information
                </h3>
                
                {/* Main Event Ticket */}
                <div className="bg-ethio-bg/30 p-6 rounded-3xl border border-gray-50 flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-serif font-bold text-primary">{booking.festival?.name || 'Festival'}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Event Date: {booking.festival?.startDate ? new Date(booking.festival.startDate).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-primary text-white border-none capitalize">{booking.ticketType} x{booking.quantity}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-8 text-right">
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Quantity</p>
                      <p className="text-lg font-bold text-primary">x{booking.quantity}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Price</p>
                      <p className="text-lg font-bold text-secondary">
                        ETB {(booking.organizerAmount || (booking.totalPrice ? booking.totalPrice * 0.9 : 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Accommodation Details */}
                {booking.bookingDetails?.room && (
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                        <Hotel className="w-5 h-5" />
                      </div>
                      <h4 className="text-lg font-bold text-primary">Accommodation Booking</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hotel Name</p>
                          <p className="text-lg font-bold text-primary">{booking.bookingDetails.room.hotelName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Room Type & Services</p>
                          <p className="text-sm font-bold text-secondary">{booking.bookingDetails.room.roomName}</p>
                          <p className="text-xs text-gray-500 mt-1">Includes all standard amenities and breakfast.</p>
                        </div>
                      </div>
                      <div className="text-right space-y-4">
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Price Per Night</p>
                          <p className="text-xl font-bold text-primary">ETB {booking.bookingDetails.room.roomPrice?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transport Details */}
                {booking.bookingDetails?.transport && (
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        <Car className="w-5 h-5" />
                      </div>
                      <h4 className="text-lg font-bold text-primary">Transportation Details</h4>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8">
                      {booking.bookingDetails.transport.image && (
                        <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden border border-gray-100">
                          <img 
                            src={booking.bookingDetails.transport.image} 
                            alt={booking.bookingDetails.transport.type}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Vehicle Type</p>
                          <h4 className="text-xl font-bold text-primary">{booking.bookingDetails.transport.type}</h4>
                          <p className="text-sm text-gray-500 mt-1">Private Transfer - Selected Option</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Fixed Rate</p>
                          <p className="text-xl font-bold text-primary">ETB {booking.bookingDetails.transport.price?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'payment' && (
            <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-500">
              <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-secondary" /> Payment Details
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Payment Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold capitalize ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {booking.paymentStatus || 'pending'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Amount</p>
                  <p className="text-lg font-bold text-primary">
                    {booking.currency} {(booking.organizerAmount || (booking.totalPrice ? booking.totalPrice * 0.9 : 0)).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Booked On</p>
                  <p className="text-sm font-bold text-primary">{new Date(booking.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'history' && (
            <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-500">
              <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                <History className="w-5 h-5 text-secondary" /> Activity Log
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-gray-50">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">Booking Created</p>
                    <p className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {booking.status === 'confirmed' && (
                  <div className="flex items-start gap-4 pb-4 border-b border-gray-50">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">Booking Confirmed</p>
                      <p className="text-xs text-gray-400">Payment completed</p>
                    </div>
                  </div>
                )}
                {booking.status === 'cancelled' && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <X className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">Booking Cancelled</p>
                      <p className="text-xs text-gray-400">Booking was cancelled</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-primary mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Tickets</span>
                <span className="font-bold text-primary">{booking.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Total Price</span>
                <span className="font-bold text-secondary">
                  ETB {(booking.organizerAmount || (booking.totalPrice ? booking.totalPrice * 0.9 : 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Guest</span>
                <span className="font-bold text-primary">{booking.contactInfo?.fullName || 'Guest'}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export const OrganizerBookingsView: React.FC<{ onViewBooking: (id: string) => void }> = ({ onViewBooking }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('All Events');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ticketTypeFilter, setTicketTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [bookings, setBookings] = useState<any[]>([]);
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, festivalsRes] = await Promise.all([
          apiClient.get('/api/organizer/bookings'),
          apiClient.get('/api/organizer/festivals')
        ]);

        if (bookingsRes.success) {
          setBookings(bookingsRes.bookings);
        }
        if (festivalsRes.success) {
          setFestivals(festivalsRes.festivals);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportCSV = () => {
    const headers = ['Booking ID', 'Date', 'Guest Name', 'Email', 'Event', 'Ticket Type', 'Quantity', 'Total', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredBookings.map(b => [
        b._id,
        new Date(b.createdAt).toLocaleDateString(),
        b.contactInfo?.fullName || 'N/A',
        b.contactInfo?.email || 'N/A',
        b.festival?.name || 'N/A',
        b.ticketType,
        b.quantity,
        b.totalPrice,
        b.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredBookings = bookings.filter(b => {
    const guestName = (b.contactInfo?.fullName || '').toLowerCase();
    const guestEmail = (b.contactInfo?.email || '').toLowerCase();
    const eventName = (b.festival?.name || '').toLowerCase();
    const bookingId = (b._id || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    // Search filter: ID, Name, Email, or Event Name
    const matchesSearch = !searchQuery || 
      bookingId.includes(query) || 
      guestName.includes(query) || 
      guestEmail.includes(query) || 
      eventName.includes(query);

    if (!matchesSearch) return false;

    // Event filter
    if (eventFilter !== 'All Events' && b.festival?.name !== eventFilter) return false;
    
    // Status filter
    if (statusFilter !== 'All') {
      const isCompleted = b.festival?.endDate && new Date(b.festival.endDate) < new Date();
      const eventStatus = isCompleted ? 'Completed' : 'Published';
      if (eventStatus !== statusFilter) return false;
    }
    
    // Ticket Type filter
    if (ticketTypeFilter !== 'All' && b.ticketType !== ticketTypeFilter.toLowerCase()) return false;
    
    return true;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBookings(filteredBookings.map(b => b._id));
    } else {
      setSelectedBookings([]);
    }
  };

  const handleSelectBooking = (id: string) => {
    setSelectedBookings(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  const handleBookingStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const response = await apiClient.put('/api/organizer/bookings', {
        bookingId,
        status: newStatus
      });
      if (response.success) {
        setBookings(prev => prev.map(b => 
          b._id === bookingId ? { ...b, status: newStatus } : b
        ));
      } else {
        alert(response.message || 'Failed to update booking');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  // Summary Stats based on Event Filter ONLY (not affected by search or status filters)
  const eventScopedBookings = bookings.filter(b => {
    if (eventFilter !== 'All Events' && b.festival?.name !== eventFilter) return false;
    return true;
  });

  const totalTicketsSold = eventScopedBookings.reduce((acc, b) => acc + (b.quantity || 0), 0);
  // Count all booked tickets for the scoped events
   const confirmedTicketsCount = eventScopedBookings
     .reduce((acc, b) => acc + (b.quantity || 0), 0);

   const netIncomeValue = eventScopedBookings
     .reduce((acc, b) => {
       // Use pre-calculated organizerAmount if available, else calculate manually (90%)
       const amount = b.organizerAmount || (b.totalPrice ? b.totalPrice * 0.9 : 0);
       return acc + amount;
     }, 0);

  // Total Capacity Calculation
  let totalCapacityValue = 0;
  if (eventFilter === 'All Events') {
    totalCapacityValue = festivals.reduce((acc, f) => {
      const festivalCapacity = f.totalCapacity || f.ticketTypes?.reduce((tAcc: number, t: any) => tAcc + (t.quantity || t.capacity || 0), 0) || 0;
      return acc + festivalCapacity;
    }, 0);
  } else {
    const selectedFestival = festivals.find(f => f.name === eventFilter);
    totalCapacityValue = selectedFestival?.totalCapacity || selectedFestival?.ticketTypes?.reduce((tAcc: number, t: any) => tAcc + (t.quantity || t.capacity || 0), 0) || 0;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-primary">Event Bookings</h2>
          <p className="text-gray-500 text-sm mt-1">Track and manage all guest reservations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" leftIcon={Download} onClick={handleExportCSV}>Export CSV</Button>
        </div>
      </header>

      {/* Event Context Banner */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Active Scope</p>
            <h3 className="text-xl font-serif font-bold text-primary">
              {eventFilter === 'All Events' ? 'All Published Events' : `Event: ${eventFilter}`}
            </h3>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-ethio-bg rounded-xl border border-gray-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Live Monitoring</span>
        </div>
      </div>

      {/* Real-Time Check-in Counter & Payout Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {eventFilter !== 'All Events' && (
          <>
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Capacity</p>
                  <p className="text-2xl font-bold text-primary">{totalCapacityValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Booked Ticket</p>
                  <p className="text-2xl font-bold text-primary">{confirmedTicketsCount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Remaining</p>
                  <p className="text-2xl font-bold text-primary">{Math.max(0, totalCapacityValue - confirmedTicketsCount).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </>
        )}
        
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">
                {eventFilter === 'All Events' ? 'Net Income for All Event' : 'Net Income'}
              </p>
              <p className="text-2xl font-bold text-primary">ETB {netIncomeValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by ID or Guest Name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <select 
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
            >
              <option>All Events</option>
              {festivals.map(f => (
                <option key={f.id || f._id} value={f.name}>{f.name}</option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
            >
              <option>All</option>
              <option>Published</option>
              <option>Completed</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              value={ticketTypeFilter}
              onChange={(e) => setTicketTypeFilter(e.target.value)}
              className="appearance-none bg-gray-50 border-none rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
            >
              <option>All</option>
              <option>VIP</option>
              <option>General</option>
              <option>Early Bird</option>
              <option>Student</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowDateRange(!showDateRange)}
              className="flex items-center gap-2 bg-gray-50 rounded-xl py-2.5 px-4 text-xs font-bold text-primary hover:bg-gray-100 transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {dateRange.start && dateRange.end ? `${dateRange.start} - ${dateRange.end}` : 'Date Range'}
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            
            {showDateRange && (
              <div className="absolute top-full right-0 mt-2 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 z-20 w-72 animate-in fade-in zoom-in-95">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Start Date</label>
                    <input 
                      type="date" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">End Date</label>
                    <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold text-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowDateRange(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" className="flex-1" onClick={() => {
                      setDateFilter('Custom');
                      setShowDateRange(false);
                    }}>Apply</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBookings.length > 0 && (
        <div className="bg-primary text-white p-4 rounded-2xl flex justify-between items-center animate-in slide-in-from-bottom-2">
          <span className="text-sm font-bold">{selectedBookings.length} bookings selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">Export Selected</Button>
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" onClick={() => {
              if (window.confirm(`Are you sure you want to cancel ${selectedBookings.length} bookings?`)) {
                // Bulk cancel logic
                selectedBookings.forEach(id => handleBookingStatusUpdate(id, 'cancelled'));
                setSelectedBookings([]);
              }
            }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-5 w-12">
                <input 
                  type="checkbox" 
                  checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                  onChange={handleSelectAll}
                  className="rounded text-primary focus:ring-primary"
                />
              </th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Booking ID</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Booking Date</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Guest</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Event</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Ticket Type</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Qty</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Paid</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Payment Method</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredBookings.map(booking => (
              <tr key={booking._id} className="hover:bg-ethio-bg/30 transition-colors group">
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedBookings.includes(booking._id)}
                    onChange={() => handleSelectBooking(booking._id)}
                    className="rounded text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-mono font-bold text-primary">{booking._id?.slice(-8)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{new Date(booking.createdAt).toLocaleDateString()}</span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-bold text-primary">{booking.contactInfo?.fullName || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{booking.contactInfo?.email || 'N/A'}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-primary">{booking.festival?.name || 'N/A'}</p>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-none capitalize">{booking.ticketType}</Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-primary">x{booking.quantity}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-secondary">
                    {booking.currency} {(booking.organizerAmount || (booking.totalPrice ? booking.totalPrice * 0.9 : 0)).toLocaleString()}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 capitalize">
                    {booking.paymentStatus?.toLowerCase() === 'pending' ? 'Chapa' : (booking.paymentMethod || booking.paymentStatus || 'Chapa')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const isCompleted = booking.festival?.endDate && new Date(booking.festival.endDate) < new Date();
                    const statusText = isCompleted ? 'Completed' : 'Published';
                    return (
                      <Badge variant="secondary" className={`border-none ${
                        isCompleted ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {statusText}
                      </Badge>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onViewBooking(booking._id || '')} className="p-2 bg-white border border-gray-100 rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export const OrganizerMyEventsView: React.FC<{ onManageEvent: (id: string) => void; onCreate: () => void }> = ({ onManageEvent, onCreate }) => {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    const fetchFestivals = async () => {
      try {
        const response = await apiClient.get('/api/organizer/festivals');
        if (response.success) {
          setFestivals(response.festivals);
        } else {
          setError(response.message || 'Failed to fetch festivals.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching festivals.');
      } finally {
        setLoading(false);
      }
    };

    fetchFestivals();
  }, []);

  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('Newest First');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDateRange, setShowDateRange] = useState(false);
  const [expandedRejection, setExpandedRejection] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [eventIdToDelete, setEventIdToDelete] = useState<string | null>(null);

  const tabs = ['All', 'Pending', 'Published', 'Completed', 'Draft', 'Rejected'];

  const isMandatoryFieldsFilled = (festival: Festival) => {
    const f = festival as any;
    return (
      (f.name_en || f.name) &&
      f.startDate &&
      f.endDate &&
      (f.locationName || (f.location && (f.location.name_en || f.location.name))) &&
      (f.shortDescription_en || f.shortDescription) &&
      (f.fullDescription_en || f.fullDescription) &&
      f.coverImage &&
      (f.pricing && (f.pricing.basePrice !== undefined || f.pricing.regularPrice !== undefined))
    );
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setFestivals(prev => prev.map(f => f._id === id ? { ...f, status: newStatus as any } : f));
    setOpenDropdown(null);
  };

  const handleDelete = (id: string) => {
    setEventIdToDelete(id);
    setShowDeleteConfirm(true);
    setOpenDropdown(null);
  };

  const handleDeleteEvent = async () => {
    if (!eventIdToDelete || deleting) return;
    
    setDeleting(true);
    try {
      const response = await apiClient.delete(`/api/organizer/festivals/${eventIdToDelete}`);
      
      if (response.success) {
        setFestivals(prev => prev.filter(f => f._id !== eventIdToDelete));
        setShowDeleteConfirm(false);
      } else {
        setError(response.message || 'Failed to delete event');
        setShowDeleteConfirm(false);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
      setEventIdToDelete(null);
    }
  };

  const filteredFestivals = festivals.filter(f => {
    // Status Filter logic
    if (activeTab === 'All') {
      // In "All", only show Pending, Published, and Completed
      const isPending = f.verificationStatus === 'Pending Approval' || f.verificationStatus === 'Pending Review';
      const isPublished = f.verificationStatus === 'Approved';
      const isCompleted = f.verificationStatus === 'Approved' && new Date(f.endDate) < new Date();
      
      if (!isPending && !isPublished && !isCompleted) return false;
    } else {
      if (activeTab === 'Pending') {
        if (f.verificationStatus !== 'Pending Approval' && f.verificationStatus !== 'Pending Review') return false;
      } else if (activeTab === 'Published') {
        if (f.verificationStatus !== 'Approved') return false;
      } else if (activeTab === 'Completed') {
        if (!(f.verificationStatus === 'Approved' && new Date(f.endDate) < new Date())) return false;
      } else if (activeTab === 'Draft') {
        if (f.verificationStatus !== 'Draft') return false;
      } else if (activeTab === 'Rejected') {
        if (f.verificationStatus !== 'Rejected') return false;
      }
    }
    
    // Search by localized name
    const localizedName = (getLocalizedText(f, 'name', language) || f.name || '').toLowerCase();
    if (searchQuery && !localizedName.includes(searchQuery.toLowerCase())) return false;
    
    // Date Range Filter
    if (dateRange.start || dateRange.end) {
      const festivalStartDate = new Date(f.startDate);
      const festivalEndDate = new Date(f.endDate);
      
      // Reset times for date-only comparison
      festivalStartDate.setHours(0, 0, 0, 0);
      festivalEndDate.setHours(23, 59, 59, 999);
      
      if (dateRange.start) {
        const filterStartDate = new Date(dateRange.start);
        filterStartDate.setHours(0, 0, 0, 0);
        if (festivalEndDate < filterStartDate) return false;
      }
      
      if (dateRange.end) {
        const filterEndDate = new Date(dateRange.end);
        filterEndDate.setHours(23, 59, 59, 999);
        if (festivalStartDate > filterEndDate) return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Only apply sorting for Completed tab
    if (activeTab === 'Completed') {
      if (sortBy === 'Most Booked') return ((b as any).ticketsSold || 0) - ((a as any).ticketsSold || 0);
      if (sortBy === 'Soonest') return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (sortBy === 'Newest First') return new Date((b as any).createdAt || b.submittedAt || 0).getTime() - new Date((a as any).createdAt || a.submittedAt || 0).getTime();
    }
    return 0;
  });

  const totalEvents = festivals.length;
  const activeEvents = festivals.filter(f => f.status === 'Published').length;
  const totalTickets = festivals.reduce((acc, f) => acc + ((f as any).ticketsSold || 0), 0);

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Top Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-primary">My Events</h1>
          <p className="text-gray-400 mt-2 text-sm max-w-xl">Manage your cultural festivals, track performance, and engage with your audience.</p>
        </div>
        <Button 
          variant="primary" 
          size="lg"
          leftIcon={Plus}
          onClick={onCreate}
          className="w-full md:w-auto"
        >
          Create New Festival
        </Button>
      </header>

      {/* Festivals List */}
      <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <h3 className="text-2xl font-serif font-bold text-primary">
            {filteredFestivals.length} {filteredFestivals.length === 1 ? 'Posted Event' : 'Posted Events'}
          </h3>
          
          <div className="w-full lg:w-auto flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[320px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by festival title..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all shadow-inner"
              />
            </div>

            {/* Status Dropdown */}
            <div className="relative min-w-[140px]">
              <select 
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full appearance-none bg-gray-50 border-none rounded-2xl py-3 pl-5 pr-12 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer shadow-sm"
              >
                {tabs.map(tab => (
                  <option key={tab} value={tab}>{tab}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Date Range Picker */}
            <div className="relative">
              <button 
                onClick={() => setShowDateRange(!showDateRange)}
                className="flex items-center gap-3 bg-gray-50 rounded-2xl py-3 px-5 text-sm font-bold text-primary hover:bg-gray-100 transition-all"
              >
                <Calendar className="w-4 h-4 text-secondary" />
                {dateRange.start && dateRange.end ? `${dateRange.start} - ${dateRange.end}` : 'Date Range'}
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {showDateRange && (
                <div className="absolute top-full right-0 mt-3 bg-white p-6 rounded-[32px] shadow-2xl border border-gray-100 z-30 w-80 animate-in fade-in zoom-in-95">
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Start Date</label>
                      <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">End Date</label>
                      <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 rounded-xl" 
                        onClick={() => {
                          setDateRange({ start: '', end: '' });
                          setShowDateRange(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="flex-1 rounded-xl" 
                        onClick={() => setShowDateRange(false)}
                      >
                        OK
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown - Only show for Completed tab */}
            {activeTab === 'Completed' && (
              <div className="relative min-w-[160px]">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border-none rounded-2xl py-3 pl-5 pr-12 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer shadow-sm hover:bg-gray-100"
                >
                  <option value="Newest First">Newest First</option>
                  <option value="Soonest">Soonest</option>
                  <option value="Most Booked">Most Booked</option>
                </select>
                <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {festivals.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
            <Layers className="w-12 h-12 mx-auto text-gray-300" />
            <h4 className="mt-6 text-xl font-serif font-bold text-primary">No Festivals Yet</h4>
            <p className="text-gray-400 mt-2">Click 'Create New Festival' to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFestivals.map(festival => (
              <div key={festival._id} onClick={() => onManageEvent(festival._id || festival.id)} className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer">
                <div className="h-48 overflow-hidden">
                  <img src={festival.coverImage || `https://picsum.photos/seed/${festival._id}/600/400`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={getLocalizedText(festival, 'name', language)} />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-serif font-bold text-primary leading-tight pr-4">{getLocalizedText(festival, 'name', language)}</h4>
                    <Badge variant={
                      festival.verificationStatus === 'Rejected' ? 'error' : 
                      (festival.verificationStatus === 'Pending Approval' || festival.verificationStatus === 'Pending Review') ? 'warning' :
                      festival.status === 'Draft' ? 'secondary' : 
                      (festival.status === 'Completed' || new Date(festival.endDate) < new Date() ? 'outline' : 'success')
                    }>
                      {
                        festival.verificationStatus === 'Rejected' ? 'Rejected' : 
                        (festival.verificationStatus === 'Pending Approval' || festival.verificationStatus === 'Pending Review') ? 'Pending' :
                        festival.status === 'Draft' ? 'Draft' : 
                        (festival.status === 'Completed' || new Date(festival.endDate) < new Date() ? 'Completed' : 'Published')
                      }
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider space-y-2">
                    <p className="flex items-center gap-2"><Calendar className="w-3 h-3 text-secondary" /> {new Date(festival.startDate).toLocaleDateString()} - {new Date(festival.endDate).toLocaleDateString()}</p>
                    <p className="flex items-center gap-2"><MapPin className="w-3 h-3 text-secondary" /> {festival.locationName}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="flex-1" 
                        onClick={(e) => { e.stopPropagation(); onManageEvent(festival._id || festival.id); }}
                      >
                        {(() => {
                          const isRejected = festival.verificationStatus === 'Rejected';
                          const isPending = festival.verificationStatus === 'Pending Approval' || festival.verificationStatus === 'Pending Review';
                          const isDraft = festival.status === 'Draft';
                          const isCompleted = festival.status === 'Completed' || new Date(festival.endDate) < new Date();
                          
                          if (isCompleted || (!isRejected && !isPending && !isDraft)) {
                            return 'Details';
                          }
                          return 'Manage';
                        })()}
                      </Button>
                    </div>
                     {festival.verificationStatus === 'Rejected' && (
                       <div className="space-y-3">
                         <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                           <div 
                             className="flex justify-between items-center cursor-pointer"
                             onClick={(e) => {
                               e.stopPropagation();
                               setExpandedRejection(expandedRejection === festival._id ? null : festival._id || null);
                             }}
                           >
                             <p className="text-[10px] font-bold text-red-600 uppercase">Rejection Reason</p>
                             <ChevronRight className={`w-3 h-3 text-red-600 transition-transform ${expandedRejection === festival._id ? 'rotate-90' : ''}`} />
                           </div>
                           {expandedRejection === festival._id && (
                             <p className="text-xs text-red-700 mt-2 animate-in fade-in slide-in-from-top-1">
                               {festival.rejectionReason || 'Please edit and resubmit your event'}
                             </p>
                           )}
                         </div>
                         <Button 
                           variant="secondary" 
                           size="sm" 
                           className="w-full"
                           onClick={async (e) => {
                             e.stopPropagation();
                             try {
                               const res = await fetch(`/api/organizer/festivals/${festival._id}/submit`, { method: 'POST' });
                               const data = await res.json();
                               if (data.success) {
                                 setFestivals(prev => prev.map(f => f._id === festival._id ? { ...f, verificationStatus: 'Pending Approval', submittedAt: new Date().toISOString() } : f));
                                 alert('Event resubmitted for review');
                               } else {
                                 alert(data.message || 'Failed to resubmit');
                               }
                             } catch (err) {
                               alert('Error resubmitting event');
                             }
                           }}
                         >
                           Resubmit for Review
                         </Button>
                       </div>
                     )}

                     {festival.status === 'Draft' && festival.verificationStatus === 'Draft' && isMandatoryFieldsFilled(festival) && (
                       <Button 
                         variant="secondary" 
                         size="sm" 
                         className="w-full"
                         onClick={async (e) => {
                           e.stopPropagation();
                           try {
                             const res = await fetch(`/api/organizer/festivals/${festival._id}/submit`, { method: 'POST' });
                             const data = await res.json();
                             if (data.success) {
                               setFestivals(prev => prev.map(f => f._id === festival._id ? { ...f, verificationStatus: 'Pending Approval', submittedAt: new Date().toISOString() } : f));
                               alert('Event submitted for review');
                             } else {
                               alert(data.message || 'Failed to submit');
                             }
                           } catch (err) {
                             alert('Error submitting event');
                           }
                         }}
                       >
                         Submit for Review
                       </Button>
                     )}
                    {(festival.verificationStatus === 'Pending Approval' || festival.verificationStatus === 'Pending Review') && (
                      <div className="text-center text-xs text-amber-600 py-2 bg-amber-50 rounded-xl font-bold uppercase tracking-wider border border-amber-100">
                        Awaiting Admin Review
                      </div>
                    )}
                    {festival.verificationStatus === 'Approved' && festival.status === 'Published' && (
                      <>
                        <div className="text-center text-xs text-emerald-600 py-2 bg-emerald-50 rounded-xl font-bold uppercase tracking-wider border border-emerald-100">
                          Published & Live
                        </div>
                        {festival.isEditedAfterApproval && (
                          <div className="text-center text-xs text-amber-600 py-2 bg-amber-50 rounded-xl font-bold uppercase tracking-wider border border-amber-100 mt-1">
                            Pending Re-verification
                          </div>
                        )}
                      </>
                    )}
                    {(festival.status === 'Completed' || (festival.status === 'Published' && new Date(festival.endDate) < new Date())) && (
                      <div className="text-center text-xs text-gray-500 py-2 bg-gray-50 rounded-xl font-bold uppercase tracking-wider border border-gray-100">
                        Event Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Delete Event?</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete <strong className="text-primary">{festivals.find(f => f._id === eventIdToDelete)?.name}</strong>? 
                This action cannot be undone and all data will be permanently lost.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none"
                  onClick={handleDeleteEvent}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Event'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const OrganizerDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const navigate = (to: string) => router.push(to);

  const [analytics, setAnalytics] = useState<any>(null);
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleManageEvent = (id: string) => setSelectedEventId(id);
  const handleBack = () => setSelectedEventId(null);
  const handleCreate = () => router.push('/dashboard/organizer/festivals/create');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, festivalsRes] = await Promise.all([
          fetch('/api/organizer/analytics'),
          fetch('/api/organizer/festivals')
        ]);
        const analyticsData = await analyticsRes.json();
        const festivalsData = await festivalsRes.json();
        if (analyticsData.success) setAnalytics(analyticsData.analytics);
        if (festivalsData.success) setFestivals(festivalsData.festivals);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (selectedEventId) {
    return <EventDetailPanel eventId={selectedEventId} onBack={handleBack} />;
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-primary">My Events</h1>
          <p className="text-gray-400 mt-2 text-sm max-w-xl">Manage your cultural festivals, track performance, and engage with your audience.</p>
        </div>
        <Button variant="primary" size="lg" leftIcon={Plus} onClick={handleCreate}>Create Event</Button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {festivals.map((festival) => (
          <div key={festival._id} onClick={() => handleManageEvent(festival._id || festival.id)} className="bg-white rounded-[32px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer">
            <div className="h-48 overflow-hidden">
              <img src={festival.coverImage || 'https://images.unsplash.com/photo-1533174072545-7a4b6dad2cf7?w=800&h=400&fit=crop'} alt={festival.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-primary line-clamp-1">{festival.name}</h3>
                <Badge variant={
                  festival.verificationStatus === 'Rejected' ? 'error' : 
                  (festival.verificationStatus === 'Pending Approval' || festival.verificationStatus === 'Pending Review') ? 'warning' :
                  festival.status === 'Draft' ? 'secondary' : 
                  (festival.status === 'Completed' || new Date(festival.endDate) < new Date() ? 'outline' : 'success')
                }>
                  {
                    festival.verificationStatus === 'Rejected' ? 'Rejected' : 
                    (festival.verificationStatus === 'Pending Approval' || festival.verificationStatus === 'Pending Review') ? 'Pending' :
                    festival.status === 'Draft' ? 'Draft' : 
                    (festival.status === 'Completed' || new Date(festival.endDate) < new Date() ? 'Completed' : 'Published')
                  }
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mb-3">{festival.startDate ? new Date(festival.startDate).toLocaleDateString() : 'TBA'}</p>
              <div className="items-center gap-4 text-xs text-gray-500 mb-4 flex">
                <p className="flex items-center gap-1"><Ticket className="w-3 h-3" /> {festival.ticketsSold || 0} sold</p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <Button variant="primary" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleManageEvent(festival._id || festival.id); }}>Manage</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
