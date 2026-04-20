'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Download } from 'lucide-react';

function PaymentContent() {
  const [params, setParams] = useState({ txRef: '', status: 'pending', loading: true });
  const [confirmed, setConfirmed] = useState(false);
  
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const txRef = searchParams.get('tx_ref') || '';
      const status = searchParams.get('status') || 'pending';
      
      setParams({ txRef, status, loading: false });
      
      // If returning from Chapa with success, try to confirm the booking
      if (status === 'success' || status === 'completed') {
        const pendingBooking = sessionStorage.getItem('pendingBooking');
        if (pendingBooking) {
          confirmBooking(pendingBooking);
        }
      }
    } catch (e) {
      console.log('Error parsing params:', e);
      setParams({ txRef: '', status: 'pending', loading: false });
    }
  }, []);
  
  const confirmBooking = async (bookingId: string) => {
    try {
      const response = await fetch('/api/tourist/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId,
          action: 'confirm',
          paymentMethod: 'chapa',
          paymentStatus: 'paid'
        }),
      });
      const data = await response.json();
      if (data.success) {
        setConfirmed(true);
        sessionStorage.removeItem('pendingBooking');
      }
    } catch (e) {
      console.error('Confirm error:', e);
    }
  };
  
  const isSuccess = params.status === 'success' || params.status === 'completed' || confirmed;
  
  if (params.loading) {
    return (
      <div style={{minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <p style={{color: '#1a1a1a'}}>Loading...</p>
      </div>
    );
  }
  
  if (!isSuccess) {
    return (
      <div style={{minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
        <div style={{background: 'white', borderRadius: '32px', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center'}}>
          <h1 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '20px'}}>Payment Failed</h1>
          <p style={{color: '#666', marginBottom: '20px'}}>Your payment could not be completed. Please try again.</p>
          <a href="/" style={{display: 'inline-block', padding: '12px 24px', background: '#1a1a1a', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold'}}>
            Back to Home
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
      <div style={{background: 'white', borderRadius: '32px', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: '#e9e4da', borderRadius: '0 0 0 100%', transform: 'translate(40px, -40px)'}} />
        
        <div style={{position: 'relative', zIndex: 1}}>
          <div style={{width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'}}>
            <CheckCircle2 style={{width: '48px', height: '48px', color: '#16a34a'}} />
          </div>

          <h1 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: '#1a1a1a'}}>Payment Successful!</h1>
          
          <p style={{color: '#666', marginBottom: '24px'}}>
            Your booking has been confirmed.
          </p>

          {params.txRef && (
            <div style={{background: '#f5f5f5', borderRadius: '12px', padding: '16px', marginBottom: '24px'}}>
              <p style={{fontSize: '12px', color: '#999', textTransform: 'uppercase', marginBottom: '4px'}}>Transaction Ref</p>
              <p style={{fontFamily: 'monospace', fontWeight: 'bold', color: '#1a1a1a'}}>{params.txRef}</p>
            </div>
          )}

          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <button style={{width: '100%', padding: '16px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
              <Download style={{width: '20px', height: '20px'}} />
              Download Ticket
            </button>
            
            <a href="/" style={{width: '100%', padding: '16px', border: '1px solid #e5e5e5', color: '#333', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
              Back to Home
              <ArrowRight style={{width: '20px', height: '20px'}} />
            </a>
          </div>

          <p style={{fontSize: '12px', color: '#999', marginTop: '24px'}}>
            Need help? Contact support@ethiohub.com
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div style={{minHeight: '100vh', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <p style={{color: '#1a1a1a'}}>Loading...</p>
      </div>
    );
  }
  
  return <PaymentContent />;
}