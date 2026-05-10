import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck, LogOut, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/UI';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export const DeliveryWaitingPage: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(false);
      if (user.deliveryStatus === 'Approved') {
        router.replace('/dashboard/delivery');
      }
      if (user.deliveryStatus === 'Not Submitted') {
        router.replace('/dashboard/delivery/onboarding');
      }
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isRejected = user?.deliveryStatus === 'Rejected' || user?.deliveryStatus === 'Modification Requested';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-10 text-center">
          {isRejected ? (
            <>
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">Application {user?.deliveryStatus}</h1>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Unfortunately, your delivery guy application was {user?.deliveryStatus?.toLowerCase()}.
              </p>
              {(user as any)?.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-2xl mb-6 text-left">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1">Reason</p>
                  <p className="text-sm text-red-600 italic">"{(user as any).rejectionReason}"</p>
                </div>
              )}
              <Button
                className="w-full rounded-2xl py-4 mb-3"
                onClick={() => router.push('/dashboard/delivery/onboarding')}
              >
                Update Application
              </Button>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <Clock className="w-12 h-12 text-amber-600" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">Verification Pending</h1>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Your delivery guy application has been submitted successfully! Our admin team is currently reviewing your documents.
              </p>
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl text-left">
                  <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Documents Submitted</p>
                    <p className="text-xs text-gray-500">We are reviewing your application.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="space-y-3">
            <Button variant="outline" className="w-full rounded-2xl py-4 flex items-center justify-center gap-2" onClick={() => { logout(); router.push('/login'); }}>
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ethio Craft Hub Delivery Fleet</p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryWaitingPage;
