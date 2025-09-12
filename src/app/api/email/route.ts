import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// WORKING Hostinger SMTP configuration - EXACTLY like the test email
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

// Verify connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP verification FAILED:', error);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

export async function POST(request: Request) {
  try {
    const { type, data, to } = await request.json();
    
    console.log('🚀 Email API called with:', { type, to, dataKeys: Object.keys(data || {}) });

    switch (type) {
      case 'customer-order-confirmation':
        const emailRecipient = to || data.userEmail || data.customerEmail;
        console.log('📧 Sending order confirmation to:', emailRecipient);
        
        if (!emailRecipient) {
          throw new Error('No email recipient found');
        }

        const productsHtml = (data.items || []).map((product: any) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${product.name || product.productName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(product.price || 0).toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${product.quantity || 0}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${((product.price || 0) * (product.quantity || 0)).toFixed(2)}</td>
          </tr>
        `).join('');

        const customerName = data.address?.firstName || data.customerName || 'Customer';
        const orderDate = new Date(data.createdAt || data.orderDate || Date.now()).toLocaleDateString();

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 20px; background-color: #2563eb; color: white;">
              <h1 style="margin: 0;">Order Confirmed!</h1>
            </div>
            
            <div style="padding: 20px;">
              <p>Dear ${customerName},</p>
              
              <p>Thank you for shopping with Fastkart! Your order has been confirmed and is being processed.</p>
              
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderId}</p>
                <p style="margin: 5px 0;"><strong>Order Date:</strong> ${orderDate}</p>
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
                  ${productsHtml}
                </tbody>
              </table>

              <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #2563eb;">Shipping Address</h4>
                <p style="margin: 5px 0;">${customerName}</p>
                <p style="margin: 5px 0;">${data.address?.streetAddress || data.address?.street || ''}</p>
                <p style="margin: 5px 0;">${data.address?.city || ''}, ${data.address?.state || ''} ${data.address?.zip || data.address?.postalCode || ''}</p>
                <p style="margin: 5px 0;">${data.address?.country || 'India'}</p>
              </div>

              <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #2563eb;">Need Help?</h4>
                <p style="margin: 5px 0;">Email: hello@hexen.in<br>
                Phone: +91 XXX XXX XXXX<br>
                Hours: Monday - Friday, 9:00 AM - 6:00 PM IST</p>
              </div>
              
              <p style="margin-top: 30px;">Best regards,<br>The Fastkart Team</p>
            </div>
            
            <div style="text-align: center; padding: 20px; background-color: #f8fafc; color: #666;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Fastkart. All rights reserved.</p>
            </div>
          </div>
        `;

        const mailOptions = {
          from: {
            name: 'Fastkart Orders',
            address: 'hello@hexen.in'
          },
          to: emailRecipient,
          subject: `Order Confirmed - #${data.orderId}`,
          html: emailHtml
        };
        
        console.log('📤 Sending email with options:', { 
          to: mailOptions.to, 
          subject: mailOptions.subject,
          from: mailOptions.from 
        });
        
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId, result.accepted);
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('❌ Email API Error:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}