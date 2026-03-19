/**
 * app.js — Bhairava Baba and Ma Adya Mahakali Upasana Calendar
 * Static single-page app: loads events.json, renders date list, handles
 * category filters, and generates .ics downloads (full export + per-event).
 */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────────────────────
  let ALL_EVENTS = [];
  let activeFilter = 'all';
  let openEventId  = null;

  // ─── Utilities ──────────────────────────────────────────────────────────────

  /** Parse "YYYY-MM-DD" into a local Date at midnight */
  function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /** Format date as e.g. "Mon, 22 Sep 2025" */
  function fmtDate(str) {
    const d = parseDate(str);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  /** Format date range for Navaratri e.g. "22 Sep – 1 Oct 2025" */
  function fmtDateRange(startStr, endStr) {
    const s = parseDate(startStr);
    const e = parseDate(endStr);
    const sYear = s.getFullYear();
    const eYear = e.getFullYear();
    const sMonth = s.toLocaleDateString('en-GB', { month: 'short' });
    const eMonth = e.toLocaleDateString('en-GB', { month: 'short' });
    if (sYear !== eYear) {
      return `${s.getDate()} ${sMonth} ${sYear} – ${e.getDate()} ${eMonth} ${eYear}`;
    }
    if (sMonth !== eMonth) {
      return `${s.getDate()} ${sMonth} – ${e.getDate()} ${eMonth} ${eYear}`;
    }
    return `${s.getDate()}–${e.getDate()} ${eMonth} ${eYear}`;
  }

  /** Returns today as "YYYY-MM-DD" */
  function todayStr() {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** Human-readable category label */
  const CAT_LABELS = {
    bhairava_ashtami: 'Bhairava',
    kali_amavasya:    'Ma Kali',
    navaratri:        'Navaratri',
    lunar_eclipse:    'Lunar Eclipse',
    solar_eclipse:    'Solar Eclipse',
  };

  function catLabel(cat) {
    return CAT_LABELS[cat] || cat;
  }

  // ─── ICS generation ─────────────────────────────────────────────────────────

  /** Convert "YYYY-MM-DD" to ICS date format "YYYYMMDD" */
  function icsDate(str) {
    return str.replace(/-/g, '');
  }

  /** Wrap text at 75 chars per RFC 5545 */
  function icsWrapLine(line) {
    const chunks = [];
    while (line.length > 75) {
      chunks.push(line.slice(0, 75));
      line = ' ' + line.slice(75);
    }
    chunks.push(line);
    return chunks.join('\r\n');
  }

  /** Escape text for ICS (commas, semicolons, newlines) */
  function icsTxt(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  /** Build a single VEVENT block */
  function buildVEvent(ev) {
    const dtstart = icsDate(ev.date);
    // For multi-day events, ICS end date is exclusive — add 1 day
    const endDateExclusive = ev.date_end
      ? icsDate(addDaysToDateStr(ev.date_end, 1))
      : icsDate(addDaysToDateStr(ev.date, 1));
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z/, 'Z');

    const lines = [
      'BEGIN:VEVENT',
      icsWrapLine(`UID:${ev.id}@bhairava-kali-calendar`),
      `DTSTAMP:${now}`,
      icsWrapLine(`DTSTART;VALUE=DATE:${dtstart}`),
      icsWrapLine(`DTEND;VALUE=DATE:${endDateExclusive}`),
      icsWrapLine(`SUMMARY:${icsTxt(ev.title)}`),
      icsWrapLine(`DESCRIPTION:${icsTxt(ev.description_short + '\\n\\n' + ev.significance)}`),
      icsWrapLine(`CATEGORIES:${icsTxt(catLabel(ev.category))}`),
    ];
    if (ev.source_links && ev.source_links.length > 0) {
      lines.push(icsWrapLine(`URL:${ev.source_links[0]}`));
    }
    lines.push(
      'BEGIN:VALARM',
      'TRIGGER:-P1W',
      'ACTION:DISPLAY',
      icsWrapLine(`DESCRIPTION:Reminder: ${icsTxt(ev.title)} is in 1 week`),
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P3D',
      'ACTION:DISPLAY',
      icsWrapLine(`DESCRIPTION:Reminder: ${icsTxt(ev.title)} is in 3 days`),
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      icsWrapLine(`DESCRIPTION:Reminder: ${icsTxt(ev.title)} is tomorrow`),
      'END:VALARM',
      'END:VEVENT'
    );
    return lines.join('\r\n');
  }

  function addDaysToDateStr(str, n) {
    const [y, m, d] = str.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n);
    const ny = dt.getFullYear();
    const nm = String(dt.getMonth() + 1).padStart(2, '0');
    const nd = String(dt.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  }

  /** Build a full ICS calendar from a list of events */
  function buildICS(events, calName) {
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z/, 'Z');
    const vevents = events.map(buildVEvent).join('\r\n');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bhairava Kali Calendar//EN',
      `X-WR-CALNAME:${icsTxt(calName || 'Bhairava Baba and Ma Adya Mahakali Upasana Calendar')}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-TIMEZONE:UTC',
      vevents,
      'END:VCALENDAR',
    ].join('\r\n');
  }

  /** Trigger a file download in the browser */
  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── Filtering ───────────────────────────────────────────────────────────────

  function filterEvents(events) {
    if (activeFilter === 'all') return events;
    if (activeFilter === 'eclipse') {
      return events.filter(e => e.category === 'lunar_eclipse' || e.category === 'solar_eclipse');
    }
    return events.filter(e => e.category === activeFilter);
  }

  // ─── Rendering ───────────────────────────────────────────────────────────────

  function buildEventCard(ev, today) {
    const isToday   = ev.date === today;
    const dateText  = ev.date_end ? fmtDateRange(ev.date, ev.date_end) : fmtDate(ev.date);
    const shortDesc = ev.description_short || '';

    const card = document.createElement('div');
    card.className = 'event-card';
    card.dataset.cat = ev.category;
    card.dataset.id  = ev.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${ev.title}, ${dateText}`);

    card.innerHTML = `
      <div class="event-stripe" aria-hidden="true"></div>
      <div class="event-body">
        <div class="event-meta">
          <span class="event-date${isToday ? ' is-today' : ''}">${dateText}${isToday ? ' · Today' : ''}</span>
          <span class="event-cat-label">${catLabel(ev.category)}</span>
        </div>
        <div class="event-title">${ev.title}</div>
        <div class="event-desc">${shortDesc}</div>
      </div>
    `;

    card.addEventListener('click', () => openModal(ev));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(ev); }
    });

    return card;
  }

  function renderUpcoming(events, today) {
    const list = document.getElementById('upcoming-list');
    list.innerHTML = '';

    const upcoming = events
      .filter(e => e.date >= today)
      .slice(0, 8);

    if (upcoming.length === 0) {
      list.innerHTML = '<p class="no-events">No upcoming events match this filter.</p>';
      return;
    }

    upcoming.forEach(ev => list.appendChild(buildEventCard(ev, today)));
  }

  function renderYearSections(events, today) {
    const container = document.getElementById('year-sections');
    container.innerHTML = '';

    // Group by year, only past/all events beyond upcoming
    const byYear = {};
    events.forEach(ev => {
      const yr = ev.date.slice(0, 4);
      if (!byYear[yr]) byYear[yr] = [];
      byYear[yr].push(ev);
    });

    const sortedYears = Object.keys(byYear).sort();

    sortedYears.forEach(yr => {
      const section = document.createElement('section');
      section.className = 'section year-section';
      section.setAttribute('aria-label', `Events in ${yr}`);

      const title = document.createElement('h2');
      title.className = 'year-section-title';
      title.textContent = yr;
      section.appendChild(title);

      const list = document.createElement('div');
      list.className = 'event-list';
      byYear[yr].forEach(ev => list.appendChild(buildEventCard(ev, today)));
      section.appendChild(list);

      container.appendChild(section);
    });
  }

  function render() {
    const today    = todayStr();
    const filtered = filterEvents(ALL_EVENTS);

    renderUpcoming(filtered, today);
    renderYearSections(filtered, today);
  }

  // ─── Modal ────────────────────────────────────────────────────────────────────

  function openModal(ev) {
    openEventId = ev.id;
    const modal = document.getElementById('event-modal');
    const dateText = ev.date_end ? fmtDateRange(ev.date, ev.date_end) : fmtDate(ev.date);

    document.getElementById('modal-tag').className = `modal-category-tag cat-${ev.category}`;
    document.getElementById('modal-tag').textContent = catLabel(ev.category);
    document.getElementById('modal-title').textContent = ev.title;
    document.getElementById('modal-date').textContent  = dateText;
    document.getElementById('modal-desc').textContent  = ev.description_short || '';
    document.getElementById('modal-significance').textContent = ev.significance || '';

    const linksEl = document.getElementById('modal-links');
    linksEl.innerHTML = '';
    if (Array.isArray(ev.source_links) && ev.source_links.length) {
      ev.source_links.forEach(url => {
        const a = document.createElement('a');
        a.href   = url;
        a.target = '_blank';
        a.rel    = 'noopener noreferrer';
        // Display the domain only
        try { a.textContent = new URL(url).hostname.replace(/^www\./, ''); }
        catch { a.textContent = url; }
        linksEl.appendChild(a);
      });
    }

    // Per-event ICS button
    document.getElementById('modal-ics-btn').onclick = () => {
      const ics = buildICS([ev], ev.title);
      const safeTitle = ev.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
      downloadFile(ics, `${safeTitle}.ics`, 'text/calendar;charset=utf-8');
    };

    modal.removeAttribute('hidden');
    document.getElementById('modal-close').focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('event-modal').setAttribute('hidden', '');
    document.body.style.overflow = '';
    openEventId = null;
  }

  // ─── Event Listeners ─────────────────────────────────────────────────────────

  function initUI() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        render();
      });
    });

    // Export all button
    document.getElementById('export-btn').addEventListener('click', () => {
      const toExport = filterEvents(ALL_EVENTS);
      const ics = buildICS(toExport, 'Bhairava Baba and Ma Adya Mahakali Upasana Calendar');
      downloadFile(ics, 'upasana-calendar.ics', 'text/calendar;charset=utf-8');
    });

    // Modal close
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-backdrop').addEventListener('click', closeModal);

    // Keyboard: Escape closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  // ─── Bootstrap ───────────────────────────────────────────────────────────────

  async function init() {
    initUI();

    try {
      const resp = await fetch('events.json');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      ALL_EVENTS = await resp.json();
    } catch (err) {
      document.getElementById('upcoming-list').innerHTML =
        '<p class="no-events">Could not load calendar data. Please refresh.</p>';
      console.error('Failed to load events.json:', err);
      return;
    }

    render();
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
