import React from 'react';
import { useRouter } from 'next/navigation';
import { OrganizerOverview } from '../../components/dashboard/OrganizerSections';
import { useAuth } from '../../context/AuthContext';

export const OrganizerOverviewPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const isSuspended = user?.status === 'Suspended';

  return (
    <OrganizerOverview 
      onManageEvent={(id) => router.push(`/dashboard/organizer/festivals/${id}`)} 
      onCreate={() => {
        if (isSuspended) return;
        router.push('/dashboard/organizer/festivals/create');
      }}
      disableCreate={isSuspended}
    />
  );
};
