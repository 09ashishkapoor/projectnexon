# Tithi Reminder System - Unit Testing Tasks

This document tracks tasks related to unit testing.

## Frontend Tests (`/tests/frontend`)

-   [X] **Form Validation:**
    -   [X] Test email validation (valid, invalid, empty).
    -   [X] Test Tithi selection (at least one selected).
    -   [X] Test form submission enabling/disabling based on validation.
-   [X] **API Interaction:**
    -   [X] Test successful API call (`fetch`) mock.
    -   [X] Test error handling from API call mock.
    -   [X] Test UI feedback on success/error.

## Backend Tests (`/tests/functions`)

-   [X] **`subscribe` Function:**
    -   [X] Test successful subscription (valid input, Netlify Blobs mock success).
    -   [X] Test validation failure (missing email, invalid email, no Tithis).
    -   [X] Test Netlify Blobs API error handling (mock failure).
    -   [X] Test correct data formatting for Netlify Blobs.
-   [X] **`sendReminders` Function:**
    -   [X] Test finding correct Tithis for a given date (mock JSON).
    -   [X] Test finding correct subscribers from Netlify Blobs (mock Blobs response).
    -   [X] Test email sending logic (mock Resend API success/failure).
    -   [X] Test handling when no Tithis are found for the target date.
    -   [X] Test handling when no subscribers are found for a Tithi.
    -   [X] Test batching/grouping of emails if implemented.

## Discovered During Work

-   *(Add testing tasks discovered during development here)*