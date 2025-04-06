# Tithi Reminder System

A web application to subscribe and receive email reminders for important Hindu lunar dates (Tithis).

## Overview

This project allows users to:
- Subscribe with their email address.
- Select specific Tithis they want reminders for.
- Receive automated email notifications a few days before each selected Tithi.

The system uses **Netlify serverless functions**, **Netlify Blobs** for storage, and an email service to send reminders.

## Features

- Simple subscription form to choose Tithis.
- Stores subscriber preferences securely.
- Sends reminder emails automatically before each Tithi.
- Fully serverless and easy to deploy on Netlify.
## Local Development

1. Install dependencies:

    ```bash
    npm install
    ```

2. (Optional) Install Netlify CLI globally if you haven't:

    ```bash
    npm install -g netlify-cli
    ```

3. Start the local development server:

    ```bash
    npm run dev
    ```

    or

    ```bash
    netlify dev
    ```

This will serve the frontend and emulate serverless functions locally, usually at [http://localhost:8888](http://localhost:8888).
- Includes unit tests for backend functions and frontend form.

## Usage

- Open the website.
- Enter your email and select the Tithis you want reminders for.
- Submit the form to subscribe.
- You will receive reminder emails before each selected Tithi.

## Project Structure

- `index.html` - Frontend subscription form.
- `style.css` - Styling for the form.
- `netlify/functions/` - Serverless backend functions:
  - `subscribe.js` - Handles new subscriptions.
  - `sendReminders.js` - Sends scheduled reminder emails.
  - `data/tithis_2024_2030.json` - Hindu calendar data.
- `tests/` - Unit tests for backend and frontend.
- `package.json` - Project dependencies and scripts.
- `jest.config.js` - Jest testing configuration.
- `PLANNING.md`, `TASKS.md`, `UNIT_TESTING.md`, `UX_UI.md` - Documentation and planning files.

## License

This project is licensed under the MIT License.