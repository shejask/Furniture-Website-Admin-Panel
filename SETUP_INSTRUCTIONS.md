# 🚀 COMPLETE SETUP INSTRUCTIONS

## Step 1: Create Environment File

**Create a new file called `.env.local` in your project root** (same folder as `package.json`) with this exact content:

```env
# Shiprocket Configuration
SHIPROCKET_EMAIL=hexenwebcreators@gmail.com
SHIPROCKET_PASSWORD=9qjGFe7u^hGlqii%
SHIPROCKET_PICKUP_LOCATION=Primary

# SMTP Configuration (REPLACE WITH YOUR GMAIL APP PASSWORD)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hello@hexen.in
SMTP_PASSWORD=REPLACE_WITH_YOUR_GMAIL_APP_PASSWORD

# Email Settings
EMAIL_FROM_NAME=Fastkart Orders
SUPPORT_EMAIL=hello@hexen.in
SUPPORT_PHONE=+91 XXX XXX XXXX
COMPANY_ADDRESS=Your Company Address Here

# Feature Flags
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_INVOICE=true
```

## Step 2: Get Gmail App Password

1. **Go to Google Account**: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. **Select App**: Choose "Mail"
3. **Select Device**: Choose "Other" and type "Fastkart"
4. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)
5. **Replace** `REPLACE_WITH_YOUR_GMAIL_APP_PASSWORD` with this password

## Step 3: Test Configuration

1. **Restart your server**: Stop and run `npm run dev` again
2. **Test Email**: Visit `http://localhost:3004/api/test-email`
3. **Test Shiprocket**: Visit `http://localhost:3004/api/test-shiprocket`

Both should show "SUCCESS" status.

## Step 4: Test Order Approval

1. Go to any pending order
2. Click "Approve Order"
3. You should see:
   - ✅ Order approved successfully!
   - ✅ Stock reduced for X products
   - ✅ Shipping label created (AWB: XXXXXXX)
   - ✅ Confirmation email sent to customer

## 🔧 Troubleshooting

### Email Not Working?
- Check Gmail App Password is correct (16 characters)
- Visit `/api/test-email` to see detailed error
- Make sure 2-factor authentication is enabled on Gmail

### Shiprocket Not Working?
- Visit `/api/test-shiprocket` to see detailed error
- Check credentials are exactly: `hexenwebcreators@gmail.com`

### Still Not Working?
- Check browser console for errors
- Make sure `.env.local` file is in the root folder
- Restart server after adding environment variables

## 📧 Expected Email Content

Customer will receive:
- **Subject**: "Order Confirmed - #order_XXXXX"
- **Content**: Order details, items, shipping address
- **Attachment**: Invoice PDF

If shipped:
- **Subject**: "Order Shipped - #order_XXXXX - Track: AWB_CODE"
- **Content**: Tracking information and delivery details

## 🎯 Final Test

After setup, approve an order and check:
1. Order status changes to "confirmed" or "shipped"
2. Product stock reduces automatically
3. Customer receives email (check spam folder)
4. AWB tracking code is generated

**Everything should work perfectly after following these steps!** 🎉
