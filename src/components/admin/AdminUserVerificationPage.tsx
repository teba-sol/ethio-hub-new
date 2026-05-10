import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, CheckCircle2, XCircle, Eye, Clock,
  FileText, Download, User, ShieldCheck, AlertCircle,
  ChevronRight, Calendar, Mail, Phone, History, Check, Ban, Loader2
} from 'lucide-react';
import { Button, Badge, Input } from '@/components/UI';
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

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// --- Types ---
type VerificationStatus = 'not_submitted' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'modification_requested';

interface VerificationDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

interface VerificationTimeline {
  event: string;
  date: string;
  admin?: string;
  note?: string;
}

interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userRole: 'Organizer' | 'Artisan' | 'Delivery Guy';
  profileCompletion: number;
  registrationDate: string;
  submittedAt: string;
  status: VerificationStatus;
  documents: VerificationDocument[];
  timeline: VerificationTimeline[];
  rejectionReason?: string;
  userAvatar?: string;
  businessName?: string;
  category?: string;
  region?: string;
  city?: string;
  artisanProfile?: any;
  organizerProfile?: any;
  deliveryProfile?: any;
  vehicleType?: string;
  licensePlate?: string;
  vehicleModel?: string;
  gender?: string;
  experience?: number;
  bio?: string;
  address?: string;
  website?: string;
  payoutMethod?: string;
  bankName?: string;
  accountName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  telebirrNumber?: string;
  chapaAccountId?: string;
}

interface VerificationStats {
  notSubmitted: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
}

export const AdminUserVerificationPage: React.FC = () => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [stats, setStats] = useState<VerificationStats>({ pending: 0, underReview: 0, approved: 0, rejected: 0, notSubmitted: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const ITEMS_PER_PAGE = 15;

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'All') params.set('status', filterStatus);
      if (filterRole !== 'All') {
        const roleMap: Record<string, string> = {
          'Organizer': 'organizer',
          'Artisan': 'artisan',
          'Delivery Guy': 'delivery'
        };
        params.set('role', roleMap[filterRole] || filterRole.toLowerCase());
      }
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', page.toString());
      params.set('limit', ITEMS_PER_PAGE.toString());
      if (dateRange.start) params.set('startDate', dateRange.start);
      if (dateRange.end) params.set('endDate', dateRange.end);

      console.log('Fetching user verification with params:', params.toString());
      const res = await fetch(`/api/admin/verification?${params.toString()}`);
      const data = await res.json();
      console.log('Received verification data:', data);
      
      if (data.success) {
        setRequests(data.requests || []);
        setHasMore(data.pagination?.hasMore || false);
      } else {
        console.error('API Error:', data.message);
        if (data.message === 'Authentication required') {
          // Handle session expiry
        }
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus, filterRole, searchQuery, page, dateRange]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/verification/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    setPage(1); // Reset to first page when filters change
  }, [filterStatus, filterRole, searchQuery, dateRange]);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [fetchRequests, fetchStats]);

  const handleApprove = async (id: string, role: 'Organizer' | 'Artisan' | 'Delivery Guy') => {
    // Optimistic UI update
    const previousRequests = [...requests];
    setRequests(prev => prev.map(req =>
      req.id === id ? { ...req, status: 'approved' as VerificationStatus } : req
    ));

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/verification/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: role === 'Delivery Guy' ? 'delivery' : role.toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedRequest(prev => prev?.id === id ? { ...prev, status: 'approved' as VerificationStatus } : prev);
        fetchRequests(true);
        fetchStats();
      } else {
        setRequests(previousRequests); // Rollback on failure
        alert(data.message || 'Failed to approve');
      }
    } catch (error) {
      setRequests(previousRequests); // Rollback on error
      console.error('Failed to approve:', error);
      alert('Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string, role: 'Organizer' | 'Artisan' | 'Delivery Guy') => {
    if (!rejectionReason.trim()) return;

    // Optimistic UI update
    const previousRequests = [...requests];
    setRequests(prev => prev.map(req =>
      req.id === id ? { ...req, status: 'rejected' as VerificationStatus, rejectionReason: rejectionReason.trim() } : req
    ));

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/verification/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason, role: role.toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedRequest(prev => prev?.id === id ? { ...prev, status: 'rejected' as VerificationStatus, rejectionReason: rejectionReason.trim() } : prev);
        setShowRejectionModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
        fetchRequests(true);
        fetchStats();
      } else {
        setRequests(previousRequests); // Rollback on failure
        alert(data.message || 'Failed to reject');
      }
    } catch (error) {
      setRequests(previousRequests); // Rollback on error
      console.error('Failed to reject:', error);
      alert('Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests;

  const StatusBadge = ({ status }: { status: VerificationStatus }) => {
    const statusKey = status === 'not_submitted' ? 'statusNotSubmitted' :
      status === 'submitted' ? 'statusSubmitted' :
        status === 'under_review' ? 'statusUnderReview' :
          status === 'approved' ? 'statusApproved' :
            status === 'rejected' ? 'statusRejected' : 'statusModificationRequested';

    const variant =
      status === 'approved' ? 'success' :
        status === 'rejected' ? 'error' :
          status === 'submitted' ? 'warning' :
            status === 'under_review' ? 'info' : 'secondary';

    return <Badge variant={variant}>{t(statusKey)}</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800">{t("admin.userVerifications")}</h1>
          <p className="text-gray-500 text-sm">{t("admin.userVerificationDesc")}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <Badge variant="warning">Pending</Badge>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.pending}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("admin.pendingRequests")}</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.approved}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("admin.approvedUsers")}</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-red-50 text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <Badge variant="error">Action Needed</Badge>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.rejected}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("admin.rejectedRequests")}</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Eye className="w-6 h-6" />
            </div>
            <Badge variant="info">Reviewing</Badge>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.underReview}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("admin.underReview")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("common.search") + "..."}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="All">{t("common.all")}</option>
              <option value="Organizer">Organizer</option>
              <option value="Artisan">Artisan</option>
              <option value="Delivery Guy">Delivery Guy</option>
            </select>
            <select
              className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">{t("admin.allStatus")}</option>
              <option value="Not Submitted">{t("status.statusNotSubmitted")}</option>
              <option value="Pending">{t("status.statusSubmitted")}</option>
              <option value="Under Review">{t("status.statusUnderReview")}</option>
              <option value="Approved">{t("status.statusApproved")}</option>
              <option value="Rejected">{t("status.statusRejected")}</option>
              <option value="Modification Requested">{t("status.statusModificationRequested")}</option>
            </select>
            <div className="relative">
              <Button
                variant={dateRange.start || dateRange.end ? "primary" : "outline"}
                size="sm"
                leftIcon={Calendar}
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                {dateRange.start && dateRange.end ? `${dateRange.start} - ${dateRange.end}` : 'Date Range'}
              </Button>
              {showDatePicker && (
                <div className="absolute right-0 mt-2 p-4 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 w-64 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Start Date</label>
                    <input
                      type="date"
                      className="w-full p-2 bg-gray-50 border-none rounded-lg text-xs"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">End Date</label>
                    <input
                      type="date"
                      className="w-full p-2 bg-gray-50 border-none rounded-lg text-xs"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1" onClick={() => setShowDatePicker(false)}>Apply</Button>
                    <Button size="sm" variant="ghost" className="flex-1" onClick={() => {
                      setDateRange({ start: '', end: '' });
                      setShowDatePicker(false);
                    }}>Clear</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ShieldCheck className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">{t('admin.noVerificationRequests')}</p>
            <p className="text-gray-400 text-sm">{t('admin.tryAdjustingFilters')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">{t("admin.userVerifications")}</th>
                  <th className="px-6 py-4">{t("admin.businessInfo")}</th>
                  <th className="px-6 py-4">{t("admin.submittedOn")}</th>
                  <th className="px-6 py-4">{t("admin.documents")}</th>
                  <th className="px-6 py-4">{t("admin.status")}</th>
                  <th className="px-6 py-4 text-right">{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0">
                          {req.userAvatar ? (
                            <img src={req.userAvatar} alt={getString(req.userName)} className="w-full h-full object-cover" />
                          ) : (
                            getString(req.userName).charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 truncate">{getString(req.userName)}</p>
                          <p className="text-xs text-gray-500 truncate">{req.userEmail}</p>
                          <p className="text-xs text-gray-400">{req.userPhone || 'No phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {req.userRole === 'Artisan' && (
                          <>
                            <p className="font-medium text-gray-800">{getString(req.businessName || 'N/A')}</p>
                            <p className="text-xs text-gray-500">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold mr-1">
                                {req.category || 'No category'}
                              </span>
                            </p>
                            <p className="text-xs text-gray-400">{req.region}{req.city ? `, ${req.city}` : ''}</p>
                          </>
                        )}
                        {req.userRole === 'Organizer' && (
                          <>
                            <p className="font-medium text-gray-800">{getString(req.businessName || 'N/A')}</p>
                            <p className="text-xs text-gray-400">{req.region}{req.city ? `, ${req.city}` : ''}</p>
                          </>
                        )}
                        {req.userRole === 'Delivery Guy' && (
                          <>
                            <p className="text-sm text-gray-600">{req.vehicleType || 'N/A'}</p>
                            <p className="text-xs text-gray-400">Plate: {req.licensePlate || 'N/A'}</p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(req.submittedAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-500">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{req.documents?.length || 0} {t("documents.files")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRequest(req)}
                        className="group-hover:bg-primary group-hover:text-white transition-all"
                      >
                        {t('admin.review')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl overflow-hidden">
                  {selectedRequest.userAvatar ? (
                    <img src={selectedRequest.userAvatar} alt={getString(selectedRequest.userName)} className="w-full h-full object-cover" />
                  ) : (
                    getString(selectedRequest.userName).charAt(0)
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{getString(selectedRequest.userName)}</h2>
                  <p className="text-sm text-gray-500">{t('admin.verificationRequest')}: {selectedRequest.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Info & Documents */}
              <div className="lg:col-span-8 space-y-8">
                {/* User Info Section */}
                <section>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" /> {t('admin.userInformation')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    {/* Common fields for all roles */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.email')}</p>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-2"><Mail className="w-4 h-4" /> {selectedRequest.userEmail}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.phone')}</p>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-2"><Phone className="w-4 h-4" /> {selectedRequest.userPhone || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.registrationDate')}</p>
                      <p className="text-sm font-medium text-gray-700">{formatDate(selectedRequest.registrationDate)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.submittedOn')}</p>
                      <p className="text-sm font-medium text-gray-700">{formatDate(selectedRequest.submittedAt)}</p>
                    </div>

                    {/* Artisan-specific fields */}
                    {selectedRequest.userRole === 'Artisan' && (
                      <>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.businessName')}</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.artisanProfile?.businessName || selectedRequest.businessName || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.category')}</p>
                          <p className="text-sm font-medium text-gray-700">
                            {selectedRequest.artisanProfile?.category || selectedRequest.category ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                                {selectedRequest.artisanProfile?.category || selectedRequest.category}
                              </span>
                            ) : 'N/A'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">Craft / Experience</p>
                          <p className="text-sm font-medium text-gray-700">
                            {selectedRequest.artisanProfile?.experience || selectedRequest.experience
                              ? `${selectedRequest.artisanProfile?.experience || selectedRequest.experience} years`
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">Gender</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.artisanProfile?.gender || selectedRequest.gender || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.region')}</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.artisanProfile?.region || selectedRequest.region || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.city')}</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.artisanProfile?.city || selectedRequest.city || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.address')}</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.artisanProfile?.address || selectedRequest.address || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">Bio</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.artisanProfile?.bio || selectedRequest.bio || 'N/A'}</p>
                        </div>
                      </>
                    )}

                    {/* Organizer-specific fields */}
                    {selectedRequest.userRole === 'Organizer' && (
                      <>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.businessName')}</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.organizerProfile?.companyName || selectedRequest.businessName || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">Website</p>
                          <p className="text-sm font-medium text-gray-700">
                            {selectedRequest.organizerProfile?.website || selectedRequest.website ? (
                              <a href={selectedRequest.organizerProfile?.website || selectedRequest.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">{selectedRequest.organizerProfile?.website || selectedRequest.website}</a>
                            ) : 'N/A'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.region')}</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.organizerProfile?.region || selectedRequest.region || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.city')}</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.organizerProfile?.city || selectedRequest.city || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.address')}</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.organizerProfile?.address || selectedRequest.address || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">Payout Method</p>
                          <p className="text-sm font-medium text-gray-700 capitalize">{(selectedRequest.organizerProfile?.payoutMethod || selectedRequest.payoutMethod || 'N/A').replace(/([A-Z])/g, ' $1').trim()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">Bio</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.organizerProfile?.bio || selectedRequest.bio || 'N/A'}</p>
                        </div>
                        {selectedRequest.organizerProfile?.payoutMethod === 'bank' && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.paymentInfo')}</p>
                            <p className="text-sm font-medium text-gray-700">
                              {selectedRequest.organizerProfile?.bankName || selectedRequest.bankName || 'N/A'} - {selectedRequest.organizerProfile?.accountHolderName || selectedRequest.accountHolderName || 'N/A'} ({selectedRequest.organizerProfile?.accountNumber || selectedRequest.accountNumber || 'N/A'})
                            </p>
                          </div>
                        )}
                        {selectedRequest.organizerProfile?.payoutMethod === 'telebirr' && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.paymentInfo')}</p>
                            <p className="text-sm font-medium text-gray-700">Telebirr: {selectedRequest.organizerProfile?.telebirrNumber || selectedRequest.telebirrNumber || 'N/A'}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Delivery Guy-specific fields */}
                    {selectedRequest.userRole === 'Delivery Guy' && (
                      <>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">Vehicle Type</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.deliveryProfile?.vehicleType || selectedRequest.vehicleType || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">Vehicle Model</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.deliveryProfile?.vehicleModel || selectedRequest.vehicleModel || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">License Plate</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.deliveryProfile?.licensePlate || selectedRequest.licensePlate || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.region')}</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.deliveryProfile?.region || selectedRequest.region || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.city')}</p>
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.deliveryProfile?.city || selectedRequest.city || 'N/A'}</p>
                        </div>
                        {(selectedRequest.deliveryProfile?.bankName || selectedRequest.bankName) && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.paymentInfo')}</p>
                            <p className="text-sm font-medium text-gray-700">
                              {selectedRequest.deliveryProfile?.bankName || selectedRequest.bankName || 'N/A'} - {selectedRequest.deliveryProfile?.accountNumber || selectedRequest.accountNumber || 'N/A'}
                              {(selectedRequest.deliveryProfile?.telebirrNumber || selectedRequest.telebirrNumber) && ` (Telebirr: ${selectedRequest.deliveryProfile?.telebirrNumber || selectedRequest.telebirrNumber})`}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Artisan payment info */}
                    {selectedRequest.userRole === 'Artisan' && (selectedRequest.artisanProfile?.bankName || selectedRequest.bankName) && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.paymentInfo')}</p>
                        <p className="text-sm font-medium text-gray-700">
                          {selectedRequest.artisanProfile?.bankName || selectedRequest.bankName || 'N/A'} - {selectedRequest.artisanProfile?.accountName || selectedRequest.accountName || 'N/A'} ({selectedRequest.artisanProfile?.accountNumber || selectedRequest.accountNumber || 'N/A'})
                        </p>
                      </div>
                    )}

                    {/* Profile completion for all */}
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-400 uppercase">{t('admin.profileCompletion')}</p>
                        <span className="text-xs font-bold text-primary">{selectedRequest.profileCompletion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all duration-500" style={{ width: `${selectedRequest.profileCompletion}%` }}></div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Documents Section */}
                <section>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> {t('admin.submittedDocuments')}
                  </h3>
                  {selectedRequest.documents.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">{t('admin.noDocumentsUploaded')}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRequest.documents.map((doc) => (
                        <div key={doc.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                          <div className="aspect-video bg-gray-100 relative overflow-hidden">
                            {doc.url.startsWith('data:') ? (
                              <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                            ) : doc.type.includes('image') ? (
                              <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <FileText className="w-12 h-12 mb-2" />
                                <span className="text-xs font-bold uppercase">{doc.type}</span>
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{doc.name}</p>
                              <p className="text-[10px] text-gray-400">{t('admin.uploadedOn')} {formatDate(doc.uploadedAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column: Timeline & Decision */}
              <div className="lg:col-span-4 space-y-8">
                {/* Timeline Section */}
                <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-wider">
                    <History className="w-4 h-4" /> {t('admin.verificationTimeline')}
                  </h3>
                  <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{t('admin.accountCreated')}</p>
                        <p className="text-xs text-gray-500">{formatDate(selectedRequest.registrationDate)}</p>
                      </div>
                    </div>
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{t('admin.documentsSubmitted')}</p>
                        <p className="text-xs text-gray-500">{formatDate(selectedRequest.submittedAt)}</p>
                      </div>
                    </div>
                    {selectedRequest.status === 'approved' && (
                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center z-10">
                          <Check className="w-3 h-3 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-700">{t('admin.approvedStatus')}</p>
                          <p className="text-xs text-gray-500">{t('admin.fullDashboardAccess')}</p>
                        </div>
                      </div>
                    )}
                    {selectedRequest.status === 'rejected' && (
                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-red-500 flex items-center justify-center z-10">
                          <Ban className="w-3 h-3 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-700">{t('admin.rejectedStatus')}</p>
                          {selectedRequest.rejectionReason && (
                            <p className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border border-gray-100 italic">"{selectedRequest.rejectionReason}"</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Decision Panel */}
                <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" /> {t('admin.decisionPanel')}
                  </h3>

                  {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-xs font-bold text-red-700 mb-1">{t('admin.previousRejectionReason')}:</p>
                      <p className="text-xs text-red-600 italic">"{selectedRequest.rejectionReason}"</p>
                    </div>
                  )}

                  {selectedRequest.status === 'approved' ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-emerald-700">
                        {selectedRequest.userRole === 'Artisan' ? t('admin.thisArtisanIsApproved') :
                          selectedRequest.userRole === 'Organizer' ? 'This organizer is approved' :
                            'This delivery guy is approved'}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">{t('admin.fullDashboardAccess')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button
                        className="w-full bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white py-4"
                        leftIcon={actionLoading === selectedRequest.id ? Loader2 : CheckCircle2}
                        onClick={() => handleApprove(selectedRequest.id, selectedRequest.userRole)}
                        disabled={actionLoading === selectedRequest.id}
                      >
                        {actionLoading === selectedRequest.id ? t('admin.loadingVerificationRequests') : t('admin.approveAccount')}
                      </Button>

                      <div className="h-px bg-gray-100 my-4"></div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('admin.rejectionReason')} ({t('common.required')})</label>
                        <textarea
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 outline-none min-h-[100px]"
                          placeholder={t('admin.rejectionReasonRequiredText')}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                      </div>

                      <Button
                        className="w-full bg-red-500 hover:bg-red-600 border-red-500 text-white"
                        variant="outline"
                        leftIcon={actionLoading === selectedRequest.id ? Loader2 : XCircle}
                        disabled={!rejectionReason || actionLoading === selectedRequest.id}
                        onClick={() => handleReject(selectedRequest.id, selectedRequest.userRole)}
                      >
                        {actionLoading === selectedRequest.id ? t('admin.loadingVerificationRequests') : t('admin.rejectRequest')}
                      </Button>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 text-center">
                    {t('admin.approvingWillEnable')}
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && filteredRequests.length > 0 && (
        <div className="px-6 py-4 flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm mt-4">
          <p className="text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-800">{filteredRequests.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="text-[10px] font-bold"
            >
              Previous
            </Button>
            <span className="text-xs font-bold text-gray-600 px-3">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage(p => p + 1)}
              className="text-[10px] font-bold"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Skeleton Loader Component ---
const TableSkeleton = () => (
  <div className="w-full animate-pulse">
    <div className="space-y-0">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
          <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-1/4"></div>
            <div className="h-2 bg-gray-50 rounded w-1/3"></div>
          </div>
          <div className="h-3 bg-gray-100 rounded w-16"></div>
          <div className="h-3 bg-gray-100 rounded w-20"></div>
          <div className="h-8 bg-gray-50 rounded w-24"></div>
        </div>
      ))}
    </div>
  </div>
);

export default AdminUserVerificationPage;
