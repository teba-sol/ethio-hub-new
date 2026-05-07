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
  HelpCircle, Lightbulb, BarChart, Map, Clock, Camera, ZoomIn, Maximize2, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Festival, HotelAccommodation, Review } from '../../types';
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

  const hasMeaningfulRoomData = (room: any) => {
    if (!room || typeof room !== 'object') return false;

    const textFields = ['name', 'description', 'image', 'bedType'];
    const hasText = textFields.some((field) => String(room[field] || '').trim().length > 0);

    const numericFields = ['capacity', 'pricePerNight', 'availability', 'sqm'];
    const hasNumeric = numericFields.some((field) => {
      const value = Number(room[field]);
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

   const currentData = isEditing ? editData : festival;

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
                  <span>â€”</span>
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
                    {new Date(currentData.startDate).toLocaleDateString()} â€” {new Date(currentData.endDate).toLocaleDateString()}
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
                  <span className="text-xs font-semibold text-primary">â˜…â˜…â˜…â˜…â˜…</span>
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
          )}
        </div>
      )}
