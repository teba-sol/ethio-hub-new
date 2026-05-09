import { NextRequest, NextResponse } from 'next/server';
import { sendContentTakenDownEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, name, targetType, reportReason, reportDescription, adminNote } = body;

    if (!to || !name || !targetType) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing required fields: to, name, targetType' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    await sendContentTakenDownEmail({
      to,
      name,
      targetType,
      reportReason: reportReason || '',
      reportDescription: reportDescription || '',
      adminNote: adminNote || '',
    });

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Content taken down email sent successfully' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Send suspended email error:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Failed to send suspended email', error: error.message }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
