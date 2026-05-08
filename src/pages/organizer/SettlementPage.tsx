"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, Hotel, Car, Users, Clock, CheckCircle2, 
  XCircle, Search, Filter, FileText, Receipt, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import apiClient from '../../lib/apiClient';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'hotel' | 'transport'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [selectedItem, setSelectedItem] = useState<SettlementItem | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  useEffect(() => {
    fetchSettlements();
  }, [filter, statusFilter]);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('serviceType', filter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await apiClient.get(`/api/organizer/settlements?${params}`);
      
      if (response.success) {
        setSettlements(response.settlements || []);
      } else {
        setError(response.message || 'Failed to load settlements');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (settlementId: string) => {
    setMarkingPaid(settlementId);
    try {
      const response = await apiClient.post(`/api/organizer/settlements/${settlementId}/mark-paid`, {});
      
      if (response.success) {
        setSettlements(prev => 
          prev.map(item => 
            item._id === settlementId 
              ? { ...item, status: 'paid' as const, paidAt: new Date().toISOString() }
              : item
          )
        );
        alert('Payment marked as paid successfully!');
      } else {
        alert(response.message || 'Failed to mark as paid');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setMarkingPaid(null);
    }
  };

  const totalPending = settlements
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + s.providerDue, 0);

  const totalPaid = settlements
    .filter(s => s.status === 'paid')
    .reduce((sum, s) => sum + s.providerDue, 0);

  const formatCurrency = (amount: number) => `ETB ${(amount || 0).toLocaleString()}`;
  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString() : 'N/A';

  return (
    <div className="min-h-screen bg-[#F4F4F9] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Third-Party Settlements
          </h1>
          <p className="text-gray-500">
            Track payments to hotels and transport providers
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-gray-500">Pending Payments</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-500">Paid Out</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-gray-500">Your Fee Earned</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(settlements.reduce((sum, s) => sum + s.organizerFee, 0))}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="all">All Services</option>
              <option value="hotel">Hotels</option>
              <option value="transport">Transport</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={fetchSettlements}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : settlements.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No settlements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">Service</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">Provider</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">User</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">Price</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">Your Fee</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">Due to Provider</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {settlements.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            item.serviceType === 'hotel' ? 'bg-blue-50' : 'bg-purple-50'
                          }`}>
                            {item.serviceType === 'hotel' ? (
                              <Hotel className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Car className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {item.serviceType === 'hotel' ? item.details.hotelName : item.details.transportType}
                            </p>
                            <p className="text-xs text-gray-400">{item.festivalName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800">{item.providerName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800">{item.userName}</p>
                        <p className="text-xs text-gray-400">{item.userEmail}</p>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-primary font-medium">
                          {formatCurrency(item.organizerFee)}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(item.providerDue)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {item.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title="View Details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {item.status === 'pending' && (
                            <button
                              onClick={() => markAsPaid(item._id)}
                              disabled={markingPaid === item._id}
                              className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                            >
                              {markingPaid === item._id ? 'Processing...' : 'Mark Paid'}
                            </button>
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

        {/* Details Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Booking Details</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Event</p>
                  <p className="font-medium">{selectedItem.festivalName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Service Type</p>
                    <p className="font-medium capitalize">{selectedItem.serviceType}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Status</p>
                    <p className="font-medium capitalize">{selectedItem.status}</p>
                  </div>
                </div>

                {selectedItem.serviceType === 'hotel' && (
                  <>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Hotel</p>
                      <p className="font-medium">{selectedItem.details.hotelName}</p>
                      <p className="text-sm text-gray-500">{selectedItem.details.roomType}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Check-In</p>
                        <p className="font-medium">{formatDate(selectedItem.details.checkIn)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Check-Out</p>
                        <p className="font-medium">{formatDate(selectedItem.details.checkOut)}</p>
                      </div>
                    </div>
                  </>
                )}

                {selectedItem.serviceType === 'transport' && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Transport</p>
                    <p className="font-medium">{selectedItem.details.transportType}</p>
                    <p className="text-sm text-gray-500">
                      {selectedItem.details.pickupLocation} → {selectedItem.details.dropoffLocation}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Booked By</p>
                  <p className="font-medium">{selectedItem.userName}</p>
                  <p className="text-sm text-gray-500">{selectedItem.userEmail}</p>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Total Price</span>
                    <span className="font-medium">{formatCurrency(selectedItem.price)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Your Fee (5%)</span>
                    <span className="font-medium text-primary">+{formatCurrency(selectedItem.organizerFee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Due to Provider</span>
                    <span className="font-bold">{formatCurrency(selectedItem.providerDue)}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  {selectedItem.status === 'pending' && (
                    <button
                      onClick={() => {
                        markAsPaid(selectedItem._id);
                        setSelectedItem(null);
                      }}
                      disabled={markingPaid === selectedItem._id}
                      className="flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      {markingPaid === selectedItem._id ? 'Processing...' : 'Mark as Paid'}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="flex-1 py-3 border border-gray-200 font-medium rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}