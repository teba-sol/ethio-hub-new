"use client";

import React, { useState, useEffect } from 'react';
import {
  Coins, TrendingUp, DollarSign, Download, ArrowUpRight,
  ArrowDownLeft, RefreshCw, AlertCircle, CheckCircle2, Clock, Wallet
} from 'lucide-react';
import { Button, Badge } from '../UI';

interface WalletData {
  wallet: {
    pendingBalance: number;
    availableBalance: number;
    lifetimeEarned: number;
    lifetimePaidOut: number;
    lifetimeRefunded: number;
    currency: string;
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
  productName?: string;
  quantity?: number;
  unitPrice?: number;
}

interface WalletPanelProps {
  userType: 'artisan' | 'admin';
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
};

const transactionTypeVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
  ORDER_PAYMENT: 'success',
  ADMIN_COMMISSION: 'info',
  WITHDRAWAL: 'warning',
  REFUND: 'error',
  ESCROW_HOLD: 'warning',
  ESCROW_RELEASE: 'success',
  RENTAL_FEE: 'success',
};

export const WalletPanel: React.FC<WalletPanelProps> = ({
  userType,
  title = 'Wallet',
  showWithdraw = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [page, setPage] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const fetchWallet = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = userType === 'admin' ? '/api/admin/wallet' : '/api/artisan/wallet';
      const res = await fetch(`${endpoint}?page=${pageNum}&limit=10`);
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
    fetchWallet(page);
  }, [page]);

  const formatCurrency = (amount: number) => {
    return `ETB ${(amount || 0).toLocaleString()}`;
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
      setWithdrawError('Please enter a valid amount');
      return;
    }

    const amount = Number(withdrawAmount);
    if (amount < 500) {
      setWithdrawError('Minimum withdrawal amount is ETB 500');
      return;
    }

    if (walletData && amount > walletData.wallet.availableBalance) {
      setWithdrawError('Amount exceeds available balance');
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError(null);

    try {
      const endpoint = userType === 'admin' ? '/api/admin/wallet/withdraw' : '/api/artisan/wallet/withdraw';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (data.success) {
        setWithdrawSuccess(true);
        setWithdrawAmount('');
        setTimeout(() => {
          setWithdrawSuccess(false);
          fetchWallet(page);
        }, 3000);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-primary">{title}</h2>
          <p className="text-gray-500 text-sm">
            {userType === 'admin' ? 'Platform earnings and commissions' : 'Your earnings and withdrawals'}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Available</span>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(wallet.availableBalance)}</p>
          <p className="text-xs text-gray-400 mt-1">Withdrawable balance</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Pending</span>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(wallet.pendingBalance)}</p>
          <p className="text-xs text-gray-400 mt-1">Awaiting clearance</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Lifetime Earned</span>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(wallet.lifetimeEarned)}</p>
          <p className="text-xs text-gray-400 mt-1">Total earnings</p>
        </div>
      </div>

      {/* Withdraw Section (Artisan only) */}
      {showWithdraw && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-primary mb-4">Withdraw via Chapa</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Amount (ETB)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 1200 (Min. 500)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
                />
              </div>

              {withdrawError && (
                <div className="text-xs text-red-600">{withdrawError}</div>
              )}

              {withdrawSuccess && (
                <div className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Withdrawal request submitted successfully!
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount}
              >
                {isWithdrawing ? 'Processing...' : 'Withdraw'}
              </Button>

              <p className="text-xs text-gray-400">
                You will be redirected to Chapa to process the withdrawal request.
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
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium tabular-nums text-sm">{formatCurrency(tx.amount)}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={transactionTypeVariants[tx.type] || 'secondary'} size="sm">
                        {tx.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-primary">Recent Transactions</h3>
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
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={transactionTypeVariants[tx.type] || 'secondary'} size="sm">
                          {transactionTypeLabels[tx.type] || tx.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800 text-sm">{tx.productName || 'N/A'}</p>
                            {(tx.type === 'ORDER_PAYMENT' || tx.type === 'ADMIN_COMMISSION') && tx.quantity && tx.quantity > 1 && (
                              <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                                x{tx.quantity}
                              </span>
                            )}
                          </div>
                          {(tx.type === 'ORDER_PAYMENT' || tx.type === 'ADMIN_COMMISSION') && tx.quantity && (
                            <p className="text-xs text-gray-400">
                              Quantity: {tx.quantity}
                              {tx.unitPrice ? ` x ${formatCurrency(tx.unitPrice)}` : ''}
                            </p>
                          )}
                          {tx.paymentRef && (
                            <p className="text-xs text-gray-400 font-mono">{tx.paymentRef}</p>
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
