# Tithi Reminder System - UX/UI Considerations

This document tracks tasks and ideas related to User Experience (UX) and User Interface (UI).

## Initial Design Tasks

-   [X] Create a simple, clear subscription form.
-   [X] Provide clear labels for email input and Tithi selection.
-   [X] Ensure the submit button is easily identifiable.
-   [X] Display clear success or error messages after form submission attempt.
-   [X] Make the page responsive for basic mobile viewing.

## Future Enhancements / Ideas

-   [ ] Improve visual styling beyond basic functionality.
-   [ ] Add a loading indicator during form submission.
-   [ ] Group Tithis (e.g., Shukla Paksha, Krishna Paksha) for easier selection.
-   [ ] Consider a "Select All" / "Deselect All" option for Tithis.
-   [ ] Add a confirmation step before submission.
-   [ ] Design the reminder email template for clarity and readability.
-   [ ] Develop UI for managing subscriptions (future feature).
-   [ ] Develop UI for unsubscribing (future feature).

## Discovered During Work

-   *(Add UX/UI tasks discovered during development here)*

## Core User Goal

To easily subscribe to receive timely email reminders (48 hours in advance) for specific Hindu Tithis they care about, for free.

## Target User Persona (Implied)

Individuals who follow Hindu traditions and want a simple, automated way to be reminded of upcoming Tithis relevant to them (e.g., for fasting, rituals, remembering anniversaries).

## User Flow

1.  **Discovery:** User finds the website (link sharing, search engine - TBD).
2.  **Landing Page:** User understands the service offering (Free Tithi email reminders).
3.  **Subscription:** User enters their email address and selects one or more Tithis they wish to be reminded about using the static HTML form.
4.  **Confirmation:** User submits the form and receives immediate feedback on the page confirming their subscription (or indicating any errors), driven by JavaScript interacting with the API response.
5.  **Receiving Reminders:** User receives an email notification approximately 48 hours before a selected Tithi occurs.
6.  **(Future) Unsubscribe:** User has a way to stop receiving reminders (e.g., a link in the email).

## Key UI Components

1.  **Subscription Form (Static `index.html`):**
    *   **Clarity:** Clearly state what the form is for ("Get Free Tithi Email Reminders").
    *   **Email Input:**
        *   Standard text input field.
        *   HTML5 `type="email"` for basic client-side validation/keyboard hints.
        *   Clear label: "Email Address".
        *   Placeholder text: e.g., "your.email@example.com".
        *   Required field indicator.
        *   Client-side JavaScript validation for email format (supplemented by server-side).
    *   **Tithi Selection:**
        *   Clear label: "Select Tithis for Reminders".
        *   **Multi-Select Method:** Checkboxes are simple and effective for a list of 30 items.
        *   List all 30 Tithis clearly (e.g., Pratipada, Dwitiya... Purnima, Amavasya). Consider grouping Shukla Paksha and Krishna Paksha if helpful for readability.
        *   Client-side JavaScript validation: Ensure at least one Tithi is selected.
    *   **Submit Button:**
        *   Clear call to action: e.g., "Subscribe", "Get Reminders".
        *   JavaScript can manage a disabled state until required fields are validly filled.
        *   Visual feedback on click/during API call (e.g., changing button text to "Subscribing...", disabling button).
    *   **Feedback Area:**
        *   A designated `<div>` on the page updated by JavaScript based on the `fetch` response.
        *   Display success messages (e.g., "Subscription successful! You'll receive reminders 48 hours in advance.").
        *   Display clear error messages (e.g., "Please enter a valid email.", "Please select at least one Tithi.", "Subscription failed, please try again.").

2.  **Reminder Email:**
    *   **Subject Line:** Clear and informative (e.g., "Tithi Reminder: [Tithi Name] is approaching", "Upcoming Tithi: [Tithi Name]").
    *   **Sender:** Use a recognizable sender name/address (configured via Resend).
    *   **Content:**
        *   Greeting (e.g., "Namaste," or "Hello,").
        *   Clearly state the Tithi name.
        *   Provide the approximate date range from the JSON data (mentioning the 48-hour advance notice). Make timezone/reference location clear if known from JSON source.
        *   Keep the content concise and focused.
        *   Professional and clean email template design.
    *   **(Future) Unsubscribe Link:** A mandatory and clearly visible link to allow users to opt-out.

## UX Principles

*   **Simplicity:** The subscription process should be extremely straightforward and quick via the static form.
*   **Clarity:** Users should immediately understand what the service does and how to use it. Form labels, button text, and email content must be clear.
*   **Reliability:** Users expect reminders to be timely (48 hours advance) and accurate *based on the pre-calculated data*. Acknowledge the source/limitations of the data if necessary (e.g., fixed location).
*   **Trust:** Clearly state it's a free service. Handle email addresses responsibly (implied: no spam, easy unsubscribe).
*   **Feedback:** Provide immediate client-side feedback upon form submission using JavaScript.
*   **Accessibility:** Ensure the form and content are reasonably accessible (e.g., proper HTML semantics, sufficient color contrast, keyboard navigability).

## Non-Functional UX Considerations

*   **Performance:** The static website should load very quickly on Netlify. API calls should be reasonably fast.
*   **Responsiveness:** The HTML form should use CSS to work well on both desktop and mobile devices.
*   **Zero Cost:** Reinforce the "free" aspect.