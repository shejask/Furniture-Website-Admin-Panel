# 📧 Hostinger Email SMTP Configuration

## Hostinger SMTP Settings for hello@hexen.in

Since you're using Hostinger email, you need different SMTP settings than Gmail.

### 🔧 Correct .env.local Configuration for Hostinger

```env
# Hostinger SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hello@hexen.in
SMTP_PASSWORD=your_hostinger_email_password

# Email Settings
EMAIL_FROM_NAME=Fastkart Orders
SUPPORT_EMAIL=hello@hexen.in
NEXT_PUBLIC_ENABLE_EMAIL=true
```

### 📋 Alternative Hostinger SMTP Settings

If port 587 doesn't work, try:

```env
# Alternative 1 - SSL
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=hello@hexen.in
SMTP_PASSWORD=your_hostinger_email_password
```

```env
# Alternative 2 - Legacy
SMTP_HOST=mail.hexen.in
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hello@hexen.in
SMTP_PASSWORD=your_hostinger_email_password
```

### 🔍 Hostinger SMTP Options

Hostinger typically supports these SMTP configurations:

1. **Primary Option:**
   - Host: `smtp.hostinger.com`
   - Port: `587` (TLS) or `465` (SSL)
   - Authentication: Required

2. **Domain-based Option:**
   - Host: `mail.hexen.in` (your domain)
   - Port: `587` (TLS) or `465` (SSL)
   - Authentication: Required

3. **Legacy Option:**
   - Host: `smtp.titan.email` (if using Titan)
   - Port: `587` or `465`

### 🔐 Authentication

- **Username:** Your full email address (`hello@hexen.in`)
- **Password:** Your regular email password (not an app password like Gmail)

### ⚠️ Important Notes

1. **No App Password Needed** - Unlike Gmail, use your regular email password
2. **SSL/TLS Support** - Hostinger supports both encrypted connections
3. **Domain Verification** - Ensure your domain is properly set up in Hostinger

### 🧪 Testing Steps

1. **Update your .env.local** with Hostinger settings
2. **Restart your development server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```
3. **Test configuration:** Visit `http://localhost:3001/api/diagnose-smtp`
4. **Send test email:** Visit `http://localhost:3001/api/test-email`

### 🔧 If Still Not Working

Try these troubleshooting steps:

1. **Check Hostinger cPanel:**
   - Verify email account exists
   - Check email quotas and limits
   - Ensure SMTP is enabled

2. **Try Different Ports:**
   ```env
   # Try port 465 with SSL
   SMTP_PORT=465
   SMTP_SECURE=true
   ```

3. **Check Domain DNS:**
   - Ensure MX records are set up
   - Verify domain is active

4. **Contact Hostinger Support:**
   - Ask for current SMTP settings
   - Verify account has SMTP access

### 📞 Hostinger SMTP Support

If you need the exact settings, check:
- Hostinger cPanel → Email Accounts → Configure Email Client
- Hostinger Knowledge Base for SMTP settings
- Contact Hostinger support for current SMTP configuration
