"use client";

import React, { useState, useEffect } from 'react';
import { Flag, Clock, CheckCircle2, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { Button, Badge } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';

interface MyReport {
  _id: string;
  targetId: string;
  targetType: 'Event' | 'Product' | 'User';
  reason: string;
  reasonOther?: string;
  description: string;
  status: 'Pending' | 'Investigating' | 'Resolved' | 'Dismissed' | 'PendingBan';
  adminNote?: string;
  createdAt: string;
  resolvedAt?: string;
  targetDetails?: any;
}

export default function MyReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MyReport | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchMyReports();
    }
  }, [user?.id]);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?reporterId=${user?.id}`);
      const data = await res.json();

      if (data.success) {
        setReports(data.reports.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt).toLocaleString(),
          resolvedAt: r.resolvedAt ? new Date(r.resolvedAt).toLocaleString() : undefined
        })));
      }
    } catch (error) {
      console.error('Fetch my reports error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'Investigating':
        return <Badge variant="info">Investigating</Badge>;
      case 'Resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'Dismissed':
        return <Badge variant="secondary">Dismissed</Badge>;
      case 'PendingBan':
        return <Badge variant="error">Pending Ban</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-800">My Reports</h1>
        <p className="text-gray-500 text-sm">Track the status of reports you've submitted</p>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-[24px] border border-gray-100 shadow-sm">
          <Flag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">You haven't submitted any reports yet</p>
          <p className="text-sm text-gray-400">When you report content, it will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    report.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' :
                    report.status === 'Dismissed' ? 'bg-gray-100 text-gray-500' :
                    'bg-orange-50 text-orange-500'
                  }`}>
                    <Flag className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800">
                        {report.targetDetails?.name || report.targetDetails?.name_en || 'Unknown'}
                      </h3>
                      {getStatusBadge(report.status)}
                      <Badge variant="secondary" size="sm">{report.targetType}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Reason: {report.reason}</p>
                    {report.reasonOther && (
                      <p className="text-xs text-gray-500 mb-1">Other: {report.reasonOther}</p>
                    )}
                    <p className="text-xs text-gray-400 line-clamp-1">"{report.description}"</p>
                    <p className="text-xs text-gray-400 mt-2">Submitted: {report.createdAt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={Eye}
                    onClick={() => setSelectedReport(report)}
                  >
                    View Details
                  </Button>
                </div>
              </div>

              {report.adminNote && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Admin Response:</p>
                  <p className="text-sm text-gray-700">{report.adminNote}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Report Details</h2>
                <p className="text-sm text-gray-500">ID: {selectedReport._id}</p>
              </div>
              <button onClick={() => setSelectedReport(null)}>
                <XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Status</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedReport.status)}
                  {selectedReport.resolvedAt && (
                    <span className="text-xs text-gray-400">Resolved: {selectedReport.resolvedAt}</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Reason</h3>
                <p className="text-gray-800">{selectedReport.reason}</p>
                {selectedReport.reasonOther && (
                  <p className="text-sm text-gray-600 mt-1">Other: {selectedReport.reasonOther}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm leading-relaxed">
                  "{selectedReport.description}"
                </p>
              </div>

              {selectedReport.adminNote && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Admin Response</h3>
                  <p className="text-gray-700 bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-sm leading-relaxed">
                    {selectedReport.adminNote}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400">Submitted: {selectedReport.createdAt}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
