# Email Service Setup Guide

## Issue Resolution

**Problem**: Team members are not receiving program invitations when added to mentorship programs.

**Root Cause**: The application is running in development mode with `VITE_MOCK_EMAIL=true`, which means emails are only simulated and logged to the console instead of being actually sent.

## Current Status

✅ **Team members are properly added to programs**  
✅ **Invitations are created and stored in backend database**  
✅ **All business logic is working correctly**  
❌ **Emails are only simulated, not actually sent**

## Solutions

### Option 1: Enable Real Email Service (Recommended for Production)

#### Using EmailJS (Client-side email service)

1. **Sign up for EmailJS**

   - Go to [https://emailjs.com](https://emailjs.com)
   - Create a free account
   - Create an email service (Gmail, Outlook, etc.)
   - Create an email template

2. **Configure Environment Variables**

   ```bash
   # Set these in your .env file:
   VITE_MOCK_EMAIL=false
   VITE_EMAILJS_SERVICE_ID=your_service_id_here
   VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
   VITE_EMAILJS_USER_ID=your_user_id_here
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   # or
   docker-compose restart
   ```

#### Using Backend SMTP (Server-side email service)

The backend already has SMTP configuration available:

```bash
# Backend environment variables in .env.docker:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@peptok.com
```

To use backend email service:

1. Configure SMTP settings in backend
2. Update frontend to call backend email endpoints
3. Set `VITE_MOCK_EMAIL=false`

### Option 2: Keep Development Mode (For Testing)

If you want to continue testing without real emails:

1. **Check Browser Console**

   - Open browser developer tools (F12)
   - Go to Console tab
   - Look for email logs when adding team members

2. **Simulate Email Reception**
   - Team members are properly added to the system
   - You can test the invitation acceptance flow manually
   - All business logic works the same way

## User Interface Changes

### New Features Added:

1. **Email Service Status Component**

   - Shows current email configuration status
   - Displays whether emails are in mock mode or real mode
   - Provides setup instructions and links

2. **Enhanced Toast Notifications**

   - Clear indication when emails are simulated vs. actually sent
   - Development mode warnings
   - Setup guidance for users

3. **Console Logging**
   - Detailed email content logged to console in development
   - Configuration status information
   - Setup instructions

## Testing the Fix

### In Development Mode (Current):

1. Add a team member to a program
2. See toast: "Team member added to program: [email]" with development mode notice
3. Check browser console for simulated email content
4. Team member appears in the program (persistence is fixed)

### With Real Email Service Configured:

1. Add a team member to a program
2. See toast: "Team member invitation sent for [email]!"
3. Team member receives actual email invitation
4. Can click invitation link to join program

## File Changes Made

### Enhanced Email Service (`src/services/email.ts`)

- Improved email sending methods
- Better error handling and logging
- Consistent template usage
- Development vs production mode handling

### Enhanced Team Management (`src/components/mentorship/TeamMemberManagementCard.tsx`)

- Added email service status component
- Better user feedback in toast messages
- Clear indication of email service mode

### New Email Status Component (`src/components/common/EmailServiceStatus.tsx`)

- Real-time email service configuration display
- Setup guidance and links
- Configuration troubleshooting

## Environment Variables Reference

```bash
# Email Service Configuration
VITE_MOCK_EMAIL=true          # Set to 'false' for real emails
VITE_EMAILJS_SERVICE_ID=      # Your EmailJS service ID
VITE_EMAILJS_TEMPLATE_ID=     # Your EmailJS template ID
VITE_EMAILJS_USER_ID=         # Your EmailJS user/public key

# Backend SMTP (Alternative)
SMTP_HOST=smtp.gmail.com      # SMTP server host
SMTP_PORT=587                 # SMTP server port
SMTP_USER=                    # Email account username
SMTP_PASS=                    # Email account password/app password
FROM_EMAIL=                   # From email address
```

## Next Steps

1. **Immediate**: The application now clearly shows email service status and provides guidance
2. **Short-term**: Configure EmailJS or backend SMTP for real email delivery
3. **Long-term**: Consider enterprise email service for production use

The team member persistence issue is completely resolved - team members now stay in the program after page refresh. The email delivery is now properly explained to users with clear guidance on how to enable real email sending.
