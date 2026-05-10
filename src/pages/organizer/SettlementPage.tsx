"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, Hotel, Car, Users, Clock, CheckCircle2, 
  XCircle, Search, Filter, FileText, Receipt, ChevronDown, Send, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import apiClient from '../../lib/apiClient';
import { Button } from '../../components/UI';

interface SettlementItem {
  _id: string;
  festivalId: string;
  festivalName: string;
  serviceType: 'hotel' | 'transport';
  providerId: string;
  providerName: string;
  userId: string;
  userName: string;
  userEmail: string;
  price: number;
  organizerFee: number;
  providerDue: number;
  status: 'pending' | 'paid';
  bookedAt: string;
  paidAt?: string;
  payoutDetails?: {
    amount: number;
    phoneNumber: string;
    paidAt: string;
  };
  details: {
    hotelName?: string;
    roomType?: string;
    checkIn?: string;
    checkOut?: string;
    transportType?: string;
    pickupLocation?: string;
    dropoffLocation?: string;
  };
}

export default function OrganizerSettlementsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'hotel' | 'transport'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [selectedItem, setSelectedItem] = useState<SettlementItem | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState<SettlementItem | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [totalLifetimeOrganizerFee, setTotalLifetimeOrganizerFee] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    fetchSettlements();
    fetchWallet();
  }, [filter, statusFilter]);

  const fetchWallet = async () => {
    try {
      const response = await apiClient.get('/api/organizer/wallet');
      if (response.success) {
        setWalletInfo(response.data.wallet);
      }
    } catch (err) {
      console.error('Failed to fetch wallet info');
    }
  };

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('serviceType', filter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await apiClient.get(`/api/organizer/settlements?${params}`);
      
      if (response.success) {
        setSettlements(response.settlements || []);
        setTotalLifetimeOrganizerFee(response.totalOrganizerFee || 0);
      } else {
        setError(response.message || 'Failed to load settlements');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayoutModal) return;

    setMarkingPaid(showPayoutModal._id);
    try {
      const response = await apiClient.post(`/api/organizer/settlements`, {
        bookingId: (showPayoutModal as any).realBookingId || showPayoutModal._id,
        serviceType: showPayoutModal.serviceType,
        amount: Number(payoutAmount),
        phoneNumber: payoutPhone
      });
      
      if (response.success) {
        setSettlements(prev => 
          prev.map(item => 
            item._id === showPayoutModal._id 
              ? { ...item, status: 'paid' as const, paidAt: new Date().toISOString() }
              : item
          )
        );
        fetchWallet(); // Refresh wallet balances
        setShowPayoutModal(null);
        setPayoutAmount('');
        setPayoutPhone('');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        if (response.message?.includes('already paid')) {
          setSettlements(prev => 
            prev.map(item => 
              item._id === showPayoutModal._id 
                ? { ...item, status: 'paid' as const, paidAt: new Date().toISOString() }
                : item
            )
          );
          setShowPayoutModal(null);
          setPayoutAmount('');
          setPayoutPhone('');
          // Optional: You could show a message here, or just silently fix the UI
        } else {
          alert(response.message || 'Failed to process payment');
        }
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setMarkingPaid(null);
    }
  };

  const totalThirdPartyEarned = (walletInfo?.thirdPartyAvailableBalance || 0) + (walletInfo?.thirdPartyPaidOut || 0);
  const thirdPartyAvailable = walletInfo?.thirdPartyAvailableBalance || 0;

  const formatCurrency = (amount: number) => `ETB ${(amount || 0).toLocaleString()}`;
  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString() : 'N/A';

  return (
    <div className="min-h-screen bg-[#F4F4F9] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2">
            Settlement Dashboard
          </h1>
          <p className="text-gray-500">
            Manage payments to service providers and your commissions.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Earned 3rd Party</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalThirdPartyEarned)}</p>
            <p className="text-xs text-gray-400 mt-1">Total provider portion from bookings</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Earnings (5%)</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalLifetimeOrganizerFee)}</p>
            <p className="text-xs text-gray-400 mt-1">Total commission from services</p>
          </div>

          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-2xl border border-primary/10 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary/60 uppercase tracking-wider">3rd Party Available</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(thirdPartyAvailable)}</p>
            
            <div className="mt-4 pt-4 border-t border-primary/10 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/60 uppercase tracking-wider">
                  <Hotel className="w-3 h-3" />
                  Hotel
                </div>
                <p className="text-sm font-bold text-primary">{formatCurrency(walletInfo?.hotelAvailableBalance || 0)}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/60 uppercase tracking-wider">
                  <Car className="w-3 h-3" />
                  Transport
                </div>
                <p className="text-sm font-bold text-primary">{formatCurrency(walletInfo?.transportAvailableBalance || 0)}</p>
              </div>
            </div>
            
            <p className="text-xs text-primary/40 mt-3">Ready to be sent to providers</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border-none bg-gray-50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Services</option>
            <option value="hotel">Hotels</option>
            <option value="transport">Transport</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-sm border-none bg-gray-50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading settlements...</p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">No settlement history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-5">Provider</th>
                    <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-5">User</th>
                    <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-5">Price</th>
                    <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-5">Your Fee (5%)</th>
                    <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-5">Available Balance</th>
                    <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-5">Status</th>
                    <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {settlements.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                            item.serviceType === 'hotel' ? 'bg-blue-50' : 'bg-purple-50'
                          }`}>
                            {item.serviceType === 'hotel' ? (
                              <Hotel className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Car className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{item.providerName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{item.serviceType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-gray-800">{item.userName}</p>
                        <p className="text-xs text-gray-400">{item.userEmail}</p>
                      </td>
                      <td className="px-6 py-5 font-bold text-sm">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-emerald-600 font-bold">
                          {formatCurrency(item.organizerFee)}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-black text-sm text-primary">
                        {formatCurrency(item.providerDue)}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {item.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                            title="View Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {item.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setShowPayoutModal(item);
                                setPayoutAmount(item.providerDue.toString());
                              }}
                              className="bg-primary hover:bg-primary/90 text-xs font-bold px-4 rounded-xl"
                            >
                              {item.serviceType === 'hotel' ? 'Send to Hotel' : 'Send to Transport'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-serif font-bold text-gray-900">Send Payment</h3>
                  <p className="text-sm text-gray-500">Provider: {showPayoutModal.providerName}</p>
                </div>
                <button onClick={() => setShowPayoutModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handlePayout} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Amount to Send (ETB)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <input
                      type="number"
                      required
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Recipient Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0912345678"
                    value={payoutPhone}
                    onChange={(e) => setPayoutPhone(e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 font-bold"
                  />
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-xs text-primary font-medium text-center">
                    This amount will be deducted from your Third-Party Available Balance and a receipt will be generated.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full py-6 rounded-2xl shadow-xl shadow-primary/20 font-bold text-lg"
                  disabled={markingPaid === showPayoutModal._id}
                  leftIcon={Send}
                >
                  {markingPaid === showPayoutModal._id ? 'Sending...' : 'Confirm & Send'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessMessage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Payment Successful</h3>
              <p className="text-sm text-gray-500">
                The payment has been processed and the receipt was saved securely.
              </p>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-serif font-bold text-gray-900">Booking Receipt</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Event Information</p>
                  <p className="text-lg font-bold text-gray-900">{selectedItem.festivalName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Service</p>
                    <p className="font-bold capitalize">{selectedItem.serviceType}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${
                      selectedItem.status === 'paid' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
                    }`}>
                      {selectedItem.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Service Details</p>
                  <p className="font-bold text-gray-900">{selectedItem.providerName}</p>
                  {selectedItem.serviceType === 'hotel' ? (
                    <p className="text-sm text-gray-500 mt-1">{selectedItem.details.roomType}</p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">{selectedItem.details.transportType}</p>
                  )}
                </div>

                <div className="border-t-2 border-dashed border-gray-200 pt-6 mt-6">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-500 font-medium">Total Paid by User</span>
                    <span className="font-bold">{formatCurrency(selectedItem.price)}</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-500 font-medium">Your Commission (5%)</span>
                    <span className="font-bold text-emerald-600">+{formatCurrency(selectedItem.organizerFee)}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-100 mt-2">
                    <span className="text-lg font-bold text-gray-900">Available Balance</span>
                    <span className="text-2xl font-black text-primary">{formatCurrency(selectedItem.providerDue)}</span>
                  </div>
                </div>

                {selectedItem.status === 'paid' && selectedItem.payoutDetails && (
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 mt-4">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Payout Receipt</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-emerald-700/60">Amount Sent</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(selectedItem.payoutDetails.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700/60">Recipient Phone</span>
                        <span className="font-bold text-emerald-700">{selectedItem.payoutDetails.phoneNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700/60">Date Paid</span>
                        <span className="font-bold text-emerald-700">{formatDate(selectedItem.payoutDetails.paidAt)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-4 mt-4"
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}