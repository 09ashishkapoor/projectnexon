# Bhairava Baba and Ma Adya Mahakali Upasana Calendar

A focused, static planning tool for Bhairava Baba and Ma Adya Mahakali practitioners — sacred dates, Navaratri windows, and eclipse times from 2025 to 2030, with one-click calendar export.

## What it includes

- **Bhairava dates** — Krishna Paksha Ashtami every lunar month
- **Ma Kali dates** — Amavasya (new moon) every lunar month
- **Navaratri windows** — Chaitra, Sharad, Magha Gupt, Ashadha Gupt (all four)
- **Eclipses** — all lunar and solar eclipses through 2030

## Using the calendar

1. Open `index.html` directly in a browser (no server required for local use)
2. Filter by category using the buttons at the top
3. Click any date for significance notes and reading links
4. Export all events (or filtered events) to `.ics` for Google Calendar / Outlook

## Regenerating events.json

If you need to update or extend the dataset:

```bash
node generate_events.js
```

Source data files:
- `tithis_2024_2030_basic.json` — tithi data through 2030
- `eclipses_2024_2030.json` — NASA eclipse data
- `special_days.json` — supplementary dates

## Deployment

Hosted on **Cloudflare Pages**. Security headers are defined in `_headers`.

**Via Wrangler CLI (direct upload):**
```bash
npx wrangler pages deploy .
```

**Via Git integration:**
1. Push repo to GitHub / GitLab
2. In the Cloudflare dashboard → Pages → Connect to Git → select repo
3. Build settings: leave build command empty, set output directory to `.`
4. Deploy

The following files are what Cloudflare Pages serves:
```
index.html
style.css
app.js
events.json
_headers
```

## License


This project is licensed under the MIT License - see the LICENSE file for details.