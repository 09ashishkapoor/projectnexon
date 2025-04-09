# Brevo Email Service Setup Guide

## Prerequisites
- Brevo account (sign up at www.brevo.com)
- Access to an email you can use as sender

## Steps to Configure Brevo

1. **Get API Key**
   - Log in to your Brevo dashboard
   - Navigate to "SMTP & API" section
   - Create a new API key with "Send email" permission
   - Copy the API key

2. **Set Up a Sender**
   - Go to "Senders & Domains" in your Brevo dashboard
   - Click "Add a new sender"
   - Fill in the form with:
     - Sender name (e.g., "Tithi Reminders")
     - Email address you have access to
   - Click the validation link sent to that email to confirm it
   - For better deliverability, consider verifying your domain

3. **Set Environment Variables**
   - Add these to Netlify environment variables or .env file:
     ```
     BREVO_API_KEY=your_api_key_here
     SENDER_EMAIL=the_email_address_you_validated
     SENDER_NAME=Tithi Reminders
     ```

## Implementation Notes

- The email sending function will use:
  - Brevo API endpoint: https://api.brevo.com/v3/smtp/email
  - API documentation: https://developers.brevo.com/reference/sendtransacemail

## Testing
- Test locally using Netlify Dev: `netlify dev`
- Check Brevo dashboard for email logs

## Troubleshooting
- If emails aren't being sent, check the Brevo dashboard for error messages
- Ensure your sender email is properly validated
- Verify that the API key has email sending permissions