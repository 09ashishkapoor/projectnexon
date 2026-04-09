<div align="center">

# 🕉️ Bhairava Baba & Ma Adya Mahakali
## Upasana Calendar

*A sacred planning tool for sincere practitioners*

[![Live Site](https://img.shields.io/badge/Live%20Site-calendar.jaikhyapaparampara.com-8B2252?style=for-the-badge&logo=cloudflare&logoColor=white)](https://calendar.jaikhyapaparampara.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Cloudflare Pages](https://img.shields.io/badge/Hosted%20on-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)
[![No dependencies](https://img.shields.io/badge/Dependencies-None-brightgreen?style=for-the-badge)](package.json)

</div>

---

A free, no-account, fully static web tool for practitioners of **Bhairava Baba** and **Ma Adya Mahakali** — sacred dates, all four Navaratri windows, and eclipse times from **2025 through 2030**, with one-click `.ics` export for any calendar app.

> No login. No email. No tracking. Just the dates.

---

## ✨ What's included

| 🗓️ Category | Dates covered |
|---|---|
| 🔱 **Bhairava Ashtami** | Krishna Paksha Ashtami — every lunar month |
| 🌑 **Ma Kali — Amavasya** | New moon (Amavasya) — every lunar month |
| 🌺 **Navaratri** | All four: Chaitra, Sharad, Magha Gupt, Ashadha Gupt |
| 🌘 **Eclipses** | All lunar and solar eclipses through 2030 |

> All dates follow the **IST sunrise rule** (standard Indian panchanga).  
> Practitioners **outside India** should verify at [drikpanchang.com](https://www.drikpanchang.com) with their local city selected.

---

## 🚀 Features

- 🔒 **No account, no email** — fully client-side, zero data collection
- 🎛️ **Filter by category** — view Bhairava, Kali, Navaratri, or eclipse dates independently
- 📖 **Date significance** — tap any date for spiritual significance notes
- 📅 **Calendar export** — download a `.ics` file for Google Calendar, Apple Calendar, Outlook, or any standard app
- ⚡ **Lightweight** — pure HTML / CSS / JS, no frameworks, no build step

---

## 🖥️ Using the calendar

1. Visit **[calendar.jaikhyapaparampara.com](https://calendar.jaikhyapaparampara.com)** — or open `index.html` locally in any browser
2. Use the filter buttons to narrow by category
3. Click any event card to read its significance
4. Click **↙ Export Calendar (.ics)** to download and import into your calendar app

---

## 🗂️ Project structure

```
├── index.html                    # Main page
├── style.css                     # All styles
├── app.js                        # Calendar logic, filtering, .ics export
├── events.json                   # Pre-generated event dataset (2025–2030)
├── generate_events.js            # Script to regenerate events.json
├── _headers                      # Cloudflare Pages security headers
├── wrangler.toml                 # Cloudflare Pages deployment config
│
├── tithis_2024_2030_basic.json   # Tithi source data
├── eclipses_2024_2030.json       # NASA eclipse source data
└── special_days.json             # Supplementary dates
```

---

## 🔄 Regenerating event data

To extend or update the dataset:

```bash
node generate_events.js
```

This reads the three source JSON files and writes a fresh `events.json`.  
Eclipse data sourced from NASA GSFC — see [ECLIPSE_DATA_SOURCES.md](ECLIPSE_DATA_SOURCES.md) for full attribution.

---

## ☁️ Deployment

Fully static — no build step required.

### Cloudflare Pages (recommended)

**Via Git integration (auto-deploys on push):**

```
1. Push this repo to GitHub
2. Cloudflare Dashboard → Pages → Connect to Git → select repo
3. Build command:    (leave empty)
   Output directory: .
4. Deploy
```

**Via Wrangler CLI:**

```bash
npx wrangler pages deploy .
```

**Files served:**
```
index.html  ·  style.css  ·  app.js  ·  events.json  ·  _headers
```

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Jai Maa Kali &nbsp;·&nbsp; Jai Bhairava Baba</sub>
</div>