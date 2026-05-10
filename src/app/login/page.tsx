"use client";
import { LoginPage } from '@/pages/AuthPages';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <LoginPage />
    </Suspense>
  );
}
