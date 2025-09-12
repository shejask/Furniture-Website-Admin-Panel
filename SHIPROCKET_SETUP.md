# Shiprocket Integration Setup Guide

## 🎉 Shiprocket Credentials Received!

You have been provided with Shiprocket API credentials:

- **API Email**: `hexenwebcreators@gmail.com`
- **API Password**: `9qjGFe7u^hGlqii%`

## Environment Setup

Add these credentials to your `.env.local` file:

```env
# Shiprocket Configuration
SHIPROCKET_EMAIL=hexenwebcreators@gmail.com
SHIPROCKET_PASSWORD=9qjGFe7u^hGlqii%
SHIPROCKET_PICKUP_LOCATION=Primary

# SMTP Configuration (if not already set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hello@hexen.in
SMTP_PASSWORD=your_gmail_app_password

# Email Settings
EMAIL_FROM_NAME=Fastkart Orders
SUPPORT_EMAIL=hello@hexen.in
SUPPORT_PHONE=+91 XXX XXX XXXX
COMPANY_ADDRESS=Your Company Address Here
```

## ✅ Features Now Available

With Shiprocket integration, your order management system now includes:

### 1. **Complete Order Workflow**
- ✅ Order confirmation
- ✅ Automatic stock reduction
- ✅ Shiprocket shipping label creation
- ✅ Customer email notifications with tracking

### 2. **Stock Management**
- ✅ Automatic inventory reduction when orders are confirmed
- ✅ Stock restoration when orders are cancelled
- ✅ Insufficient stock validation
- ✅ Real-time stock status updates

### 3. **Shipping Integration**
- ✅ Automatic shipping label generation
- ✅ AWB (tracking number) assignment
- ✅ Courier partner selection
- ✅ Shipping cost calculation
- ✅ Tracking information retrieval

### 4. **Email Notifications**
- ✅ Order confirmation emails with invoice
- ✅ Shipping confirmation with tracking details
- ✅ Order cancellation notifications
- ✅ Professional HTML email templates

## 🚀 How to Test

1. **Create a test order** in the dashboard
2. **Click "Approve Order"** on any pending order
3. **Watch the magic happen**:
   - Order status changes to "confirmed"
   - Product stock automatically reduces
   - Shiprocket creates shipping label
   - Customer receives confirmation email
   - If AWB is generated, shipping email is sent

## 📋 Order Approval Process

When you click "Approve Order", the system will:

```
1. ✅ Update order status to "confirmed"
2. ✅ Reduce stock for all order items
3. ✅ Create Shiprocket order with shipping details
4. ✅ Generate AWB/tracking number
5. ✅ Send order confirmation email to customer
6. ✅ Send shipping notification (if tracking available)
```

## 🔧 Configuration Options

### Pickup Location
Set your default pickup location in Shiprocket dashboard, then update:
```env
SHIPROCKET_PICKUP_LOCATION=Your_Location_Name
```

### Email Templates
Customize email templates in:
- `src/app/api/email/route.ts`

### Stock Management
Configure stock behavior in:
- `src/lib/stock-service.ts`

## 📊 Order Status Flow

```
pending → confirmed → shipped → delivered
   ↓         ↓         ↓
 (stock)  (shiprocket) (tracking)
```

## 🛠️ Troubleshooting

### Shiprocket Issues
- Check credentials in `.env.local`
- Verify pickup location exists
- Ensure product dimensions/weight are set

### Email Issues
- Verify SMTP credentials
- Check spam folder
- Enable "Less secure apps" for Gmail

### Stock Issues
- Verify product stock quantities
- Check Firebase permissions
- Review product IDs match order items

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Review server logs
3. Verify all environment variables are set
4. Contact support with specific error messages

## 🎯 Next Steps

Your order management system is now fully integrated! You can:

1. **Process real orders** with confidence
2. **Monitor stock levels** automatically
3. **Track shipments** through Shiprocket
4. **Keep customers informed** with automated emails

The system is production-ready! 🚀
