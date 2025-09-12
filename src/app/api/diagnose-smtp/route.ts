import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const config = {
      SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
      SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
      SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
      SMTP_USER: process.env.SMTP_USER || 'NOT SET',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'SET (length: ' + process.env.SMTP_PASSWORD.length + ')' : 'NOT SET',
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'NOT SET',
      NEXT_PUBLIC_ENABLE_EMAIL: process.env.NEXT_PUBLIC_ENABLE_EMAIL || 'NOT SET'
    };

    return NextResponse.json({
      message: 'SMTP Configuration Diagnosis',
      environment: config,
      recommendations: [
        'For Hostinger Email (hello@hexen.in):',
        '  SMTP_HOST=smtp.hostinger.com',
        '  SMTP_PORT=587 (or 465 for SSL)',
        '  SMTP_SECURE=false (or true for port 465)',
        '  SMTP_USER=hello@hexen.in',
        '  SMTP_PASSWORD=your_regular_hostinger_email_password',
        '',
        'Alternative Hostinger settings:',
        '  SMTP_HOST=mail.hexen.in',
        '  Or try: smtp.titan.email',
        '',
        'Note: Use regular email password, NOT app password for Hostinger'
      ]
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to read environment variables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
