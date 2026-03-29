import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
  // To log out, we simply expire the cookie immediately
  const serializedCookie = serialize('sessionToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1, // Expire the cookie
    path: '/',
  });

  const response = new NextResponse(
    JSON.stringify({ success: true, message: 'Logged out successfully' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  response.headers.set('Set-Cookie', serializedCookie);

  return response;
}