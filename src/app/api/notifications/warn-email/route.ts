import { NextRequest, NextResponse } from 'next/server';

// POST /api/notifications/warn-email - Send warning email
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

    // Email template
    const subject = `Warning: Your ${targetType} received a report`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Hello ${name},</h2>
        <p>Your ${targetType.toLowerCase()} has received a report with the following details:</p>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>Reason:</strong> ${reason}<br/>
            <strong>Description:</strong> ${description || 'No additional details provided'}
          </p>
        </div>

        <p>Please review your content to ensure it complies with our community guidelines. If you believe this report is incorrect, you can contact our support team.</p>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Best regards,<br/>
          The EthioHub Team
        </p>
      </div>
    `;

    // For now, log the email (you can integrate with an email service like SendGrid, Nodemailer, etc.)
    console.log('Warn Email:', { to, subject, html });

    // TODO: Integrate with actual email service
    // Example with SendGrid:
    // await sgMail.send({ to, from: 'noreply@ethiohub.com', subject, html });

    return NextResponse.json({
      success: true,
      message: 'Warning email sent (logged)'
    });

  } catch (error: any) {
    console.error('Send warn email error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    );
  }
}
