import { NextRequest, NextResponse } from 'next/server';

// POST /api/notifications/ban-email - Send ban email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, name, targetType, reason, description } = body;

    if (!to || !name) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const subject = targetType 
      ? `Your ${targetType} has been suspended` 
      : 'Your account has been suspended';
    
    const contentType = targetType || 'account';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Hello ${name},</h2>
        <p>Your ${contentType} has been suspended due to violations of our community guidelines.</p>
 
        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;">
            <strong>Reason:</strong> ${reason || 'Multiple reports and violations'}<br/>
            <strong>Description:</strong> ${description || 'No additional details provided'}
          </p>
        </div>
 
        <p>If you believe this suspension is incorrect, you can appeal by contacting our support team at <a href="mailto:support@ethiohub.com">support@ethiohub.com</a>.</p>
 
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Best regards,<br/>
          The EthioHub Team
        </p>
      </div>
    `;

    // For now, log the email (you can integrate with an email service)
    console.log('Ban Email:', { to, subject, html });

    // TODO: Integrate with actual email service

    return NextResponse.json({
      success: true,
      message: 'Ban email sent (logged)'
    });

  } catch (error: any) {
    console.error('Send ban email error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    );
  }
}
