import React from 'react';
import { WalletPanel } from '../../components/dashboard/WalletPanel';

export const AdminWalletPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Admin Wallet</h1>
        <p className="text-gray-500">
          Platform commissions and earnings from all transactions.
        </p>
      </div>
      <WalletPanel userType="admin" title="Wallet Overview" showWithdraw={false} />
    </div>
  );
};
