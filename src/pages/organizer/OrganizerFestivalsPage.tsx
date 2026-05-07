import React from 'react';
import { useRouter } from 'next/navigation';
import { OrganizerMyEventsView } from '../../components/dashboard/OrganizerSections';
import { useAuth } from '../../context/AuthContext';

export const OrganizerFestivalsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const isSuspended = user?.status === 'Suspended';

  return (
    <OrganizerMyEventsView 
      onManageEvent={(id) => router.push(`/dashboard/organizer/festivals/${id}`)} 
      onCreate={() => {
        if (isSuspended) return;
        router.push('/dashboard/organizer/festivals/create');
      }}
      disableCreate={isSuspended}
    />
  );
};

export default OrganizerFestivalsPage;
