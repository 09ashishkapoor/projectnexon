const fs = require('fs');
const path = require('path');
const { getStore } = require('@netlify/blobs');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.SENDER_EMAIL || 'reminder@yourdomain.com';

const storeName = 'subscriptions';
const tithiDataPath = path.join(__dirname, 'data', 'tithis_2024_2030.json');

exports.handler = async (event, context) => {
  console.log('sendReminders function triggered.');

  let store;
  try {
    store = getStore(storeName);
  } catch (setupError) {
    console.error('Error accessing Blob store:', setupError);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not access subscription store.' }),
    };
  }

  try {
    // 1. Load and parse Tithi data
    let tithiData = {};
    try {
      const rawData = fs.readFileSync(tithiDataPath, 'utf8');
      tithiData = JSON.parse(rawData);
      console.log('Successfully loaded Tithi data.');
    } catch (err) {
      console.error('Error loading or parsing Tithi data:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Failed to load Tithi data.' }),
      };
    }

    // 2. Determine target date
    const leadDays = parseInt(process.env.REMINDER_LEAD_DAYS || '2', 10);
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setUTCDate(today.getUTCDate() + leadDays);
    const targetYear = targetDate.getUTCFullYear();
    const targetDateString = targetDate.toISOString().split('T')[0];

    console.log(`Checking for Tithis on target date: ${targetDateString} (${leadDays} days from now)`);

    // 3. Filter Tithis for the target date
    const upcomingTithis = [];
    if (tithiData[targetYear]) {
      for (const tithiName in tithiData[targetYear]) {
        const dates = tithiData[targetYear][tithiName];
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

    if (upcomingTithis.length === 0) {
      console.log(`No Tithis found for target date ${targetDateString}. Exiting.`);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No Tithis found for target date.' }),
      };
    }

    const upcomingTithiNames = upcomingTithis.map(t => t.name);
    console.log(`Found ${upcomingTithis.length} Tithis for ${targetDateString}:`, upcomingTithis.map(t => t.fullName));

    // 4. Fetch subscribers from Netlify Blobs
    const subscribersToSend = [];
    try {
      console.log('Fetching subscribers from Netlify Blobs...');
      const keys = await store.list();
      console.log(`Fetched ${keys.length} subscriber keys.`);

      for (const email of keys) {
        const tithiList = await store.get(email, { type: 'json' });
        if (!Array.isArray(tithiList)) continue;

        const relevantTithis = upcomingTithis.filter(upcoming =>
          tithiList.includes(upcoming.name)
        );

        if (relevantTithis.length > 0) {
          subscribersToSend.push({
            email,
            tithis: relevantTithis,
          });
        }
      }
    } catch (blobError) {
      console.error('Error fetching or processing Blob data:', blobError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Failed to fetch or process subscriber data.' }),
      };
    }

    if (subscribersToSend.length === 0) {
      console.log('No subscribers found for the upcoming Tithis.');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No subscribers for upcoming Tithis.' }),
      };
    }

    console.log(`Found ${subscribersToSend.length} subscribers to notify.`);

    // 5. Prepare and send emails using Resend
    console.log(`Attempting to send ${subscribersToSend.length} emails via Resend...`);
    const emailPromises = [];
    let successfulSends = 0;
    let failedSends = 0;

    if (!process.env.RESEND_API_KEY) {
      console.error('FATAL: RESEND_API_KEY environment variable not set.');
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Resend API key is not configured.' }),
      };
    }

    for (const subscriber of subscribersToSend) {
      const { email, tithis } = subscriber;
      const tithiListString = tithis.map(t => `- ${t.fullName} (${t.name}) on ${t.date}`).join('\n');

      const subject = `Upcoming Tithi Reminder for ${targetDateString}`;
      const bodyHtml = `
        <p>Namaskar,</p>
        <p>This is a reminder for the following Tithi(s) occurring in ${leadDays} day(s) on <strong>${targetDateString}</strong>:</p>
        <pre>${tithiListString}</pre>
        <p>Regards,</p>
        <p>Your Tithi Reminder Service</p>
        <p style="font-size:0.8em; color:#777;">
          <a href="/.netlify/functions/unsubscribe?email=${email}" style="color:#777;">Unsubscribe</a>
        </p>
      `;

      const emailData = {
        from: fromEmail,
        to: email,
        subject: subject,
        html: bodyHtml,
      };

      emailPromises.push(
        resend.emails.send(emailData)
          .then(response => {
            console.log(`Email sent successfully to ${email} for Tithis: ${tithis.map(t => t.name).join(', ')}. ID: ${response.id}`);
            successfulSends++;
          })
          .catch(error => {
            console.error(`Failed to send email to ${email}:`, error);
            failedSends++;
          })
      );
    }

    await Promise.allSettled(emailPromises);

    console.log(`Email sending process completed. Successful: ${successfulSends}, Failed: ${failedSends}`);

    const finalStatusCode = failedSends > 0 ? 500 : 200;
    const finalMessage = `Reminder process complete. Emails sent: ${successfulSends}. Failures: ${failedSends}.`;

    return {
      statusCode: finalStatusCode,
      body: JSON.stringify({ message: finalMessage }),
    };

  } catch (error) {
    console.error('Error in sendReminders function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing reminders',
        error: error.message,
      }),
    };
  }
};