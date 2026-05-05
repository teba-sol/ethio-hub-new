"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ShieldAlert, UserX, Mail, Clock, User, Calendar, AlertTriangle, Ban, Eye, MessageSquare, Package } from 'lucide-react';
import { Button, Badge } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';

interface PendingBan {
  _id: string;
  targetId: string;
  targetType: string;
  reason: string;
  description: string;
  reporterId: { 
    name: string; 
    email: string; 
    profileImage?: string;
    role?: string;
  };
  resolvedBy: { name: string };
  createdAt: string;
  adminNote?: string;
  targetDetails?: {
    name: string;
    email: string;
    role: string;
    status: string;
    reportsCount: number;
    profileImage?: string;
    phone?: string;
    createdAt?: string;
    artisanStatus?: string;
    organizerStatus?: string;
  };
}

export default function PendingBansPage() {
  const { user, loading: authLoading } = useAuth();
  const [pendingBans, setPendingBans] = useState<PendingBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (authLoading) return;
    
    if (!user) {
      window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    if (user.role !== 'ADMIN' && user.role !== 'admin') {
      window.location.href = '/';
      return;
    }
    if (user) {
      fetchPendingBans();
    }
  }, [user, authLoading, isMounted]);

  const fetchPendingBans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pending-bans');
      const data = await res.json();
      if (data.success) {
        setPendingBans(data.pendingBans.map((ban: any) => ({
          ...ban,
          date: new Date(ban.createdAt).toLocaleString()
        })));
      }
    } catch (error) {
      console.error('Fetch pending bans error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId: string) => {
    if (!confirm('Are you sure you want to approve this ban? The user will be permanently banned and all their content restricted.')) {
      return;
    }

    setProcessing(reportId);
    try {
      const adminId = user?._id?.toString() || user?.id?.toString() || '';
      const res = await fetch(`/api/admin/pending-bans/${reportId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminId,
          reason: 'Account banned due to multiple violations and pending ban approval.'
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('✅ User has been banned successfully. They will be notified via email.');
        fetchPendingBans();
      } else {
        alert(data.message || 'Failed to approve ban');
      }
    } catch (error) {
      alert('Failed to approve ban');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (reportId: string) => {
    const reason = prompt('Reason for rejecting ban (optional):\n\nThis will allow the user to continue using the platform.');
    if (reason === null) return; // User cancelled

    setProcessing(reportId);
    try {
      const adminId = user?._id?.toString() || user?.id?.toString() || '';
      const res = await fetch(`/api/admin/pending-bans/${reportId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, reason })
      });

      const data = await res.json();
      if (data.success) {
        alert('❌ Ban request rejected. User remains active.');
        fetchPendingBans();
      } else {
        alert(data.message || 'Failed to reject ban');
      }
    } catch (error) {
      alert('Failed to reject ban');
    } finally {
      setProcessing(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'error';
      case 'artisan': return 'default';
      case 'organizer': return 'info';
      case 'tourist': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Suspended': return 'warning';
      case 'Banned': return 'error';
      default: return 'secondary';
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'User': return UserX;
      case 'Event': return Calendar;
      case 'Product': return Package;
      default: return Flag;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium animate-pulse">Loading pending bans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="p-5 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
              <Ban className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-serif font-bold mb-2">Pending Ban Approvals</h1>
              <p className="text-red-100 text-lg">Second admin approval required before account termination</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20 text-center min-w-[100px]">
                <p className="text-red-100 text-sm font-medium uppercase tracking-wider">Total</p>
                <p className="text-3xl font-bold">{pendingBans.length}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20 text-center min-w-[100px]">
                <p className="text-red-100 text-sm font-medium uppercase tracking-wider">High Priority</p>
                <p className="text-3xl font-bold">{pendingBans.filter(b => b.targetDetails?.reportsCount > 5).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {pendingBans.length === 0 ? (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl border-2 border-emerald-200 p-16 text-center shadow-lg">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-500 rounded-full mb-6 shadow-xl">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">All Clear! ✨</h3>
          <p className="text-gray-600 text-lg">No pending ban requests at this time.</p>
          <p className="text-gray-400 text-sm mt-2">Check back later for new reports requiring attention.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingBans.map((ban) => {
            const TargetIcon = getTargetIcon(ban.targetType);
            return (
          <div 
            key={ban._id}
            className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-rose-600"></div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Left: Target Details */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-start gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                      {ban.targetDetails?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-2xl font-bold text-gray-800 truncate">
                          {ban.targetDetails?.name || 'Unknown User'}
                        </h3>
                        <Badge variant={getRoleBadgeVariant(ban.targetDetails?.role || '')}>
                          {ban.targetDetails?.role || 'User'}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(ban.targetDetails?.status || '')}>
                          {ban.targetDetails?.status || 'Unknown'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="truncate font-medium">{ban.targetDetails?.email || 'No email'}</span>
                        </div>
                        {ban.targetDetails?.phone && (
                          <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                            <UserX className="w-4 h-4 text-gray-400" />
                            <span>{ban.targetDetails.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded-xl border border-red-200 font-medium">
                          <ShieldAlert className="w-4 h-4" />
                          <span>📊 {ban.targetDetails?.reportsCount || 0} total reports</span>
                        </div>
                        {ban.targetDetails?.createdAt && (
                          <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Joined {new Date(ban.targetDetails.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Report Details */}
                  <div className="bg-gradient-to-r from-red-50/50 to-rose-50/80 border border-red-100 rounded-2xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-bold text-red-900 mb-2">Report Reason: {ban.reason}</h4>
                        {ban.description && (
                          <p className="text-red-800/90 bg-white/70 p-4 rounded-lg border-l-3 border-red-400 leading-relaxed">
                            "{ban.description}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Reporter Info */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-red-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {ban.reporterId?.name?.charAt(0)?.toUpperCase() || 'R'}
                        </div>
                        <div>
                          <p className="text-xs text-blue-700 font-medium">Reported by</p>
                          <p className="text-sm font-bold text-gray-800">{ban.reporterId?.name || 'Anonymous'}</p>
                        </div>
                      </div>
                      {ban.reporterId?.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{ban.reporterId.email}</span>
                        </div>
                      )}
                      <div className="ml-auto text-right">
                        <p className="text-xs text-gray-500">Report date</p>
                        <p className="text-sm font-medium text-gray-800">{ban.date?.split(',')[0]}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="lg:w-80">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm sticky top-4">
                    <h4 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                      Admin Actions
                    </h4>
                    
                    <div className="space-y-3">
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-none shadow-lg py-6 text-base"
                        leftIcon={CheckCircle2}
                        onClick={() => handleApprove(ban._id)}
                        disabled={processing === ban._id}
                      >
                        {processing === ban._id ? '⏳ Processing...' : '✅ Approve Ban'}
                      </Button>
                      
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 py-6 text-base"
                        leftIcon={XCircle}
                        onClick={() => handleReject(ban._id)}
                        disabled={processing === ban._id}
                      >
                        ❌ Reject Request
                      </Button>
                    </div>

                    <div className="mt-5 pt-5 border-t border-gray-200">
                      <p className="text-xs text-gray-600 leading-relaxed space-y-1">
                        <span className="block"><strong className="text-green-700">✓ Approve:</strong> Permanently ban user & send notification email.</span>
                        <span className="block"><strong className="text-red-700">✗ Reject:</strong> User keeps account, ban request closed.</span>
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
