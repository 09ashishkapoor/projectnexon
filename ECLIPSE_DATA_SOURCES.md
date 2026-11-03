# Eclipse Data Sources

This repository file documents the source references used for eclipses in [eclipses_2024_2030.json](eclipses_2024_2030.json).

## Primary sources

1. NASA GSFC Solar Eclipses: 2021-2030
- URL: https://eclipse.gsfc.nasa.gov/SEdecade/SEdecade2021.html
- Used fields: date, eclipse type, TD of greatest eclipse (UTC), broad visibility regions

2. NASA GSFC Lunar Eclipses: 2021-2030
- URL: https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html
- Used fields: date, eclipse type, TD of greatest eclipse (UTC), broad visibility regions

## Notes

- Scope for local dataset: 2024 through 2030 only.
- Date format: YYYY-MM-DD.
- Time format: HH:MM:SS in UTC (greatest eclipse).
- Visibility text is normalized from NASA abbreviations for readability.
- `generate_events.js` converts eclipse dates to IST for the calendar and includes the greatest-eclipse time in both IST and UTC in each event.
- This file can be regenerated from the same NASA decade tables if needed.

## Acknowledgment

NASA pages indicate data is by Fred Espenak (GSFC) and can be reproduced with attribution.
