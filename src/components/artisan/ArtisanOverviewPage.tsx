import React from 'react';
import { useRouter } from 'next/navigation';
import { ArtisanOverview } from '@/components/dashboard/ArtisanSections';
import { useAuth } from '@/context/AuthContext';

export const ArtisanOverviewPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const isSuspended = user?.status === 'Suspended';

  return (
    <ArtisanOverview
      onAddProduct={() => {
        if (isSuspended) return;
        router.push('/dashboard/artisan/products/create');
      }}
      disableCreate={isSuspended}
    />
  );
};

export default ArtisanOverviewPage;
