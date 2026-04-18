"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FestivalPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  useEffect(() => {
    if (id) {
      // Redirect to new booking flow step 1: hotels
      router.push(`/event/${id}/hotels`);
    }
  }, [id, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-ethio-bg">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">Loading booking flow...</p>
      </div>
    </div>
  );
}