import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, CheckCircle2, XCircle, Eye, Clock, 
  FileText, Download, User, ShieldCheck, AlertCircle,
  ChevronRight, Calendar, Mail, Phone, History, Check, Ban, Loader2
} from 'lucide-react';
import { Button, Badge, Input } from '../../components/UI';

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
  userRole: 'Organizer' | 'Artisan';
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
}

interface VerificationStats {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
}

export const AdminUserVerificationPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [stats, setStats] = useState<VerificationStats>({ pending: 0, underReview: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'All') params.set('status', filterStatus);

      const res = await fetch(`/api/admin/verification?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

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
    fetchRequests();
    fetchStats();
  }, [fetchRequests, fetchStats]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/verification/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSelectedRequest(null);
        fetchRequests();
        fetchStats();
      } else {
        alert(data.message || 'Failed to approve');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve artisan');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/verification/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRejectionModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
        fetchRequests();
        fetchStats();
      } else {
        alert(data.message || 'Failed to reject');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject artisan');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesRole = filterRole === 'All' || req.userRole === filterRole;
    const matchesSearch = req.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          req.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = (!dateRange.start || new Date(req.submittedAt) >= new Date(dateRange.start)) &&
                        (!dateRange.end || new Date(req.submittedAt) <= new Date(dateRange.end));

    return matchesRole && matchesSearch && matchesDate;
  });

  const StatusBadge = ({ status }: { status: VerificationStatus }) => {
    switch (status) {
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'rejected': return <Badge variant="error">Rejected</Badge>;
      case 'submitted': return <Badge variant="warning">Pending</Badge>;
      case 'under_review': return <Badge variant="info">Under Review</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800">User Verification</h1>
          <p className="text-gray-500 text-sm">Review and verify artisan and organizer accounts.</p>
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
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Requests</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.approved}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Approved Users</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-red-50 text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <Badge variant="error">Action Needed</Badge>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.rejected}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rejected Requests</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Eye className="w-6 h-6" />
            </div>
            <Badge variant="info">Reviewing</Badge>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.underReview}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Under Review</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
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
              <option value="All">All Roles</option>
              <option value="Organizer">Organizer</option>
              <option value="Artisan">Artisan</option>
            </select>
            <select 
              className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Submitted">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
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
        
        <div className="flex gap-2 border-t border-gray-50 pt-4 overflow-x-auto">
          {['All Requests', 'Organizer Requests', 'Artisan Requests', 'Pending', 'Approved', 'Rejected'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                if (tab.includes('Organizer')) setFilterRole('Organizer');
                else if (tab.includes('Artisan')) setFilterRole('Artisan');
                else setFilterRole('All');

                if (tab === 'Pending') setFilterStatus('Submitted');
                else if (tab === 'Approved') setFilterStatus('Approved');
                else if (tab === 'Rejected') setFilterStatus('Rejected');
                else setFilterStatus('All');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                (tab === 'All Requests' && filterStatus === 'All' && filterRole === 'All') ||
                (tab === 'Organizer Requests' && filterRole === 'Organizer') ||
                (tab === 'Artisan Requests' && filterRole === 'Artisan') ||
                (tab === 'Pending' && filterStatus === 'Submitted') ||
                (tab === 'Approved' && filterStatus === 'Approved') ||
                (tab === 'Rejected' && filterStatus === 'Rejected')
                ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-500">Loading verification requests...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ShieldCheck className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No verification requests found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Business</th>
                  <th className="px-6 py-4">Submitted On</th>
                  <th className="px-6 py-4">Documents</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                          {req.userAvatar ? (
                            <img src={req.userAvatar} alt={req.userName} className="w-full h-full object-cover" />
                          ) : (
                            req.userName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{req.userName}</p>
                          <p className="text-xs text-gray-500">{req.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-700">{req.businessName || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{req.category || ''}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{req.submittedAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-500">
                        <FileText className="w-4 h-4" />
                        <span>{req.documents.length} files</span>
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
                        Review
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
                    <img src={selectedRequest.userAvatar} alt={selectedRequest.userName} className="w-full h-full object-cover" />
                  ) : (
                    selectedRequest.userName.charAt(0)
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedRequest.userName}</h2>
                  <p className="text-sm text-gray-500">Verification Request: {selectedRequest.id}</p>
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
                    <User className="w-5 h-5 text-primary" /> User Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">Email</p>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-2"><Mail className="w-4 h-4" /> {selectedRequest.userEmail}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">Phone</p>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-2"><Phone className="w-4 h-4" /> {selectedRequest.userPhone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">Business Name</p>
                      <p className="text-sm font-medium text-gray-700">{selectedRequest.businessName || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">Category</p>
                      <p className="text-sm font-medium text-gray-700">{selectedRequest.category || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">Region</p>
                      <p className="text-sm font-medium text-gray-700">{selectedRequest.region || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">City</p>
                      <p className="text-sm font-medium text-gray-700">{selectedRequest.city || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">Registration Date</p>
                      <p className="text-sm font-medium text-gray-700">{selectedRequest.registrationDate}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">Submitted At</p>
                      <p className="text-sm font-medium text-gray-700">{selectedRequest.submittedAt}</p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-400 uppercase">Profile Completion</p>
                        <span className="text-xs font-bold text-primary">{selectedRequest.profileCompletion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all duration-500" style={{ width: `${selectedRequest.profileCompletion}%` }}></div>
                      </div>
                    </div>
                    {selectedRequest.artisanProfile?.bio && (
                      <div className="md:col-span-2 space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">Bio</p>
                        <p className="text-sm font-medium text-gray-700">{selectedRequest.artisanProfile.bio}</p>
                      </div>
                    )}
                    {selectedRequest.artisanProfile?.address && (
                      <div className="md:col-span-2 space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">Address</p>
                        <p className="text-sm font-medium text-gray-700">{selectedRequest.artisanProfile.address}</p>
                      </div>
                    )}
                    {selectedRequest.artisanProfile?.bankName && (
                      <div className="md:col-span-2 space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">Payment Info</p>
                        <p className="text-sm font-medium text-gray-700">
                          {selectedRequest.artisanProfile.bankName} - {selectedRequest.artisanProfile.accountName} ({selectedRequest.artisanProfile.accountNumber})
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Documents Section */}
                <section>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> Submitted Documents
                  </h3>
                  {selectedRequest.documents.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No documents uploaded</p>
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
                              <p className="text-[10px] text-gray-400">Uploaded on {doc.uploadedAt}</p>
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
                    <History className="w-4 h-4" /> Verification Timeline
                  </h3>
                  <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Account Created</p>
                        <p className="text-xs text-gray-500">{selectedRequest.registrationDate}</p>
                      </div>
                    </div>
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Documents Submitted</p>
                        <p className="text-xs text-gray-500">{selectedRequest.submittedAt}</p>
                      </div>
                    </div>
                    {selectedRequest.status === 'approved' && (
                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center z-10">
                          <Check className="w-3 h-3 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-700">Approved</p>
                          <p className="text-xs text-gray-500">Artisan can now access dashboard</p>
                        </div>
                      </div>
                    )}
                    {selectedRequest.status === 'rejected' && (
                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-red-500 flex items-center justify-center z-10">
                          <Ban className="w-3 h-3 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-700">Rejected</p>
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
                    <ShieldCheck className="w-5 h-5 text-primary" /> Decision Panel
                  </h3>
                  
                  {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-xs font-bold text-red-700 mb-1">Previous Rejection Reason:</p>
                      <p className="text-xs text-red-600 italic">"{selectedRequest.rejectionReason}"</p>
                    </div>
                  )}

                  {selectedRequest.status === 'approved' ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-emerald-700">This artisan is approved</p>
                      <p className="text-xs text-emerald-600 mt-1">They have full access to their dashboard</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button 
                        className="w-full bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white py-4"
                        leftIcon={actionLoading === selectedRequest.id ? Loader2 : CheckCircle2}
                        onClick={() => handleApprove(selectedRequest.id)}
                        disabled={actionLoading === selectedRequest.id}
                      >
                        {actionLoading === selectedRequest.id ? 'Approving...' : 'Approve Account'}
                      </Button>
                      
                      <div className="h-px bg-gray-100 my-4"></div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Rejection Reason (Required)</label>
                        <textarea 
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 outline-none min-h-[100px]"
                          placeholder="Explain why the request is being rejected..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                      </div>
                      
                      <Button 
                        className="w-full bg-red-500 hover:bg-red-600 border-red-500 text-white"
                        variant="outline"
                        leftIcon={actionLoading === selectedRequest.id ? Loader2 : XCircle}
                        disabled={!rejectionReason || actionLoading === selectedRequest.id}
                        onClick={() => handleReject(selectedRequest.id)}
                      >
                        {actionLoading === selectedRequest.id ? 'Rejecting...' : 'Reject Request'}
                      </Button>
                    </div>
                  )}
                  
                  <p className="text-[10px] text-gray-400 text-center">
                    Approving will automatically enable artisan features and grant dashboard access.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
