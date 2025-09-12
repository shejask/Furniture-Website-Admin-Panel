import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create reusable transporter with SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: 'hello@hexen.in',
    pass: 'l1XR#d!W'
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  logger: true
});

// Verify SMTP connection configuration
transporter.verify(function (error) {
  if (error) {
    // Log error for debugging but don't expose to client
  }
});

export async function POST(request: Request) {
  try {
    const { order, invoiceHtml } = await request.json();

    // Generate email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background-color: #2563eb; color: white;">
          <h1 style="margin: 0;">Order Confirmed!</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear ${order.customerName},</p>
          
          <p>Thank you for shopping with Fastkart! Your order has been confirmed and is being processed.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.total.toFixed(2)}</p>
          </div>

          <h3 style="color: #2563eb;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e2e8f0;">Product</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">Price</th>
                <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #e2e8f0;">Quantity</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.products.map((product: any) => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${product.productName}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${product.price.toFixed(2)}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${product.quantity}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${product.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #2563eb;">Delivery Address</h4>
            <p style="margin: 5px 0;">${order.shippingAddress?.street || ''}</p>
            <p style="margin: 5px 0;">${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}</p>
            <p style="margin: 5px 0;">${order.shippingAddress?.country || ''} - ${order.shippingAddress?.postalCode || ''}</p>
          </div>

          <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #2563eb;">Need Help?</h4>
            <p style="margin: 5px 0;">If you have any questions about your order, please contact our customer service:</p>
            <p style="margin: 5px 0;">
              Email: hello@hexen.in<br>
              Phone: ${process.env.SUPPORT_PHONE || '+91 XXX XXX XXXX'}<br>
              Hours: Monday - Friday, 9:00 AM - 6:00 PM IST
            </p>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br>The Fastkart Team</p>
        </div>
        
        <div style="text-align: center; padding: 20px; background-color: #f8fafc; color: #666;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Fastkart. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send email
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Fastkart Orders',
        address: process.env.SMTP_USER || 'hello@hexen.in'
      },
      to: order.customerEmail,
      subject: `Order Confirmed - #${order.orderNumber}`,
      html: emailHtml,
      attachments: invoiceHtml ? [
        {
          filename: `invoice-${order.orderNumber}.html`,
          content: invoiceHtml,
          contentType: 'text/html'
        }
      ] : []
    };

    // Send email using SMTP
    const info = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted
    });
  } catch (error) {
    // More detailed error handling for common issues
    let errorMessage = 'Failed to send email';
    let troubleshooting: string[] = [];
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid login') || error.message.includes('authentication failed')) {
        errorMessage = 'SMTP Authentication failed';
        troubleshooting = [
          'Check SMTP_USER is set to hello@hexen.in',
          'Verify SMTP_PASSWORD is your Gmail App Password (16 characters)',
          'Ensure 2-Factor Authentication is enabled on Gmail',
          'Generate a new App Password at: https://myaccount.google.com/apppasswords'
        ];
      } else if (error.message.includes('ECONNRESET')) {
        errorMessage = 'SMTP Connection reset - Usually authentication issue';
        troubleshooting = [
          'This typically means wrong credentials',
          'Check your Gmail App Password is correct',
          'Ensure you are using App Password, not regular password',
          'Verify 2FA is enabled on your Gmail account',
          'Try generating a new App Password'
        ];
      } else if (error.message.includes('Connection timeout') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'SMTP Connection timeout';
        troubleshooting = [
          'Check internet connection',
          'Verify SMTP_HOST and SMTP_PORT',
          'Check firewall settings',
          'Try port 465 with SMTP_SECURE=true'
        ];
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'SMTP Host not found';
        troubleshooting = [
          'Check SMTP_HOST spelling',
          'Verify DNS resolution',
          'Try different SMTP server'
        ];
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused by SMTP server';
        troubleshooting = [
          'Check SMTP_PORT (587 for TLS, 465 for SSL)',
          'Verify SMTP server is accessible',
          'Check if ISP blocks SMTP ports'
        ];
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting,
      config: {
        host: process.env.SMTP_HOST || 'NOT SET',
        port: process.env.SMTP_PORT || 'NOT SET',
        user: process.env.SMTP_USER || 'NOT SET',
        passwordLength: process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 0,
        secure: process.env.SMTP_SECURE || 'NOT SET'
      }
    }, { status: 500 });
  }
}
