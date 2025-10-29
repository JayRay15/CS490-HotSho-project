# 📧 Email Setup Guide for Account Deletion

This guide explains how to configure email notifications for account deletion in the HotSho application.

## ✅ What's Already Implemented

The email functionality is **fully implemented** in the codebase:

1. **Two Email Templates**:
   - ✅ Deletion confirmation email (sent when user requests deletion)
   - ✅ Final deletion notification (sent after 30 days when account is permanently deleted)

2. **Integration Points**:
   - ✅ `userController.js` - Sends email when user clicks "Delete Account"
   - ✅ `cleanupDeletedUsers.js` - Sends email when account is permanently deleted after 30 days
   - ✅ `email.js` - Email service with professional HTML templates

3. **Features**:
   - ✅ Professional HTML email templates with styling
   - ✅ Fallback to console logging when SMTP is not configured (for development)
   - ✅ Error handling (deletion continues even if email fails)
   - ✅ Clear information about the 30-day grace period

## 🚀 Quick Start

### Option 1: Development Mode (Console Logging)

**No configuration needed!** Emails will be logged to the console instead of being sent.

Just run your server and test the deletion flow. You'll see output like:

```
📧 [MOCK EMAIL] Account Deletion Scheduled:
   To: user@example.com
   Subject: ⚠️ Account Deletion Scheduled - HotSho
   Deletion Date: Thu Nov 28 2025 12:00:00 GMT-0500
```

### Option 2: Production Mode (Real Emails)

To send **actual emails**, configure SMTP settings in your `.env` file.

## 📝 SMTP Configuration

### Step 1: Choose an Email Provider

Popular options:
- **Gmail** (easiest for testing)
- **SendGrid** (best for production)
- **Amazon SES** (scalable)
- **Mailgun** (developer-friendly)

### Step 2: Add Environment Variables

Add these to your `backend/.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
   SMTP_FROM="Nirvana <no-reply@nirvanaprofile.com>"
```

### Step 3: Get SMTP Credentials

#### For Gmail:

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security**
3. Enable **2-Step Verification** (required)
4. Go to **App passwords**
5. Create a new app password for "Mail"
6. Copy the 16-character password
7. Use it as `SMTP_PASS` in your `.env` file

**Gmail Settings:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password
```

#### For SendGrid:

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Verify your sender email/domain

**SendGrid Settings:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM="HotSho <verified@yourdomain.com>"
```

#### For Amazon SES:

**Amazon SES Settings:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

### Step 4: Test the Configuration

1. Start your server:
   ```bash
   cd backend
   npm start
   ```

2. Trigger account deletion through the frontend

3. Check your console for success message:
   ```
   ✅ Deletion confirmation email sent to: user@example.com
      Message ID: <unique-message-id>
   ```

4. Check your email inbox!

## 🔍 Troubleshooting

### "SMTP not configured" message

**Cause**: SMTP_HOST environment variable is not set

**Solution**: Add SMTP configuration to your `.env` file (see Step 2 above)

### Gmail: "Less secure app access blocked"

**Cause**: Gmail requires App Passwords for third-party apps

**Solution**: 
1. Enable 2-Step Verification
2. Generate an App Password
3. Use the App Password (not your regular password)

### "Authentication failed"

**Cause**: Wrong username or password

**Solution**: 
- For Gmail: Use your full email and App Password (not regular password)
- For SendGrid: Username must be exactly `apikey`

### Emails not received

**Possible causes**:
1. Check spam/junk folder
2. Verify `SMTP_FROM` email is valid
3. Check console for error messages
4. For SendGrid: Verify your sender email

### Port Connection Error

**Cause**: Firewall blocking SMTP ports

**Solution**: Try different ports:
- Port 587 (recommended, TLS)
- Port 465 (SSL, set `SMTP_SECURE=true`)
- Port 25 (often blocked by ISPs)

## 📋 Email Templates

### 1. Deletion Confirmation Email

**Sent**: Immediately when user requests account deletion

**Subject**: "⚠️ Account Deletion Scheduled - HotSho"

**Content**:
- Confirmation of deletion request
- 30-day grace period information
- List of what will be deleted
- Contact support option
- Professional HTML styling

### 2. Final Deletion Email

**Sent**: After 30 days when account is permanently deleted

**Subject**: "🗑️ Your HotSho Account Has Been Permanently Deleted"

**Content**:
- Confirmation of permanent deletion
- List of deleted data
- Notice that action is irreversible
- Professional HTML styling

## 🧪 Testing

### Manual Testing

1. **Create a test account**
2. **Request account deletion** from profile settings
3. **Check email** - should receive deletion confirmation
4. **Wait or manually trigger cleanup** (see below)
5. **Check email** - should receive final deletion notification

### Trigger Cleanup Job Manually

To test the final deletion email without waiting 30 days:

```javascript
// In backend/src/server.js or a test script
import { cleanupExpiredAccounts } from './utils/cleanupDeletedUsers.js';

// Manually run cleanup
await cleanupExpiredAccounts();
```

Or temporarily change the deletion expiry to 1 minute in `userController.js`:

```javascript
// Change from 30 days to 1 minute for testing
const expires = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute
```

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use environment variables** - Never hardcode credentials
3. **Use App Passwords** - Don't use your main account password
4. **Rotate credentials** - Change SMTP passwords periodically
5. **Use verified domains** - For production, verify sender domain
6. **Monitor email logs** - Track delivery failures

## 📊 Production Recommendations

### For Small Scale (< 100 emails/day)
- **Gmail** with App Passwords - Free and reliable

### For Medium Scale (100-10,000 emails/day)
- **SendGrid** - 100 emails/day free tier
- **Mailgun** - 5,000 emails/month free tier

### For Large Scale (> 10,000 emails/day)
- **Amazon SES** - $0.10 per 1,000 emails
- **SendGrid** paid plans - Better deliverability

## 🎯 Acceptance Criteria Status

From JIRA UC-009:

- ✅ Account deletion option available in profile settings
- ✅ Deletion requires password confirmation
- ✅ Warning message explains data removal is permanent
- ✅ Soft delete maintains data for 30 days before permanent removal
- ✅ User immediately logged out after deletion request
- ✅ **Confirmation email sent to user about deletion** ← **IMPLEMENTED**
- ✅ Deleted accounts cannot log in during 30-day grace period

## 📞 Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify SMTP configuration in `.env`
3. Test with Gmail first (easiest to set up)
4. Review the troubleshooting section above

## 🎉 Summary

**Email functionality is fully implemented!** You just need to:

1. **For development**: Nothing! Emails will be logged to console
2. **For production**: Add SMTP configuration to `.env` file

That's it! The code already handles everything else. 🚀
