# Scope Rework: Bhairava Baba and Ma Adya Mahakali Upasana Calendar

## Product direction
Build a focused self-help calendar tool, not a reminder service.

The app should help users plan their own sadhana by giving a clean, reliable list of spiritually significant dates and easy calendar export.

## Core audience
- Practitioners focused on Bhairava Baba upasana and Ma Adya Mahakali upasana
- Users who prefer self-guided planning over email reminders

## In scope (MVP)
1. Bhairava dates:
- Krishna Paksha Ashtami only

2. Ma Kali dates:
- Amavasya only

3. Navaratri dates:
- Chaitra Navaratri
- Sharad Navaratri
- Gupt Navaratri windows (Magha and Ashadha)

4. Eclipse dates:
- Lunar eclipse dates
- Solar eclipse dates
- Global occurrence is acceptable for this project

5. Calendar export:
- Download .ics file for all included events
- Individual event download optional
- Works with Google Calendar and Outlook import

6. Content layer:
- Brief significance note per event (1-3 lines)
- Curated external reading links for Bhairava Baba and Ma Adya Mahakali upasana

7. UI:
- Simple landing page with clean date list
- Filters by category (Bhairava, Kali, Navaratri, Eclipse)
- Upcoming first, then year sections

## Explicitly out of scope
- Email subscriptions
- Reminder scheduling/cron jobs
- User accounts
- Personalization per subscriber
- Multi-deity expansion in this phase

## Data model (proposed)
Each event entry should include:
- id
- date (ISO)
- title
- category (bhairava_ashtami | kali_amavasya | navaratri | lunar_eclipse | solar_eclipse)
- description_short
- significance
- source_links (array)
- calendar_uid

## Success criteria
- User can understand the next important dates in under 30 seconds
- User can import all events into calendar in under 2 minutes
- No background jobs required to keep core experience useful

## Build approach (lean)
1. Generate a single curated JSON dataset.
2. Render a static landing page from that dataset.
3. Generate an .ics file from the same dataset.
4. Deploy as static + lightweight edge endpoints if needed.

## Notes for current codebase migration
- Keep date generation utilities and JSON assets.
- Remove reminder, subscription, and scheduler flows.
- Replace Netlify-function-dependent frontend calls with static data + calendar download.
- Cloudflare target can be mostly static pages (Pages/Workers), with minimal backend.

## Phase plan
### Phase 1: Dataset and definitions
- Finalize event taxonomy and naming conventions.
- Produce curated event list for supported years.

### Phase 2: UX and page
- Build simple landing page with sections and filters.
- Add concise significance copy and resource links.

### Phase 3: Calendar export
- Build single-click full .ics export.
- Validate import in Google Calendar and Outlook.

### Phase 4: QA and publishing
- Validate dates, naming consistency, and link quality.
- Publish with clear disclaimer on tradition/regional variation.