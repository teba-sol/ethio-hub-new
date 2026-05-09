"use client";

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, User, Truck, CheckCircle, 
  RefreshCw, Download, Calendar, ArrowUpRight
} from 'lucide-react';
import { Button, Badge } from '@/components/UI';
import { useNotification } from '@/context/NotificationContext';

interface PayrollItem {
  _id: string;
  name: string;
  email: string;
  tripsCompleted: number;
  totalFeesCollected: number;
  driverShare: number;
  adminShare: number;
  walletBalance: number;
}

export default function DeliveryPayrollPage() {
  const [payroll, setPayroll] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/delivery-payroll');
      const data = await res.json();
      if (data.success) {
        setPayroll(data.payroll);
      }
    } catch (err) {
      console.error('Error fetching payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async (id: string) => {
    if (!window.confirm('Are you sure you want to process payout for this driver?')) return;
    
    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/delivery-payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryGuyId: id }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message, 'success');
        fetchPayroll();
      } else {
        showNotification(data.message || 'Payout failed', 'error');
      }
    } catch (err) {
      showNotification('Error processing payout', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => `ETB ${(amount || 0).toLocaleString()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Delivery Payroll</h1>
          <p className="text-gray-500">Track driver performance and manage monthly payouts</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={Calendar}>Current Month</Button>
          <Button leftIcon={Download}>Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Trips (Month)</p>
          <p className="text-3xl font-bold text-primary">
            {payroll.reduce((sum, item) => sum + item.tripsCompleted, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Fees Collected</p>
          <p className="text-3xl font-bold text-emerald-600">
            {formatCurrency(payroll.reduce((sum, item) => sum + item.totalFeesCollected, 0))}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Admin Share (20%)</p>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(payroll.reduce((sum, item) => sum + item.adminShare, 0))}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Driver Name</th>
                <th className="px-6 py-4">Trips Completed</th>
                <th className="px-6 py-4">Total Fees Collected</th>
                <th className="px-6 py-4">Driver Share (80%)</th>
                <th className="px-6 py-4">Admin Share (20%)</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payroll.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-primary">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700">{item.tripsCompleted}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{formatCurrency(item.totalFeesCollected)}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-emerald-600">{formatCurrency(item.driverShare)}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600">{formatCurrency(item.adminShare)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      size="sm" 
                      onClick={() => handlePayout(item._id)}
                      disabled={processingId === item._id || item.walletBalance <= 0}
                      isLoading={processingId === item._id}
                      leftIcon={DollarSign}
                    >
                      Pay Now
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
