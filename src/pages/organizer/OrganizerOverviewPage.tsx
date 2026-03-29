import React from 'react';
import { useRouter } from 'next/navigation';
import { OrganizerOverview } from '../../components/dashboard/OrganizerSections';

export const OrganizerOverviewPage: React.FC = () => {
  const router = useRouter();
  return (
    <OrganizerOverview 
      onManageEvent={(id) => router.push(`/dashboard/organizer/festivals/${id}`)} 
      onCreate={() => router.push('/dashboard/organizer/festivals/create')} 
    />
  );
};
