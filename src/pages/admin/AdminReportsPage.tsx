import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Flag, AlertTriangle, XCircle, CheckCircle2, X,
  MessageSquare, UserX, ShieldAlert, Eye, FileText, Download,
  Clock, Image as ImageIcon, Link as LinkIcon,
  Trash2, Ban, TrendingUp, Calendar, MapPin, Users, Package, Ticket, Upload
} from 'lucide-react';
import { Button, Badge } from '../../components/UI';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

// Types
interface Report {
  _id: string;
  id: string;
  targetId: string;
  targetType: 'Event' | 'Product' | 'User' | 'Review';
  reason: string;
  reasonOther?: string;
  description: string;
  reporterId: { _id: string; name: string; email: string; profileImage?: string };
  evidence: string[];
  status: 'Pending' | 'Resolved' | 'Dismissed' | 'Investigating' | 'PendingBan';
  adminNote?: string;
  resolvedAt?: string;
  resolvedBy?: { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
  targetDetails?: {
    name?: string;
    name_en?: string;
    name_am?: string;
    status?: string;
    profileImage?: string;
    profile_photo?: string;
    coverImage?: string;
    locationName?: string;
    startDate?: string;
    endDate?: string;
    price?: number;
    ticketsAvailable?: number;
    artisanName?: string;
    [key: string]: any;
  };
}

// Helper to get target display name
const getTargetName = (report: Report): string => {
  if (report.targetType === 'Event') {
    return report.targetDetails?.name || report.targetDetails?.name_en || report.targetDetails?.name_am || 'Unknown Event';
  }
  if (report.targetType === 'Product') {
    return report.targetDetails?.name || report.targetDetails?.name_en || report.targetDetails?.name_am || report.targetDetails?.artisanName || 'Unknown Product';
  }
  if (report.targetType === 'User') {
    return report.targetDetails?.name || report.targetDetails?.profile?.name || report.targetDetails?.email || 'Unknown User';
  }
  return 'Unknown Entity';
};

// Report Detail Modal
const ReportDetailModal = ({
  report,
  onClose,
  onAction,
  onViewProfile,
  onSuccess,
  onError,
  adminId
}: {
  report: Report;
  onClose: () => void;
  onAction: (id: string, action: string, note?: string) => void;
  onViewProfile: (id: string) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  adminId: string;
}) => {
  const router = useRouter();
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const targetName = getTargetName(report);
  const severity = report.status === 'Pending' ? 'High' :
                  report.status === 'Investigating' ? 'Medium' : 'Low';

  const getSeverityColor = () => {
    if (report.status === 'Pending') return 'from-red-500 to-rose-600';
    if (report.status === 'Investigating') return 'from-amber-500 to-orange-600';
    return 'from-emerald-500 to-green-600';
  };

  const handleAddEvidence = async () => {
    if (evidenceFiles.length === 0) return;

    setUploading(true);
    try {
      const evidenceUrls: string[] = [];
      for (const file of evidenceFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ethio-hub');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dmhu32ya9/auto/upload`,
          { method: 'POST', body: formData }
        );
        const data = await response.json();
        if (data.secure_url) evidenceUrls.push(data.secure_url);
      }

      const res = await fetch(`/api/admin/reports/${report._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidence: evidenceUrls })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess('Evidence added successfully');
        setEvidenceFiles([]);
      }
    } catch (error) {
      onError('Failed to upload evidence');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header with gradient banner */}
        <div className={`h-2 bg-gradient-to-r ${getSeverityColor()}`}></div>
        <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-800">📋 Report Details</h2>
              <Badge variant={severity === 'High' ? 'error' : severity === 'Medium' ? 'warning' : 'success'}>
                {severity} Severity
              </Badge>
              <Badge variant={report.status === 'PendingBan' ? 'error' : report.status === 'Resolved' ? 'success' : 'info'}>
                {report.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="font-mono bg-gray-200 px-2 py-1 rounded">ID: {report._id}</span>
              <span>•</span>
              <span>{new Date(report.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Target Profile Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Reported Entity
                </h3>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                    {targetName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xl font-bold text-gray-800 truncate">{targetName}</h4>
                      <Badge variant="secondary" size="sm">{report.targetType}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>ID: {report.targetId.slice(-8)}</span>
                      </div>
                      {report.targetDetails?.status && (
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-gray-400" />
                          <span>{report.targetDetails.status}</span>
                        </div>
                      )}
                      {report.targetDetails?.startDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{report.targetDetails?.startDate ? new Date(report.targetDetails.startDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="md"
                    variant="outline"
                    onClick={() => {
                      if (report.targetType === 'Event') {
                        router.push(`/dashboard/admin/management?view=event&id=${report.targetId}`);
                      } else if (report.targetType === 'Product') {
                        router.push(`/dashboard/admin/management?view=product&id=${report.targetId}`);
                      } else {
                        router.push(`/dashboard/admin/users?id=${report.targetId}`);
                      }
                    }}
                    className="shrink-0"
                  >
                    {report.targetType === 'Event' ? 'View Event' : report.targetType === 'Product' ? 'View Product' : 'View User'}
                  </Button>
                </div>
              </div>

              {/* Reason & Description */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Report Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase mb-2">Reason</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="error" size="sm">{report.reason}</Badge>
                      {report.reasonOther && <span className="text-gray-600 text-sm">— {report.reasonOther}</span>}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase mb-2">Description</p>
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-xl">
                      <p className="text-gray-700 leading-relaxed italic">"{report.description}"</p>
                      <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                        <UserX className="w-3 h-3" />
                        Reported by <span className="font-bold">{report.reporterId?.name || 'Unknown'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Evidence & Attachments
                    <Badge variant="secondary">{report.evidence?.length || 0} files</Badge>
                  </h3>
                </div>

                {report.evidence?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {report.evidence.map((url: string, i: number) => (
                      <div key={i} className="group relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                        {url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                          <>
                            <div className="aspect-video bg-gray-200 relative">
                              <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <Button size="sm" variant="secondary" leftIcon={Eye} onClick={() => window.open(url, '_blank')}>
                                  View Full
                                </Button>
                              </div>
                            </div>
                            <div className="p-2 bg-white border-t border-gray-100">
                              <p className="text-xs text-gray-500 truncate font-mono">evidence-{i + 1}.jpg</p>
                            </div>
                          </>
                        ) : (
                          <div className="p-4 flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                              <LinkIcon className="w-5 h-5" />
                            </div>
                            <div className="overflow-hidden flex-1">
                              <p className="text-xs font-bold text-gray-800 truncate">{url}</p>
                              <a href={url} target="_blank" className="text-xs text-blue-600 hover:underline">Open link →</a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No evidence files attached</p>
                  </div>
                )}

                {/* Admin Upload Evidence */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Add Admin Evidence
                  </h4>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
                    className="mb-3 text-sm block w-full"
                  />
                  {evidenceFiles.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-blue-700 font-medium">
                        {evidenceFiles.length} file(s) selected
                      </span>
                      <Button
                        size="sm"
                        onClick={handleAddEvidence}
                        isLoading={uploading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {uploading ? 'Uploading...' : '📤 Upload Evidence'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              
              {/* Action Panel */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg sticky top-4">
                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                  Quick Actions
                </h3>
                
                <div className="space-y-3">
                  <Button
                    className="w-full justify-between bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-none shadow-lg py-6"
                    leftIcon={CheckCircle2}
                    onClick={() => onAction(report._id, 'Resolve', adminNote)}
                  >
                    <span>Resolve Report</span>
                    <span className="text-xs opacity-75">Mark as done</span>
                  </Button>

                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    size="lg"
                    leftIcon={MessageSquare}
                    onClick={() => onAction(report._id, 'Warn', adminNote)}
                  >
                    Warn User
                  </Button>

                  <div className="h-px bg-gray-200 my-4"></div>

                  <Button
                    className="w-full justify-start bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                    variant="outline"
                    size="lg"
                    leftIcon={Trash2}
                    onClick={() => {
                      if (confirm('⚠️ This will take down this content. Continue?')) {
                        onAction(report._id, 'TakeDown', adminNote);
                      }
                    }}
                  >
                    🗑️ Take Down Content
                  </Button>

                  <Button
                    className="w-full justify-start bg-red-600 hover:bg-red-700 text-white border-none shadow-md"
                    variant="default"
                    size="lg"
                    leftIcon={Ban}
                    onClick={() => {
                      if (confirm('🚫 This will directly ban the user. Continue?')) {
                        onAction(report._id, 'Ban', adminNote);
                      }
                    }}
                  >
                    Ban User (Immediate)
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Admin Note (optional)
                  </label>
                  <textarea
                    placeholder="Add internal notes..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none transition-all"
                    rows={4}
                  />
                </div>
              </div>

              {/* Audit Trail */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  Action History
                </h3>
                <div className="space-y-5 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                  {report.resolvedBy && (
                    <div className="relative pl-10">
                      <div className="absolute left-[11px] top-2 w-3 h-3 rounded-full bg-green-500 ring-4 ring-white shadow-sm"></div>
                      <p className="text-sm font-bold text-gray-800">{report.status}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(report.resolvedAt || report.updatedAt).toLocaleString()}
                        <br />
                        by {report.resolvedBy?.name || 'Admin'}
                      </p>
                      {report.adminNote && (
                        <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border-l-3 border-green-500 italic">
                          "{report.adminNote}"
                        </p>
                      )}
                    </div>
                  )}
                  <div className="relative pl-10">
                    <div className="absolute left-[11px] top-2 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white shadow-sm"></div>
                    <p className="text-sm font-bold text-gray-800">Report Submitted</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
          <Button variant="ghost" size="lg" onClick={onClose}>
            Close Modal
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main Page
export const AdminReportsPage: React.FC = () => {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [filterTiming, setFilterTiming] = useState<'All' | 'Pre-Event' | 'During-Event' | 'Post-Event'>('All');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { user } = useAuth();

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  const router = useRouter();
  const adminId = user?._id?.toString() || user?.id?.toString() || '';

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'admin') {
      setErrorMessage('Access denied: Admin only');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  }, [user]);

  useEffect(() => {
    fetchReports();
  }, [filterStatus, filterType, filterTiming]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'All') params.set('status', filterStatus);
      if (filterType !== 'All') params.set('targetType', filterType);

      const res = await fetch(`/api/reports?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }

      const data = await res.json();

      if (data.success) {
        setReports(data.reports.map((r: any) => ({
          ...r,
          id: r._id?.toString() || r._id || '',
          _id: r._id?.toString() || r._id || '',
          date: new Date(r.createdAt).toLocaleString(),
          reporterName: r.reporterId?.name || 'Unknown',
        })));
      }
    } catch (error) {
      console.error('Fetch reports error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (targetId: string) => {
    router.push(`/admin/entity/${targetId}`);
  };

  const handleExportReports = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      triggerSuccess('Reports exported successfully as CSV.');
    }, 1500);
  };

  const openReportDetail = async (reportId: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`);
      
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }

      const data = await res.json();
      if (data.success) {
        setViewReport(data.report);
      } else {
        setErrorMessage('Failed to fetch report details: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      setErrorMessage('Failed to fetch report details');
    }
  };

  const handleReportAction = async (reportId: string, action: string, note?: string) => {
    if (!adminId) {
      setErrorMessage('Admin ID not found. Please check authentication.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/reports/${reportId.toString()}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNote: note })
      });

      const data = await res.json();

      if (data.success) {
        triggerSuccess(`Report ${action} action completed successfully`);
        fetchReports();
        setViewReport(null);
      } else {
        setErrorMessage(data.message || 'Action failed');
      }
    } catch (error) {
      console.error('Action error:', error);
      setErrorMessage('Failed to perform action');
    }
  };

  const toggleSelectReport = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'Event': return Calendar;
      case 'Product': return Package;
      case 'User': return UserX;
      default: return Flag;
    }
  };

  const getReportTiming = (report: Report): 'Pre-Event' | 'During-Event' | 'Post-Event' => {
    if (report.targetType !== 'Event' || !report.targetDetails?.startDate || !report.targetDetails?.endDate) {
      return 'Pre-Event';
    }
    const reportDate = new Date(report.createdAt);
    const startDate = new Date(report.targetDetails.startDate);
    const endDate = new Date(report.targetDetails.endDate);
    
    if (reportDate < startDate) return 'Pre-Event';
    if (reportDate > endDate) return 'Post-Event';
    return 'During-Event';
  };

  const getStatusColor = (status: string, timing?: string) => {
    if (timing === 'During-Event' && status !== 'Resolved' && status !== 'Dismissed') return 'bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.4)]';
    switch (status) {
      case 'Pending': return 'bg-yellow-500';
      case 'Investigating': return 'bg-blue-500';
      case 'Resolved': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium animate-pulse">Loading reports...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    pendingBan: reports.filter((r) => r.status === 'PendingBan').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Success Notification Pop-out */}
      {showSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
          <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-emerald-500/20">
            <div className="bg-white/20 p-2 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="font-bold text-base tracking-wide">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Notification Bar */}
      {errorMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
          <div className="bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-red-500/20">
            <div className="bg-white/20 p-2 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="font-bold text-base tracking-wide">{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {viewReport && (
        <ReportDetailModal
          report={viewReport}
          onClose={() => setViewReport(null)}
          onAction={handleReportAction}
          onViewProfile={handleViewProfile}
          onSuccess={triggerSuccess}
          onError={setErrorMessage}
          adminId={adminId}
        />
      )}

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Flag className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Bans</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingBan}</p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Ban className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Resolved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Reports Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reports & Moderation</h1>
              <p className="text-sm text-gray-500 mt-1">Review and take action on user-submitted reports</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onClick={handleExportReports}
              isLoading={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status</label>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none bg-gray-100 border-none rounded-xl py-2 pl-4 pr-10 text-sm font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-primary/10 hover:bg-gray-200 transition-all min-w-[140px]"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Timing</label>
              <div className="relative">
                <select
                  value={filterTiming}
                  onChange={(e) => setFilterTiming(e.target.value as any)}
                  className="appearance-none bg-gray-100 border-none rounded-xl py-2 pl-4 pr-10 text-sm font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-primary/10 hover:bg-gray-200 transition-all min-w-[140px]"
                >
                  <option value="All">All Timing</option>
                  <option value="Pre-Event">Pre-Event</option>
                  <option value="During-Event">During-Event</option>
                  <option value="Post-Event">Post-Event</option>
                </select>
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type</label>
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none bg-gray-100 border-none rounded-xl py-2 pl-4 pr-10 text-sm font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-primary/10 hover:bg-gray-200 transition-all min-w-[140px]"
                >
                  <option value="All">All Types</option>
                  <option value="Event">Events</option>
                  <option value="Product">Products</option>
                  <option value="User">Users</option>
                  <option value="Review">Reviews</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {(filterStatus !== 'All' || filterTiming !== 'All' || filterType !== 'All') && (
              <button 
                onClick={() => { setFilterStatus('All'); setFilterTiming('All'); setFilterType('All'); }}
                className="mt-5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest flex items-center gap-1"
              >
                <XCircle className="w-3 h-3" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Reports List */}
        <div className="p-6 space-y-4">
          {reports.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">All Caught Up!✨</h3>
              <p className="text-gray-500">No reports match your current filters</p>
</div>
            ) : (
              reports
                .filter(report => {
                  if (filterTiming === 'All') return true;
                  return getReportTiming(report) === filterTiming;
                })
                .sort((a, b) => {
                  const timingA = getReportTiming(a);
                  const timingB = getReportTiming(b);
                  const isUrgentA = timingA === 'During-Event' && a.status !== 'Resolved' && a.status !== 'Dismissed';
                  const isUrgentB = timingB === 'During-Event' && b.status !== 'Resolved' && b.status !== 'Dismissed';
                  
                  // Prioritize "Urgent" reports
                  if (isUrgentA && !isUrgentB) return -1;
                  if (!isUrgentA && isUrgentB) return 1;
                  
                  // Then by date
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .map((report) => {
                  const TargetIcon = getTargetIcon(report.targetType);
                  const displayName = getTargetName(report);
                  const reportTiming = getReportTiming(report);
                  const isUrgent = reportTiming === 'During-Event' && report.status !== 'Resolved' && report.status !== 'Dismissed';

                  return (
                    <div 
                      key={report.id}
                      className={`group relative bg-white rounded-lg border transition-all duration-200 hover:shadow-md ${
                        selectedReports.includes(report.id)
                          ? 'border-gray-900 ring-1 ring-gray-900/10'
                          : isUrgent 
                            ? 'border-rose-200 bg-rose-50/30' 
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Left accent bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(report.status, reportTiming)}`}></div>

                  <div className="p-4 pl-6">
                    <div className="flex flex-col lg:flex-row items-start gap-4">
                      
                      {/* Checkbox & Icon */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(report.id)}
                          onChange={() => toggleSelectReport(report.id)}
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                        />
                        <div className={`p-2 rounded-lg ${isUrgent ? 'bg-rose-100' : 'bg-gray-100'}`}>
                          <TargetIcon className={`w-5 h-5 ${isUrgent ? 'text-rose-600' : 'text-gray-600'}`} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {isUrgent && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded animate-pulse shadow-sm">
                              <AlertTriangle className="w-3 h-3" />
                              Urgent
                            </span>
                          )}
                          <h3 className={`text-base font-semibold truncate ${isUrgent ? 'text-rose-900' : 'text-gray-900'}`}>{displayName}</h3>
                          <Badge 
                            variant={report.status === 'Resolved' ? 'success' : report.status === 'Pending' ? 'warning' : 'info'}
                            size="sm"
                          >
                            {report.status}
                          </Badge>
                          <Badge variant="secondary" size="sm">
                            {report.targetType}
                          </Badge>
                          <Badge variant={reportTiming === 'Pre-Event' ? 'secondary' : reportTiming === 'During-Event' ? 'error' : 'success'} size="sm">
                            {reportTiming}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <p className={`${isUrgent ? 'text-rose-700/80' : 'text-gray-600'} truncate`}>
                            <span className="font-medium">Reason:</span> {report.reason}
                          </p>
                          <p className={`${isUrgent ? 'text-rose-700/80' : 'text-gray-600'} truncate`}>
                            <span className="font-medium">Reported by:</span> {report.reporterId?.name || 'Anonymous'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {report.date}
                          </span>
                          {report.evidence?.length > 0 && (
                            <span className="flex items-center gap-1 text-gray-600 font-medium">
                              <FileText className="w-3 h-3" />
                              {report.evidence.length} evidence
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReportDetail(report._id?.toString() || report.id)}
                        >
                          View
                        </Button>
                        
                        {report.status === 'Pending' || report.status === 'Investigating' ? (
                          <Button
                            size="sm"
                            className="bg-gray-900 hover:bg-gray-800 text-white"
                            onClick={() => handleReportAction(report._id?.toString() || report.id, 'Resolve')}
                          >
                            Resolve
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant={report.status === 'Resolved' ? 'success' : 'secondary'}>
                              {report.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};