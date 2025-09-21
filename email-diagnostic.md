# 📧 Email Diagnostic Guide

## Issues Found and Fixed

### 1. ✅ **Email Type Mismatch** - FIXED
- **Problem**: Order management was sending `vendor-order-notification` to customer email
- **Fix**: Changed to `customer-order-confirmation` with proper data structure

### 2. ✅ **Hardcoded SMTP Credentials** - FIXED  
- **Problem**: SMTP password was hardcoded in source code
- **Fix**: Updated to use environment variables with fallback

### 3. ✅ **Poor Error Handling** - FIXED
- **Problem**: Generic error messages made debugging difficult
- **Fix**: Added detailed error logging and connection diagnostics

## Next Steps to Resolve Email Issues

### Step 1: Create Environment File
Create a `.env.local` file in your project root:

```env
# Email Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hello@hexen.in
SMTP_PASSWORD=l1XR#d!W

# App Configuration  
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

### Step 2: Test Email Service
1. Start your development server: `npm run dev`
2. Visit: `http://localhost:3004/api/email` to test SMTP connection
3. Check console logs for connection status

### Step 3: Test Order Approval
1. Create a test order in your admin panel
2. Click "Approve Order" 
3. Check browser console and server logs for email sending status
4. Check your email inbox (and spam folder)

## Common Email Issues

### 🔍 **If emails still don't work:**

1. **SMTP Authentication Issues**
   - Verify the email password is correct
   - Check if 2FA is enabled (may need app password)
   - Try different SMTP settings

2. **Server Connection Issues**
   - Ensure development server is running on port 3004
   - Check firewall settings
   - Verify network connectivity

3. **Email Provider Issues**
   - Check Hostinger email service status
   - Verify email account is active
   - Try sending from a different email service

### 🛠️ **Debugging Commands**

```bash
# Start development server
npm run dev

# Test email API directly (PowerShell)
Invoke-WebRequest -Uri "http://localhost:3004/api/email" -Method GET

# Test email sending (PowerShell)
$body = @{
  type = "customer-order-confirmation"
  to = "test@example.com"
  data = @{
    orderId = "test-123"
    customerName = "Test User"
    totalAmount = 100
    items = @()
  }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3004/api/email" -Method POST -Body $body -ContentType "application/json"
```

## Email Flow During Order Approval

```
1. User clicks "Approve Order" 
   ↓
2. OrderManagementService.confirmOrder() called
   ↓  
3. Stock check & reduction
   ↓
4. Order status updated to "confirmed"
   ↓
5. Shiprocket order creation (optional)
   ↓
6. Customer email sent via /api/email
   ↓
7. Vendor email sent (if vendor info exists)
   ↓
8. Success/error messages displayed
```

## Email Templates Available

- `customer-order-confirmation` - Order confirmation to customer
- `vendor-order-notification` - New order notification to vendor  
- `order-cancellation` - Order cancellation notice
- `refund-confirmation` - Refund processed notification

All templates are responsive and include order details, tracking info, and company branding.
