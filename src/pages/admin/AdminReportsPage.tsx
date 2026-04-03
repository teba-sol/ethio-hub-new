import React, { useState } from 'react';
import { 
  Search, Filter, Flag, AlertTriangle, XCircle, CheckCircle2, 
  MessageSquare, UserX, ShieldAlert, Eye, FileText, Download,
  MoreVertical, Clock, Image as ImageIcon, Link as LinkIcon,
  Trash2, Ban, Check, TrendingUp
} from 'lucide-react';
import { Button, Badge } from '../../components/UI';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend 
} from 'recharts';

// --- Types ---
interface Evidence {
  type: 'Image' | 'Link' | 'Screenshot';
  url: string;
  description?: string;
}

interface AuditLog {
  action: string;
  admin: string;
  date: string;
  note?: string;
}

interface Report {
  id: string;
  targetId: string;
  targetName: string;
  targetType: 'Event' | 'Product' | 'User' | 'Review';
  reason: string;
  description: string;
  reporterName: string;
  reporterId: string;
  date: string;
  status: 'Pending' | 'Resolved' | 'Dismissed' | 'Investigating';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  evidence: Evidence[];
  auditLog: AuditLog[];
}

// --- Mock Data ---
const MOCK_REPORTS: Report[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `RPT-${3000 + i}`,
  targetId: i % 3 === 0 ? `USR-${100+i}` : i % 2 === 0 ? `EVT-${500+i}` : `PROD-${800+i}`,
  targetName: i % 3 === 0 ? 'BadActor123' : i % 2 === 0 ? 'Fake Festival 2025' : 'Counterfeit Gucci Bag',
  targetType: i % 3 === 0 ? 'User' : i % 2 === 0 ? 'Event' : 'Product',
  reason: i % 3 === 0 ? 'Harassment' : i % 2 === 0 ? 'Scam/Fraud' : 'Counterfeit Item',
  description: 'This user has been sending abusive messages to multiple artisans.',
  reporterName: `ConcernedUser${i}`,
  reporterId: `USR-${200+i}`,
  date: new Date(Date.now() - i * 3600000 * 5).toLocaleString(),
  status: i === 0 ? 'Pending' : i === 1 ? 'Investigating' : i % 4 === 0 ? 'Resolved' : 'Dismissed',
  severity: i % 3 === 0 ? 'High' : i % 2 === 0 ? 'Critical' : 'Medium',
  evidence: [
    { type: 'Screenshot', url: `https://picsum.photos/seed/evidence${i}/800/600`, description: 'Screenshot of abusive chat' },
    { type: 'Link', url: 'https://example.com/proof', description: 'Link to external profile' }
  ],
  auditLog: i > 0 ? [
    { action: 'Flagged for review', admin: 'System', date: '2025-10-25 10:00 AM' },
    { action: 'Investigating', admin: 'Admin Sarah', date: '2025-10-25 11:30 AM', note: 'Checking chat logs' }
  ] : []
}));

const REPORT_STATS = [
  { name: 'User Reports', value: 45, color: '#3b82f6' },
  { name: 'Product Reports', value: 30, color: '#10b981' },
  { name: 'Event Reports', value: 25, color: '#f59e0b' },
];

// --- Components ---

const ReportDetailModal = ({ 
  report, 
  onClose, 
  onAction,
  onViewProfile 
}: { 
  report: Report; 
  onClose: () => void;
  onAction: (id: string, action: string, note?: string) => void;
  onViewProfile: (id: string) => void;
}) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="bg-white rounded-[24px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-gray-800">Report Details</h2>
            <Badge variant={report.severity === 'Critical' ? 'error' : report.severity === 'High' ? 'warning' : 'info'}>
              {report.severity} Severity
            </Badge>
            <Badge variant="secondary">{report.status}</Badge>
          </div>
          <p className="text-sm text-gray-500">ID: {report.id} • Reported on {report.date}</p>
        </div>
        <button onClick={onClose}><XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Report Info & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Info */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Reported Entity</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-200 shadow-sm">
                {report.targetType === 'User' ? <UserX className="w-6 h-6 text-gray-600" /> : 
                 report.targetType === 'Event' ? <Clock className="w-6 h-6 text-gray-600" /> : 
                 <Flag className="w-6 h-6 text-gray-600" />}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">{report.targetName}</p>
                <p className="text-sm text-gray-500">{report.targetType} • ID: {report.targetId}</p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="ml-auto"
                onClick={() => onViewProfile(report.targetId)}
              >
                View Profile
              </Button>
            </div>
          </div>

          {/* Reason & Description */}
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Reason: {report.reason}</h3>
            <p className="text-gray-600 bg-white p-4 rounded-xl border border-gray-200 text-sm leading-relaxed">
              "{report.description}"
            </p>
            <p className="text-xs text-gray-400 mt-2">Reported by <span className="font-bold text-gray-600">{report.reporterName}</span> (ID: {report.reporterId})</p>
          </div>

          {/* Evidence */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Evidence & Attachments
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {report.evidence.map((item, i) => (
                <div key={i} className="group relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                  {item.type === 'Screenshot' || item.type === 'Image' ? (
                    <div className="aspect-video bg-gray-200 relative">
                      <img src={item.url} alt="Evidence" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary" leftIcon={Eye}>View Full</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><LinkIcon className="w-5 h-5" /></div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-gray-800 truncate">{item.url}</p>
                        <a href="#" className="text-xs text-blue-500 hover:underline">Open Link</a>
                      </div>
                    </div>
                  )}
                  {item.description && <p className="p-2 text-xs text-gray-500 border-t border-gray-200">{item.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Actions & History */}
        <div className="space-y-6">
          {/* Action Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Admin Actions</h3>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start bg-emerald-500 hover:bg-emerald-600 border-emerald-500" 
                leftIcon={CheckCircle2}
                onClick={() => onAction(report.id, 'Resolve')}
              >
                Resolve Report
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline" 
                leftIcon={XCircle}
                onClick={() => onAction(report.id, 'Dismiss')}
              >
                Dismiss Report
              </Button>
              <div className="h-px bg-gray-100 my-2"></div>
              <Button 
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50" 
                variant="outline" 
                leftIcon={Ban}
                onClick={() => {
                  alert(`User ${report.targetId} has been banned.`);
                  onAction(report.id, 'Ban', 'User banned from platform');
                }}
              >
                Ban User
              </Button>
              <Button 
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50" 
                variant="outline" 
                leftIcon={Trash2}
                onClick={() => {
                  alert(`Content related to report ${report.id} has been deleted.`);
                  onAction(report.id, 'Delete', 'Reported content removed');
                }}
              >
                Delete Content
              </Button>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" /> Action History
            </h3>
            <div className="space-y-4 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
              {report.auditLog.map((log, i) => (
                <div key={i} className="relative pl-8">
                  <div className="absolute left-[11px] top-1.5 w-2 h-2 rounded-full bg-gray-400 ring-4 ring-gray-50"></div>
                  <p className="text-xs font-bold text-gray-700">{log.action}</p>
                  <p className="text-[10px] text-gray-400">{log.date} • {log.admin}</p>
                  {log.note && <p className="text-xs text-gray-500 mt-1 bg-white p-2 rounded border border-gray-200 italic">"{log.note}"</p>}
                </div>
              ))}
              <div className="relative pl-8">
                <div className="absolute left-[11px] top-1.5 w-2 h-2 rounded-full bg-blue-400 ring-4 ring-gray-50"></div>
                <p className="text-xs font-bold text-gray-700">Report Submitted</p>
                <p className="text-[10px] text-gray-400">{report.date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const filteredReports = reports.filter(report => 
    filterStatus === 'All' || report.status === filterStatus
  );

  const handleExportReports = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Reports exported successfully as CSV.');
    }, 1500);
  };

  const handleViewProfile = (targetId: string) => {
    alert(`Navigating to profile of entity: ${targetId}`);
  };

  const handleReportAction = (reportId: string, action: string, note?: string) => {
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        const newStatus = action === 'Resolve' ? 'Resolved' : 
                          action === 'Dismiss' ? 'Dismissed' : 
                          action === 'Investigate' ? 'Investigating' : r.status;
        
        const newLog: AuditLog = {
          action: `${action} Report`,
          admin: 'Admin Sarah',
          date: new Date().toLocaleString(),
          note
        };

        return {
          ...r,
          status: newStatus as any,
          auditLog: [newLog, ...r.auditLog]
        };
      }
      return r;
    }));
    
    if (viewReport?.id === reportId) {
      setViewReport(null);
    }
  };

  const toggleSelectReport = (id: string) => {
    if (selectedReports.includes(id)) {
      setSelectedReports(selectedReports.filter(rid => rid !== id));
    } else {
      setSelectedReports([...selectedReports, id]);
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} on:`, selectedReports);
    setSelectedReports([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Modal */}
      {viewReport && (
        <ReportDetailModal 
          report={viewReport} 
          onClose={() => setViewReport(null)} 
          onAction={handleReportAction}
          onViewProfile={handleViewProfile}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800">Reports & Moderation</h1>
          <p className="text-gray-500 text-sm">Handle user reports, review evidence, and maintain platform safety.</p>
        </div>
        <Button 
          variant="outline" 
          leftIcon={Download}
          onClick={handleExportReports}
          isLoading={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export Reports (CSV)'}
        </Button>
      </div>

      {/* Analytics Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-50 rounded-2xl text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Reports (Week)</p>
            <h3 className="text-3xl font-bold text-gray-800">124</h3>
            <p className="text-xs text-red-500 font-bold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +12% vs last week</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Resolution Rate</p>
            <h3 className="text-3xl font-bold text-gray-800">85%</h3>
            <p className="text-xs text-emerald-500 font-bold">High efficiency</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Most Reported</p>
            <h3 className="text-xl font-bold text-gray-800">User Harassment</h3>
            <p className="text-xs text-gray-400">45 reports this week</p>
          </div>
          <div className="h-16 w-16">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={REPORT_STATS} innerRadius={15} outerRadius={30} paddingAngle={5} dataKey="value">
                  {REPORT_STATS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {['All', 'Pending', 'Investigating', 'Resolved', 'Dismissed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === status ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {selectedReports.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
            <span className="text-sm font-bold text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
              {selectedReports.length} Selected
            </span>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500" onClick={() => handleBulkAction('Resolve')}>
              Resolve Selected
            </Button>
            <Button size="sm" variant="outline" className="text-gray-500 border-gray-200 hover:bg-gray-50" onClick={() => handleBulkAction('Dismiss')}>
              Dismiss Selected
            </Button>
          </div>
        )}
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReports.map((report) => (
          <div key={report.id} className={`bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6 ${selectedReports.includes(report.id) ? 'ring-2 ring-primary/20 bg-indigo-50/10' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="pt-1">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-primary focus:ring-primary w-5 h-5 cursor-pointer"
                  checked={selectedReports.includes(report.id)}
                  onChange={() => toggleSelectReport(report.id)}
                />
              </div>
              <div className={`p-3 rounded-xl shrink-0 ${report.severity === 'Critical' ? 'bg-red-100 text-red-600' : report.severity === 'High' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                <Flag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-800">{report.targetName}</h3>
                  <Badge variant={report.severity === 'Critical' || report.severity === 'High' ? 'error' : 'warning'} size="sm">{report.severity}</Badge>
                  <Badge variant="secondary" size="sm">{report.targetType}</Badge>
                  {report.status === 'Pending' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                </div>
                <p className="text-sm text-gray-600 font-medium mb-1">Reason: {report.reason}</p>
                <p className="text-xs text-gray-500 mb-2 line-clamp-1">"{report.description}"</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><UserX className="w-3 h-3" /> Reported by {report.reporterName}</span>
                  <span>•</span>
                  <span>{report.date}</span>
                  {report.evidence.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-blue-500 font-medium"><FileText className="w-3 h-3" /> {report.evidence.length} Attachments</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center">
               {report.status === 'Pending' || report.status === 'Investigating' ? (
                 <>
                   <Button variant="outline" size="sm" leftIcon={Eye} onClick={() => setViewReport(report)}>View Details</Button>
                   <Button 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white" 
                    leftIcon={ShieldAlert} 
                    onClick={() => handleReportAction(report.id, 'Investigate')}
                   >
                    Investigate
                   </Button>
                 </>
               ) : (
                 <div className="flex items-center gap-4">
                   <div className="text-right">
                     <Badge variant={report.status === 'Resolved' ? 'success' : 'secondary'}>{report.status}</Badge>
                     <p className="text-[10px] text-gray-400 mt-1">Resolved by Admin</p>
                   </div>
                   <Button variant="ghost" size="sm" onClick={() => setViewReport(report)}>View Log</Button>
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
