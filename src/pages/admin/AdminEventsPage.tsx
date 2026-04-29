import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, CheckCircle2, XCircle, Eye, AlertCircle, 
  MapPin, Calendar, Clock, User, DollarSign, FileText, 
  Shield, AlertTriangle, MoreVertical, ChevronDown, 
  CreditCard, Flag, History, Download, Ban, Check,
  LayoutGrid
} from 'lucide-react';
import { Button, Badge, Input } from '../../components/UI';
import { useLanguage } from '@/context/LanguageContext';

// --- Helpers ---
const getString = (val: any): string => {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    if (val.en) return String(val.en);
    if (val.am) return String(val.am);
    return '';
  }
  return String(val || '');
};

// --- Types ---
type VerificationStatus = 'Not Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected';
type AccountStatus = 'Active' | 'Suspended' | 'Deleted';

interface VerificationDocument {
  id: string;
  name: string;
  type: 'ID' | 'License' | 'Permit' | 'Other';
  url: string;
  thumbnail: string;
  expiryDate?: string;
  uploadedAt: string;
}

interface TicketType {
  name: string;
  price: number;
  quantity: number;
}

interface VerificationLog {
  date: string;
  action: VerificationStatus | 'Resubmitted' | 'Account Suspended' | 'Account Activated';
  by: string;
  note?: string;
  reason?: string;
}

interface OrganizerProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  pastEvents: number;
  cancellationRate: string;
  totalRevenue: number;
  reportHistory: number;
  joinedDate: string;
  status: AccountStatus;
}

interface Event {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  images: string[];
  organizer: OrganizerProfile;
  location: {
    venue: string;
    city: string;
    mapUrl?: string;
  };
  date: string;
  time: string;
  ticketTypes: TicketType[];
  vipTicketPrice: number;
  capacity: number;
  schedule: { time: string; activity: string }[];
  hotels: { name: string; distance: string; price: string }[];
  transportation: { type: string; provider: string; details: string }[];
  services: string[];
  policies: string[];
  termsAndConditions: string;
  commissionRate: number;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  submittedAt: string;
  resubmittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  status: VerificationStatus;
  documents: VerificationDocument[];
  riskBadges: string[];
  verificationHistory: VerificationLog[];
  decisionReason?: string;
}

// --- Mock Data ---
const MOCK_EVENTS: Event[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `EVT-${2000 + i}`,
  title: i % 2 === 0 ? 'Meskel Festival Celebration' : 'Timket Grand Procession',
  description: 'A vibrant celebration of Ethiopian culture and heritage with traditional music, dance, and religious ceremonies.',
  bannerImage: `https://picsum.photos/seed/event${i}/800/400`,
  images: [
    `https://picsum.photos/seed/event${i}1/800/600`,
    `https://picsum.photos/seed/event${i}2/800/600`,
    `https://picsum.photos/seed/event${i}3/800/600`
  ],
  organizer: {
    id: `ORG-${100 + i}`,
    name: i % 3 === 0 ? 'Addis Events PLC' : 'Cultural Heritage Tours',
    email: `org${i}@example.com`,
    role: 'Organizer',
    isVerified: i % 3 === 0,
    pastEvents: i * 2 + 1,
    cancellationRate: i === 1 ? '15%' : '2%',
    totalRevenue: 50000 + i * 10000,
    reportHistory: i === 1 ? 2 : 0,
    joinedDate: '2024-01-15',
    status: i === 4 ? 'Suspended' : 'Active'
  },
  location: {
    venue: i % 2 === 0 ? 'Meskel Square' : 'Gondar Fasilides Bath',
    city: i % 2 === 0 ? 'Addis Ababa' : 'Gondar'
  },
  date: new Date(Date.now() + i * 86400000 * 10).toLocaleDateString(),
  time: '14:00 - 20:00',
  ticketTypes: [
    { name: 'Regular', price: 500, quantity: 1000 },
    { name: 'VIP', price: 1500, quantity: 100 }
  ],
  vipTicketPrice: 1500,
  capacity: 1100,
  schedule: [
    { time: '09:00 AM', activity: 'Opening Ceremony' },
    { time: '11:00 AM', activity: 'Morning Workshop' },
    { time: '01:00 PM', activity: 'Traditional Lunch' },
    { time: '03:00 PM', activity: 'Afternoon Performance' }
  ],
  hotels: [
    { name: 'Sheraton Addis', distance: '2.5 km', price: 'ETB 8,500/night' },
    { name: 'Hilton Addis Ababa', distance: '3.1 km', price: 'ETB 7,200/night' }
  ],
  transportation: [
    { type: 'Shuttle', provider: 'Ride Ethiopia', details: 'Available every 30 mins from Meskel Square' },
    { type: 'Private', provider: 'Feres', details: 'Direct booking available via app' }
  ],
  services: ['Free WiFi', 'Translation Services', 'First Aid Station', 'VIP Lounge'],
  policies: [
    'No professional cameras without permit',
    'Refunds available up to 48 hours before event',
    'Must present valid ID at entrance'
  ],
  termsAndConditions: 'No refunds within 24 hours. Alcohol prohibited.',
  commissionRate: 10,
  bankDetails: {
    bankName: 'Commercial Bank of Ethiopia',
    accountNumber: '1000123456789',
    accountName: i % 3 === 0 ? 'Addis Events PLC' : 'Cultural Heritage Tours'
  },
  submittedAt: new Date(Date.now() - i * 3600000 * 5).toLocaleString(),
  status: i === 0 ? 'Pending Review' : i % 3 === 0 ? 'Approved' : i % 4 === 0 ? 'Under Review' : 'Rejected',
  documents: [
    { id: 'D1', name: 'Business License', type: 'License', url: '#', thumbnail: 'https://picsum.photos/seed/doc1/100/100', expiryDate: '2026-12-31', uploadedAt: '2025-10-20' },
    { id: 'D2', name: 'Event Permit', type: 'Permit', url: '#', thumbnail: 'https://picsum.photos/seed/doc2/100/100', uploadedAt: '2025-10-20' }
  ],
  riskBadges: i === 1 ? ['New Organizer', 'High Capacity'] : i === 3 ? ['High Ticket Price'] : [],
  verificationHistory: [
    { date: '2025-10-20 10:00 AM', action: 'Pending Review', by: 'System' }
  ],
  reviewedAt: i % 3 === 0 ? '2025-10-21 02:00 PM' : undefined,
  reviewedBy: i % 3 === 0 ? 'Admin Sarah' : undefined
}));

export const AdminEventsPage: React.FC = () => {
  const { t } = useLanguage();
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal States
  const [viewEvent, setViewEvent] = useState<any | null>(null);
  const [rejectEvent, setRejectEvent] = useState<any | null>(null);
  const [approveEvent, setApproveEvent] = useState<any | null>(null);
  const [resubmitEvent, setResubmitEvent] = useState<any | null>(null);
  const [viewOrganizer, setViewOrganizer] = useState<any | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'All') params.set('status', filterStatus);
      
      const res = await fetch(`/api/admin/events?${params.toString()}`);
      const data = await res.json();
      const eventData = data.requests || data.events || [];
      if (data.success || data.events || data.requests) {
        setEvents(eventData.length > 0 ? eventData : MOCK_EVENTS);
      } else {
        setEvents(MOCK_EVENTS);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filterStatus]);

  const handleApprove = async (id: string) => {
    const previousEvents = [...events];
    setEvents(prev => prev.map(ev => 
      ev.id === id ? { ...ev, verificationStatus: 'approved' } : ev
    ));
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/events/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setApproveEvent(null);
        fetchEvents();
      } else {
        setEvents(previousEvents);
        alert(data.message || 'Failed to approve');
      }
    } catch (error) {
      setEvents(previousEvents);
      console.error('Failed to approve:', error);
      alert('Failed to approve event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) return;
    
    const previousEvents = [...events];
    setEvents(prev => prev.map(ev => 
      ev.id === id ? { ...ev, verificationStatus: 'rejected', rejectionReason: rejectionReason } : ev
    ));
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/events/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        setRejectEvent(null);
        setRejectionReason('');
        fetchEvents();
      } else {
        setEvents(previousEvents);
        alert(data.message || 'Failed to reject');
      }
    } catch (error) {
      setEvents(previousEvents);
      console.error('Failed to reject:', error);
      alert('Failed to reject event');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredEvents = events.filter((event: any) => {
     const statusMap: Record<string, string> = {
         'pending_approval': 'Pending Review',
       'under_review': 'Under Review',
       'approved': 'Approved',
       'rejected': 'Rejected',
       'draft': 'Not Submitted',
     };
    const mappedStatus = statusMap[event.verificationStatus] || event.verificationStatus;
    const matchesStatus = filterStatus === 'All' || mappedStatus === filterStatus;
    const matchesSearch = getString(event.title || event.eventName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           getString(event.organizerName || event.organizer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Rejection State
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionType, setRejectionType] = useState('Incomplete information');

  // Resubmission State
  const [resubmissionNote, setResubmissionNote] = useState('');

  // Approval State
  const [approvalNote, setApprovalNote] = useState('');

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({ start: '', end: '' });

  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  // Toggle action menu
  const toggleActionMenu = (id: string) => {
    setOpenActionMenu(openActionMenu === id ? null : id);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenu(null);
    if (openActionMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openActionMenu]);

  const toggleSelectEvent = (id: string) => {
    if (selectedEventIds.includes(id)) {
      setSelectedEventIds(selectedEventIds.filter(eid => eid !== id));
    } else {
      setSelectedEventIds([...selectedEventIds, id]);
    }
  };

  const handleBulkApprove = () => {
    console.log('Bulk approving:', selectedEventIds);
    setSelectedEventIds([]);
  };

  const handleBulkReject = () => {
    console.log('Bulk rejecting:', selectedEventIds);
    setSelectedEventIds([]);
  };

  const calculateEstimatedCommission = (event: Event) => {
    const totalPotentialRevenue = event.ticketTypes.reduce((acc, ticket) => acc + (ticket.price * ticket.quantity), 0);
    return (totalPotentialRevenue * event.commissionRate) / 100;
  };

   const ResubmitModal = ({ event, onClose }: { event: Event; onClose: () => void }) => (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
       <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
         <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             <AlertCircle className="w-6 h-6 text-amber-500" /> {t("admin.requestResubmission")}
           </h2>
           <button onClick={onClose}><XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
         </div>
         
         <div className="space-y-4">
           <p className="text-sm text-gray-600">
             {t("admin.resubmit.youAreAsking")} <span className="font-bold text-gray-800">{getString(event.organizer.name)}</span> {t("admin.resubmit.toResubmit")} <span className="font-bold text-gray-800">{getString(event.title)}</span>.
           </p>

           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">{t("admin.itemsToCorrect")} <span className="text-red-500">*</span></label>
             <textarea 
               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none min-h-[120px]"
               placeholder={t("admin.itemsToCorrectPlaceholder")}
               value={resubmissionNote}
               onChange={(e) => setResubmissionNote(e.target.value)}
             />
           </div>

           <div className="flex justify-end gap-3 pt-4">
             <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
             <Button className="bg-amber-500 hover:bg-amber-600 border-amber-500 text-white" onClick={() => {
               console.log('Resubmission Requested:', event.id, resubmissionNote);
               onClose();
             }}>
               {t("admin.sendRequest")}
             </Button>
           </div>
         </div>
       </div>
     </div>
   );

  // --- Modals ---

   const OrganizerProfileModal = ({ organizer, onClose }: { organizer: OrganizerProfile; onClose: () => void }) => (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
       <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
         <div className="flex justify-between items-start mb-6">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
               {getString(organizer.name).charAt(0)}
             </div>
             <div>
               <h3 className="font-bold text-gray-800 text-lg">{getString(organizer.name)}</h3>
              <div className="flex items-center gap-2">
                {organizer.isVerified ? 
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span> :
                  <span className="text-xs font-bold text-gray-500">Unverified</span>
                }
                <span className={`text-xs px-2 py-0.5 rounded-full ${organizer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {organizer.status}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose}><XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold">Past Events</p>
              <p className="text-xl font-bold text-gray-800">{organizer.pastEvents}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold">Total Revenue</p>
              <p className="text-xl font-bold text-gray-800">ETB {(organizer.totalRevenue / 1000).toFixed(1)}k</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold">Cancel Rate</p>
              <p className={`text-xl font-bold ${parseInt(organizer.cancellationRate) > 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                {organizer.cancellationRate}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold">Reports</p>
              <p className={`text-xl font-bold ${organizer.reportHistory > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {organizer.reportHistory}
              </p>
            </div>
          </div>
          
          {organizer.reportHistory > 0 && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">Risk Warning</p>
                <p className="text-xs text-red-600">This organizer has a history of reports. Review carefully.</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Close Profile</Button>
        </div>
      </div>
    </div>
  );

   const RejectionModal = ({ event, onClose }: { event: Event; onClose: () => void }) => (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
       <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
         <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             <XCircle className="w-6 h-6 text-red-500" /> {t("admin.rejectEvent")}
           </h2>
           <button onClick={onClose}><XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
         </div>
         
         <div className="space-y-4">
           <p className="text-sm text-gray-600">
             {t("admin.youAreRejecting")} <span className="font-bold text-gray-800">{getString(event.title)}</span>. {t("admin.willNotifyOrganizer")}
           </p>

           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">{t("admin.reasonForRejection")} <span className="text-red-500">*</span></label>
             <select 
               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none"
               value={rejectionType}
               onChange={(e) => setRejectionType(e.target.value)}
             >
               <option value="Incomplete information">{t("admin.reasons.incompleteInfo")}</option>
               <option value="Invalid location">{t("admin.reasons.invalidLocation")}</option>
               <option value="Suspicious activity">{t("admin.reasons.suspiciousActivity")}</option>
               <option value="Policy violation">{t("admin.reasons.policyViolation")}</option>
               <option value="Duplicate event">{t("admin.reasons.duplicateEvent")}</option>
               <option value="Other">{t("admin.reasons.other")}</option>
             </select>
           </div>

           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">{t("admin.customMessage")}</label>
             <textarea 
               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none min-h-[100px]"
               placeholder={t("admin.customMessagePlaceholder")}
               value={rejectionReason}
               onChange={(e) => setRejectionReason(e.target.value)}
             />
           </div>

           <div className="flex justify-end gap-3 pt-4">
             <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
             <Button className="bg-red-500 hover:bg-red-600 border-red-500 text-white" onClick={() => {
               if (rejectionReason.trim()) {
                 handleReject(event.id);
                 onClose();
               } else {
                 alert(t('messages.saving') || 'Please provide a rejection reason');
               }
             }}>
               {t("admin.confirmRejection")}
             </Button>
           </div>
         </div>
       </div>
     </div>
   );

   const ApprovalModal = ({ event, onClose }: { event: Event; onClose: () => void }) => (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
       <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
         <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             <CheckCircle2 className="w-6 h-6 text-emerald-500" /> {t("admin.approveEvent")}
           </h2>
           <button onClick={onClose}><XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
         </div>
         
         <div className="space-y-4">
           <p className="text-sm text-gray-600">
             {t("admin.approveConfirmation").replace('{event}', getString(event.title))}
           </p>

           <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
             <div className="flex justify-between text-sm mb-1">
               <span className="text-emerald-800 font-medium">{t("admin.commissionRate")}:</span>
               <span className="font-bold text-emerald-900">{event.commissionRate}%</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-emerald-800 font-medium">{t("admin.estimatedCommission")}:</span>
               <span className="font-bold text-emerald-900">ETB {calculateEstimatedCommission(event).toLocaleString()}</span>
             </div>
           </div>

           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">{t("admin.optionalNote")}</label>
             <textarea 
               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[80px]"
               placeholder={t("admin.optionalNotePlaceholder")}
               value={approvalNote}
               onChange={(e) => setApprovalNote(e.target.value)}
             />
           </div>

           <div className="flex justify-end gap-3 pt-4">
             <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
             <Button className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white" onClick={() => {
               handleApprove(event.id);
               onClose();
             }}>
               {t("admin.confirmApproval")}
             </Button>
           </div>
         </div>
       </div>
     </div>
   );

  const EventDetailsModal = ({ event, onClose }: { event: Event; onClose: () => void }) => {
    const statusSteps = ['pendingApproval', 'underReview', 'published'];
    const currentStepIndex = statusSteps.indexOf(event.status === 'Rejected' ? 'underReview' : (event.status === 'Approved' ? 'published' : event.status as any));

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{t("events.eventDetails")}</h2>
              <p className="text-sm text-gray-500">ID: {event.id} • Submitted: {event.submittedAt}</p>
            </div>
            <div className="flex gap-2">
        {['pending_approval', 'under_review'].includes((event as any).verificationStatus || event.status) && (
          <>
            <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => setResubmitEvent(event)}>{t("admin.requestResubmission")}</Button>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setRejectEvent(event)}>{t("admin.reject")}</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500" onClick={() => setApproveEvent(event)}>{t("admin.approve")}</Button>
          </>
        )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full ml-2">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {/* Rejection Reason Banner */}
            {(event as any).rejectionReason && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-700">{t("admin.rejectionReason")}</p>
                    <p className="text-xs text-red-600 mt-1">{(event as any).rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Re-verification Banner */}
            {(event as any).isEditedAfterApproval && (event as any).verificationStatus === 'Pending Review' && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-700">{t("status.pendingReVerification")}</p>
                    <p className="text-xs text-amber-600 mt-1">{t("admin.organizerChanges")}</p>
                    {(event as any).lastEditedAt && (
                      <p className="text-[10px] text-amber-500 mt-1">{t("admin.lastEdited")} {new Date((event as any).lastEditedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="mb-10">
              <div className="flex items-center justify-between max-w-2xl mx-auto relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
                <div 
                  className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500" 
                  style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                ></div>
                
                {statusSteps.map((step, idx) => (
                  <div key={step} className="relative z-10 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                      idx <= currentStepIndex 
                        ? 'bg-emerald-500 border-emerald-100 text-white' 
                        : 'bg-white border-gray-100 text-gray-300'
                    }`}>
                      {idx < currentStepIndex ? <Check className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                    </div>
                     <span className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${idx <= currentStepIndex ? 'text-emerald-600' : 'text-gray-400'}`}>
                       {t(`status.${step}`)}
                     </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Event Media & Core Info (8 cols) */}
              <div className="lg:col-span-8 space-y-8">
                 {/* Media Gallery */}
                 <div className="space-y-4">
                   <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                     <LayoutGrid className="w-5 h-5 text-primary" /> {t("events.sections.media")}
                   </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <img src={event.bannerImage} className="w-full h-80 object-cover rounded-2xl shadow-sm" alt="Banner" />
                    </div>
                    {event.images.map((img, idx) => (
                      <div key={idx} className="h-40 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                        <img src={img} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" alt={`Gallery ${idx}`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core Information */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> {t("events.sections.coreInfo")}
                  </h3>
                  <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">{getString(event.title)}</h1>
                  <p className="text-gray-600 leading-relaxed mb-6">{getString(event.description)}</p>
                   
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t("events.date")}</p>
                      <p className="text-sm font-bold text-gray-800 flex items-center gap-1">
                         <Calendar className="w-3.5 h-3.5 text-primary" /> {getString(event.date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t("events.time")}</p>
                      <p className="text-sm font-bold text-gray-800 flex items-center gap-1">
                         <Clock className="w-3.5 h-3.5 text-primary" /> {getString(event.time)}
                      </p>
                    </div>
                     <div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t("events.location")}</p>
                       <p className="text-sm font-bold text-gray-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary" /> {getString(event.location.city)}
                       </p>
                     </div>
                     <div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t("events.capacity")}</p>
                       <p className="text-sm font-bold text-gray-800 flex items-center gap-1">
                         <Shield className="w-3.5 h-3.5 text-primary" /> {event.capacity}
                       </p>
                     </div>
                  </div>
                </div>

                {/* Schedule & Logistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Clock className="w-4 h-4" /> {t("events.sections.schedule")}
                     </h3>
                    <div className="space-y-4">
                      {event.schedule.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                          <span className="text-xs font-bold text-primary">{item.time}</span>
                          <span className="text-xs text-gray-700 font-medium">{item.activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                     <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                       <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <MapPin className="w-4 h-4" /> {t("events.sections.hotels")}
                       </h3>
                      <div className="space-y-4">
                       {Array.isArray(event.hotels) ? event.hotels.map((h, i) => (
                             <div key={i} className="text-xs flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                               <div>
                                 <p className="font-bold text-gray-800">{h.name}</p>
                                 <p className="text-[10px] text-gray-500">{h.distance}</p>
                               </div>
                               <span className="font-bold text-primary">{h.price}</span>
                             </div>
                           )) : []}
                      </div>
                    </div>

                     <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                       <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <Flag className="w-4 h-4" /> {t("events.sections.transportation")}
                       </h3>
                      <div className="space-y-3">
                         {Array.isArray(event.transportation) ? event.transportation.map((t, i) => (
                           <div key={i} className="p-3 bg-gray-50 rounded-xl">
                             <p className="text-[10px] font-bold text-primary uppercase mb-1">{t.type} • {t.provider}</p>
                             <p className="text-[10px] text-gray-600 leading-tight">{t.details}</p>
                           </div>
                         )) : []}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> {t("events.submittedDocuments")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.documents.map((doc) => (
                      <div key={doc.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          <img src={doc.thumbnail} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm truncate">{doc.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{doc.type}</p>
                          {doc.expiryDate && (
                            <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Expires: {doc.expiryDate}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button className="p-2 bg-gray-50 text-gray-500 hover:bg-primary hover:text-white rounded-lg transition-all" title={t("documents.preview")}>
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 bg-gray-50 text-gray-500 hover:bg-primary hover:text-white rounded-lg transition-all" title={t("documents.download")}>
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Organizer, Pricing, Policies (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Pricing Card */}
                <div className="bg-[#1a1c23] p-6 rounded-[24px] text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Pricing Structure
                  </h3>
                  <div className="space-y-6">
                    {event.ticketTypes.map((ticket, i) => (
                      <div key={i} className="flex justify-between items-end border-b border-white/10 pb-4">
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase">{ticket.name} Ticket</p>
                          <p className="text-2xl font-bold">ETB {ticket.price.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500">Allocation</p>
                          <p className="text-sm font-bold">{ticket.quantity}</p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <div className="flex justify-between text-sm text-emerald-400 font-bold">
                        <span>Platform Commission ({event.commissionRate}%)</span>
                        <span>ETB {calculateEstimatedCommission(event).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services & Policies */}
                 <div className="space-y-4">
                   <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Shield className="w-4 h-4" /> {t("events.sections.servicesPolicies")}
                     </h3>
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t("events.includedServices")}</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(event.services) ? event.services.map((s: any, i: number) => (
                              <span key={`service-${i}`} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">
                                {typeof s === 'string' ? s : (s?.name || s?.description || 'Service')}
                              </span>
                            )) : null}
                          </div>
                       </div>
                       <div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t("events.eventPolicies")}</p>
                        <ul className="space-y-3">
                          {(event.policies || []).map((p, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organizer Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">{t("events.sections.organizerInfo")}</h3>
                    <Button size="sm" variant="ghost" onClick={() => setViewOrganizer(event.organizer)}>{t("admin.viewProfile")}</Button>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                      {getString(event.organizer.name).charAt(0)}
                    </div>
                    <div>
                       <p className="font-bold text-gray-900">{getString(event.organizer.name)}</p>
                      <p className="text-xs text-gray-500">{event.organizer.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{t("events.pastEvents")}</p>
                      <p className="text-lg font-bold text-gray-800">{event.organizer.pastEvents}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{t("events.verified")}</p>
                      <p className={`text-lg font-bold ${event.organizer.isVerified ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {event.organizer.isVerified ? t("common.yes") : t("common.no")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Indicators */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {t("events.sections.risk")}
                  </h3>
                  <div className="space-y-3">
                    {event.riskBadges.length > 0 ? (
                      event.riskBadges.map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100">
                          <AlertTriangle className="w-4 h-4 shrink-0" /> {badge}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> {t("events.lowRisk")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Modals */}
      {viewEvent && <EventDetailsModal event={viewEvent} onClose={() => setViewEvent(null)} />}
      {rejectEvent && <RejectionModal event={rejectEvent} onClose={() => setRejectEvent(null)} />}
      {approveEvent && <ApprovalModal event={approveEvent} onClose={() => setApproveEvent(null)} />}
      {resubmitEvent && <ResubmitModal event={resubmitEvent} onClose={() => setResubmitEvent(null)} />}
      {viewOrganizer && <OrganizerProfileModal organizer={viewOrganizer} onClose={() => setViewOrganizer(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800">{t("admin.eventVerifications")}</h1>
          <p className="text-gray-500 text-sm">{t("admin.eventVerificationDesc")}</p>
        </div>
        
        {/* Bulk Actions */}
        {selectedEventIds.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-bold text-gray-600 bg-white px-3 py-2 rounded-xl border border-gray-200">
              {selectedEventIds.length} Selected
            </span>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500" onClick={handleBulkApprove}>
              Approve All
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleBulkReject}>
              Reject All
            </Button>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder={t("common.search") + "..."} 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <select className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer hover:bg-gray-100">
            <option value="All">All Cities</option>
            <option value="Addis Ababa">Addis Ababa</option>
            <option value="Gondar">Gondar</option>
            <option value="Lalibela">Lalibela</option>
          </select>
          <div className="w-px h-8 bg-gray-200 mx-2 hidden xl:block"></div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-9 pr-8 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer hover:bg-gray-100 appearance-none"
              >
                <option value="All">{t("common.all")}</option>
                <option value="Pending Review">{t("status.pendingApproval")}</option>
                <option value="Under Review">{t("status.underReview")}</option>
                <option value="Approved">{t("status.approved")}</option>
                <option value="Rejected">{t("status.rejected")}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  dateRange.start || dateRange.end 
                    ? 'bg-primary/5 border-primary text-primary' 
                    : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {dateRange.start || dateRange.end ? 'Date Filter Active' : 'Date Range'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
              </button>

              {showDatePicker && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-30 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-gray-50 border-none rounded-lg text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20"
                        value={tempDateRange.start}
                        onChange={(e) => setTempDateRange({ ...tempDateRange, start: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-gray-50 border-none rounded-lg text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20"
                        value={tempDateRange.end}
                        onChange={(e) => setTempDateRange({ ...tempDateRange, end: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="flex-1 text-[10px]"
                        onClick={() => {
                          setTempDateRange({ start: '', end: '' });
                          setDateRange({ start: '', end: '' });
                          setShowDatePicker(false);
                        }}
                      >
                        Clear
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 text-[10px]"
                        onClick={() => {
                          setDateRange(tempDateRange);
                          setShowDatePicker(false);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
             <h3 className="text-lg font-bold text-gray-800 mb-2">{t("common.noResults")}</h3>
             <p className="text-gray-500 text-sm">{t("events.noMatchFilters")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedEventIds.length === filteredEvents.length && filteredEvents.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedEventIds(filteredEvents.map(ev => ev.id));
                        else setSelectedEventIds([]);
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{t("admin.organizer")}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{t("events.title")}</th>
                <th className="px-6 py4 text-xs font-bold text-gray-500 uppercase tracking-widest">{t("admin.submittedOn")}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{t("admin.documents")}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{t("admin.status")}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedEventIds.includes(event.id)}
                      onChange={() => toggleSelectEvent(event.id)}
                    />
                  </td>
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                         {getString(event.organizer?.name || 'U').charAt(0)}
                       </div>
                      <div className="min-w-0">
                         <p className="text-sm font-bold text-gray-800 truncate">{getString(event.organizer?.name || 'Unknown')}</p>
                         <p className="text-[10px] text-gray-500 truncate">{getString(event.organizer?.email || '')}</p>
                         <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">{getString(event.organizer?.role || 'Organizer')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-800">{getString(event.title || event.eventName || 'Untitled')}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                       <MapPin className="w-3 h-3" /> {getString(event.location?.city || 'N/A')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{formatDate(event.submittedAt)}</p>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-gray-50">
                          {(event.documents?.length || 0)} {t("documents.files")}
                        </Badge>
                        <button 
                          className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                          title={t("documents.preview")}
                          onClick={() => setViewEvent(event)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                  </td>
                  <td className="px-6 py-4">
                   <Badge variant={
                       event.verificationStatus === 'approved' || event.verificationStatus === 'Approved' ? 'success' : 
                       event.verificationStatus === 'rejected' || event.verificationStatus === 'Rejected' ? 'error' : 
                       event.verificationStatus === 'under_review' || event.verificationStatus === 'Under Review' ? 'info' : 
                       (event.verificationStatus === 'pending_approval' || event.verificationStatus === 'Pending Approval') ? 'warning' : 'secondary'
                      }>
                        {event.verificationStatus === 'approved' || event.verificationStatus === 'Approved' ? t("status.published") : 
                         event.verificationStatus === 'rejected' || event.verificationStatus === 'Rejected' ? t("status.rejected") : 
                         event.verificationStatus === 'under_review' || event.verificationStatus === 'Under Review' ? t("status.underReview") : 
                         (event.verificationStatus === 'pending_approval' || event.verificationStatus === 'Pending Approval') ? 
                           ((event as any).reverificationRequested ? t("status.pendingReVerification") : t("status.pendingApproval")) : 
                           event.status || t("status.draft")}
                      </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 items-center">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest"
                         onClick={() => setViewEvent(event)}
                       >
                         {t("admin.review")}
                       </Button>
                      {['Pending Review', 'Under Review', 'pending_review', 'under_review'].includes(event.status) ? (
                        <div className="relative">
                          <button 
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 bg-gray-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActionMenu(event.id);
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openActionMenu === event.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20">
                               <button 
                                 className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setApproveEvent(event);
                                   setOpenActionMenu(null);
                                 }}
                               >
                                 <Check className="w-3.5 h-3.5" /> {t("admin.approve")}
                               </button>
                               <button 
                                 className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setRejectEvent(event);
                                   setOpenActionMenu(null);
                                 }}
                               >
                                 <Ban className="w-3.5 h-3.5" /> {t("admin.reject")}
                               </button>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
