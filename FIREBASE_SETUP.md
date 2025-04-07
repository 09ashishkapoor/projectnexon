# Firebase Setup for ProjectNexon

This guide will help you set up Firebase for your project to replace Netlify Blobs.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a name for your project (e.g., "ProjectNexon")
4. Follow the setup wizard (you can disable Google Analytics if you don't need it)
5. Click "Create Project"

## Step 2: Set Up Firestore Database

1. In the Firebase Console, navigate to your project
2. In the left sidebar, select "Firestore Database"
3. Click "Create database"
4. Start in production mode (recommended for security)
5. Choose a location that's closest to your users
6. Click "Enable"

## Step 3: Create a Service Account

1. In the Firebase Console, go to Project Settings (gear icon in the top left)
2. Go to the "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file securely (don't commit it to version control)

## Step 4: Configure Netlify Environment Variables

1. Log in to your Netlify dashboard
2. Go to your project
3. Navigate to Site settings > Environment variables
4. Add the following environment variable:

```
FIREBASE_SERVICE_ACCOUNT
```

5. For the value, paste the entire contents of your service account JSON file
6. Save the environment variable

## Step 5: Local Development Setup

For local development, create a file named `firebase-service-account.json` in the root of your project with the contents of your service account JSON file. **DO NOT commit this file to version control**. Add it to your `.gitignore` file:

```
# Add to .gitignore
firebase-service-account.json
```

## Security Considerations

1. **Never** commit your Firebase service account JSON file to version control
2. Set up Firestore security rules to restrict access to your data
3. Regularly rotate your service account keys
4. Set up Firebase monitoring and alerts for suspicious activity

## Testing Your Setup

Run the following command to test your Firebase setup locally:

```
npm run dev
```

You should see the application running with Firebase storage instead of Netlify Blobs.

## Firestore Security Rules

Here's a basic set of security rules for your Firestore database:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Only allow authenticated server-side access
      allow read, write: if false;
    }
  }
}
```

These rules block all direct client access, ensuring only your serverless functions can interact with the database.