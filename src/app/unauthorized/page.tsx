"use client";
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

const UnauthorizedPage = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
      <div className="bg-white p-12 rounded-2xl shadow-lg max-w-md w-full">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100">
          <ShieldAlert className="h-12 w-12 text-red-600" />
        </div>
        <h1 className="mt-6 text-3xl font-serif font-bold text-primary">Access Denied</h1>
        <p className="mt-4 text-gray-600">
          We're sorry, but you do not have the necessary permissions to access this page. 
          This could be because the page is restricted to certain user roles.
        </p>
        <div className="mt-8">
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;