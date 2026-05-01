import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const txRef = searchParams.get('tx_ref') || searchParams.get('trx_ref');
  
  if (!txRef) {
    return NextResponse.redirect(new URL('/?payment=error', request.url));
  }
  
  // Redirect to Chapa receipt page
  const receiptUrl = `https://chapa.link/payment-receipt/${txRef}`;
  
  return NextResponse.redirect(receiptUrl);
}
