"use client";

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, CheckCircle, XCircle, Clock, AlertCircle,
  DollarSign, User, Package, FileText, MessageSquare, Search
} from 'lucide-react';
import { Button, Badge } from '../UI';

interface RefundRequest {
  _id: string;
  orderId: {
    _id: string;
    status: string;
    totalPrice: number;
    shippingFee: number;
  };
  touristId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  productId: {
    name: string;
    images: string[];
  };
  reason: string;
  imageUrl?: string;
  refundMethod: 'bank' | 'telebirr';
  bankName?: string;
  accountNumber?: string;
  telebirrNumber?: string;
  amount: number;
  shippingFee: number;
  artisanEarnings: number;
  adminCommission: number;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  adminNotes?: string;
}

interface Stats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  totalAmount: number;
}

export const AdminRefundRequestsPage: React.FC = () => {
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [action, setAction] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'processing'; message: string } | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutPhone, setPayoutPhone] = useState('');

  useEffect(() => {
    fetchRefundRequests();
  }, []);

  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/refund');
      const data = await res.json();
      if (data.success) {
        setRefundRequests(data.refundRequests || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching refund requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (requestId: string, actionType: 'process' | 'complete' | 'reject') => {
    setProcessing(requestId);
    setAction(actionType);
    
    // Show processing notification
    setNotification({
      type: 'processing',
      message: actionType === 'process' ? 'Initializing refund process...' : 
               actionType === 'reject' ? 'Rejecting request...' : 'Completing disbursement...'
    });

    try {
      const res = await fetch('/api/admin/refund', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          refundRequestId: requestId, 
          action: actionType,
          adminNotes,
          payoutAmount: actionType === 'complete' ? payoutAmount : undefined,
          payoutPhone: actionType === 'complete' ? payoutPhone : undefined
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: actionType === 'process' ? 'Refund process started successfully' : 
                   actionType === 'reject' ? 'Refund request rejected' : 'Refund disbursement completed'
        });
        setSelectedRequest(null);
        setShowPayoutModal(false);
        setAdminNotes('');
        setPayoutAmount('');
        setPayoutPhone('');
        fetchRefundRequests();
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Failed to process refund'
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'An error occurred during processing'
      });
    } finally {
      setProcessing(null);
      setAction('');
      // Dismiss notification after 3 seconds if not an error or processing
      setTimeout(() => {
        setNotification(prev => (prev?.type !== 'error' && prev?.type !== 'processing') ? null : prev);
      }, 3000);
    }
  };

  const filteredRequests = refundRequests.filter(req => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      req.touristId?.name?.toLowerCase().includes(search) ||
      req.touristId?.email?.toLowerCase().includes(search) ||
      req.productId?.name?.toLowerCase().includes(search)
    );
  });

  const formatCurrency = (amount: number) => `ETB ${(amount || 0).toLocaleString()}`;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      'pending': { bg: 'bg-amber-50', text: 'text-amber-600' },
      'processing': { bg: 'bg-blue-50', text: 'text-blue-600' },
      'completed': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${style.bg} ${style.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Refund Requests</h1>
          <p className="text-gray-500">Review and process customer refund requests</p>
        </div>
        <Button onClick={fetchRefundRequests} leftIcon={RefreshCw} variant="outline">
          Refresh
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase">Processing</p>
            <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase">Completed</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase">Total Amount</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalAmount)}</p>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No refund requests</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredRequests.map((request) => (
              <div key={request._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                      {request.productId?.images?.[0] ? (
                        <img src={request.productId.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{request.productId?.name || 'Product'}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{request.touristId?.name}</span>
                        <span>•</span>
                        <span>{request.touristId?.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-red-600">{formatCurrency(request.amount)}</p>
                      <p className="text-xs text-gray-400">
                        + {formatCurrency(request.shippingFee)} shipping
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedRequest(request)}
                    >
                      Review
                    </Button>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Reason</p>
                  <p className="text-sm text-gray-600">{request.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRequest && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setSelectedRequest(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-primary text-white">
              <h3 className="text-xl font-bold">Refund Request Review</h3>
              <p className="text-sm text-white/80">Order #{selectedRequest.orderId?._id?.slice(-6).toUpperCase()}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 uppercase">Customer</p>
                  <p className="font-medium">{selectedRequest.touristId?.name}</p>
                  <p className="text-xs text-gray-500">{selectedRequest.touristId?.email}</p>
                  <p className="text-xs text-gray-500">{selectedRequest.touristId?.phone}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 uppercase">Refund Amount</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(selectedRequest.amount)}</p>
                  <p className="text-xs text-gray-500">Shipping (non-refundable): {formatCurrency(selectedRequest.shippingFee)}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Reason</p>
                <p className="text-sm text-gray-700">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.imageUrl && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Proof Image</p>
                  <img
                    src={selectedRequest.imageUrl}
                    alt="Refund proof"
                    className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}

              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs font-bold text-red-500 uppercase mb-3">Financial Split</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Artisan Cut (90%)</span>
                    <span className="text-sm font-bold text-gray-800">
                      ETB {selectedRequest.artisanEarnings?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Admin Commission (10%)</span>
                    <span className="text-sm font-bold text-gray-800">
                      ETB {selectedRequest.adminCommission?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-red-100">
                    <span className="text-sm font-bold text-red-700">Return to Tourist</span>
                    <span className="text-sm font-bold text-red-700">
                      ETB {selectedRequest.amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Refund Method</p>
                <p className="font-medium text-emerald-800 capitalize">
                  {selectedRequest.refundMethod === 'bank' ? 'Bank Transfer' : 'Telebirr'}
                </p>
                {selectedRequest.refundMethod === 'bank' && (
                  <>
                    <p className="text-sm text-emerald-700">{selectedRequest.bankName}</p>
                    <p className="text-sm font-mono text-emerald-800">{selectedRequest.accountNumber}</p>
                  </>
                )}
                {selectedRequest.refundMethod === 'telebirr' && (
                  <p className="text-sm font-mono text-emerald-800">{selectedRequest.telebirrNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this refund (optional)..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                  rows={3}
                />
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleProcessRefund(selectedRequest._id, 'reject')}
                    disabled={processing === selectedRequest._id}
                    isLoading={processing === selectedRequest._id && action === 'reject'}
                  >
                    Reject
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => handleProcessRefund(selectedRequest._id, 'process')}
                    disabled={processing === selectedRequest._id}
                    isLoading={processing === selectedRequest._id && action === 'process'}
                  >
                    Start Processing
                  </Button>
                </div>
              )}

              {selectedRequest.status === 'processing' && (
                <div className="flex gap-3 pt-4">
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setPayoutAmount(selectedRequest.amount.toString());
                      setPayoutPhone(selectedRequest.touristId?.phone || '');
                      setShowPayoutModal(true);
                    }}
                    disabled={processing === selectedRequest._id}
                  >
                    Send to User
                  </Button>
                </div>
              )}

              {selectedRequest.status === 'completed' && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-emerald-800">Refund Completed</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Notification Modal */}
      {notification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              notification.type === 'processing' ? 'bg-blue-50 text-blue-600' :
              notification.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
              'bg-red-50 text-red-600'
            }`}>
              {notification.type === 'processing' && <RefreshCw className="w-8 h-8 animate-spin" />}
              {notification.type === 'success' && <CheckCircle className="w-8 h-8" />}
              {notification.type === 'error' && <AlertCircle className="w-8 h-8" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {notification.type === 'processing' ? 'Processing' : 
                 notification.type === 'success' ? 'Success' : 'Attention'}
              </h3>
              <p className="text-gray-500 mt-2">{notification.message}</p>
            </div>
            {notification.type !== 'processing' && (
              <Button 
                fullWidth 
                onClick={() => setNotification(null)}
                variant={notification.type === 'error' ? 'outline' : 'primary'}
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-emerald-600 text-white">
              <h3 className="text-xl font-bold">Process Refund Payment</h3>
              <p className="text-sm text-white/80">Disburse funds to {selectedRequest.touristId?.name}</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Refund Amount (ETB)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none font-bold text-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Transfer To (Phone Number)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      value={payoutPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPayoutPhone(val);
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-emerald-700">Disbursement Method</span>
                  <Badge className="bg-white text-emerald-700 border-emerald-200">
                    {selectedRequest.refundMethod === 'bank' ? 'Bank Transfer' : 'Telebirr'}
                  </Badge>
                </div>
                <p className="text-xs text-emerald-600">The amount will be deducted from the pending refund total.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowPayoutModal(false)}>Cancel</Button>
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleProcessRefund(selectedRequest._id, 'complete')}
                  disabled={!payoutAmount || !payoutPhone || processing !== null}
                  isLoading={processing === selectedRequest._id}
                >
                  Send Refund
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
