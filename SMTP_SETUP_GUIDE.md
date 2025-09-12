# 🚨 SMTP Setup Fix for `ECONNRESET` Error

## Issue Identified
The error `read ECONNRESET` typically means **authentication failure** with Gmail SMTP.

## Required `.env.local` Configuration

Create/update your `.env.local` file with these exact settings:

```env
# SMTP Configuration for hello@hexen.in
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hello@hexen.in
SMTP_PASSWORD=your_16_character_app_password_here

# Email Settings
EMAIL_FROM_NAME=Fastkart Orders
SUPPORT_EMAIL=hello@hexen.in
NEXT_PUBLIC_ENABLE_EMAIL=true
```

## 🔧 Step-by-Step Gmail Setup

### 1. Enable 2-Factor Authentication
- Go to: https://myaccount.google.com/security
- Turn on **2-Step Verification**

### 2. Generate App Password
- Go to: https://myaccount.google.com/apppasswords
- Select **"Mail"** as the app
- Copy the **16-character password** (example: `abcd efgh ijkl mnop`)
- Use this as your `SMTP_PASSWORD` (NOT your regular Gmail password)

### 3. Update .env.local
```env
SMTP_PASSWORD=abcd efgh ijkl mnop
```
(Replace with your actual app password)

## 🧪 Test Your Configuration

Visit these URLs to test:

1. **Check Environment Variables:** 
   `http://localhost:3000/api/diagnose-smtp`

2. **Test SMTP Connection:** 
   `http://localhost:3000/api/test-email`

## ⚠️ Common Mistakes

❌ **Wrong Password Type**
- Don't use your regular Gmail password
- Must use the 16-character App Password

❌ **Missing 2FA**
- App Passwords only work with 2FA enabled

❌ **Wrong Port/Security**
- Use port `587` with `secure: false`
- Or port `465` with `secure: true`

❌ **Typos in Email**
- Ensure `SMTP_USER=hello@hexen.in` (exact spelling)

## 🔍 Troubleshooting

If still failing:

1. **Generate New App Password**
   - Delete old app password
   - Generate a fresh one
   - Update `.env.local`

2. **Check Account Security**
   - Ensure account is not locked
   - Check for suspicious activity alerts

3. **Try Alternative Settings**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   ```

4. **Restart Development Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

## ✅ Expected Success

When working correctly, you should see:
- Console log: "SMTP Server is ready to send emails"
- Test email delivered to hello@hexen.in
- Order confirmation emails working

## 🆘 Still Not Working?

Share the output from:
1. `http://localhost:3000/api/diagnose-smtp`
2. Console errors from browser network tab
3. Your `.env.local` file (hide password)
