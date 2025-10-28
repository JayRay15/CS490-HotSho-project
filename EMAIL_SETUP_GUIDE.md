# Email Setup Guide for Account Deletion Notifications

## Using Gmail SMTP (Recommended for Development)

### Step 1: Enable 2-Factor Authentication on Your Gmail Account

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click "2-Step Verification"
3. Follow the prompts to enable it

### Step 2: Create an App Password

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → Type "HotSho Backend"
4. Click **Generate**
5. **Copy the 16-character password** (you won't see it again!)

### Step 3: Update Backend `.env` File

Add these lines to `backend/.env`:

```env
# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=HotSho <your-gmail@gmail.com>
```

**Replace:**
- `your-gmail@gmail.com` with your actual Gmail address
- `your-16-char-app-password` with the password from Step 2

### Step 4: Restart Backend Server

```powershell
cd backend
npm start
```

You should see: `📧 Email system ready`

### Step 5: Test It

1. Delete an account through the UI
2. Check the email inbox for the deletion notification

---

## Alternative: Using SendGrid (Production Ready)

### Step 1: Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for free account (100 emails/day free)
3. Verify your email address

### Step 2: Create API Key

1. Go to Settings → API Keys
2. Create API Key → Full Access
3. Copy the API key

### Step 3: Update Backend `.env`

```env
# Email Configuration (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=HotSho <noreply@yourdomain.com>
```

### Step 4: Verify Sender Identity

In SendGrid dashboard:
1. Go to Settings → Sender Authentication
2. Verify a Single Sender
3. Use the email you want to send from

---

## Alternative: Use Ethereal Email (Testing Only)

For testing without real emails:

### Step 1: Create Test Account

Visit [Ethereal Email](https://ethereal.email/) and click "Create Account"

### Step 2: Use Provided Credentials

Copy the SMTP credentials shown and add to `backend/.env`:

```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<username-from-ethereal>
SMTP_PASS=<password-from-ethereal>
SMTP_FROM=test@ethereal.email
```

### Step 3: View Emails

All emails will appear in your Ethereal inbox (check the URL provided)

---

## Troubleshooting

### Gmail Says "Less secure app access"

- You need to use an **App Password**, not your regular Gmail password
- Make sure 2-Factor Authentication is enabled first

### Emails Not Sending

1. Check backend console logs for errors
2. Verify SMTP credentials are correct
3. Make sure `.env` file is in `backend/` folder
4. Restart backend server after changing `.env`

### "Authentication failed" Error

- Double-check SMTP_USER and SMTP_PASS
- For Gmail: Make sure you're using the **16-character app password**
- Remove any spaces from the app password

### Port Issues

- Try `SMTP_PORT=465` with `SMTP_SECURE=true` for SSL
- Try `SMTP_PORT=587` with `SMTP_SECURE=false` for TLS (recommended)

---

## Email Template Preview

When an account is deleted, users receive:

```
Subject: Account deletion scheduled

Hello [User Name],

Your account has been scheduled for permanent deletion on [Date].
You have 30 days to cancel if this was a mistake. All your personal 
data will be removed permanently after that date.

If you did not request this, please contact support.
```

---

## Production Recommendations

For production use:

1. **Use SendGrid or similar service** (more reliable than Gmail)
2. **Set up custom domain** for from address
3. **Configure SPF and DKIM** records
4. **Monitor email deliverability**
5. **Add unsubscribe links** (if sending marketing emails)
6. **Use email templates** with HTML formatting

---

## Quick Setup for Development

**Fastest option for testing:**

```bash
# No configuration needed - just check console logs
# Emails will be logged to terminal instead of sent
```

The system already falls back to console logging when SMTP isn't configured!
