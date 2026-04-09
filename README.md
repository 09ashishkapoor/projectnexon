# Bhairava Baba and Ma Adya Mahakali Upasana Calendar

A free, no-account, static web tool for practitioners of Bhairava Baba and Ma Adya Mahakali — covering sacred dates, Navaratri windows, and eclipse times from 2025 through 2030, with one-click `.ics` export for any calendar app.

**Live site:** [calendar.jaikhyapaparampara.com](https://calendar.jaikhyapaparampara.com)

---

## What it includes

| Category | Dates covered |
|---|---|
| **Bhairava Ashtami** | Krishna Paksha Ashtami every lunar month |
| **Ma Kali — Amavasya** | New moon (Amavasya) every lunar month |
| **Navaratri** | All four: Chaitra, Sharad, Magha Gupt, Ashadha Gupt |
| **Eclipses** | All lunar and solar eclipses through 2030 |

All dates follow the **IST sunrise rule** (standard Indian panchanga). Practitioners outside India should verify dates at [drikpanchang.com](https://www.drikpanchang.com) with their local city selected.

---

## Features

- **No account, no email** — fully client-side, no data collection
- **Filter by category** — view Bhairava, Kali, Navaratri, or eclipse dates independently
- **Date significance** — tap any date for notes on its spiritual significance
- **Calendar export** — download a `.ics` file for import into Google Calendar, Apple Calendar, Outlook, or any standard calendar app
- **Lightweight** — pure HTML/CSS/JS, no frameworks, no build step

---

## Using the calendar

1. Visit the live site, or open `index.html` directly in a browser (no server needed)
2. Use the filter buttons to narrow by category
3. Click any event to read significance notes
4. Click **Export Calendar (.ics)** to download and import into your calendar

---

## Project structure

```
index.html          — main page
style.css           — all styles
app.js              — calendar logic, filtering, .ics export
events.json         — pre-generated event dataset (2025–2030)
generate_events.js  — script to regenerate events.json from source data
_headers            — Cloudflare Pages security headers
wrangler.toml       — Cloudflare Pages deployment config

tithis_2024_2030_basic.json   — tithi source data
eclipses_2024_2030.json       — NASA eclipse source data
special_days.json             — supplementary dates
```

---

## Regenerating event data

If you want to extend or update the dataset:

```bash
node generate_events.js
```

This reads `tithis_2024_2030_basic.json`, `eclipses_2024_2030.json`, and `special_days.json` and writes a fresh `events.json`. Eclipse data sourced from NASA GSFC — see [ECLIPSE_DATA_SOURCES.md](ECLIPSE_DATA_SOURCES.md) for attribution details.

---

## Deployment

The site is a fully static build — no build step required.

### Cloudflare Pages (recommended)

**Via Git integration (auto-deploy on push):**
1. Push this repo to GitHub
2. In the Cloudflare dashboard → Pages → Connect to Git → select this repo
3. Build command: *(leave empty)*
4. Output directory: `.`
5. Deploy

**Via Wrangler CLI:**
```bash
npx wrangler pages deploy .
```

Files served by Cloudflare Pages:
```
index.html  style.css  app.js  events.json  _headers
```

---

## License

MIT — see [LICENSE](LICENSE) for details.