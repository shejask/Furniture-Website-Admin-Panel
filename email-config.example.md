# Email Configuration for hello@hexen.in

## Environment Variables

Create a `.env.local` file in your project root with these variables:

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
COMPANY_ADDRESS=Your Company Address Here

# Feature Flags
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_INVOICE=true
```

## Setup Instructions

### For Gmail (hello@hexen.in):

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and generate a password
   - Use this as your `SMTP_PASSWORD` (not your regular password)

### For Other Email Providers:

- **Outlook**: `smtp-mail.outlook.com` (port 587)
- **Yahoo**: `smtp.mail.yahoo.com` (port 587)
- **Custom Domain**: Check with your hosting provider

## Testing

After setting up the environment variables:

1. Restart your development server
2. Create a test order
3. Confirm the order to trigger the email
4. Check your email logs in the console

## Troubleshooting

If emails still fail:

1. Check console logs for specific error messages
2. Verify your app password is correct
3. Ensure 2FA is enabled on Gmail
4. Check firewall settings (port 587 should be open)
5. Try enabling "Less secure app access" temporarily (not recommended for production)
