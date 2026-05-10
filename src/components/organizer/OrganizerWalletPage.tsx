import React from 'react';
import { WalletPanel } from '../../components/dashboard/WalletPanel';

export const OrganizerWalletPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Wallet</h1>
        <p className="text-gray-500">
          Track your earnings, available balance, and request withdrawals.
        </p>
      </div>
      <WalletPanel userType="organizer" title="Wallet" showWithdraw={true} />
    </div>
  );
};

export default OrganizerWalletPage;
