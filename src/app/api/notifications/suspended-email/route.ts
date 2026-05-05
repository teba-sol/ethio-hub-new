import { NextRequest, NextResponse } from 'next/server';

// POST /api/notifications/suspended-email - Send suspension notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, name, targetType, reason, description } = body;

    if (!to || !name || !targetType) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const subject = `Notice: Your ${targetType} has been taken down`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Hello ${name},</h2>
        <p>Your ${targetType.toLowerCase()} has been taken down due to a community report.</p>

        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;">
            <strong>Reason:</strong> ${reason}<br/>
            <strong>Description:</strong> ${description || 'No additional details provided'}
          </p>
        </div>

        <p>If you believe this action was taken in error, please contact our support team to appeal this decision.</p>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Best regards,<br/>
          The EthioHub Team
        </p>
      </div>
    `;

    console.log('Suspended Email:', { to, subject, html });

    return NextResponse.json({
      success: true,
      message: 'Suspension email sent (logged)'
    });

  } catch (error: any) {
    console.error('Send suspended email error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    );
  }
}