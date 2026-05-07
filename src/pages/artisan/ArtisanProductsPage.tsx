import React from 'react';
import { ArtisanProductManager } from '../../components/dashboard/ArtisanProductManager';
import { WalletPanel } from '../../components/dashboard/WalletPanel';

export const ArtisanProductsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <ArtisanProductManager />
    </div>
  );
};

export default ArtisanProductsPage;
