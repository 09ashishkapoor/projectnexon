# Project Planning: Tithi Reminder System

## 1. Goals

-   Create a web application where users can subscribe to receive email reminders for specific Hindu Tithis (lunar days).
-   Emails should be sent a configurable number of days (e.g., 2 days) before the Tithi occurs.
-   Use Netlify for hosting the frontend, running serverless functions, scheduling, and data storage (Blobs).
-   Use Resend for sending reminder emails.

## 2. Architecture

-   **Frontend:** Static HTML (`index.html`), CSS (`style.css`), and JavaScript (`script.js`). Hosted on Netlify.
-   **Backend:** Netlify Functions (Node.js).
    -   `subscribe`: Handles POST requests from the frontend form, validates data, and adds subscription info to Netlify Blobs.
    -   `sendReminders`: A scheduled function (triggered daily via Netlify cron) that checks upcoming Tithis, retrieves subscriptions from Netlify Blobs, filters relevant subscribers, and sends emails via Resend.
-   **Data Storage:** Netlify Blobs.
    -   Store Name: `subscriptions` (or similar)
    -   Key: User's email address
    -   Value: JSON string containing an array of selected Tithi names (e.g., `["Ashtami", "Purnima"]`)
-   **Email Service:** Resend API.
-   **Tithi Data:** Static JSON file (`tithis_2024_2030.json`) included in the project, likely within the `netlify/functions/data/` directory.

## 3. Style & Conventions

-   **Code Style:** Use standard JavaScript/Node.js conventions. Consider adding a linter (like ESLint) later.
-   **File Structure:**
    -   `/index.html`
    -   `/style.css`
    -   `/script.js`
    -   `/netlify.toml`
    -   `/netlify/functions/subscribe.js`
    -   `/netlify/functions/sendReminders.js`
    -   `/netlify/functions/data/tithis_2024_2030.json`
    -   `/package.json`
    -   `/README.md`
    -   `/PLANNING.md`
    -   `/TASKS.md`
    -   `/UNIT_TESTING.md`
    -   `/UX_UI.md`
    -   `/.gitignore`
    -   `/tests/`
        -   `/tests/frontend/`
        -   `/tests/functions/`
-   **Naming:** Use camelCase for JavaScript variables and functions. Use descriptive names.

## 4. Constraints & Assumptions

-   Relies heavily on Netlify platform features (Functions, Scheduled Functions, Blobs, Environment Variables).
-   Requires external service: Resend.
-   Netlify Blobs is currently in Beta; APIs or behavior might change.
-   Tithi data is pre-calculated and static (2024-2030).
-   Reminders are sent based on UTC date matching in the JSON.
-   Basic error handling and user feedback.
-   Scalability might be limited by Netlify Blobs limits (check documentation) and potentially by fetching/processing all keys in the `sendReminders` function if the list grows very large.
-   Initial version does not include unsubscribe or subscription management (though Blobs' `delete` operation makes unsubscribe simpler to implement later).

## 5. Implementation Phases

### Phase 1: Setup & Configuration
- Initialize project files (`index.html`, `style.css`, `script.js`).
- Set up Git repository and connect to Netlify.
- Enable Netlify Blobs and configure blob store (`subscriptions`).
- Set up Resend account and environment variables (`RESEND_API_KEY`, `SENDER_EMAIL`, `REMINDER_LEAD_DAYS`).
- Add static Tithi data (`tithis_2024_2030.json`).
- Install dependencies (`@netlify/blobs`, `resend`).
- Create initial documentation and testing folder structure.

### Phase 2: Frontend Development
- Build subscription form with email input and Tithi checkboxes.
- Style the form.
- Implement JavaScript to handle form submission, validation, and API call to `/.netlify/functions/subscribe`.
- Provide user feedback on success or error.

### Phase 3: Backend Refactoring & Implementation
- Refactor `subscribe.js`:
  - Remove Airtable integration.
  - Use Netlify Blobs (`@netlify/blobs`) to store subscriptions keyed by email.
  - Validate inputs and handle errors.
- Refactor `sendReminders.js`:
  - Remove Airtable integration.
  - Use Netlify Blobs to fetch all subscriptions.
  - Load static Tithi data.
  - Identify upcoming Tithis and match subscribers.
  - Send emails via Resend.
  - Handle errors and logging.

### Phase 4: Scheduling, Testing & Deployment
- Configure Netlify scheduled function (cron) for daily reminder sending.
- Test subscription flow locally and after deployment.
- Test reminder function locally and after deployment.
- Verify environment variables and Netlify Blobs access.
- Monitor initial runs and logs.
- Finalize deployment.

### Future Enhancements
- Add unsubscribe and subscription management.
- Add location selection.
- Add email confirmation.
- Optimize Blob querying if needed.
- Automate Tithi data updates.

This phased plan aligns with the detailed checklist in `TASKS.md` and guides the implementation from setup to deployment and beyond.