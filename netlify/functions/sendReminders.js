const fs = require('fs');
const path = require('path');
const SibApiV3Sdk = require('@getbrevo/brevo');
const { subscriptionStore } = require('../../config/firebase');

// Initialize Brevo API instance
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const fromEmail = process.env.SENDER_EMAIL || 'reminder@yourdomain.com';
const fromName = process.env.SENDER_NAME || 'Tithi Reminder';
const BATCH_SIZE = 50;

// Load tithi data from JSON file instead of hardcoding
let tithiData = {};
try {
  const tithiDataPath = path.join(__dirname, '..', '..', 'tithis_2024_2030_basic.json');
  const tithiDataRaw = fs.readFileSync(tithiDataPath, 'utf8');
  tithiData = JSON.parse(tithiDataRaw);
  console.log('Loaded complete tithi data from tithis_2024_2030_basic.json');
} catch (error) {
  console.error('Error loading tithi data from file:', error);
  // Fallback to a minimal dataset in case of error
  tithiData = {
    // Basic fallback data would go here
    // This ensures the function doesn't completely fail if file access issues occur
    2025: {
      "Amavasya": [
        { "date": "2025-01-29", "full_name": "Pausha Amavasya" },
        { "date": "2025-02-28", "full_name": "Magha Amavasya" }
      ],
      "Purnima": [
        { "date": "2025-01-14", "full_name": "Pausha Purnima" },
        { "date": "2025-04-12", "full_name": "Chaitra Purnima", "special": "Hanuman Jayanti" }
      ]
    }
  };
}

exports.handler = async (event, context) => {
  console.log('sendReminders function triggered.');
  
  try {
    // Determine target date - use environment variable for more flexibility
    const leadDays = parseInt(process.env.REMINDER_LEAD_DAYS || '2', 10);
    const targetDate = new Date();
    targetDate.setUTCDate(targetDate.getUTCDate() + leadDays);
    const targetDateString = targetDate.toISOString().split('T')[0];
    const targetYear = targetDate.getUTCFullYear();

    console.log(`Checking Tithis for ${targetDateString} (${leadDays} days ahead)`);

    // Find upcoming Tithis
    const upcomingTithis = [];
    if (tithiData[targetYear]) {
      for (const [tithiName, dates] of Object.entries(tithiData[targetYear])) {
        for (const entry of dates) {
          if (entry.date === targetDateString) {
            upcomingTithis.push({
              name: tithiName,
              fullName: entry.full_name,
              date: entry.date,
              special: entry.special || null
            });
          }
        }
      }
    }

    if (!upcomingTithis.length) {
      console.log(`No Tithis found for target date ${targetDateString}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No Tithis found for target date.',
          targetDate: targetDateString,
          leadDays: leadDays
        }),
      };
    }

    console.log(`Found ${upcomingTithis.length} upcoming Tithis for ${targetDateString}: ${upcomingTithis.map(t => t.name).join(', ')}`);

    // Get all subscriber keys from Firebase
    const subscriberKeys = await subscriptionStore.list();
    console.log(`Found ${subscriberKeys.length} total subscribers`);

    const subscribersToNotify = [];
    
    // Process subscribers in batches
    for (let i = 0; i < subscriberKeys.length; i += BATCH_SIZE) {
      const batch = subscriberKeys.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (email) => {
          try {
            const tithiData = await subscriptionStore.get(email);
            if (!tithiData) return null;
            
            const tithiList = JSON.parse(tithiData);
            if (!Array.isArray(tithiList)) return null;

            const matchingTithis = upcomingTithis.filter(t => 
              tithiList.includes(t.name)
            );

            return matchingTithis.length ? { email, tithis: matchingTithis } : null;
          } catch (error) {
            console.error(`Error processing subscriber ${email}:`, error);
            return null;
          }
        })
      );

      subscribersToNotify.push(...batchResults.filter(Boolean));
    }

    if (!subscribersToNotify.length) {
      console.log(`No subscribers found for upcoming Tithis on ${targetDateString}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No subscribers found for upcoming Tithis.', 
          tithiCount: upcomingTithis.length,
          subscriberCount: subscriberKeys.length 
        }),
      };
    }

    // Send emails
    console.log(`Sending notifications to ${subscribersToNotify.length} subscribers for Tithis on ${targetDateString}`);
    
    const emailResults = await Promise.allSettled(
      subscribersToNotify.map(async ({ email, tithis }) => {
        const tithiListString = tithis
          .map(t => `- ${t.fullName} ${t.special ? `(${t.special})` : ''} on ${t.date}`)
          .join('\n');

        // Create Brevo email send request
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        
        sendSmtpEmail.subject = `Upcoming Tithi Reminder for ${targetDateString}`;
        sendSmtpEmail.htmlContent = `
          <p>Namaskar,</p>
          <p>This is a reminder for the following Tithi(s) occurring in ${leadDays} day(s) on <strong>${targetDateString}</strong>:</p>
          <ul>
            ${tithis.map(t => `<li><strong>${t.fullName}</strong> ${t.special ? `(${t.special})` : ''}</li>`).join('')}
          </ul>
          <p>Regards,</p>
          <p>Your Tithi Reminder Service</p>
          <p style="font-size:0.8em; color:#777;">
            <a href="https://simpletithireminder.netlify.app/.netlify/functions/unsubscribe?email=${encodeURIComponent(email)}" style="color:#777;">Unsubscribe</a>
          </p>
        `;
        
        sendSmtpEmail.sender = {
          name: fromName,
          email: fromEmail
        };
        
        sendSmtpEmail.to = [{
          email: email
        }];

        // Send email using Brevo
        try {
          const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
          console.log(`Email sent successfully to ${email}`);
          return result;
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
          throw error;
        }
      })
    );

    const successCount = emailResults.filter(r => r.status === 'fulfilled').length;
    const failureCount = emailResults.filter(r => r.status === 'rejected').length;

    console.log(`Email sending completed. Success: ${successCount}, Failed: ${failureCount}`);

    return {
      statusCode: failureCount ? 500 : 200,
      body: JSON.stringify({
        message: `Reminder process complete. Successful: ${successCount}, Failed: ${failureCount}`,
        totalSubscribers: subscribersToNotify.length,
        targetDate: targetDateString
      }),
    };

  } catch (error) {
    console.error('Error in sendReminders function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing reminders',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
    };
  }
};

// Export schedule configuration
exports.config = {
  // Run more frequently for testing until we confirm it's working
  schedule: "0 */4 * * *" // run every 4 hours (6 times per day)
};