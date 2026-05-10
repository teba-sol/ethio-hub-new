import React from 'react';
import { useRouter } from 'next/navigation';
import { FestivalCreationWizard } from '../../components/dashboard/Wizards';

export const OrganizerCreateFestivalPage: React.FC = () => {
  const router = useRouter();
  return <FestivalCreationWizard onCancel={() => router.push('/dashboard/organizer/festivals')} />;
};

export default OrganizerCreateFestivalPage;
