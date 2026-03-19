# Tithi Reminder System - Development Tasks (Netlify Approach)

This document outlines the specific development tasks required to build the Tithi Reminder System using Netlify, static HTML, Netlify Blobs, and Brevo.

## Phase 1: Setup & Configuration (Week 1)

-   [X] Create a local project directory with `index.html`, `style.css`, `script.js`.
-   [X] Initialize a Git repository and push to GitHub/GitLab/Bitbucket. 
-   [X] Create a new site on Netlify and connect it to the Git repository. (User action)
-   [X] Enable Netlify Blobs for the site (User action - via Netlify UI or `netlify link` + `netlify labs:enable netlify_blobs`). **(New)**
-   [X] Define Blob store name (e.g., `subscriptions`) and ensure functions have necessary access permissions (usually automatic if Blobs enabled). **(New)**
-   [X] Set up a Brevo account and obtain an API key. (User action)
-   [X] Add Brevo API key (`BREVO_API_KEY`) and sender email (`SENDER_EMAIL`) to Netlify Environment Variables. (User action)
-   [X] Add `REMINDER_LEAD_DAYS` (optional, defaults to 2) to Netlify Environment Variables. (User action)
-   [X] Add your `tithis_2024_2030.json` file to the project (e.g., in `netlify/functions/data/`). 
-   [X] Install necessary Node.js dependencies for functions (`@netlify/blobs`). Update `package.json`.
-   [X] Create `netlify.toml` for configuration.
-   [X] Create documentation placeholders (`PLANNING.md`, `README.md`, etc.).
-   [X] Create `.gitignore`.
-   [X] Create `/tests` directory structure.

## Phase 2: Frontend Development (Week 2)

-   [X] Design and implement the subscription form in `index.html`.
    -   [X] Input field for email address (`type="email"`).
    -   [X] Checkboxes for choosing Tithis (dynamically loaded).
    -   [X] Submit button.
-   [X] Style the form using `style.css`.
-   [X] Implement form submission logic in `script.js`:
    -   [X] Add event listener for form submission.
    -   [X] Prevent default form submission.
    -   [X] Get email value and selected Tithi values.
    -   [X] Basic client-side validation.
    -   [X] Use `fetch` to send `POST` to `/.netlify/functions/subscribe`.
    -   [X] Handle success/error responses and display feedback.

## Phase 3: Backend Implementation (Week 3) - **Refactoring for Netlify Blobs**

-   [X] **Refactor Subscription API Endpoint (`netlify/functions/subscribe.js`):**
    -   [X] Remove `airtable` library dependency.
    -   [X] Add `@netlify/blobs` dependency (`npm install @netlify/blobs`).
    -   [X] Require/import `getStore` from `@netlify/blobs`.
    -   [X] Get the blob store instance (e.g., `const store = getStore('subscriptions');`).
    -   [X] Validate incoming data (email, selectedTithis array).
    -   [X] On valid subscription, use `store.set(email, JSON.stringify(selectedTithis), { metadata: { subscribedAt: new Date().toISOString() } });` to save/update the subscription. (Using email as the key, storing selected Tithis array as a JSON string).
    -   [X] Handle potential errors during the Blob store operation.
    -   [X] Return appropriate success/error responses.
-   [X] **Refactor Reminder Logic (`netlify/functions/sendReminders.js`):**
    -   [X] Load and parse `tithis_2024_2030.json`.
    -   [X] Determine target date based on `REMINDER_LEAD_DAYS`.
    -   [X] Filter JSON data for Tithis occurring on the target date.
    -   [X] Remove `airtable` dependency.
    -   [X] Add `@netlify/blobs` dependency if not already present.
    -   [X] Require/import `getStore`.
    -   [X] Get the blob store instance (e.g., `const store = getStore('subscriptions');`).
    -   [X] Retrieve *all* subscriber keys (emails) using `store.list()`. (Note: This might become inefficient at large scale).
    -   [X] For each key (email), retrieve the corresponding value (JSON string of Tithis) using `store.get(key, { type: 'json' })`.
    -   [X] Parse the retrieved Tithi list for the subscriber.
    -   [X] Compare the subscriber's Tithis with the `upcomingTithis` identified earlier.
    -   [X] Filter/collect subscribers who need reminders for the specific Tithis.
    -   [X] Define the email template content.
    -   [X] Integrate with the Brevo API to send emails.
    -   [X] Handle errors and logging.

## Phase 4: Scheduled Function & Deployment (Week 4)

-   [ ] **Reminder Scheduled Function (`netlify/functions/sendReminders.js`):**
    -   [X] Function created.
    -   [X] Core logic implemented (Tithi loading, date calc, filtering).
    -   [X] **Airtable querying logic replaced with Netlify Blobs logic.**
    -   [X] Brevo integration implemented.
    -   [X] Error handling and logging in place.
-   [ ] **Configure Cron Trigger:**
    -   [X] Update `netlify.toml` with schedule for `sendReminders`.
-   [X] **Testing:**
    -   [X] Test the subscription form end-to-end locally (`netlify dev`).
    -   [X] Test the `subscribe` function response and verify data saved correctly in Netlify Blobs (using local dev tools or checking logs/Netlify UI after deployment).
    -   [X] Test the `sendReminders` function logic locally, verifying it retrieves data from Blobs and identifies correct recipients.
    -   [X] Trigger a test email send via Brevo.
    -   [X] Test deployed version's form and API.
    -   [X] Monitor the first few scheduled runs on Netlify, check Blob store access logs (if available) and function logs.
    -   [X] Implement comprehensive unit tests for backend functions and frontend form (2025-04-05)
-   [ ] **Deployment:**
    -   [ ] Ensure all necessary code is pushed to the main branch on Git.
    -   [ ] Verify required Environment Variables (`BREVO_API_KEY`, `SENDER_EMAIL`, `REMINDER_LEAD_DAYS`) are set in Netlify UI.
    -   [ ] Ensure Netlify Blobs is enabled for the site.
    -   [ ] Monitor the build/deploy logs.

## Future Considerations / Enhancements

-   [ ] Add location selection.
-   [ ] Implement an unsubscribe mechanism (easy with Blobs: use `store.delete(email)`).
-   [ ] Add email confirmation upon subscription.
-   [ ] Allow users to manage subscriptions (update selected Tithis - use `store.set` which overwrites).
-   [ ] Explore Netlify Blobs query/filtering capabilities if `store.list()` becomes too slow.
-   [ ] Automate JSON regeneration/update process.

## Documentation Updates

- 2025-04-05: Updated `PLANNING.md` to include detailed implementation phases aligned with this task list.
- 2025-04-05: Created `SETUP_BLOBS.md` and `.env.example` to document Blob storage configuration requirements after discovering missing environment variables (NETLIFY_SITE_ID, NETLIFY_BLOBS_TOKEN).
- 2025-04-07: Created `SETUP_BREVO.md` to document Brevo email service configuration after switching from Resend.

## 90-Day Special Days Calendar Feature (Netlify Deployment Plan)

This outlines the plan to implement the 90-Day Special Days calendar view, adapted for static deployment on platforms like Netlify.

1.  **Data Pre-generation (Python Script):**
    *   Modify or create a Python script (e.g., adapt `calculate_all_tithis.py` or create `generate_special_days_list.py`).
    *   Load the main Tithi data (`tithis_2024_2030_basic.json`).
    *   Iterate through the data (2025-2030).
    *   Filter to extract only entries considered "special days".
        *   *Filtering Rule:* Include entries where `full_name` does **not** match the standard "Paksha TithiName" pattern (e.g., "Shukla Pratipada", "Krishna Amavasya"). This assumes festival names from `special_days.json` are distinct.
    *   Save the filtered list (containing objects like `{ "date": "YYYY-MM-DD", "full_name": "Festival Name" }`) into a new static JSON file named `upcoming_special_days_data.json`.
    *   This script is run locally or during a build step, *before* deployment.

2.  **Frontend HTML (`index.html`):**
    *   Implement the tab navigation structure (Subscribe / 90-Day Calendar) as specified in `FESTIVAL_FEATURE.md`.
    *   Create the `calendar-tab` pane.
    *   Add containers for the three time periods (e.g., `special-days-30`, `special-days-60`, `special-days-90`).

3.  **Frontend JavaScript (`static/js/script.js`):**
    *   Implement tab switching functionality.
    *   When the calendar tab is activated:
        *   Fetch the static `upcoming_special_days_data.json` file.
        *   Get the user's current date (`new Date()`).
        *   Calculate the date 90 days from the current date.
        *   Filter the loaded festival data to include only entries between the current date and the 90-day future date.
        *   Calculate the number of days from today for each filtered festival.
        *   Group the filtered festivals into 0-30, 31-60, and 61-90 day buckets.
        *   Render the grouped festivals into their respective HTML containers, displaying date and name.

4.  **Frontend CSS (`static/css/style.css`):**
    *   Implement the styling for tabs and the calendar/festival list sections as defined in `FESTIVAL_FEATURE.md`.

5.  **Deployment:**
    *   Deploy the project folder containing `index.html`, CSS, JS, and the generated `upcoming_special_days_data.json` as a static site to Netlify.