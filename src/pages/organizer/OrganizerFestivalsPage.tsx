import React from 'react';
import { useRouter } from 'next/navigation';
import { OrganizerMyEventsView } from '../../components/dashboard/OrganizerSections';

export const OrganizerFestivalsPage: React.FC = () => {
  const router = useRouter();
  return (
    <OrganizerMyEventsView 
      onManageEvent={(id) => router.push(`/dashboard/organizer/festivals/${id}`)} 
      onCreate={() => router.push('/dashboard/organizer/festivals/create')} 
    />
  );
};
