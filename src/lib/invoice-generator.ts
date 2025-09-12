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
    const productsHtml = orderData.products.map(product => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${product.productName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${product.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${product.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${product.total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - ${orderData.orderNumber}</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #eee;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            .invoice-title {
              font-size: 20px;
              color: #666;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
            }
            .section-title {
              font-weight: bold;
              font-size: 16px;
              color: #2563eb;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 1px solid #eee;
            }
            .info-text {
              margin: 5px 0;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background: #f8fafc;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              color: #2563eb;
              border-bottom: 2px solid #e2e8f0;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .summary {
              margin-left: auto;
              width: 300px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              color: #666;
            }
            .total-row {
              font-weight: bold;
              font-size: 18px;
              color: #2563eb;
              border-top: 2px solid #e2e8f0;
              padding-top: 12px;
              margin-top: 8px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #eee;
              color: #666;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company-name">FASTKART</div>
              <div class="invoice-title">INVOICE</div>
            </div>

            <div class="details-grid">
              <div>
                <div class="section-title">Invoice Details</div>
                <div class="info-text">Invoice No: ${orderData.orderNumber}</div>
                <div class="info-text">Date: ${new Date(orderData.createdAt).toLocaleDateString()}</div>
                <div class="info-text">Payment Method: ${orderData.paymentMethod.replace('_', ' ')}</div>
                <div class="info-text">Payment Status: ${orderData.paymentStatus}</div>
              </div>
              <div>
                <div class="section-title">Bill To</div>
                <div class="info-text">${orderData.customerName}</div>
                <div class="info-text">${orderData.customerEmail}</div>
                <div class="info-text">${orderData.customerPhone}</div>
                <div class="info-text">${orderData.billingAddress.street}</div>
                <div class="info-text">${orderData.billingAddress.city}, ${orderData.billingAddress.state}</div>
                <div class="info-text">${orderData.billingAddress.country} - ${orderData.billingAddress.postalCode}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right">Price</th>
                  <th class="text-center">Quantity</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${productsHtml}
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>₹${orderData.subtotal.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Tax (18% GST):</span>
                <span>₹${orderData.tax.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Shipping:</span>
                <span>₹${orderData.shipping.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Discount:</span>
                <span>-₹${orderData.discount.toFixed(2)}</span>
              </div>
              <div class="summary-row total-row">
                <span>Total:</span>
                <span>₹${orderData.total.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              Thank you for shopping with Fastkart!
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static async generateInvoicePDF(orderData: any):Promise<Buffer> {
    try {
      const html = this.generateInvoiceHTML(orderData);
      return Buffer.from(html);
    } catch (error) {
      // Log error for debugging but don't expose to client
      // Fallback to HTML download
      this.downloadHTML(orderData);
      // Return a fallback buffer with error message
      return Buffer.from(`Error generating invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateInvoiceBuffer(orderData: any): Promise<Buffer> {
    return this.generateInvoicePDF(orderData);
  }

  // Client-side method to generate and download PDF
  static async downloadInvoice(orderData: any): Promise<void> {
    try {
      // Import jsPDF dynamically (only on client side)
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      
      const doc = new jsPDF();
      
      // Set font
      doc.setFontSize(20);
      doc.text('INVOICE', 20, 30);
      
      // Company info
      doc.setFontSize(12);
      doc.text('Fastkart', 20, 50);
      doc.text('Your Trusted E-commerce Partner', 20, 60);
      
      // Invoice details
      doc.text(`Invoice #: ${orderData.orderNumber}`, 120, 50);
      doc.text(`Date: ${new Date(orderData.createdAt).toLocaleDateString()}`, 120, 60);
      
      // Customer info
      doc.text('Bill To:', 20, 80);
      doc.text(orderData.customerName, 20, 90);
      doc.text(orderData.customerEmail, 20, 100);
      doc.text(orderData.customerPhone, 20, 110);
      
      // Address
      if (orderData.billingAddress) {
        doc.text(`${orderData.billingAddress.street}`, 20, 120);
        doc.text(`${orderData.billingAddress.city}, ${orderData.billingAddress.state}`, 20, 130);
        doc.text(`${orderData.billingAddress.country} - ${orderData.billingAddress.postalCode}`, 20, 140);
      }
      
      // Products table
      let yPos = 160;
      doc.text('Products:', 20, yPos);
      yPos += 10;
      
      // Table headers
      doc.text('Item', 20, yPos);
      doc.text('Price', 80, yPos);
      doc.text('Qty', 120, yPos);
      doc.text('Total', 150, yPos);
      yPos += 10;
      
      // Table content
      if (orderData.products && orderData.products.length > 0) {
        orderData.products.forEach((product: any) => {
          doc.text(product.productName || 'Product', 20, yPos);
          doc.text(`₹${(product.price || 0).toFixed(2)}`, 80, yPos);
          doc.text(`${product.quantity || 0}`, 120, yPos);
          doc.text(`₹${(product.total || 0).toFixed(2)}`, 150, yPos);
          yPos += 10;
        });
      }
      
      // Totals
      yPos += 10;
      doc.text(`Subtotal: ₹${(orderData.subtotal || 0).toFixed(2)}`, 120, yPos);
      yPos += 10;
      doc.text(`Tax: ₹${(orderData.tax || 0).toFixed(2)}`, 120, yPos);
      yPos += 10;
      doc.text(`Shipping: ₹${(orderData.shipping || 0).toFixed(2)}`, 120, yPos);
      yPos += 10;
      doc.text(`Discount: -₹${(orderData.discount || 0).toFixed(2)}`, 120, yPos);
      yPos += 10;
      
      // Total with bold font
      doc.setFontSize(14);
      doc.text(`Total: ₹${(orderData.total || 0).toFixed(2)}`, 120, yPos);
      
      // Footer
      doc.setFontSize(10);
      doc.text('Thank you for shopping with Fastkart!', 20, yPos + 30);
      
      // Download the PDF
      doc.save(`invoice-${orderData.orderNumber}.pdf`);
      
    } catch (error) {
      // Log error for debugging but don't expose to client
      // Fallback to HTML download
      this.downloadHTML(orderData);
    }
  }

  // Fallback method to download as HTML
  static downloadHTML(orderData: any): void {
    try {
      const html = this.generateInvoiceHTML(orderData);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderData.orderNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      // Log error for debugging but don't expose to client
    }
  }
}