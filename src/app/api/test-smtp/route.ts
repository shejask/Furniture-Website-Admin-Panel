import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    console.log('Testing SMTP with email:', email);
    console.log('SMTP Config:', {
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER || 'hello@hexen.in'
    });

    // Create transporter with Hostinger SMTP settings
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'hello@hexen.in',
        pass: process.env.SMTP_PASSWORD || 'l1XR#d!W'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    // Send test email
    const mailOptions = {
      from: {
        name: 'Fastkart Test',
        address: 'hello@hexen.in'
      },
      to: email,
      subject: 'SMTP Test - ' + new Date().toISOString(),
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>SMTP Test Email</h2>
          <p>This is a test email to verify SMTP configuration is working.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Server:</strong> smtp.hostinger.com</p>
          <p><strong>From:</strong> hello@hexen.in</p>
        </div>
      `
    };

    console.log('Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully:', info.messageId);

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted,
      message: 'Test email sent successfully'
    });

  } catch (error) {
    console.error('SMTP Test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'SMTP Test endpoint - POST to test email sending',
    config: {
      host: process.env.SMTP_HOST || 'smtp.hostinger.com (fallback)',
      port: process.env.SMTP_PORT || '587 (fallback)',
      user: process.env.SMTP_USER || 'hello@hexen.in (fallback)',
      passwordSet: !!process.env.SMTP_PASSWORD
    }
  });
}
