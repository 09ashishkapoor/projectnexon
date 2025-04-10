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

// Define tithiData directly in the function rather than loading from disk
// Focusing on the most important tithis for the current and next years
const tithiData = {
  2025: {
    "Amavasya": [
      { "date": "2025-01-29", "full_name": "Pausha Amavasya" },
      { "date": "2025-02-28", "full_name": "Magha Amavasya" },
      { "date": "2025-03-30", "full_name": "Phalguna Amavasya" },
      { "date": "2025-04-28", "full_name": "Chaitra Amavasya" },
      { "date": "2025-05-28", "full_name": "Vaishakha Amavasya" },
      { "date": "2025-06-26", "full_name": "Jyeshtha Amavasya" },
      { "date": "2025-07-26", "full_name": "Ashadha Amavasya" },
      { "date": "2025-08-24", "full_name": "Shravana Amavasya" },
      { "date": "2025-09-23", "full_name": "Bhadrapada Amavasya" },
      { "date": "2025-10-22", "full_name": "Ashwin Amavasya" },
      { "date": "2025-11-21", "full_name": "Kartika Amavasya", "special": "Diwali" },
      { "date": "2025-12-20", "full_name": "Margashirsha Amavasya" }
    ],
    "Purnima": [
      { "date": "2025-01-14", "full_name": "Pausha Purnima" },
      { "date": "2025-02-13", "full_name": "Magha Purnima" },
      { "date": "2025-03-15", "full_name": "Phalguna Purnima", "special": "Holi" },
      { "date": "2025-04-13", "full_name": "Chaitra Purnima", "special": "Hanuman Jayanti" },
      { "date": "2025-05-13", "full_name": "Vaishakha Purnima", "special": "Buddha Purnima" },
      { "date": "2025-06-12", "full_name": "Jyeshtha Purnima" },
      { "date": "2025-07-11", "full_name": "Ashadha Purnima", "special": "Guru Purnima" },
      { "date": "2025-08-09", "full_name": "Shravana Purnima", "special": "Raksha Bandhan" },
      { "date": "2025-09-08", "full_name": "Bhadrapada Purnima" },
      { "date": "2025-10-07", "full_name": "Ashwin Purnima" },
      { "date": "2025-11-06", "full_name": "Kartika Purnima" },
      { "date": "2025-12-05", "full_name": "Margashirsha Purnima" }
    ],
    "Ashtami": [
      { "date": "2025-01-21", "full_name": "Shukla Ashtami" },
      { "date": "2025-02-05", "full_name": "Krishna Ashtami" },
      { "date": "2025-02-20", "full_name": "Shukla Ashtami" },
      { "date": "2025-03-07", "full_name": "Krishna Ashtami" },
      { "date": "2025-03-22", "full_name": "Shukla Ashtami" },
      { "date": "2025-04-06", "full_name": "Krishna Ashtami" },
      { "date": "2025-04-20", "full_name": "Shukla Ashtami" },
      { "date": "2025-05-05", "full_name": "Krishna Ashtami" },
      { "date": "2025-05-20", "full_name": "Shukla Ashtami" },
      { "date": "2025-06-04", "full_name": "Krishna Ashtami" },
      { "date": "2025-06-19", "full_name": "Shukla Ashtami" },
      { "date": "2025-07-03", "full_name": "Krishna Ashtami" },
      { "date": "2025-07-19", "full_name": "Shukla Ashtami" },
      { "date": "2025-08-02", "full_name": "Krishna Ashtami" },
      { "date": "2025-08-17", "full_name": "Shukla Ashtami" },
      { "date": "2025-09-01", "full_name": "Krishna Ashtami", "special": "Janmashtami" },
      { "date": "2025-09-16", "full_name": "Shukla Ashtami" },
      { "date": "2025-09-30", "full_name": "Krishna Ashtami" },
      { "date": "2025-10-15", "full_name": "Durga Mahashtami Puja", "special": "Durga Ashtami" },
      { "date": "2025-10-30", "full_name": "Krishna Ashtami" },
      { "date": "2025-11-14", "full_name": "Shukla Ashtami" },
      { "date": "2025-11-28", "full_name": "Krishna Ashtami" },
      { "date": "2025-12-13", "full_name": "Shukla Ashtami" },
      { "date": "2025-12-28", "full_name": "Krishna Ashtami" }
    ],
    "Ekadashi": [
      { "date": "2025-01-10", "full_name": "Pausha Putrada Ekadashi" },
      { "date": "2025-01-24", "full_name": "Shittala Ekadashi" },
      { "date": "2025-02-08", "full_name": "Jaya Ekadashi" },
      { "date": "2025-02-23", "full_name": "Vijaya Ekadashi" },
      { "date": "2025-03-10", "full_name": "Amalaki Ekadashi" },
      { "date": "2025-03-25", "full_name": "Papmochani Ekadashi" },
      { "date": "2025-04-08", "full_name": "Kamada Ekadashi" },
      { "date": "2025-04-23", "full_name": "Varuthini Ekadashi" },
      { "date": "2025-05-08", "full_name": "Mohini Ekadashi" },
      { "date": "2025-05-22", "full_name": "Apara Ekadashi" },
      { "date": "2025-06-07", "full_name": "Nirjala Ekadashi" },
      { "date": "2025-06-21", "full_name": "Yogini Ekadashi" },
      { "date": "2025-07-06", "full_name": "Devshayani Ekadashi", "special": "Ashadhi Ekadashi" },
      { "date": "2025-07-21", "full_name": "Kamika Ekadashi" },
      { "date": "2025-08-05", "full_name": "Shravana Putrada Ekadashi" },
      { "date": "2025-08-19", "full_name": "Aja Ekadashi" },
      { "date": "2025-09-03", "full_name": "Parivartini Ekadashi" },
      { "date": "2025-09-18", "full_name": "Indira Ekadashi" },
      { "date": "2025-10-03", "full_name": "Papankusha Ekadashi" },
      { "date": "2025-10-17", "full_name": "Rama Ekadashi" },
      { "date": "2025-11-01", "full_name": "Devutthana Ekadashi" },
      { "date": "2025-11-16", "full_name": "Utpanna Ekadashi" },
      { "date": "2025-12-01", "full_name": "Mokshada Ekadashi" },
      { "date": "2025-12-15", "full_name": "Safala Ekadashi" },
      { "date": "2025-12-30", "full_name": "Putrada Ekadashi" }
    ],
    "Chaturthi": [
      { "date": "2025-09-07", "full_name": "Ganesh Chaturthi", "special": "Ganesh Chaturthi" }
    ]
  }
};

exports.handler = async (event, context) => {
  console.log('sendReminders function triggered.');
  
  try {
    // Determine target date
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
            });
          }
        }
      }
    }

    if (!upcomingTithis.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No Tithis found for target date.' }),
      };
    }

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
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No subscribers found for upcoming Tithis.' }),
      };
    }

    // Send emails
    console.log(`Sending notifications to ${subscribersToNotify.length} subscribers`);
    
    const emailResults = await Promise.allSettled(
      subscribersToNotify.map(async ({ email, tithis }) => {
        const tithiListString = tithis
          .map(t => `- ${t.fullName} (${t.name}) on ${t.date}`)
          .join('\n');

        // Create Brevo email send request
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        
        sendSmtpEmail.subject = `Upcoming Tithi Reminder for ${targetDateString}`;
        sendSmtpEmail.htmlContent = `
          <p>Namaskar,</p>
          <p>This is a reminder for the following Tithi(s) occurring in ${leadDays} day(s) on <strong>${targetDateString}</strong>:</p>
          <pre>${tithiListString}</pre>
          <p>Regards,</p>
          <p>Your Tithi Reminder Service</p>
          <p style="font-size:0.8em; color:#777;">
            <a href="/.netlify/functions/unsubscribe?email=${email}" style="color:#777;">Unsubscribe</a>
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
        return apiInstance.sendTransacEmail(sendSmtpEmail);
      })
    );

    const successCount = emailResults.filter(r => r.status === 'fulfilled').length;
    const failureCount = emailResults.filter(r => r.status === 'rejected').length;

    return {
      statusCode: failureCount ? 500 : 200,
      body: JSON.stringify({
        message: `Reminder process complete. Successful: ${successCount}, Failed: ${failureCount}`,
        totalSubscribers: subscribersToNotify.length
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
  schedule: "0 5 * * *" // run at 5:00 AM UTC daily
};