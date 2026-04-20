'use client';

import { useEffect } from 'react';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);
 
  return (
    <div className="min-h-screen bg-ethio-bg flex items-center justify-center p-6">
      <div className="bg-white rounded-[32px] p-10 max-w-lg w-full text-center shadow-2xl">
        <h2 className="text-2xl font-serif font-bold text-primary mb-4">Something went wrong</h2>
        <p className="text-gray-500 mb-6">Please refresh the page and try again.</p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}