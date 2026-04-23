// Standalone success page - no providers needed
export default function PaymentSuccessPage() {
  // Get params directly from URL without hooks
  let status = 'pending';
  let bookingId = '';
  
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      status = params.get('status') || 'pending';
      bookingId = params.get('bookingId') || '';
    } catch (e) {
      // ignore
    }
  }

  const isSuccess = status === 'success';

  // Confirm booking on load - no await needed
  if (bookingId && isSuccess && typeof fetch !== 'undefined') {
    try {
      fetch('/api/tourist/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId,
          action: 'confirm',
          paymentMethod: 'chapa',
          paymentStatus: 'paid'
        })
      }).catch(function() {});
    } catch (e) {
      // ignore
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf8f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '32px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: isSuccess ? '#dcfce7' : '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '40px'
        }}>
          {isSuccess ? '✓' : '✗'}
        </div>
        
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '12px',
          color: isSuccess ? '#16a34a' : '#dc2626'
        }}>
          Payment {isSuccess ? 'Successful!' : 'Failed'}
        </h1>
        
        <p style={{ color: '#666', marginBottom: '24px' }}>
          {isSuccess 
            ? 'Your booking has been confirmed. Thank you for your purchase!' 
            : 'There was an issue processing your payment.'}
        </p>
        
        <a 
          href="/" 
          style={{
            display: 'inline-block',
            padding: '16px 32px',
            background: '#1a1a1a',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: 'bold'
          }}
        >
          Back to Home
        </a>
        
        {bookingId && (
          <div style={{
            background: '#f5f5f5',
            padding: '12px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            marginTop: '16px'
          }}>
            Booking: {bookingId}
          </div>
        )}
      </div>
    </div>
  );
}