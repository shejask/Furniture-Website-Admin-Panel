# SMTP Configuration with Nodemailer

## Overview

The email system uses **Nodemailer** with **SMTP** configuration for sending professional emails from `hello@hexen.in`.

## Current Implementation

### Features:
- ✅ **Nodemailer** for email sending
- ✅ **SMTP** protocol for reliable delivery
- ✅ **Connection pooling** for performance
- ✅ **Rate limiting** to prevent spam
- ✅ **TLS encryption** for security
- ✅ **Error handling** with detailed messages
- ✅ **Connection verification** on startup

### SMTP Configuration:
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'hello@hexen.in',
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  },
  pool: true,
  maxConnections: 3,
  rateDelta: 20000,
  rateLimit: 5
});
```

## Environment Variables

Create `.env.local` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hello@hexen.in
SMTP_PASSWORD=your_app_password_here

# Email Settings
EMAIL_FROM_NAME=Fastkart Orders
SUPPORT_EMAIL=hello@hexen.in
SUPPORT_PHONE=+91 XXX XXX XXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_INVOICE=true
```

## SMTP Providers

### Gmail (Recommended for hello@hexen.in):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Yahoo Mail:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Custom Domain/Business Email:
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Setup Instructions

### For Gmail (hello@hexen.in):

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification → Turn on

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Copy the generated 16-character password
   - Use this as `SMTP_PASSWORD`

3. **Update Environment Variables**
   ```env
   SMTP_USER=hello@hexen.in
   SMTP_PASSWORD=abcd efgh ijkl mnop
   ```

### Testing SMTP Connection:

The system automatically verifies the SMTP connection on startup. Check console logs:

```
✅ "SMTP Server is ready to send emails"
❌ "SMTP Connection Error: [error details]"
```

## Email Features

### 1. Order Confirmation Emails:
- Professional HTML templates
- Order details and invoice attachment
- Branded with your business info
- Sent from `hello@hexen.in`

### 2. Rate Limiting:
- Max 5 emails per 20 seconds
- Prevents spam and server overload
- Connection pooling for efficiency

### 3. Error Handling:
- Detailed error messages
- Automatic retry logic
- Graceful failure handling

## API Endpoints

### `/api/send-email`
- Main email endpoint
- Handles order confirmations
- Uses enhanced SMTP configuration

### `/api/email`
- Alternative email endpoint
- Supports multiple email types
- Same SMTP configuration

## Troubleshooting

### Common Issues:

1. **"Invalid login" Error**
   - Check App Password is correct
   - Ensure 2FA is enabled
   - Verify email address

2. **"Connection timeout"**
   - Check firewall settings
   - Verify SMTP_HOST and PORT
   - Test network connectivity

3. **"ENOTFOUND" Error**
   - Check SMTP_HOST spelling
   - Verify DNS resolution
   - Try different SMTP server

### Debug Steps:

1. Check environment variables are loaded
2. Verify SMTP credentials
3. Test with simple email first
4. Check server logs for details
5. Try different SMTP port (465 for secure)

## Production Recommendations

1. **Use dedicated email service** (SendGrid, AWS SES, etc.)
2. **Set up SPF/DKIM records** for better deliverability
3. **Monitor email bounce rates**
4. **Implement email queues** for high volume
5. **Use separate SMTP for transactional emails**

## Current Status

✅ **SMTP with Nodemailer**: Fully configured  
✅ **Professional Email**: Using hello@hexen.in  
✅ **Error Handling**: Enhanced with detailed messages  
✅ **Rate Limiting**: Implemented for spam prevention  
✅ **Connection Pooling**: Optimized for performance  
✅ **TLS Security**: Encrypted connections  

Your email system is ready to send professional emails using SMTP with Nodemailer!
