import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EventDetailPanel } from '../../components/dashboard/OrganizerSections';

export const OrganizerEventDetailPage: React.FC = () => {
  const params = useParams();
  const id = Array.isArray((params as any)?.id) ? (params as any).id[0] : (params as any)?.id;
  const router = useRouter();
  
  if (!id) return null;
  
  return <EventDetailPanel eventId={id} onBack={() => router.push('/dashboard/organizer/festivals')} />;
};
