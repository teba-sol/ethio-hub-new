"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';

export default function Page() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-ethio-bg flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Under Review</h2>
        <p className="text-gray-600 mb-8">
          Your artisan application has been submitted successfully. Our team is reviewing your profile. 
          You will be notified once you are approved.
        </p>
        <div className="space-y-3">
          <Button onClick={() => router.push('/')} variant="outline" className="w-full">Return Home</Button>
          <Button onClick={() => { logout(); router.push('/login'); }} variant="ghost" leftIcon={LogOut} className="w-full">Log Out</Button>
        </div>
      </div>
    </div>
  );
}
