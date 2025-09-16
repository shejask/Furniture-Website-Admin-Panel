'use client';

interface OrderProduct {
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  products: OrderProduct[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
}

export class InvoiceGenerator {
  static generateInvoiceHTML(orderData: OrderData): string {
    const productsHtml = orderData.products.map((product, index) => `
      <tr class="product-row">
        <td class="product-cell">
          <div class="product-info">
            <span class="product-name">${product.productName}</span>
            <span class="product-index">#${(index + 1).toString().padStart(2, '0')}</span>
          </div>
        </td>
        <td class="price-cell">₹${product.price.toFixed(2)}</td>
        <td class="quantity-cell">
          <span class="quantity-badge">${product.quantity}</span>
        </td>
        <td class="total-cell">₹${product.total.toFixed(2)}</td>
      </tr>
    `).join('');

    const paymentStatusColor = orderData.paymentStatus.toLowerCase() === 'paid' ? '#10b981' : 
                              orderData.paymentStatus.toLowerCase() === 'pending' ? '#f59e0b' : '#ef4444';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - ${orderData.orderNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 20px;
            }
            
            .invoice-container {
              max-width: 900px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 24px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              overflow: hidden;
              position: relative;
            }
            
            .invoice-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 6px;
              background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              animation: float 6s ease-in-out infinite;
            }
            
            @keyframes float {
              0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
              50% { transform: translate(-50%, -50%) rotate(180deg); }
            }
            
            .company-name {
              font-size: 36px;
              font-weight: 800;
              margin-bottom: 8px;
              letter-spacing: -0.5px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
              position: relative;
              z-index: 1;
            }
            
            .invoice-title {
              font-size: 18px;
              font-weight: 500;
              opacity: 0.9;
              letter-spacing: 2px;
              text-transform: uppercase;
              position: relative;
              z-index: 1;
            }
            
            .content {
              padding: 40px;
            }
            
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
            }
            
            .detail-section {
              background: #f8fafc;
              padding: 24px;
              border-radius: 16px;
              border: 1px solid #e2e8f0;
              position: relative;
            }
            
            .detail-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
              border-radius: 16px 16px 0 0;
            }
            
            .section-title {
              font-weight: 700;
              font-size: 16px;
              color: #1f2937;
              margin-bottom: 16px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .section-title::before {
              content: '';
              width: 8px;
              height: 8px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 50%;
            }
            
            .info-item {
              margin: 8px 0;
              color: #4b5563;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .info-label {
              font-weight: 600;
              color: #374151;
              min-width: 100px;
            }
            
            .payment-status {
              display: inline-flex;
              align-items: center;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              background: ${paymentStatusColor}15;
              color: ${paymentStatusColor};
              border: 1px solid ${paymentStatusColor}30;
            }
            
            .payment-status::before {
              content: '';
              width: 6px;
              height: 6px;
              background: ${paymentStatusColor};
              border-radius: 50%;
              margin-right: 6px;
            }
            
            .products-section {
              margin-bottom: 40px;
            }
            
            .products-title {
              font-size: 20px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .products-title::before {
              content: '🛍️';
              font-size: 20px;
            }
            
            .products-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .products-table th {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 16px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .products-table th:first-child {
              border-radius: 12px 0 0 0;
            }
            
            .products-table th:last-child {
              border-radius: 0 12px 0 0;
            }
            
            .product-row {
              transition: all 0.2s ease;
            }
            
            .product-row:hover {
              background: #f8fafc;
            }
            
            .product-row:nth-child(even) {
              background: #fafbfc;
            }
            
            .product-row:nth-child(even):hover {
              background: #f3f4f6;
            }
            
            .product-cell,
            .price-cell,
            .quantity-cell,
            .total-cell {
              padding: 16px;
              border-bottom: 1px solid #e5e7eb;
              font-weight: 500;
            }
            
            .product-info {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            
            .product-name {
              font-weight: 600;
              color: #1f2937;
            }
            
            .product-index {
              font-size: 12px;
              color: #6b7280;
              background: #f3f4f6;
              padding: 2px 8px;
              border-radius: 8px;
            }
            
            .price-cell,
            .total-cell {
              text-align: right;
              font-weight: 600;
              color: #059669;
            }
            
            .quantity-cell {
              text-align: center;
            }
            
            .quantity-badge {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
            }
            
            .summary-section {
              background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
              border-radius: 16px;
              padding: 32px;
              border: 1px solid #e2e8f0;
              margin-left: auto;
              width: 400px;
              position: relative;
            }
            
            .summary-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
              border-radius: 16px 16px 0 0;
            }
            
            .summary-title {
              font-size: 18px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 20px;
              text-align: center;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              color: #4b5563;
              font-weight: 500;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .summary-row:last-child {
              border-bottom: none;
            }
            
            .discount-row {
              color: #059669;
            }
            
            .total-row {
              font-weight: 700;
              font-size: 20px;
              color: #1f2937;
              background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
              padding: 16px;
              margin: 16px -16px -16px;
              border-radius: 12px;
              border-top: 2px solid #e5e7eb;
            }
            
            .footer {
              background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
              text-align: center;
              padding: 32px;
              margin-top: 40px;
              border-top: 2px solid #e5e7eb;
              border-radius: 0 0 24px 24px;
            }
            
            .footer-message {
              font-size: 16px;
              color: #6b7280;
              margin-bottom: 12px;
            }
            
            .footer-tagline {
              font-size: 14px;
              color: #9ca3af;
              font-style: italic;
            }
            
            @media (max-width: 768px) {
              .details-grid {
                grid-template-columns: 1fr;
                gap: 20px;
              }
              
              .summary-section {
                width: 100%;
              }
              
              .content {
                padding: 20px;
              }
              
              .header {
                padding: 30px 20px;
              }
            }
            
            @media print {
              body {
                background: white;
                padding: 0;
              }
              
              .invoice-container {
                box-shadow: none;
                border-radius: 0;
              }
              
              .header::before {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="company-name">FASTKART</div>
              <div class="invoice-title">Invoice</div>
            </div>

            <div class="content">
              <div class="details-grid">
                <div class="detail-section">
                  <div class="section-title">Invoice Details</div>
                  <div class="info-item">
                    <span class="info-label">Invoice #:</span>
                    <span>${orderData.orderNumber}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Date:</span>
                    <span>${new Date(orderData.createdAt).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Payment:</span>
                    <span>${orderData.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Status:</span>
                    <span class="payment-status">${orderData.paymentStatus}</span>
                  </div>
                </div>
                
                <div class="detail-section">
                  <div class="section-title">Bill To</div>
                  <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span>${orderData.customerName}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span>${orderData.customerEmail}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Phone:</span>
                    <span>${orderData.customerPhone}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Address:</span>
                    <div>
                      <div>${orderData.billingAddress.street}</div>
                      <div>${orderData.billingAddress.city}, ${orderData.billingAddress.state}</div>
                      <div>${orderData.billingAddress.country} - ${orderData.billingAddress.postalCode}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="products-section">
                <div class="products-title">Order Items</div>
                <table class="products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style="text-align: right;">Unit Price</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productsHtml}
                  </tbody>
                </table>
              </div>

              <div class="summary-section">
                <div class="summary-title">Order Summary</div>
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>₹${orderData.subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span>Tax (GST 18%)</span>
                  <span>₹${orderData.tax.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span>Shipping & Handling</span>
                  <span>₹${orderData.shipping.toFixed(2)}</span>
                </div>
                ${orderData.discount > 0 ? `
                <div class="summary-row discount-row">
                  <span>Discount Applied</span>
                  <span>-₹${orderData.discount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="summary-row total-row">
                  <span>Total Amount</span>
                  <span>₹${orderData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="footer-message">
                Thank you for choosing Shopping Lala
              </div>
              <div class="footer-tagline">
                Your trusted partner in online shopping
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static async generateInvoicePDF(orderData: OrderData): Promise<Buffer> {
    try {
      const html = this.generateInvoiceHTML(orderData);
      // Return HTML as buffer for now - will be sent as HTML attachment
      return Buffer.from(html, 'utf-8');
    } catch (error) {
      console.error('Error generating invoice:', error);
      return Buffer.from(`Error generating invoice: ${error instanceof Error ? error.message : 'Unknown error'}`, 'utf-8');
    }
  }

  static async generateInvoiceBuffer(orderData: OrderData): Promise<Buffer> {
    return this.generateInvoicePDF(orderData);
  }

  static async downloadInvoice(orderData: OrderData): Promise<void> {
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      
      const doc = new jsPDF();
      
      // Enhanced PDF generation with better formatting
      doc.setFontSize(24);
      doc.setTextColor(102, 126, 234);
      doc.text('FASTKART', 20, 25);
      
      doc.setFontSize(16);
      doc.setTextColor(75, 85, 99);
      doc.text('INVOICE', 20, 35);
      
      // Invoice details box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(120, 15, 70, 25, 'F');
      doc.rect(120, 15, 70, 25, 'S');
      
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.text(`Invoice #: ${orderData.orderNumber}`, 125, 22);
      doc.text(`Date: ${new Date(orderData.createdAt).toLocaleDateString()}`, 125, 28);
      doc.text(`Status: ${orderData.paymentStatus}`, 125, 34);
      
      // Customer info section
      doc.setFontSize(12);
      doc.setTextColor(102, 126, 234);
      doc.text('BILL TO:', 20, 55);
      
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.text(orderData.customerName, 20, 65);
      doc.text(orderData.customerEmail, 20, 72);
      doc.text(orderData.customerPhone, 20, 79);
      
      if (orderData.billingAddress) {
        doc.text(orderData.billingAddress.street, 20, 86);
        doc.text(`${orderData.billingAddress.city}, ${orderData.billingAddress.state}`, 20, 93);
        doc.text(`${orderData.billingAddress.country} - ${orderData.billingAddress.postalCode}`, 20, 100);
      }
      
      // Products table with enhanced styling
      let yPos = 120;
      doc.setFontSize(12);
      doc.setTextColor(102, 126, 234);
      doc.text('ORDER ITEMS', 20, yPos);
      yPos += 15;
      
      // Table header with background
      doc.setFillColor(102, 126, 234);
      doc.rect(20, yPos - 5, 170, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('PRODUCT', 25, yPos);
      doc.text('PRICE', 100, yPos);
      doc.text('QTY', 130, yPos);
      doc.text('TOTAL', 160, yPos);
      yPos += 15;
      
      // Table content with alternating row colors
      doc.setTextColor(31, 41, 55);
      orderData.products.forEach((product, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(250, 251, 252);
          doc.rect(20, yPos - 5, 170, 10, 'F');
        }
        
        doc.text(product.productName.length > 25 ? product.productName.substring(0, 25) + '...' : product.productName, 25, yPos);
        doc.text(`₹${product.price.toFixed(2)}`, 100, yPos);
        doc.text(product.quantity.toString(), 130, yPos);
        doc.text(`₹${product.total.toFixed(2)}`, 160, yPos);
        yPos += 12;
      });
      
      // Summary section with enhanced styling
      yPos += 15;
      const summaryX = 120;
      const summaryWidth = 70;
      
      doc.setFillColor(248, 250, 252);
      doc.rect(summaryX, yPos - 5, summaryWidth, 45, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(summaryX, yPos - 5, summaryWidth, 45, 'S');
      
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      
      doc.text('Subtotal:', summaryX + 5, yPos);
      doc.text(`₹${orderData.subtotal.toFixed(2)}`, summaryX + summaryWidth - 5, yPos, { align: 'right' });
      yPos += 8;
      
      doc.text('Tax (GST):', summaryX + 5, yPos);
      doc.text(`₹${orderData.tax.toFixed(2)}`, summaryX + summaryWidth - 5, yPos, { align: 'right' });
      yPos += 8;
      
      doc.text('Shipping:', summaryX + 5, yPos);
      doc.text(`₹${orderData.shipping.toFixed(2)}`, summaryX + summaryWidth - 5, yPos, { align: 'right' });
      yPos += 8;
      
      if (orderData.discount > 0) {
        doc.setTextColor(5, 150, 105);
        doc.text('Discount:', summaryX + 5, yPos);
        doc.text(`-₹${orderData.discount.toFixed(2)}`, summaryX + summaryWidth - 5, yPos, { align: 'right' });
        yPos += 8;
      }
      
      // Total with emphasis
      doc.setDrawColor(102, 126, 234);
      doc.line(summaryX + 5, yPos, summaryX + summaryWidth - 5, yPos);
      yPos += 5;
      
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      doc.text('TOTAL:', summaryX + 5, yPos);
      doc.text(`₹${orderData.total.toFixed(2)}`, summaryX + summaryWidth - 5, yPos, { align: 'right' });
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text('Thank you for shopping with Fastkart!', 105, 280, { align: 'center' });
      
      doc.save(`fastkart-invoice-${orderData.orderNumber}.pdf`);
      
    } catch (error) {
      this.downloadHTML(orderData);
    }
  }

  static downloadHTML(orderData: OrderData): void {
    try {
      const html = this.generateInvoiceHTML(orderData);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fastkart-invoice-${orderData.orderNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading HTML invoice:', error);
    }
  }
}