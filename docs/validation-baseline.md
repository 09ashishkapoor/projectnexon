# Validation baseline for Project Nexon

This repo now uses a small validation baseline that is easy to review locally and straightforward to reuse in similar static or frontend-heavy repos.

## What was standardized

- keep the existing Node test suite as the first validation layer
- add a single-browser Playwright baseline for the highest-value flows:
  - the calendar shell renders with upcoming events and year sections
  - the category filter narrows the visible results correctly
  - the event-detail modal opens and supports `.ics` export
- add `@axe-core/playwright` coverage for the most stable critical flow:
  - the main calendar content
  - the representative Bhairava event modal
- add only three visual snapshots for stable UI surfaces:
  - header shell
  - upcoming events section
  - Bhairava event modal
- add a Playwright performance budget for the main page using repo-owned assets and local render timing
- freeze browser time to `2026-04-13` during Playwright runs so the upcoming-event surface stays deterministic
- add GitHub Actions for pull requests and pushes to `main`
- add CI link checking for `README.md`, `index.html`, `PRIVACY.md`, and `ECLIPSE_DATA_SOURCES.md`
- expose `npm run validate` as the main local validation entry point

## Local commands

Install dependencies and Playwright once:

```bash
npm ci
npx playwright install chromium
```

Run the full validation set:

```bash
npm run validate
```

Useful focused commands:

```bash
npm test
npm run test:syntax
npm run test:browser
```

## How to intentionally update visual baselines

Visual baselines are committed under `test/validation/visual.spec.js-snapshots/`.

When a UI change is intentional:

```bash
npx playwright test test/validation/visual.spec.js --update-snapshots
```

Then review the updated images before committing them. If the snapshots are meant to stay stable across CI, keep the workflow on the same operating system used to record the baselines.

This repo uses **Windows CI** for Playwright because the committed baselines were recorded against Chromium on Windows.

## How to reuse this pattern in future repos

1. keep any existing unit or integration tests instead of replacing them
2. choose the 1–3 browser flows that matter most to the real user journey
3. run accessibility checks only on stable, meaningful UI scopes
4. snapshot only stable surfaces with low animation and predictable content
5. pick performance budgets from the actual asset sizes and render timings in the repo
6. keep the browser matrix intentionally small unless product risk proves otherwise
7. make CI artifact upload automatic so failed runs are easy to debug
8. keep docs explicit about local usage and snapshot refresh steps

## Repo-specific notes

- the snapshot targets deliberately avoid the entire full page because the long year list adds noise without helping review
- the browser tests pin the in-page date to `2026-04-13` so time-sensitive upcoming cards stay reproducible
- the performance test blocks third-party font requests so the budget reflects repo-owned assets instead of external network variability
- the smoke coverage focuses on browsing events and exporting calendars because those are the highest-value user actions here
