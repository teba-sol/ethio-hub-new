import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear access token
  response.cookies.set('sessionToken', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  // Clear refresh token
  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}