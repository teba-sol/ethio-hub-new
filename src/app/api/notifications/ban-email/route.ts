import { NextRequest, NextResponse } from 'next/server';
import { sendBanEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, name, targetType, reportReason, reportDescription, adminNote } = body;

    if (!to || !name) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing required fields: to, name' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    await sendBanEmail({
      to,
      name,
      targetType: targetType || 'account',
      reportReason: reportReason || 'Multiple serious violations of community guidelines',
      reportDescription: reportDescription || '',
      adminNote: adminNote || '',
    });

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Ban email sent successfully' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Send ban email error:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Failed to send ban email', error: error.message }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
