"use client";
import { RegisterPage } from '@/pages/AuthPages';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <RegisterPage />
    </Suspense>
  );
}
