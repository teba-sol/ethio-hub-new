"use client";

import React, { useState, useEffect } from 'react';
import {
  Coins, TrendingUp, DollarSign, Download, ArrowUpRight,
  ArrowDownLeft, RefreshCw, AlertCircle, CheckCircle2, Clock, Wallet, Eye, X,
  Truck, Users, Hotel, Car
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button, Badge } from '../UI';

interface WalletData {
  wallet: {
    pendingBalance: number;
    availableBalance: number;
    lifetimeEarned: number;
    lifetimePaidOut: number;
    lifetimeRefunded: number;
    currency: string;
    artisanTotalEarned?: number;
    organizerTotalEarned?: number;
    shippingFeesReceived?: number;
    shippingFeesPaidOut?: number;
    refundInReview?: number;
    refundInReviewCount?: number;
    thirdPartyAvailableBalance?: number;
    thirdPartyPaidOut?: number;
    hotelAvailableBalance?: number;
    hotelPaidOut?: number;
    transportAvailableBalance?: number;
    transportPaidOut?: number;
  };
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  paymentRef?: string;
  createdAt: string;
  orderId?: string;
  bookingId?: string;
  providerAmount?: number;
  hotelFee?: number;
  transportFee?: number;
  productId?: string;
  productName?: string;
  artisanName?: string;
  role?: 'artisan' | 'organizer';
  quantity?: number;
  unitPrice?: number;
  contactInfo?: { fullName?: string; email?: string; phone?: string };
  ticketType?: string;
  bookingDetails?: {
    room?: { hotelName?: string; roomPrice?: number; hotelRefCode?: string; roomId?: string };
    transport?: { type?: string; price?: number; transportRefCode?: string; transportId?: string };
  };
  details?: TransactionDetails;
  metadata?: {
    phoneNumber?: string;
    [key: string]: any;
  };
}

interface TransactionDetails {
  touristFullName?: string;
  touristEmail?: string;
  touristPhone?: string | null;
  artisanFullName?: string;
  artisanEmail?: string;
  artisanPhone?: string | null;
  artisanId?: string;
  productId?: string;
  productName?: string | null;
  productSku?: string | null;
  productCategory?: string | null;
  orderId?: string;
  bookingId?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  artisanEarnings?: number;
  providerAmount?: number;
  hotelFee?: number;
  transportFee?: number;
  adminCommission?: number | null;
  commissionRate?: number | null;
  paymentRef?: string;
  paymentGatewayId?: string | null;
  paymentMethod?: string;
  paymentDate?: string;
  orderStatus?: string | null;
  paymentStatus?: string | null;
  role?: 'artisan' | 'organizer';
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  } | null;
}

interface WalletPanelProps {
  userType: 'artisan' | 'admin' | 'organizer';
  title?: string;
  showWithdraw?: boolean;
}

const transactionTypeLabels: Record<string, string> = {
  ORDER_PAYMENT: 'Order Payment',
  ADMIN_COMMISSION: 'Admin Commission',
  WITHDRAWAL: 'Withdrawal',
  REFUND: 'Refund',
  ESCROW_HOLD: 'Escrow Hold',
  ESCROW_RELEASE: 'Escrow Release',
  RENTAL_FEE: 'Rental Fee',
  SHIPPING_FEE: 'Shipping Fee',
};

const transactionTypeVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
  ORDER_PAYMENT: 'success',
  ADMIN_COMMISSION: 'info',
  WITHDRAWAL: 'warning',
  REFUND: 'error',
  ESCROW_HOLD: 'warning',
  ESCROW_RELEASE: 'success',
  RENTAL_FEE: 'success',
  SHIPPING_FEE: 'info',
};

export const WalletPanel: React.FC<WalletPanelProps> = ({
  userType,
  title = 'Wallet',
  showWithdraw = true,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawSuccessMessage, setWithdrawSuccessMessage] = useState('');
  const [lastWithdrawData, setLastWithdrawData] = useState<{ amount: number; phoneNumber: string; txRef: string } | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showCommissionBreakdown, setShowCommissionBreakdown] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const fetchWallet = async (pageNum: number = 1, role: string = 'all', dates = dateRange) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = userType === 'admin' ? '/api/admin/wallet' : userType === 'organizer' ? '/api/organizer/wallet' : '/api/artisan/wallet';
      const roleParam = role !== 'all' ? `&role=${role}` : '';
      let dateParam = '';
      if (dates.start) dateParam += `&startDate=${dates.start}`;
      if (dates.end) dateParam += `&endDate=${dates.end}`;
      
      const res = await fetch(`${endpoint}?page=${pageNum}&limit=10${roleParam}${dateParam}`);
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      const data = await res.json();

      if (data.success) {
        setWalletData(data.data);
      } else {
        setError(data.message || 'Failed to load wallet data');
      }
    } catch (err) {
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet(page, roleFilter, dateRange);
  }, [page, roleFilter, dateRange]);

  const formatCurrency = (amount: number) => {
    return `ETB ${(amount || 0).toLocaleString()}`;
  };

  const formatDateTime = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const renderDetailValue = (value?: string | number | null) => {
    if (value === undefined || value === null || value === '') return 'N/A';
    return value;
  };

  const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words">{renderDetailValue(value)}</p>
    </div>
  );

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
      setWithdrawError('Please enter a valid amount');
      return;
    }

    const amount = Number(withdrawAmount);
    if (amount <= 0) {
      setWithdrawError('Withdrawal amount cannot be negative or zero');
      return;
    }

    const minAmount = userType === 'admin' ? 40 : userType === 'organizer' ? 2 : 500;
    if (amount < minAmount) {
      setWithdrawError(`Minimum withdrawal amount is ETB ${minAmount}`);
      return;
    }

    if (walletData && amount > walletData.wallet.availableBalance) {
      setWithdrawError('Amount exceeds available balance');
      return;
    }

    if ((userType === 'admin' || userType === 'organizer') && !phoneNumber) {
      setWithdrawError('Please enter a phone number');
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError(null);

    try {
      const endpoint = userType === 'admin' ? '/api/admin/wallet/withdraw' : userType === 'organizer' ? '/api/organizer/wallet/withdraw' : '/api/artisan/wallet/withdraw';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, phoneNumber }),
      });

      const data = await res.json();

      if (data.success) {
        setLastWithdrawData({
          amount: data.data.amount,
          phoneNumber: data.data.phoneNumber,
          txRef: data.data.txRef
        });
        setWithdrawSuccess(true);
        setWithdrawSuccessMessage(data.message || 'Withdrawal successful!');
        setWithdrawAmount('');
        setPhoneNumber('');
        
        // Refresh immediately so the lists update behind the receipt
        fetchWallet(page, roleFilter, dateRange);
      } else {
        setWithdrawError(data.message || 'Withdrawal request failed');
      }
    } catch (err) {
      setWithdrawError('Failed to process withdrawal');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold text-primary">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold text-primary">{title}</h2>
        </div>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!walletData) return null;

  const { wallet, transactions, pagination } = walletData;

  return (
    <div className="space-y-6">
      {/* Header */}
      {userType !== 'organizer' && userType !== 'admin' && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-primary">{title}</h2>
            <p className="text-gray-500 text-sm">
              Your earnings and withdrawals
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchWallet(page)}
              leftIcon={RefreshCw}
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 ${userType === 'admin' ? 'md:grid-cols-3' : 'md:grid-cols-3'} gap-6`}>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available</span>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(wallet.availableBalance)}</p>
          <p className="text-xs text-gray-400 mt-1">Withdrawable balance</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(wallet.pendingBalance)}</p>
          <p className="text-xs text-gray-400 mt-1">Awaiting clearance</p>
        </div>

        <div 
          onClick={() => userType === 'admin' && setShowCommissionBreakdown(!showCommissionBreakdown)}
          className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all ${userType === 'admin' ? 'cursor-pointer hover:border-blue-200 group' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${showCommissionBreakdown ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'}`}>
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Earned</span>
            </div>
            {userType === 'admin' && (
              <div className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${showCommissionBreakdown ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                {showCommissionBreakdown ? 'Hide Details' : 'View Details'}
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency((wallet.availableBalance || 0) + (wallet.lifetimePaidOut || 0))}
          </p>
          <p className="text-xs text-gray-400 mt-1">{userType === 'admin' ? 'Total cleared commission' : 'Lifetime available earnings'}</p>
        </div>
        
        {userType === 'organizer' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Third-Party Available</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(wallet.thirdPartyAvailableBalance || 0)}</p>
            
            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <Hotel className="w-3 h-3" />
                  Hotel
                </div>
                <p className="text-sm font-bold text-gray-700">{formatCurrency(wallet.hotelAvailableBalance || 0)}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <Car className="w-3 h-3" />
                  Transport
                </div>
                <p className="text-sm font-bold text-gray-700">{formatCurrency(wallet.transportAvailableBalance || 0)}</p>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-3">Total funds for providers</p>
          </div>
        )}

        {userType === 'admin' && (wallet.refundInReview || 0) > 0 && (
          <div
            onClick={() => router.push('/dashboard/admin/refund-requests')}
            className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-red-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <RefreshCw className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Refunds in Review</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(wallet.refundInReview || 0)}</p>
            <p className="text-xs text-gray-400 mt-1">{(wallet.refundInReviewCount || 0)} pending request{(wallet.refundInReviewCount || 0) !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {userType === 'admin' && showCommissionBreakdown && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-br from-white to-blue-50/30 p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Total from Artisan</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(wallet.artisanTotalEarned || 0)}</p>
            <p className="text-xs text-blue-400 mt-1">Total cleared commission from product sales</p>
          </div>
          
          <div className="bg-gradient-to-br from-white to-purple-50/30 p-6 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Coins className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Total from Organizer</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(wallet.organizerTotalEarned || 0)}</p>
            <p className="text-xs text-purple-400 mt-1">Total cleared commission from festival bookings</p>
          </div>

          <div className="bg-gradient-to-br from-white to-emerald-50/30 p-6 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Truck className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Shipping Fees</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency((wallet.shippingFeesReceived || 0) - (wallet.shippingFeesPaidOut || 0))}
            </p>
            <p className="text-xs text-emerald-400 mt-1">Available for delivery guy payroll</p>
          </div>
        </div>
      )}

      {userType === 'admin' && (
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            leftIcon={RefreshCw}
            onClick={() => router.push('/dashboard/admin/refund-requests')}
          >
            Refund Requests
            {(wallet.refundInReviewCount || 0) > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {wallet.refundInReviewCount}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Withdraw Section (Artisan, Organizer, and Admin) */}
      {(showWithdraw || userType === 'admin') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-primary mb-4">Withdraw Funds</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Amount (ETB)</label>
                <input
                  type="number"
                  min={userType === 'admin' ? 40 : userType === 'organizer' ? 2 : 500}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`e.g. 1200 (Min. ${userType === 'admin' ? 40 : userType === 'organizer' ? 2 : 500})`}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                />
              </div>

              {(userType === 'admin' || userType === 'organizer') && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Recipient Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="e.g. 0912345678"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                  />
                </div>
              )}

              {withdrawError && (
                <div className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  {withdrawError}
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount}
              >
                {isWithdrawing ? 'Processing Transfer...' : 'Withdraw Money'}
              </Button>

              <p className="text-xs text-gray-400">
                {(userType === 'admin' || userType === 'organizer')
                  ? 'Funds will be transferred immediately to the specified phone number.'
                  : 'You will be redirected to Chapa to process the withdrawal request.'}
              </p>
            </div>
          </div>

          {/* Recent Payout Requests */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-primary mb-4">Recent Payouts</h3>
            {transactions.filter(tx => tx.type === 'WITHDRAWAL').length === 0 ? (
              <p className="text-sm text-gray-400">No payout requests yet.</p>
            ) : (
              <div className="space-y-2">
                {transactions
                  .filter(tx => tx.type === 'WITHDRAWAL')
                  .slice(0, 5)
                  .map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 bg-gray-50/30">
                      <div>
                        <p className="font-bold text-gray-900 tabular-nums text-sm">{formatCurrency(tx.amount)}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {tx.metadata?.phoneNumber ? `To: ${tx.metadata.phoneNumber}` : new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                        {tx.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withdrawal Receipt Modal */}
      {withdrawSuccess && lastWithdrawData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            {/* Success Header */}
            <div className="bg-emerald-600 p-8 text-center relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h4 className="text-xl font-bold text-white mb-1">Transfer Successful</h4>
                <p className="text-emerald-100 text-sm opacity-90">Payment Receipt</p>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-8 space-y-6">
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Amount Transferred</p>
                <p className="text-4xl font-black text-primary">{formatCurrency(lastWithdrawData.amount)}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Recipient</span>
                  <span className="font-bold text-gray-900">{lastWithdrawData.phoneNumber}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Date</span>
                  <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Time</span>
                  <span className="font-medium text-gray-900">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Reference</span>
                  <span className="font-mono text-[10px] font-bold text-gray-500">{lastWithdrawData.txRef}</span>
                </div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <p className="text-[10px] text-emerald-700 text-center font-medium">
                  The funds have been deducted from your available balance and the recipient has been credited.
                </p>
              </div>

              <Button
                className="w-full py-6 rounded-2xl shadow-xl shadow-emerald-600/20"
                onClick={() => setWithdrawSuccess(false)}
              >
                Close Receipt
              </Button>
            </div>

            {/* Receipt Footer Decor */}
            <div className="h-2 bg-gray-50 flex gap-1 px-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex-1 bg-white rounded-t-full"></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h3 className="text-xl font-bold text-primary">Recent Transactions</h3>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Range Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`text-xs font-bold ${showDateFilter ? 'text-primary bg-primary/5' : 'text-gray-500'}`}
              leftIcon={Clock}
            >
              {showDateFilter ? 'Hide Dates' : 'Filter by Date'}
            </Button>

            {/* Date Range Filter */}
            {showDateFilter && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                <span className="text-sm text-gray-500 font-medium">Date:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                  />
                  {(dateRange.start || dateRange.end) && (
                    <button
                      onClick={() => setDateRange({ start: '', end: '' })}
                      className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                      title="Clear dates"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {userType === 'admin' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="artisan">Artisan (Products)</option>
                  <option value="organizer">Organizer (Festivals)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Coins className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-bold text-gray-400 uppercase">
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Type</th>
                    <th className="px-6 py-4 text-left">Details</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Payment Status</th>
{(userType === 'artisan' || userType === 'admin' || userType === 'organizer') && (
                       <th className="px-6 py-4 text-center">View Detail</th>
                     )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant={transactionTypeVariants[tx.type] || 'secondary'} size="sm">
                            {transactionTypeLabels[tx.type] || tx.type}
                          </Badge>
                          {tx.role && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${
                              tx.role === 'artisan' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                            }`}>
                              {tx.role}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm truncate">{tx.productName || 'N/A'}</p>
                            {(tx.type === 'ORDER_PAYMENT' || tx.type === 'ADMIN_COMMISSION') && tx.quantity && tx.quantity > 1 && (
                              <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                                x{tx.quantity}
                              </span>
                            )}
                          </div>
                          {(tx.type === 'ORDER_PAYMENT' || tx.type === 'ADMIN_COMMISSION') && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {tx.artisanName && (
                                <span className="font-medium">{tx.artisanName}</span>
                              )}
                              {tx.quantity && tx.unitPrice ? ` • ${tx.quantity} x ${formatCurrency(tx.unitPrice)}` : ''}
                            </p>
                          )}
                          {tx.type === 'SHIPPING_FEE' && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              <span className="font-medium text-primary">Tourist</span>
                              {tx.artisanName && (
                                <span className="text-gray-400 ml-1">({tx.artisanName})</span>
                              )}
                            </p>
                          )}
                          {tx.paymentRef && (
                            <p className="text-[10px] text-gray-400 font-mono mt-1">{tx.paymentRef}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-primary">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                          {tx.status}
                        </Badge>
                      </td>
{(userType === 'artisan' || userType === 'admin' || userType === 'organizer') && (
                         <td className="px-6 py-4 text-center">
                           <Button
                             variant="ghost"
                             size="sm"
                             leftIcon={Eye}
                             onClick={() => setSelectedTransaction(tx)}
                             className="text-xs"
                           >
                             View
                           </Button>
                         </td>
                       )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-6 border-t border-gray-100 flex justify-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setPage(pageNum);
                      fetchWallet(pageNum);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      pageNum === page
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {(userType === 'artisan' || userType === 'admin' || userType === 'organizer') && selectedTransaction && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-primary">Transaction Detail</h3>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {selectedTransaction.paymentRef || selectedTransaction.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close transaction detail"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedTransaction.type === 'SHIPPING_FEE' ? (
                  <div className="md:col-span-2 p-6 rounded-xl bg-blue-50 border border-blue-100 flex flex-col justify-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Total paid for shipment fee</p>
                    <p className="text-3xl font-black text-blue-900">
                      {formatCurrency(selectedTransaction.amount)}
                    </p>
                    <p className="text-xs text-blue-500 mt-2 italic">Paid by tourist for delivery service</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                        {userType === 'admin' ? 'Admin Commission' : (userType === 'organizer' || selectedTransaction.role === 'organizer') ? 'Organizer Earning' : 'Artisan Earning'}
                      </p>
                      <p className="text-xl font-bold text-emerald-800 mt-1">
                        {formatCurrency(
                          userType === 'admin'
                            ? selectedTransaction.details?.adminCommission || selectedTransaction.amount
                            : selectedTransaction.amount
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">{selectedTransaction.bookingId ? 'Tourist Paid' : 'Customer Paid'}</p>
                      <p className="text-xl font-bold text-blue-800 mt-1">
                        {selectedTransaction.details?.totalPrice
                          ? formatCurrency(selectedTransaction.details.totalPrice)
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                        {(userType === 'organizer' || (userType === 'artisan' && selectedTransaction.role !== 'artisan')) ? 'Admin Commission' : selectedTransaction.role === 'organizer' ? 'Organizer Got' : 'Artisan Got'}
                      </p>
                      <p className="text-xl font-bold text-amber-800 mt-1">
                        {formatCurrency(
                          (userType === 'organizer' || userType === 'artisan')
                            ? selectedTransaction.details?.adminCommission || 0
                            : selectedTransaction.details?.artisanEarnings || (selectedTransaction.details?.totalPrice ? (selectedTransaction.details.totalPrice - selectedTransaction.amount) : 0)
                        )}
                      </p>
                    </div>
                  </>
                )}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Transaction Status</p>
                  <div className="mt-2">
                    <Badge variant={selectedTransaction.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedTransaction.bookingId && (
                <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900">Third-Party Financials</h4>
                      <p className="text-xs text-purple-600">Breakdown for hotels and transport providers</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Total Provider Due (85%)</p>
                      <p className="text-xl font-black text-purple-700">
                        {formatCurrency(selectedTransaction.details?.providerAmount || selectedTransaction.providerAmount || 0)}
                      </p>
                    </div>
                    
                    { (selectedTransaction.details?.hotelFee || selectedTransaction.hotelFee || 0) > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          <Hotel className="w-3 h-3" />
                          Hotel Portion (85%)
                        </div>
                        <p className="text-lg font-bold text-gray-700">
                          {formatCurrency((selectedTransaction.details?.hotelFee || selectedTransaction.hotelFee || 0) * 0.85)}
                        </p>
                      </div>
                    )}
                    
                    { (selectedTransaction.details?.transportFee || selectedTransaction.transportFee || 0) > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          <Car className="w-3 h-3" />
                          Transport Portion (85%)
                        </div>
                        <p className="text-lg font-bold text-gray-700">
                          {formatCurrency((selectedTransaction.details?.transportFee || selectedTransaction.transportFee || 0) * 0.85)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-primary mb-4">Tourist Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DetailItem label="Full Name" value={selectedTransaction.details?.touristFullName} />
                  <DetailItem label="Email" value={selectedTransaction.details?.touristEmail} />
                  <DetailItem label="Phone" value={selectedTransaction.details?.touristPhone} />
                </div>
              </div>

              {userType === 'admin' && (
                <div>
                  <h4 className="font-bold text-primary mb-4">{selectedTransaction.role === 'organizer' ? 'Organizer Information' : 'Artisan Information'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DetailItem label="Full Name" value={selectedTransaction.details?.artisanFullName || selectedTransaction.artisanName} />
                    <DetailItem label="Email" value={selectedTransaction.details?.artisanEmail} />
                    <DetailItem label="Phone" value={selectedTransaction.details?.artisanPhone} />
                    <DetailItem label={selectedTransaction.role === 'organizer' ? 'Organizer ID' : 'Artisan ID'} value={selectedTransaction.details?.artisanId} />
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-primary mb-4">{selectedTransaction.bookingId ? 'Festival and Booking' : 'Product and Order'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DetailItem label={selectedTransaction.bookingId ? 'Festival Name' : 'Product Name'} value={selectedTransaction.details?.productName || selectedTransaction.productName} />
                  <DetailItem label={selectedTransaction.bookingId ? 'Booking ID' : 'Order ID'} value={selectedTransaction.details?.bookingId || selectedTransaction.details?.orderId || selectedTransaction.orderId} />
                  <DetailItem label="Quantity" value={selectedTransaction.details?.quantity || selectedTransaction.quantity} />
                  <DetailItem
                    label="Unit Price"
                    value={
                      selectedTransaction.details?.unitPrice || selectedTransaction.unitPrice
                        ? formatCurrency(selectedTransaction.details?.unitPrice || selectedTransaction.unitPrice || 0)
                        : null
                    }
                  />
                  {!selectedTransaction.bookingId && (
                    <>
                      <DetailItem label="SKU" value={selectedTransaction.details?.productSku} />
                      <DetailItem label="Category" value={selectedTransaction.details?.productCategory} />
                    </>
                  )}
                  <DetailItem label="Status" value={selectedTransaction.details?.orderStatus} />
                  <DetailItem label="Payment Status" value={selectedTransaction.details?.paymentStatus} />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-primary mb-4">Payment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DetailItem label="Payment Status" value={selectedTransaction.details?.paymentStatus || selectedTransaction.status} />
                  <DetailItem label="Chapa Reference" value={selectedTransaction.details?.paymentRef || selectedTransaction.paymentRef} />
                  <DetailItem label="Gateway Reference" value={selectedTransaction.details?.paymentGatewayId} />
                  <DetailItem label="Payment Method" value={selectedTransaction.details?.paymentMethod} />
                  <DetailItem label="Paid At" value={formatDateTime(selectedTransaction.details?.paymentDate || selectedTransaction.createdAt)} />
                  <DetailItem
                    label="Admin Commission"
                    value={
                      selectedTransaction.details?.adminCommission
                        ? formatCurrency(selectedTransaction.details.adminCommission)
                        : null
                    }
                  />
                  <DetailItem
                    label="Commission Rate"
                    value={
                      selectedTransaction.details?.commissionRate
                        ? `${Math.round(selectedTransaction.details.commissionRate * 100)}%`
                        : null
                    }
                  />
                </div>
              </div>

              {selectedTransaction.details?.shippingAddress && (
                <div>
                  <h4 className="font-bold text-primary mb-4">Shipping Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DetailItem label="Street" value={selectedTransaction.details.shippingAddress.street} />
                    <DetailItem label="City" value={selectedTransaction.details.shippingAddress.city} />
                    <DetailItem label="State" value={selectedTransaction.details.shippingAddress.state} />
                    <DetailItem label="Country" value={selectedTransaction.details.shippingAddress.country} />
                    <DetailItem label="Zip Code" value={selectedTransaction.details.shippingAddress.zipCode} />
                  </div>
                </div>
              )}

              {/* Download Receipt Button */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  leftIcon={Download}
                  onClick={() => {
                    // Logic to download receipt (can be a simple window.print() or a specific PDF generation)
                    window.print();
                  }}
                  className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                >
                  Download Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 p-6 rounded-2xl">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-800 mb-2">Wallet Information</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Platform commission rate: 10%</li>
              <li>• Artisan earnings: 90% of each sale</li>
              {userType === 'artisan' && (
                <li>• Minimum withdrawal amount: ETB 500</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
