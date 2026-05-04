import React, { useState, useEffect } from 'react';
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
import { Button, Badge, VerifiedBadge, Input } from '../UI';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedText } from '../../utils/getLocalizedText';
import { MOCK_FESTIVALS } from '../../data/constants';
import { 
  CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis
} from 'recharts';

import apiClient from '../../lib/apiClient';
import { getImageUrl as getCloudImageUrl } from '../../lib/cloudinary';

const REVENUE_DATA = [
  { name: 'Jan', revenue: 45000, bookings: 120, users: 400, sales: 85 },
  { name: 'Feb', revenue: 52000, bookings: 145, users: 450, sales: 92 },
  { name: 'Mar', revenue: 48000, bookings: 130, users: 480, sales: 110 },
  { name: 'Apr', revenue: 61000, bookings: 170, users: 520, sales: 130 },
  { name: 'May', revenue: 55000, bookings: 155, users: 590, sales: 125 },
  { name: 'Jun', revenue: 67000, bookings: 190, users: 650, sales: 150 },
  { name: 'Jul', revenue: 72000, bookings: 210, users: 710, sales: 180 },
];

const SNAPSHOT_DATA = [
  { day: 'Mon', bookings: 12 },
  { day: 'Tue', bookings: 18 },
  { day: 'Wed', bookings: 15 },
  { day: 'Thu', bookings: 25 },
  { day: 'Fri', bookings: 32 },
  { day: 'Sat', bookings: 45 },
  { day: 'Sun', bookings: 38 },
];

const NOTIFICATIONS = [
  { id: 1, type: 'booking', message: 'New booking from Sarah J.', time: '2m ago' },
  { id: 2, type: 'review', message: '5-star review on Timket 2025', time: '1h ago' },
  { id: 3, type: 'payout', message: 'Payout of ETB 45,000 processed', time: '1d ago' },
];

const ENGAGEMENT_DATA = [
  { city: 'Addis Ababa', visitors: '45%' },
  { city: 'Washington DC', visitors: '15%' },
  { city: 'London', visitors: '10%' },
  { city: 'Dubai', visitors: '8%' },
];

const MOCK_REVIEWS: Review[] = [
  { id: 'rev-1', userId: 'u1', userName: 'Abebe Bikila', userImage: 'https://picsum.photos/seed/abebe/100/100', targetId: 'f1', targetName: 'Timket 2025 (Epiphany)', rating: 5, comment: 'An absolutely breathtaking experience.', date: 'Jan 22, 2025', isVerified: true },
];

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
       const dataToSave = { ...editData };

       // Strip incomplete array entries with empty required fields
       if (Array.isArray(dataToSave.transportation)) {
         dataToSave.transportation = dataToSave.transportation
           .filter((t: any) => t.type?.trim())
           .map((t: any) => ({
             ...t,
             type: String(t?.type || '').trim(),
             capacity: Number.isFinite(Number(t?.capacity)) ? Number(t.capacity) : 0,
             price: Number.isFinite(Number(t?.price)) ? Number(t.price) : 0,
             availability: Number.isFinite(Number(t?.availability)) ? Number(t.availability) : 0,
             description: String(t?.description || '').trim(),
             pickupLocations: String(t?.pickupLocations || '').trim(),
           }));
       }
       if (Array.isArray(dataToSave.hotels)) {
          dataToSave.hotels = dataToSave.hotels
            .filter((h: any) => h.name?.trim())
            .map((h: any) => {
              const sourceRooms = Array.isArray(h.rooms) ? h.rooms : [];
              const normalizedRooms = sourceRooms
                .filter((r: any) => hasMeaningfulRoomData(r))
                .map((r: any, roomIndex: number) => ({
                  ...r,
                  name: String(r?.name || '').trim() || `Room ${roomIndex + 1}`,
                  bedType: String(r?.bedType || '').trim() || 'King Size',
                  capacity: Number.isFinite(Number(r?.capacity)) ? Number(r.capacity) : 2,
                  pricePerNight: Number.isFinite(Number(r?.pricePerNight)) ? Number(r.pricePerNight) : 0,
                  availability: Number.isFinite(Number(r?.availability)) ? Number(r.availability) : 0,
                  sqm: Number.isFinite(Number(r?.sqm)) ? Number(r.sqm) : 30,
                  amenities: Array.isArray(r?.amenities) ? r.amenities : [],
                }));

              return {
                ...h,
                rooms: normalizedRooms,
              };
            });
        }
       if (Array.isArray(dataToSave.schedule)) {
         dataToSave.schedule = dataToSave.schedule.filter((s: any) => s.title?.trim());
       }

       // If this is an approved event being edited, mark it for reverification
       if (currentData.verificationStatus === 'Approved') {
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
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
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

  if (!festival || !editData) {
    return (
      <div className="text-center h-[60vh] flex flex-col items-center justify-center">
        <h3 className="text-2xl font-bold text-primary">Event Not Found</h3>
        <p className="text-gray-500">The requested event could not be found.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onBack}>Go Back</Button>
      </div>
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
    src={getImageUrl(currentData?.coverImage, 'coverImage')} 
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
                 {new Date(currentData.startDate) > new Date() ? 'Upcoming' : 'Live'}
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
                <Button 
                  variant="outline" 
                  className="flex-1 lg:flex-none" 
                  onClick={() => setIsEditing(true)} 
                  leftIcon={Edit3}
                >
                  Edit Event
                </Button>
                <Button variant="primary" className="flex-1 lg:flex-none" leftIcon={Globe}>
                  View Public Page
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
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Festival Name</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-bold text-primary">{currentData.name}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Status</p>
                    {isEditing ? (
                      <select
                        value={currentData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      >
                        <option>Draft</option>
                        <option>Published</option>
                        <option>Cancelled</option>
                      </select>
                    ) : (
                      <p className="text-sm font-bold text-primary">{currentData.status}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Start Date</p>
                    {isEditing ? (
                      <input
                        type="date"
                        value={new Date(currentData.startDate).toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-bold text-primary">{new Date(currentData.startDate).toDateString()}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">End Date</p>
                    {isEditing ? (
                      <input
                        type="date"
                        value={new Date(currentData.endDate).toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-bold text-primary">{new Date(currentData.endDate).toDateString()}</p>
                    )}
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
                      <textarea
                        value={currentData.location?.address || ''}
                        onChange={(e) => handleNestedChange('location', 'address', e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
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
                      <textarea
                        value={currentData.shortDescription}
                        onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed">{currentData.shortDescription}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Full Description</p>
                    {isEditing ? (
                      <textarea
                        value={currentData.fullDescription}
                        onChange={(e) => handleInputChange('fullDescription', e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
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
                <div key={idx} className="bg-ethio-bg/30 p-8 rounded-[32px] border border-gray-50 flex gap-8 relative">
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveArrayItem('schedule', idx)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="w-20 h-20 bg-primary text-white rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">Day</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={day.day}
                        onChange={(e) => handleArrayChange('schedule', idx, 'day', parseNumberInput(e.target.value))}
                        className="text-2xl font-serif font-bold bg-transparent text-white text-center w-12"
                      />
                    ) : (
                      <span className="text-3xl font-serif font-bold">{day.day}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={day.title}
                        onChange={(e) => handleArrayChange('schedule', idx, 'title', e.target.value)}
                        className="text-xl font-serif font-bold text-primary w-full bg-white border border-gray-200 rounded-lg p-2"
                        placeholder="Day title"
                      />
                    ) : (
                      <h4 className="text-xl font-serif font-bold text-primary">{day.title || 'Special Celebration Day'}</h4>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Activities</p>
                        {isEditing ? (
                          <textarea
                            value={day.activities}
                            onChange={(e) => handleArrayChange('schedule', idx, 'activities', e.target.value)}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                            rows={3}
                          />
                        ) : (
                          <p className="text-sm text-gray-600">{day.activities || 'Traditional ceremonies and community gathering.'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Performers</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={day.performers?.join(', ') || ''}
                            onChange={(e) => handleArrayChange('schedule', idx, 'performers', e.target.value.split(',').map((p: string) => p.trim()))}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                            placeholder="Comma separated list"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(day.performers || ['Local Artists', 'Cultural Troupe']).map((p: string, i: number) => (
                              <Badge key={`performer-${i}`} variant="outline" className="bg-white">{p}</Badge>
                            ))}
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
                    className="group/room bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                  >
                    {/* Room Image */}
                    <div className="relative h-56 overflow-hidden">
                      {isEditing ? (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative group/edit">
                          {room.image ? (
                            <img 
                              src={getImageUrl(room.image)} 
                              className="w-full h-full object-cover" 
                              alt={room.name} 
                            />
                          ) : (
                            <Hotel className="w-12 h-12 text-gray-400" />
                          )}
                          <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/edit:opacity-100 transition-opacity duration-300 cursor-pointer">
                            <span className="bg-white text-primary px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                              Change Image
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
                                      const newRooms = [...editData.hotels[idx].rooms];
                                      newRooms[rIdx] = { ...newRooms[rIdx], image: data.url };
                                      const newHotels = [...editData.hotels];
                                      newHotels[idx].rooms = newRooms;
                                      handleInputChange('hotels', newHotels);
                                    }
                                  } catch (err) {
                                    console.error('Room image upload failed:', err);
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <>
                          <img 
                            src={getImageUrl(room.image)} 
                            className="w-full h-full object-cover transform group-hover/room:scale-110 transition-transform duration-700" 
                            alt={room.name} 
                          />
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-white/95 backdrop-blur-sm text-primary text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                              {room.remaining ?? room.availability ?? 0} left
                            </Badge>
                          </div>
                        </>
                      )}
                      
                      {isEditing && (
                        <button
                          onClick={() => {
                            const newRooms = hotel.rooms.filter((_: any, i: number) => i !== rIdx);
                            handleArrayChange('hotels', idx, 'rooms', newRooms);
                          }}
                          className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md text-red-500 hover:text-red-700 transition-all duration-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Room Details */}
                    <div className="p-6 space-y-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => {
                            const newRooms = [...hotel.rooms];
                            newRooms[rIdx] = { ...newRooms[rIdx], name: e.target.value };
                            handleArrayChange('hotels', idx, 'rooms', newRooms);
                          }}
                          className="w-full text-xl font-bold text-primary bg-gray-50 border border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="Room name"
                        />
                      ) : (
                        <h6 className="text-xl font-bold text-primary">{room.name}</h6>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1">Bed Type</p>
                          {isEditing ? (
                            <input
                              type="text"
                              value={room.bedType}
                              onChange={(e) => {
                                const newRooms = [...hotel.rooms];
                                newRooms[rIdx] = { ...newRooms[rIdx], bedType: e.target.value };
                                handleArrayChange('hotels', idx, 'rooms', newRooms);
                              }}
                              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            />
                          ) : (
                            <p className="font-semibold text-gray-800 text-sm">{room.bedType || 'Standard Bed'}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1">Max Guests</p>
                          {isEditing ? (
                            <input
                              type="number"
                              value={room.capacity}
                              onChange={(e) => {
                                const newRooms = [...hotel.rooms];
                                newRooms[rIdx] = { ...newRooms[rIdx], capacity: parseNumberInput(e.target.value) };
                                handleArrayChange('hotels', idx, 'rooms', newRooms);
                              }}
                              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            />
                          ) : (
                            <p className="font-semibold text-gray-800 text-sm">{room.capacity} Persons</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1">Room Size (m²)</p>
                          {isEditing ? (
                            <input
                              type="number"
                              value={room.sqm || 30}
                              onChange={(e) => {
                                const newRooms = [...hotel.rooms];
                                newRooms[rIdx] = { ...newRooms[rIdx], sqm: parseNumberInput(e.target.value) };
                                handleArrayChange('hotels', idx, 'rooms', newRooms);
                              }}
                              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            />
                          ) : (
                            <p className="font-semibold text-gray-800 text-sm">{room.sqm || 30} m²</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1">Availability</p>
                          {isEditing ? (
                            <input
                              type="number"
                              value={room.availability ?? ''}
                              onChange={(e) => {
                                const newRooms = [...hotel.rooms];
                                newRooms[rIdx] = { ...newRooms[rIdx], availability: parseNumberInput(e.target.value) };
                                handleArrayChange('hotels', idx, 'rooms', newRooms);
                              }}
                              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            />
                          ) : (
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-800 text-sm">
                                {room.remaining ?? room.availability ?? 0} remaining
                              </p>
                              <p className="text-xs text-gray-500">
                                {room.initialAvailability ?? room.availability ?? 0} total, {room.bookedCount ?? 0} booked
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1">Price per Night ($)</p>
                          {isEditing ? (
                            <input
                              type="number"
                              value={Number.isFinite(Number(room.pricePerNight)) ? Number(room.pricePerNight) : 0}
                              onChange={(e) => {
                                const newRooms = [...hotel.rooms];
                                newRooms[rIdx] = { ...newRooms[rIdx], pricePerNight: parseNumberInput(e.target.value) };
                                handleArrayChange('hotels', idx, 'rooms', newRooms);
                              }}
                              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            />
                          ) : (
                            <p className="text-2xl font-bold text-secondary">${room.pricePerNight.toLocaleString()}</p>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-2">Description</p>
                          <textarea
                            value={room.description || ''}
                            onChange={(e) => {
                              const newRooms = [...hotel.rooms];
                              newRooms[rIdx] = { ...newRooms[rIdx], description: e.target.value };
                              handleArrayChange('hotels', idx, 'rooms', newRooms);
                            }}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            rows={2}
                            placeholder="Room description"
                          />
                        </div>
                      )}

                      {isEditing && (
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-2">Amenities</p>
                          <div className="flex flex-wrap gap-2">
                            {['Free WiFi', 'Air Conditioning', 'Mini Bar', 'Flat-screen TV', 'Safe', 'Coffee Machine', 'Jacuzzi', 'Bathtub', 'Balcony', 'City View'].map((amenity) => (
                              <label key={amenity} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(room.amenities || []).includes(amenity)}
                                  onChange={(e) => {
                                    const newRooms = [...hotel.rooms];
                                    const amenities = room.amenities || [];
                                    if (e.target.checked) {
                                      newRooms[rIdx] = { ...newRooms[rIdx], amenities: [...amenities, amenity] };
                                    } else {
                                      newRooms[rIdx] = { ...newRooms[rIdx], amenities: amenities.filter((a: string) => a !== amenity) };
                                    }
                                    handleArrayChange('hotels', idx, 'rooms', newRooms);
                                  }}
                                  className="w-3.5 h-3.5 text-primary rounded border-gray-300 focus:ring-primary"
                                />
                                <span className="text-xs text-gray-600">{amenity}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isEditing && room.sqm && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>{room.sqm} m²</span>
                        </div>
                      )}

                      {!isEditing && room.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{room.description}</p>
                      )}

                      {!isEditing && room.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {room.amenities.slice(0, 3).map((a: string, ai: number) => (
                            <span key={ai} className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-medium rounded-full">{a}</span>
                          ))}
                          {room.amenities.length > 3 && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                              +{room.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {!isEditing && (
                        <button className="w-full mt-4 bg-gradient-to-r from-primary to-primary/90 text-white py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                          Book Now
                        </button>
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
                <div key={idx} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex gap-6 relative">
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveArrayItem('transportation', idx)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700"
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
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
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
                    
                    {isEditing ? (
                      <textarea
                        value={transport.description || ''}
                        onChange={(e) => handleArrayChange('transportation', idx, 'description', e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        rows={2}
                        placeholder="Description"
                      />
                    ) : (
                      <p className="text-xs text-gray-500">{transport.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Capacity</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={transport.capacity}
                            onChange={(e) => handleArrayChange('transportation', idx, 'capacity', parseNumberInput(e.target.value))}
                            className="w-full p-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
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
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Price</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={transport.price}
                            onChange={(e) => handleArrayChange('transportation', idx, 'price', parseNumberInput(e.target.value))}
                            className="w-full p-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                          />
                        ) : (
                          <p className="font-bold text-secondary">ETB {transport.price}/trip</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Pickup Locations</p>
                      {isEditing ? (
                        <textarea
                          value={transport.pickupLocations || ''}
                          onChange={(e) => handleArrayChange('transportation', idx, 'pickupLocations', e.target.value)}
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                          rows={2}
                          placeholder="Pickup locations"
                        />
                      ) : (
                        <p className="text-[10px] text-gray-500">{transport.pickupLocations}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Features</p>
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          {['AC', 'WiFi', 'GPS', 'USB Charging', 'Leather Seats', 'Refreshments', 'Professional Driver', 'Luggage Space'].map((feature) => (
                            <label key={feature} className="flex items-center gap-1 text-[10px]">
                              <input
                                type="checkbox"
                                checked={transport.features?.includes(feature) || false}
                                onChange={(e) => {
                                  const currentFeatures = transport.features || [];
                                  const newFeatures = e.target.checked
                                    ? [...currentFeatures, feature]
                                    : currentFeatures.filter((f: string) => f !== feature);
                                  handleArrayChange('transportation', idx, 'features', newFeatures);
                                }}
                                className="rounded"
                              />
                              {feature}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {transport.features?.map((feature: string, i: number) => (
                            <span key={i} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{feature}</span>
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
                  <div  className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm relative">
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
                  <div  className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm relative">
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
                  <div  className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm relative">
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
            <h3 className="text-2xl font-serif font-bold text-primary">Pricing & Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Base Price Card */}
              <div className="bg-primary p-10 rounded-[40px] text-white shadow-xl space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Standard Ticket</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={currentData.pricing?.basePrice || 0}
                    onChange={(e) => handleNestedChange('pricing', 'basePrice', parseNumberInput(e.target.value))}
                    className="text-5xl font-serif font-bold bg-transparent border-b border-white/30 text-white w-full"
                  />
                ) : (
                  <h4 className="text-5xl font-serif font-bold">
                    {currentData.pricing?.currency || 'ETB'} {currentData.pricing?.basePrice || '0'}
                  </h4>
                )}
                <ul className="space-y-3 text-sm opacity-80">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> General Admission</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Standard Seating</li>
                  {currentData.pricing?.earlyBird > 0 && (
                    <li className="flex items-center gap-2"><Clock className="w-4 h-4" /> Early Bird: {currentData.pricing.earlyBird}% off</li>
                  )}
                </ul>
              </div>

              {/* VIP Price Card */}
              <div className="bg-secondary p-10 rounded-[40px] text-white shadow-xl space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">VIP Experience</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={currentData.pricing?.vipPrice || 0}
                    onChange={(e) => handleNestedChange('pricing', 'vipPrice', parseNumberInput(e.target.value))}
                    className="text-5xl font-serif font-bold bg-transparent border-b border-white/30 text-white w-full"
                  />
                ) : (
                  <h4 className="text-5xl font-serif font-bold">
                    {currentData.pricing?.currency || 'ETB'} {currentData.pricing?.vipPrice || (currentData.pricing?.basePrice ? currentData.pricing.basePrice * 3 : 750)}
                  </h4>
                )}
                <ul className="space-y-3 text-sm opacity-80">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Priority Entry</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Exclusive Lounge Access</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Meet & Greet</li>
                </ul>
              </div>

              {/* Inventory & Discounts Card */}
              <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inventory & Discounts</p>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Currency</p>
                    {isEditing ? (
                      <select
                        value={currentData.pricing?.currency || 'ETB'}
                        onChange={(e) => handleNestedChange('pricing', 'currency', e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      >
                        <option>ETB</option>
                        <option>USD</option>
                        <option>EUR</option>
                      </select>
                    ) : (
                      <p className="text-sm font-bold text-primary">{currentData.pricing?.currency || 'ETB'}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Early Bird Discount</p>
                    {isEditing ? (
                      <input
                        type="number"
                        value={currentData.pricing?.earlyBird || 0}
                        onChange={(e) => handleNestedChange('pricing', 'earlyBird', parseNumberInput(e.target.value))}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-bold text-primary">{currentData.pricing?.earlyBird || 0}% off</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Group Discount</p>
                    {isEditing ? (
                      <input
                        type="number"
                        value={currentData.pricing?.groupDiscount || 0}
                        onChange={(e) => handleNestedChange('pricing', 'groupDiscount', parseNumberInput(e.target.value))}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm font-bold text-primary">{currentData.pricing?.groupDiscount || 10}% off for groups of 10+</p>
                    )}
                  </div>
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
                  {[...Array(5)].map((_, i) => <Star  className="w-5 h-5 fill-current" />)}
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
export const OrganizerOverview: React.FC = () => {
  const [view, setView] = useState('overview'); // 'overview', 'eventDetail', 'createEvent'
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleManageEvent = (id: string) => {
    setSelectedEventId(id);
    setView('eventDetail');
  };

  const handleCreate = () => {
    // In a real app, this would likely navigate to a creation form/page
    // For this example, we'll just log it.
    console.log('Navigate to create event view');
    // Or, if a create view component exists:
    // setView('createEvent'); 
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
  const onCreate = handleCreate;
  const { user } = useAuth();
  const router = useRouter();
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
  
  const activeListings = analytics?.festivals?.published || festivals.length;
  const totalAttendees = analytics?.bookings?.confirmed || 0;
  // Split payment breakdown
  const grossRevenue = analytics?.revenue?.gross || 0;
  const platformFee = analytics?.revenue?.platformFee || 0;
  const netEarnings = analytics?.revenue?.net || grossRevenue;
  
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
  const hasEvents = myEvents.length > 0;
  const [showSupport, setShowSupport] = useState(false);
  const [showTips, setShowTips] = useState(false);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
          { label: 'Active Listings', val: activeListings.toString(), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Global Attendees', val: formatNumber(totalAttendees), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Net Earnings (10% fee)', val: formatCurrency(netEarnings), icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50', tooltip: `Gross: ${formatCurrency(grossRevenue)} | Platform Fee: ${formatCurrency(platformFee)}` },
        ].map((stat, i) => (
          <div key={`stat-${i}`} className="bg-white p-8 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm relative group">
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p><p className="text-2xl font-bold text-primary">{stat.val}</p></div>
            <div className={`p-4 ${stat.bg} rounded-[20px]`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
            {stat.tooltip && (
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded whitespace-nowrap z-50">
                {stat.tooltip}
              </div>
            )}
          </div>
        ))}
         <div className="bg-white p-8 rounded-3xl border border-gray-100 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="flex justify-between items-start z-10">
               <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trust Level</p><p className="text-2xl font-bold text-primary">{user?.organizerProfile?.isVerified ? 'Verified' : 'Pending'}</p></div>
               <div className="p-4 bg-secondary/10 rounded-[20px]"><ShieldCheck className="w-6 h-6 text-secondary" /></div>
            </div>
            <div className="mt-4 z-10">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1"><span>Progress to Top Rated</span><span>{Math.min(80, Math.round((totalAttendees / 100) * 100))}%</span></div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-secondary w-[80%]"></div></div>
            </div>
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
             {/* Upcoming Events Timeline */}
             <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h3 className="text-lg font-serif font-bold text-primary mb-6 flex items-center gap-2"><CalendarClock className="w-5 h-5 text-secondary" /> Upcoming Timeline</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                   {myEvents.slice(0, 5).map((ev: any, i: number) => (
                      <div key={ev._id || i} className="min-w-[200px] p-4 bg-ethio-bg/30 rounded-2xl border border-gray-50 flex gap-4 items-center cursor-pointer hover:bg-ethio-bg/50 transition-colors" onClick={() => onManageEvent(ev._id)}>
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
                   <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> 7-Day Booking Trend</h3>
                   <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100">+12% vs last week</Badge>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SNAPSHOT_DATA}>
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
                </div>
             </section>

             {/* Engagement Metrics */}
             <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                   <h4 className="font-bold text-primary mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-600" /> Top Visitor Locations</h4>
                   <div className="space-y-3">
                      {ENGAGEMENT_DATA.map((loc, i) => (
                         <div key={loc.city || i} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{loc.city}</span>
                            <div className="flex items-center gap-2 w-1/2">
                               <div className="h-1.5 bg-gray-100 rounded-full flex-1 overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{width: loc.visitors}}></div>
                               </div>
                               <span className="text-xs font-bold text-primary w-8 text-right">{loc.visitors}</span>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
                <div 
                  className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all group"
                  onClick={() => myEvents[0] && onManageEvent(myEvents[0].id)}
                >
                   <h4 className="font-bold text-primary mb-4 flex items-center gap-2"><Eye className="w-4 h-4 text-purple-600" /> Most Viewed Event</h4>
                   {myEvents[0] ? (
                     <div className="space-y-4">
                         <div className="h-32 rounded-2xl overflow-hidden relative">
                            {myEvents[0].coverImage ? (
                              <img src={myEvents[0].coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Calendar className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg">1.2k Views</div>
                         </div>
                        <div>
                           <p className="font-bold text-primary group-hover:text-secondary transition-colors">{myEvents[0].name}</p>
                           <p className="text-xs text-gray-500 mt-1">245 views today</p>
                        </div>
                     </div>
                   ) : <p className="text-sm text-gray-400">No events yet.</p>}
                </div>
             </section>

             {/* Existing My Events List */}
             {!hasEvents ? (
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
                   <button className="text-xs font-bold text-secondary hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                   {NOTIFICATIONS.map(notif => (
                      <div key={notif.id} className="flex gap-3 items-start p-3 bg-gray-50 rounded-2xl border border-gray-100">
                         <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${notif.type === 'booking' ? 'bg-blue-500' : notif.type === 'review' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                         <div>
                            <p className="text-sm font-bold text-primary leading-tight">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                         </div>
                      </div>
                   ))}
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
                <div  className="flex gap-4 p-4 bg-ethio-bg/50 rounded-2xl">
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
          <Button variant="outline" leftIcon={Printer}>Print Invoice</Button>
          <Button variant="primary" leftIcon={QrCode}>View QR Code</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs */}
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: Info },
              { id: 'payment', label: 'Payment Details', icon: CreditCard },
              { id: 'history', label: 'Activity Log', icon: History },
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
                {booking.specialRequests && (
                  <div className="pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Special Requests</p>
                    <p className="text-sm text-gray-600 italic">"{booking.specialRequests}"</p>
                  </div>
                )}
              </section>

              {/* Event Ticket */}
              <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-secondary" /> Event Ticket
                </h3>
                <div className="bg-ethio-bg/30 p-6 rounded-3xl border border-gray-50 flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-serif font-bold text-primary">{booking.festival?.name || 'Festival'}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Date: {booking.festival?.startDate ? new Date(booking.festival.startDate).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-primary text-white border-none capitalize">{booking.ticketType} x{booking.quantity}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-right">
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Quantity</p>
                      <p className="text-lg font-bold text-primary">x{booking.quantity}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Price</p>
                      <p className="text-lg font-bold text-primary">ETB {booking.totalPrice / booking.quantity}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Subtotal</p>
                      <p className="text-lg font-bold text-secondary">ETB {booking.totalPrice}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Accommodation */}
              {booking.bookingDetails?.room && (
                <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                    <Hotel className="w-5 h-5 text-secondary" /> Accommodation
                  </h3>
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div>
                        <h4 className="text-xl font-serif font-bold text-primary">{booking.bookingDetails.room.hotelName}</h4>
                        <p className="text-sm font-bold text-secondary">{booking.bookingDetails.room.roomName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Per Night</p>
                        <p className="text-lg font-bold text-primary">ETB {booking.bookingDetails.room.roomPrice}</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Transport */}
              {booking.bookingDetails?.transport && (
                <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                    <Car className="w-5 h-5 text-secondary" /> Transport
                  </h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xl font-serif font-bold text-primary">{booking.bookingDetails.transport.type}</h4>
                      <p className="text-sm text-gray-500">Private Transfer</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Fixed Rate</p>
                      <p className="text-lg font-bold text-primary">ETB {booking.bookingDetails.transport.price}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Fee Breakdown */}
              {booking.status === 'confirmed' && (
                <section className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100 space-y-4">
                  <h3 className="text-lg font-serif font-bold text-emerald-800">Your Earnings Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Gross Amount</p>
                      <p className="text-xl font-bold text-primary">ETB {booking.totalPrice}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Platform Fee ({booking.commissionPercent || 10}%)</p>
                      <p className="text-xl font-bold text-red-500">- ETB {booking.platformFee || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">You Receive</p>
                      <p className="text-xl font-bold text-emerald-600">ETB {booking.organizerAmount || (booking.totalPrice - (booking.platformFee || 0))}</p>
                    </div>
                  </div>
                </section>
              )}
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
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Booking Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold capitalize ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Amount</p>
                  <p className="text-lg font-bold text-primary">{booking.currency} {booking.totalPrice}</p>
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
            <h3 className="text-lg font-serif font-bold text-primary mb-4">Booking Actions</h3>
            <div className="space-y-3">
              {booking.status === 'pending' && (
                <>
                  <Button className="w-full" onClick={() => handleStatusUpdate('confirmed')} disabled={updating}>
                    {updating ? 'Processing...' : 'Confirm Booking'}
                  </Button>
                  <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleStatusUpdate('cancelled')} disabled={updating}>
                    Cancel Booking
                  </Button>
                </>
              )}
              {booking.status === 'confirmed' && (
                <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleStatusUpdate('cancelled')} disabled={updating}>
                  Cancel Booking
                </Button>
              )}
              {booking.status === 'cancelled' && (
                <div className="text-center text-gray-500 text-sm">This booking has been cancelled</div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-primary mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Tickets</span>
                <span className="font-bold text-primary">{booking.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Total</span>
                <span className="font-bold text-primary">{booking.currency} {booking.totalPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Guest</span>
                <span className="font-bold text-primary">{booking.tourist?.name || 'Guest'}</span>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await apiClient.get('/api/organizer/bookings');
        if (response.success) {
          setBookings(response.bookings);
        } else {
          setError(response.message || 'Failed to fetch bookings');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
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
    const guestName = b.contactInfo?.fullName || '';
    const eventName = b.festival?.name || '';
    if (searchQuery && !b._id?.toLowerCase().includes(searchQuery.toLowerCase()) && !guestName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (eventFilter !== 'All Events' && eventName !== eventFilter) return false;
    if (statusFilter !== 'All' && b.status !== statusFilter.toLowerCase()) return false;
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

  const totalTickets = filteredBookings.reduce((acc, b) => acc + (b.quantity || 0), 0);
  const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed').reduce((acc, b) => acc + (b.quantity || 0), 0);
  const totalRevenue = filteredBookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);

  if (loading) {
    return <div className="text-center p-10">Loading bookings...</div>;
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

      {/* Real-Time Check-in Counter & Payout Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Tickets</p>
            <p className="text-xl font-bold text-primary">{totalTickets}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Confirmed</p>
            <p className="text-xl font-bold text-primary">{confirmedBookings}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Remaining</p>
            <p className="text-xl font-bold text-primary">{totalTickets - confirmedBookings}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Net Income</p>
            <p className="text-xl font-bold text-primary">ETB {totalRevenue.toLocaleString()}</p>
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
              <option>Timket 2025 (Epiphany)</option>
              <option>Meskel Festival</option>
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
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Cancelled</option>
              <option>Refunded</option>
              <option>Checked-in</option>
              <option>No-show</option>
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
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">Mark Checked-in</Button>
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">Cancel</Button>
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">Refund</Button>
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
                  <p className="text-sm font-bold text-secondary">{booking.currency} {booking.totalPrice}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 capitalize">{booking.paymentStatus}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="secondary" className={`border-none ${
                    booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                    booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {booking.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onViewBooking(booking._id)} className="p-2 bg-white border border-gray-100 rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                      <Eye className="w-4 h-4" />
                    </button>
                    {booking.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleBookingStatusUpdate(booking._id, 'confirmed')}
                          className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          title="Confirm"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleBookingStatusUpdate(booking._id, 'cancelled')}
                          className="p-2 bg-red-50 border border-red-200 rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
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
  const [sortBy, setSortBy] = useState('Newest');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [eventIdToDelete, setEventIdToDelete] = useState<string | null>(null);

  const tabs = ['All', 'Draft', 'Upcoming', 'Live', 'Completed', 'Cancelled'];

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setFestivals(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
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
        setFestivals(prev => prev.filter(f => f.id !== eventIdToDelete));
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
    if (activeTab !== 'All' && f.status !== activeTab) return false;
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Highest Revenue') return b.revenue - a.revenue;
    if (sortBy === 'Most Booked') return b.ticketsSold - a.ticketsSold;
    if (sortBy === 'Soonest Event Date') return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    return 0; // Default Newest
  });

  const totalEvents = festivals.length;
  const activeEvents = festivals.filter(f => ['Live', 'Upcoming'].includes(f.status)).length;
  const totalTickets = festivals.reduce((acc, f) => acc + f.ticketsSold, 0);
  const totalRevenue = festivals.reduce((acc, f) => acc + f.revenue, 0);

  if (loading) {
    return <div className="text-center p-10">Loading your events...</div>;
  }

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
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-serif font-bold text-primary">Your Active & Upcoming Festivals ({festivals.length})</h3>
          {/* Add filtering/sorting options here if needed */}
        </div>

        {festivals.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
            <Layers className="w-12 h-12 mx-auto text-gray-300" />
            <h4 className="mt-6 text-xl font-serif font-bold text-primary">No Festivals Yet</h4>
            <p className="text-gray-400 mt-2">Click 'Create New Festival' to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {festivals.map(festival => (
              <div key={festival._id} onClick={() => onManageEvent(festival._id)} className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer">
                <div className="h-48 overflow-hidden">
                  <img src={festival.coverImage || `https://picsum.photos/seed/${festival._id}/600/400`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={getLocalizedText(festival, 'name', language)} />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-serif font-bold text-primary leading-tight pr-4">{getLocalizedText(festival, 'name', language)}</h4>
                    <Badge variant={new Date(festival.startDate) > new Date() ? 'secondary' : 'success'}>
                      {new Date(festival.startDate) > new Date() ? 'Upcoming' : 'Live'}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider space-y-2">
                    <p className="flex items-center gap-2"><Calendar className="w-3 h-3 text-secondary" /> {new Date(festival.startDate).toLocaleDateString()} - {new Date(festival.endDate).toLocaleDateString()}</p>
                    <p className="flex items-center gap-2"><MapPin className="w-3 h-3 text-secondary" /> {festival.locationName}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" className="flex-1" onClick={() => onManageEvent(festival._id)}>Manage</Button>
                      <Button variant="outline" size="sm" className="flex-1" disabled={festival.verificationStatus === 'Approved'}>View Public</Button>
                    </div>
                     {[(festival as any).verificationStatus === 'Draft', (festival as any).verificationStatus === 'Rejected'].includes(true) && (
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
                               setFestivals(prev => prev.map(f => f._id === festival._id ? { ...f, verificationStatus: 'Pending Review', submittedAt: new Date().toISOString() } : f));
                               alert('Event submitted for review');
                             } else {
                               alert(data.message || 'Failed to submit');
                             }
                           } catch (err) {
                             alert('Error submitting event');
                           }
                         }}
                       >
                         {(festival as any).verificationStatus === 'Rejected' ? 'Resubmit for Review' : 'Submit for Review'}
                       </Button>
                     )}
                    {(festival as any).verificationStatus === 'Pending Review' && (
                      <div className="text-center text-xs text-amber-600 py-1 bg-amber-50 rounded-lg">
                        Awaiting Admin Review
                      </div>
                    )}
                    {festival.verificationStatus === 'Approved' && (
                      <>
                        <div className="text-center text-xs text-emerald-600 py-1 bg-emerald-50 rounded-lg">
                          Published
                        </div>
                        {(festival as any).isEditedAfterApproval && (
                          <div className="text-center text-xs text-amber-600 py-1 bg-amber-50 rounded-lg mt-1">
                            Pending Re-verification
                          </div>
                        )}
                      </>
                    )}
                    {festival.verificationStatus === 'Rejected' && (
                      <div className="space-y-2">
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                          <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Rejection Reason</p>
                          <p className="text-xs text-red-700">{(festival as any).rejectionReason || 'Please edit and resubmit your event'}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-red-600 border-red-200 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onManageEvent(festival._id);
                          }}
                        >
                          Edit & Resubmit
                        </Button>
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
                Are you sure you want to delete <strong className="text-primary">{festivals.find(f => f.id === eventIdToDelete)?.name}</strong>? 
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
  const handleCreate = () => router.push('/dashboard/organizer/create-event');

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
      {loading ? (
        <div className="flex items-center justify-center h-64"><RefreshCw className="w-10 h-10 text-primary animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {festivals.map((festival) => (
            <div key={festival._id} className="bg-white rounded-[32px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="h-48 overflow-hidden">
                <img src={festival.coverImage || 'https://images.unsplash.com/photo-1533174072545-7a4b6dad2cf7?w=800&h=400&fit=crop'} alt={festival.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-primary line-clamp-1">{festival.name}</h3>
                  <Badge variant={festival.status === 'published' ? 'success' : 'warning'}>{festival.status}</Badge>
                </div>
                <p className="text-xs text-gray-400 mb-3">{festival.startDate ? new Date(festival.startDate).toLocaleDateString() : 'TBA'}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <p className="flex items-center gap-1"><Ticket className="w-3 h-3" /> {festival.ticketsSold || 0} sold</p>
                  <p className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ETB {festival.revenue || 0}</p>
                </div>
                <div className="pt-4 border-t border-gray-100 flex gap-3">
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => onManageEvent(festival._id)}>Manage</Button>
                  <Button variant="outline" size="sm" className="flex-1">View Public</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
