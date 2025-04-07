const fetch = require('node-fetch');
const { subscriptionStore } = require('../../config/firebase');
const { Resend } = require('resend');

const ALLOWED_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
const RECAPTCHA_SCORE_THRESHOLD = 0.5; // Minimum score to accept (0.0 to 1.0)

// Initialize Resend for sending emails
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.SENDER_EMAIL || 'notifications@tithireminders.com';

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  try {
    console.log('Using Firebase Firestore for storage');
    
    const { email, selectedTithis, website, 'g-recaptcha-response': captchaToken } = JSON.parse(event.body);

    // Honeypot check
    if (website && website.trim() !== '') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Bot detected.' }),
      };
    }

    // Validate CAPTCHA (skip for test tokens)
    if (captchaToken !== 'test-token') {
      if (!captchaToken) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'CAPTCHA verification required.' }),
        };
      }

      try {
        // ReCAPTCHA v3 verification
        const captchaResponse = await fetch(
          `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captchaToken}`
        );
        const captchaResult = await captchaResponse.json();

        console.log('reCAPTCHA verification result:', JSON.stringify(captchaResult));

        if (!captchaResult.success) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              message: 'CAPTCHA verification failed.',
              details: captchaResult['error-codes'] || 'Unknown error'
            }),
          };
        }

        // Check the score for v3 reCAPTCHA
        if (captchaResult.score < RECAPTCHA_SCORE_THRESHOLD) {
          console.log(`Low reCAPTCHA score: ${captchaResult.score}`);
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              message: 'Our system flagged this submission as potentially automated. Please try again later.',
              score: captchaResult.score
            }),
          };
        }
        
        // Verify action matches
        if (captchaResult.action !== 'submit') {
          console.log(`Invalid reCAPTCHA action: ${captchaResult.action}`);
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid verification action.' }),
          };
        }
        
      } catch (captchaError) {
        console.error('CAPTCHA verification error:', captchaError);
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'CAPTCHA verification failed. Please try again.' }),
        };
      }
    } else {
      console.log('Using test token - skipping CAPTCHA verification');
    }

    // Basic server-side validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid email address provided.' }),
      };
    }

    // Domain validation (skip for test email)
    if (!email.includes('test-') && email.indexOf('@') > 0) {
      const domain = email.split('@')[1].toLowerCase();
      if (!ALLOWED_DOMAINS.includes(domain)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Please use major email providers (Gmail, Yahoo, Outlook, or Hotmail).' }),
        };
      }
    }

    if (!selectedTithis?.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'At least one Tithi must be selected.' }),
      };
    }

    // Normalize and validate Tithis
    const normalizedTithis = selectedTithis
      .map(t => String(t).trim())
      .filter(t => t.length > 0);

    try {
      // Use Firebase to store the subscription
      const key = email.toLowerCase();
      const value = JSON.stringify(normalizedTithis);
      
      console.log('Attempting to store subscription in Firebase:', { key, value });
      await subscriptionStore.set(key, value);
      
      console.log(`Subscription saved for ${email} with ${normalizedTithis.length} Tithis`);

      // Send confirmation email
      try {
        console.log('Sending confirmation email to:', email);
        
        // Format the list of tithis for the email
        const tithiListItems = normalizedTithis.map(tithi => `<li>${tithi}</li>`).join('');
        
        // Current date for the email
        const subscriptionDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // Send the confirmation email
        const emailResponse = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: 'Your Tithi Reminders Subscription Confirmation',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
              <div style="background: linear-gradient(90deg, #ff3b3b, #ff6b6b); height: 5px; width: 100%;"></div>
              <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px;">
                <h2 style="color: #ff3b3b; margin-top: 0;">Tithi Reminders Subscription Confirmed!</h2>
                
                <p>Namaskar,</p>
                
                <p>Thank you for subscribing to Tithi Reminders. Your subscription has been successfully set up on <strong>${subscriptionDate}</strong>.</p>
                
                <p>You will receive reminder emails <strong>2 days before</strong> the following Tithis:</p>
                
                <ul style="background-color: #f0f0f0; padding: 15px 30px; border-radius: 5px;">
                  ${tithiListItems}
                </ul>
                
                <p>These reminders will help you prepare for important occasions in advance.</p>
                
                <div style="margin: 30px 0; padding: 15px; background-color: #fff3f3; border-left: 4px solid #ff3b3b; border-radius: 3px;">
                  <p style="margin: 0;"><strong>Note:</strong> If you need to modify your subscription, please visit our website.</p>
                </div>
                
                <p>Regards,<br>Tithi Reminders Team</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                  <p>If you did not request this subscription, please <a href="${process.env.URL || '/.netlify/functions'}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #ff3b3b;">click here to unsubscribe</a>.</p>
                </div>
              </div>
            </div>
          `
        });
        
        console.log('Confirmation email sent successfully:', emailResponse.id);
        
      } catch (emailError) {
        // Log the error but don't fail the subscription process
        console.error('Error sending confirmation email:', emailError);
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Subscription successful! A confirmation email has been sent to your inbox.',
          subscribedTithis: normalizedTithis
        }),
      };
    } catch (storageError) {
      console.error('Firebase storage error:', storageError);
      throw new Error(`Failed to save subscription: ${storageError.message}`);
    }
  } catch (error) {
    console.error('Error processing subscription:', error);
    
    const statusCode = error instanceof SyntaxError ? 400 : 500;
    const message = error instanceof SyntaxError 
      ? 'Invalid request format.'
      : `Subscription failed: ${error.message}`;

    return {
      statusCode,
      body: JSON.stringify({ message }),
    };
  }
};