# Netlify Blob Storage Setup Guide

## Prerequisites
- Netlify account with the site deployed
- Netlify CLI installed (for local testing)

## Steps to Enable Blob Storage

1. **Enable Blob Storage in Netlify UI**
   - Go to your site dashboard in Netlify
   - Navigate to "Storage" > "Blobs"
   - Click "Enable Blob Storage"
   - Note the automatically generated `NETLIFY_BLOBS_TOKEN`

2. **Set Required Environment Variables**
   - In Netlify dashboard, go to "Site settings" > "Environment variables"
   - Add these variables:
     - `NETLIFY_SITE_ID`: Your site's ID (found in site settings)
     - `NETLIFY_BLOBS_TOKEN`: The token from step 1

3. **Local Development Setup**
   - Create a `.env` file in your project root with:
     ```
     NETLIFY_SITE_ID=your_site_id_here
     NETLIFY_BLOBS_TOKEN=your_blobs_token_here
     ```
   - Add `.env` to your `.gitignore` file

4. **Verify Configuration**
   - The subscribe.js function will log the environment variables when run
   - Test locally using Netlify Dev: `netlify dev`

## Troubleshooting
- If you get "Could not access subscription store":
  - Verify both environment variables are set
  - Check the Blob storage is enabled
  - Ensure the store name ('subscriptions') matches in the Netlify UI