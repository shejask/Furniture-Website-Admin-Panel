import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, orderData } = await request.json();

    // Create transporter with Hostinger SMTP settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com', // Hostinger SMTP server
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: 'hello@hexen.in', // Your Hostinger email
        pass: 'l1XR#d!W' // Your Hostinger password
      },
      tls: {
        rejectUnauthorized: false // Important for some servers
      }
    });

    // Verify connection
    await transporter.verify();

    // Send test email
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Shopping Lala Orders',
        address: process.env.SMTP_USER || 'hexenwebcreators@gmail.com'
      },
      to: email,
      subject: `Order Confirmed - #${orderData.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1>Order Confirmed!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Dear Customer,</p>
            
            <p>Thank you for your order! We're pleased to confirm that your order has been received and is being processed.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Order Number:</strong> ${orderData.orderId}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> ₹${orderData.total}</p>
            </div>

            <h3>Order Items:</h3>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px;">
              ${orderData.items.map((item: any) => `
                <div style="border-bottom: 1px solid #e5e7eb; padding: 10px 0;">
                  <strong>${item.name}</strong><br>
                  Quantity: ${item.quantity} × ₹${item.salePrice || item.price}<br>
                  Total: ₹${(item.salePrice || item.price) * item.quantity}
                </div>
              `).join('')}
            </div>
            
            <p style="margin-top: 20px;">Your order will be shipped soon. You will receive tracking information once it's dispatched.</p>
            
            <p>Best regards,<br>The Fastkart Team</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #666;">
            <p>© ${new Date().getFullYear()} Fastkart. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully!'
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }, { status: 500 });
  }
}
