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
        
        // Shiprocket tracking section
        const trackingSection = data.awbCode ? `
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <h4 style="margin-top: 0; color: #0ea5e9;">📦 Tracking Information</h4>
            <p style="margin: 5px 0;"><strong>AWB Code:</strong> ${data.awbCode}</p>
            <p style="margin: 5px 0;"><strong>Courier:</strong> ${data.courierName || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Shiprocket Order ID:</strong> ${data.shiprocketOrderId || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Shipment ID:</strong> ${data.shiprocketShipmentId || 'N/A'}</p>
            <p style="margin: 10px 0 5px 0;"><strong>Track Your Package:</strong></p>
            <a href="https://shiprocket.co/tracking/${data.awbCode}" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold;">Track Package</a>
          </div>
        ` : '';

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

              ${trackingSection}

              <!-- Invoice section temporarily disabled -->

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

        const mailOptions: any = {
          from: {
            name: 'Fastkart Orders',
            address: 'hello@hexen.in'
          },
          to: emailRecipient,
          subject: `Order Confirmed - #${data.orderId}`,
          html: emailHtml
        };

        // Invoice attachment temporarily disabled
        // if (data.invoiceBuffer) {
        //   mailOptions.attachments = [
        //     {
        //       filename: `invoice-${data.orderId}.html`,
        //       content: data.invoiceBuffer,
        //       encoding: 'base64',
        //       contentType: 'text/html'
        //     }
        //   ];
        // }
        
        console.log('📤 Sending email with options:', { 
          to: mailOptions.to, 
          subject: mailOptions.subject,
          from: mailOptions.from 
        });
        
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId, result.accepted);
        break;

      case 'order-cancellation':
        const cancellationRecipient = to || data.userEmail || data.customerEmail;
        console.log('📧 Sending order cancellation to:', cancellationRecipient);
        
        if (!cancellationRecipient) {
          throw new Error('No email recipient found');
        }

        const cancellationProductsHtml = (data.items || []).map((product: any) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${product.name || product.productName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(product.price || 0).toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${product.quantity || 0}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${((product.price || 0) * (product.quantity || 0)).toFixed(2)}</td>
          </tr>
        `).join('');

        const cancellationCustomerName = data.address?.firstName || data.customerName || 'Customer';
        const cancellationOrderDate = new Date(data.createdAt || data.orderDate || Date.now()).toLocaleDateString();
        const cancellationDate = new Date(data.cancelledAt || Date.now()).toLocaleDateString();

        const cancellationEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 20px; background-color: #dc2626; color: white;">
              <h1 style="margin: 0;">Order Cancelled</h1>
            </div>
            
            <div style="padding: 20px;">
              <p>Dear ${cancellationCustomerName},</p>
              
              <p>We regret to inform you that your order has been cancelled. We apologize for any inconvenience this may cause.</p>
              
              <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderId}</p>
                <p style="margin: 5px 0;"><strong>Order Date:</strong> ${cancellationOrderDate}</p>
                <p style="margin: 5px 0;"><strong>Cancelled On:</strong> ${cancellationDate}</p>
                <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${(data.totalAmount || 0).toFixed(2)}</p>
                ${data.cancellationReason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${data.cancellationReason}</p>` : ''}
              </div>

              <h3 style="color: #dc2626;">Cancelled Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${cancellationProductsHtml}
                </tbody>
              </table>

              <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #dc2626;">Refund Information</h4>
                <p style="margin: 5px 0;">If payment was already processed, a refund will be initiated within 3-5 business days.</p>
                <p style="margin: 5px 0;">You will receive a separate email confirmation once the refund is processed.</p>
              </div>

              <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #dc2626;">Need Help?</h4>
                <p style="margin: 5px 0;">Email: hello@hexen.in<br>
                Phone: +91 XXX XXX XXXX<br>
                Hours: Monday - Friday, 9:00 AM - 6:00 PM IST</p>
              </div>
              
              <p style="margin-top: 30px;">We apologize for any inconvenience and look forward to serving you again in the future.</p>
              
              <p style="margin-top: 20px;">Best regards,<br>The Fastkart Team</p>
            </div>
            
            <div style="text-align: center; padding: 20px; background-color: #f8fafc; color: #666;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Fastkart. All rights reserved.</p>
            </div>
          </div>
        `;

        const cancellationMailOptions = {
          from: {
            name: 'Fastkart Orders',
            address: 'hello@hexen.in'
          },
          to: cancellationRecipient,
          subject: `Order Cancelled - #${data.orderId}`,
          html: cancellationEmailHtml
        };
        
        console.log('📤 Sending cancellation email with options:', { 
          to: cancellationMailOptions.to, 
          subject: cancellationMailOptions.subject,
          from: cancellationMailOptions.from 
        });
        
        const cancellationResult = await transporter.sendMail(cancellationMailOptions);
        console.log('✅ Cancellation email sent successfully:', cancellationResult.messageId, cancellationResult.accepted);
        break;

      case 'vendor-order-notification':
        const vendorRecipient = data.vendorEmail;
        console.log('📧 Sending vendor notification to:', vendorRecipient);
        
        if (!vendorRecipient) {
          throw new Error('No vendor email found');
        }

        const vendorProductsHtml = (data.items || []).map((product: any) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${product.productName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(product.price || 0).toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${product.quantity || 0}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${((product.price || 0) * (product.quantity || 0)).toFixed(2)}</td>
          </tr>
        `).join('');

        const vendorName = data.vendorName || 'Vendor';
        const vendorCustomerName = data.customerName || 'Customer';
        const vendorOrderDate = new Date(data.orderDate || Date.now()).toLocaleDateString();

        // Check if this is a customer email (sent to customer) or vendor email
        const isCustomerEmail = data.to === data.userEmail;
        
        const vendorEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 20px; background-color: ${isCustomerEmail ? '#2563eb' : '#059669'}; color: white;">
              <h1 style="margin: 0;">${isCustomerEmail ? 'Order Confirmed!' : 'New Order Received!'}</h1>
            </div>
            
            <div style="padding: 20px;">
              <p>Dear ${isCustomerEmail ? vendorCustomerName : vendorName},</p>
              
              <p>${isCustomerEmail 
                ? 'Thank you for your order! Your order has been confirmed and is being processed. We will notify you once it ships.' 
                : 'You have received a new order from Fastkart. Please review the details below and prepare the items for shipment.'}</p>
              
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #059669;">
                <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderId}</p>
                <p style="margin: 5px 0;"><strong>Order Date:</strong> ${vendorOrderDate}</p>
                ${!isCustomerEmail ? `<p style="margin: 5px 0;"><strong>Customer:</strong> ${vendorCustomerName}</p>` : ''}
                ${!isCustomerEmail ? `<p style="margin: 5px 0;"><strong>Customer Email:</strong> ${data.userEmail}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${(data.totalAmount || data.total || 0).toFixed(2)}</p>
                ${isCustomerEmail && data.paymentStatus ? `<p style="margin: 5px 0;"><strong>Payment Status:</strong> ${data.paymentStatus}</p>` : ''}
              </div>

              <h3 style="color: #059669;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f0fdf4;">
                    <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e2e8f0;">Product</th>
                    <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">Price</th>
                    <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #e2e8f0;">Quantity</th>
                    <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${vendorProductsHtml}
                </tbody>
              </table>

              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #059669;">Shipping Address</h4>
                <p style="margin: 5px 0;"><strong>${vendorCustomerName}</strong></p>
                <p style="margin: 5px 0;">${data.address?.streetAddress || ''}</p>
                <p style="margin: 5px 0;">${data.address?.city || ''}, ${data.address?.state || ''} ${data.address?.zip || ''}</p>
                <p style="margin: 5px 0;">${data.address?.country || 'India'}</p>
                ${data.address?.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.address.phone}</p>` : ''}
              </div>

              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #059669;">Order Summary</h4>
                <p style="margin: 5px 0;"><strong>Subtotal:</strong> ₹${(data.subtotal || 0).toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>Shipping:</strong> ₹${(data.shipping || 0).toFixed(2)}</p>
                ${(data.discount || 0) > 0 ? `<p style="margin: 5px 0;"><strong>Discount:</strong> -₹${(data.discount || 0).toFixed(2)}</p>` : ''}
                <hr style="border: none; border-top: 1px solid #d1d5db; margin: 10px 0;">
                <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #059669;"><strong>Total:</strong> ₹${(data.totalAmount || data.total || 0).toFixed(2)}</p>
              </div>

              ${!isCustomerEmail ? `
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #059669;">Next Steps</h4>
                <p style="margin: 5px 0;">1. Review the order details and prepare the items</p>
                <p style="margin: 5px 0;">2. Package the items securely</p>
                <p style="margin: 5px 0;">3. Contact Fastkart for shipping arrangements</p>
                <p style="margin: 5px 0;">4. Update order status once shipped</p>
              </div>
              ` : ''}

              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #059669;">Need Help?</h4>
                <p style="margin: 5px 0;">Email: hello@hexen.in<br>
                Phone: +91 XXX XXX XXXX<br>
                Hours: Monday - Friday, 9:00 AM - 6:00 PM IST</p>
              </div>
              
              <p style="margin-top: 30px;">${isCustomerEmail 
                ? 'Thank you for purchasing from Fastkart! We appreciate your business and look forward to serving you again.' 
                : 'Thank you for being a valued vendor partner!'}</p>
              
              <p style="margin-top: 20px;">Best regards,<br>The Fastkart Team</p>
            </div>
            
            <div style="text-align: center; padding: 20px; background-color: #f0fdf4; color: #666;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Fastkart. All rights reserved.</p>
            </div>
          </div>
        `;

        const vendorMailOptions = {
          from: {
            name: 'Fastkart Orders',
            address: 'hello@hexen.in'
          },
          to: vendorRecipient,
          subject: isCustomerEmail 
            ? `Order Confirmed #${data.orderId} - Thank you for your order!` 
            : `New Order #${data.orderId} - ${vendorCustomerName}`,
          html: vendorEmailHtml
        };
        
        console.log('📤 Sending vendor notification with options:', { 
          to: vendorMailOptions.to, 
          subject: vendorMailOptions.subject,
          from: vendorMailOptions.from 
        });
        
        const vendorResult = await transporter.sendMail(vendorMailOptions);
        console.log('✅ Vendor notification sent successfully:', vendorResult.messageId, vendorResult.accepted);
        break;

      case 'refund-confirmation':
        const refundRecipient = data.customerEmail;
        console.log('📧 Sending refund confirmation to:', refundRecipient);
        
        if (!refundRecipient) {
          throw new Error('No email recipient found');
        }

        const refundProductsHtml = (data.items || []).map((product: any) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${product.productName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(product.price || 0).toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${product.quantity || 0}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${((product.price || 0) * (product.quantity || 0)).toFixed(2)}</td>
          </tr>
        `).join('');

        const refundCustomerName = data.customerName || 'Customer';
        const refundOrderDate = new Date(data.orderDate || Date.now()).toLocaleDateString();
        const refundDate = new Date(data.refundDate || Date.now()).toLocaleDateString();

        const refundEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 20px; background-color: #f59e0b; color: white;">
              <h1 style="margin: 0;">Refund Processed</h1>
            </div>
            
            <div style="padding: 20px;">
              <p>Dear ${refundCustomerName},</p>
              
              <p>Your refund request has been processed successfully. We apologize for any inconvenience and appreciate your understanding.</p>
              
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderId}</p>
                <p style="margin: 5px 0;"><strong>Order Date:</strong> ${refundOrderDate}</p>
                <p style="margin: 5px 0;"><strong>Refund Date:</strong> ${refundDate}</p>
                <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ₹${(data.totalAmount || 0).toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>Reason:</strong> ${data.refundReason}</p>
              </div>

              <h3 style="color: #f59e0b;">Refunded Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${refundProductsHtml}
                </tbody>
              </table>

              <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #f59e0b;">Refund Timeline</h4>
                <p style="margin: 5px 0;">• Refund processed: ${refundDate}</p>
                <p style="margin: 5px 0;">• Credit to original payment method: 3-5 business days</p>
                <p style="margin: 5px 0;">• Bank processing time: 1-2 business days</p>
                <p style="margin: 5px 0;">• You will receive a separate confirmation once the refund is credited</p>
              </div>

              <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #f59e0b;">Need Help?</h4>
                <p style="margin: 5px 0;">Email: hello@hexen.in<br>
                Phone: +91 XXX XXX XXXX<br>
                Hours: Monday - Friday, 9:00 AM - 6:00 PM IST</p>
              </div>
              
              <p style="margin-top: 30px;">Thank you for your patience and we look forward to serving you again in the future.</p>
              
              <p style="margin-top: 20px;">Best regards,<br>The Fastkart Team</p>
            </div>
            
            <div style="text-align: center; padding: 20px; background-color: #fef3c7; color: #666;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Fastkart. All rights reserved.</p>
            </div>
          </div>
        `;

        const refundMailOptions = {
          from: {
            name: 'Fastkart Orders',
            address: 'hello@hexen.in'
          },
          to: refundRecipient,
          subject: `Refund Processed - #${data.orderId}`,
          html: refundEmailHtml
        };
        
        console.log('📤 Sending refund confirmation with options:', { 
          to: refundMailOptions.to, 
          subject: refundMailOptions.subject,
          from: refundMailOptions.from 
        });
        
        const refundResult = await transporter.sendMail(refundMailOptions);
        console.log('✅ Refund confirmation sent successfully:', refundResult.messageId, refundResult.accepted);
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