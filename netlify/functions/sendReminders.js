const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');
const { subscriptionStore } = require('../../config/firebase');

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.SENDER_EMAIL || 'reminder@yourdomain.com';
const BATCH_SIZE = 50;

exports.handler = async (event, context) => {
  console.log('sendReminders function triggered.');
  
  try {
    // Load and parse Tithi data
    const tithiDataPath = path.join(__dirname, '../../tithis_2024_2030.json');
    const tithiData = JSON.parse(fs.readFileSync(tithiDataPath, 'utf8'));
    
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

        const emailData = {
          from: fromEmail,
          to: email,
          subject: `Upcoming Tithi Reminder for ${targetDateString}`,
          html: `
            <p>Namaskar,</p>
            <p>This is a reminder for the following Tithi(s) occurring in ${leadDays} day(s) on <strong>${targetDateString}</strong>:</p>
            <pre>${tithiListString}</pre>
            <p>Regards,</p>
            <p>Your Tithi Reminder Service</p>
            <p style="font-size:0.8em; color:#777;">
              <a href="/.netlify/functions/unsubscribe?email=${email}" style="color:#777;">Unsubscribe</a>
            </p>
          `
        };

        return resend.emails.send(emailData);
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