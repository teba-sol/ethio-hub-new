import React from 'react';
import { useRouter } from 'next/navigation';
import { ArtisanOverview } from '../../components/dashboard/ArtisanSections';

export const ArtisanOverviewPage: React.FC = () => {
  const router = useRouter();
  return <ArtisanOverview onAddProduct={() => router.push('/dashboard/artisan/products/create')} />;
};
