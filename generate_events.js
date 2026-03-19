/**
 * generate_events.js
 * One-time script to produce events.json from raw tithi and eclipse data.
 * Run: node generate_events.js
 */

const fs = require('fs');
const path = require('path');

// --- Load source data ---
const tithis = JSON.parse(fs.readFileSync(path.join(__dirname, 'tithis_2024_2030_basic.json'), 'utf8'));
const eclipses = JSON.parse(fs.readFileSync(path.join(__dirname, 'eclipses_2024_2030.json'), 'utf8'));

const events = [];
let idCounter = 1;
const uid = () => `upasana-cal-${(idCounter++).toString().padStart(4, '0')}@bhairava-kali-calendar`;

// --- Helper ---
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ============================
// 1. Krishna Paksha Ashtami (Bhairava dates)
// ============================
const YEARS = ['2026', '2027', '2028', '2029', '2030'];
YEARS.forEach(yr => {
  const yearData = tithis[yr];
  if (!yearData || !yearData['Ashtami']) return;
  yearData['Ashtami']
    .filter(e => e.full_name.includes('Krishna'))
    .forEach(e => {
      events.push({
        id: uid(),
        date: e.date,
        title: 'Kala Bhairava Ashtami',
        category: 'bhairava_ashtami',
        description_short: 'Krishna Paksha Ashtami — the sacred 8th lunar day of the dark fortnight, most potent for Bhairava upasana.',
        significance: 'Kala Bhairava, the Guru of Shakti Vidya and Guru Tatva within Shiva, is worshipped intensely on Krishna Paksha Ashtami. Fasting, night vigil, and recitation of Bhairava 1000 names or Kalabhairava Ashtakam are traditional practices.',
        source_links: [
          'https://bhairavakalikenamosthute.com/',
          'https://www.jaikhyapaparampara.com/articles/hey-beginner-lets-start-japa-mala-nam-jap-sankalp-set-asan-IxeSBqAdZNk/',
          'https://www.drikpanchang.com/vrats/masik-kalashtami-dates.html'
        ]
      });
    });
});

// ============================
// 2. Amavasya (Ma Kali dates)
// ============================
YEARS.forEach(yr => {
  const yearData = tithis[yr];
  if (!yearData || !yearData['Amavasya']) return;
  yearData['Amavasya'].forEach(e => {
    const monthRaw = e.full_name.replace(' Amavasya', '').replace('Krishna', '').replace('Diwali,', '').trim();
    const monthLabel = monthRaw && monthRaw !== '' ? monthRaw : 'Amavasya';
    events.push({
      id: uid(),
      date: e.date,
      title: monthLabel.includes('Amavasya') ? 'Amavasya' : `${monthLabel} Amavasya`,
      category: 'kali_amavasya',
      description_short: 'Amavasya — the new moon, the most potent lunar phase for Ma Kali upasana.',
      significance: "Amavasya is the night of the new moon, when Ma Kali's energy is considered most accessible. Reading her 1000 names, sadhana, Kali puja, Nama Japa and meditation on the void are traditionally performed. A day of inner turning, deep reverence, and dissolution of ego.",
      source_links: [
        'https://www.1000namesofmakali.com/',
        'https://www.drikpanchang.com/vrats/amavasyadates.html',
        'https://www.jaikhyapaparampara.com/articles/maha-adya-kali-sadhana-sri-krishnas-adesha-defeat-kali-yuga-bhairava-kripa-GRusYQHEEBs/'
      ]
    });
  });
});

// ============================
// 3. Navaratri (start and end events for each window)
// ============================

// Manually derived start dates (see generate_events.js commentary).
// End = start + 8 days (9 nights/days, day 1 = Pratipada, day 9 = Navami).
const navaratriData = [
  // 2026
  { start: '2026-01-19', type: 'gupt_magha',  label: 'Magha Gupt Navaratri 2026' },
  { start: '2026-03-20', type: 'chaitra',      label: 'Chaitra Navaratri 2026' },
  { start: '2026-07-15', type: 'gupt_ashadha', label: 'Ashadha Gupt Navaratri 2026' },
  { start: '2026-09-12', type: 'sharad',       label: 'Sharad Navaratri 2026' },
  // 2027
  { start: '2027-01-08', type: 'gupt_magha',  label: 'Magha Gupt Navaratri 2027' },
  { start: '2027-03-09', type: 'chaitra',      label: 'Chaitra Navaratri 2027' },
  { start: '2027-06-05', type: 'gupt_ashadha', label: 'Ashadha Gupt Navaratri 2027' },
  { start: '2027-09-01', type: 'sharad',       label: 'Sharad Navaratri 2027' },
  // 2028
  { start: '2027-12-28', type: 'gupt_magha',  label: 'Magha Gupt Navaratri 2028' },
  { start: '2028-03-27', type: 'chaitra',      label: 'Chaitra Navaratri 2028' },
  { start: '2028-06-23', type: 'gupt_ashadha', label: 'Ashadha Gupt Navaratri 2028' },
  { start: '2028-09-19', type: 'sharad',       label: 'Sharad Navaratri 2028' },
  // 2029
  { start: '2029-01-15', type: 'gupt_magha',  label: 'Magha Gupt Navaratri 2029' },
  { start: '2029-03-16', type: 'chaitra',      label: 'Chaitra Navaratri 2029' },
  { start: '2029-06-13', type: 'gupt_ashadha', label: 'Ashadha Gupt Navaratri 2029' },
  { start: '2029-09-09', type: 'sharad',       label: 'Sharad Navaratri 2029' },
  // 2030
  { start: '2030-02-03', type: 'gupt_magha',  label: 'Magha Gupt Navaratri 2030' },
  { start: '2030-03-05', type: 'chaitra',      label: 'Chaitra Navaratri 2030' },
  { start: '2030-07-01', type: 'gupt_ashadha', label: 'Ashadha Gupt Navaratri 2030' },
  { start: '2030-09-28', type: 'sharad',       label: 'Sharad Navaratri 2030' },
];

const navaratriMeta = {
  gupt_magha: {
    description_short: 'Magha Gupt Navaratri — the hidden nine nights of the Magha lunar month dedicated to the ten Mahavidyas.',
    significance: 'One of the four Gupt (hidden/secret) Navaratris, falling in the Magha Shukla Paksha. This Navaratri is especially suited for tantric sadhana and worship of the Dasha Mahavidyas, with Ma Kali primary among them. It is considered less publicly observed but highly potent for intensive inner practice.',
    source_links: ['https://www.drikpanchang.com/navratri/navratri-calendars.html']
  },
  chaitra: {
    description_short: 'Chaitra Navaratri — the nine nights of spring, beginning on the Hindu New Year.',
    significance: 'Chaitra Navaratri marks the beginning of the new Hindu lunar year. The nine nights honor Devi in her nine forms (Navadurga). Day 1 is Pratipada with Kalasha Sthapana; Day 9 is Ram Navami, celebrated as the birth of Lord Rama. For Shakta practitioners, fierce Devi forms are honored each night.',
    source_links: ['https://www.drikpanchang.com/navratri/navratri-calendars.html']
  },
  gupt_ashadha: {
    description_short: 'Ashadha Gupt Navaratri — the hidden nine nights of the Ashadha lunar month.',
    significance: 'The Ashadha Gupt Navaratri falls in the Ashadha Shukla Paksha, around the summer solstice. Like Magha Gupt Navaratri, it is considered ideal for Dasha Mahavidya sadhana and tantric worship. Less observed publicly, these nine nights are considered especially auspicious for Kali, Tara, and Chhinnamasta practices.',
    source_links: ['https://www.drikpanchang.com/navratri/navratri-calendars.html']
  },
  sharad: {
    description_short: 'Sharad Navaratri — the most widely observed nine nights in Ashwin, culminating in Dussehra.',
    significance: 'The most celebrated of the four Navaratris, falling in Ashwin Shukla Paksha after the Ashwin Amavasya. The nine nights honor Durga, Lakshmi, and Saraswati in sequence. Day 8 (Ashtami) and Day 9 (Navami) are celebrated as Durga Puja, and Day 10 is Vijaya Dashami/Dussehra — the victory of Devi over Mahishasura.',
    source_links: ['https://www.drikpanchang.com/navratri/navratri-calendars.html']
  }
};

navaratriData.forEach(n => {
  const meta = navaratriMeta[n.type];
  const endDate = addDays(n.start, 8);
  events.push({
    id: uid(),
    date: n.start,
    date_end: endDate,
    title: n.label,
    category: 'navaratri',
    navaratri_type: n.type,
    description_short: meta.description_short,
    significance: meta.significance,
    source_links: meta.source_links
  });
});

// ============================
// 4. Eclipses
// ============================
eclipses.filter(e => e.date >= '2026-01-01').forEach(e => {
  const isLunar = e.kind === 'lunar';
  const typeLabel = e.eclipse_type.charAt(0).toUpperCase() + e.eclipse_type.slice(1);
  const title = `${typeLabel} ${isLunar ? 'Lunar' : 'Solar'} Eclipse`;
  const category = isLunar ? 'lunar_eclipse' : 'solar_eclipse';

  const lunarSig = 'Lunar eclipses are considered auspicious times for inner practice, especially Kali and Bhairava upasana. The period of totality or penumbra is traditional for japa, meditation, and fasting.';
  const solarSig = 'Solar eclipses mark powerful solar-lunar conjunctions considered transformative in tantric practice. Many practitioners observe silence, brahmacharya, and intensified sadhana during this window.';

  events.push({
    id: uid(),
    date: e.date,
    title,
    category,
    eclipse_type: e.eclipse_type,
    visibility: e.visibility,
    description_short: `${typeLabel} ${isLunar ? 'lunar' : 'solar'} eclipse. Visible: ${e.visibility}.`,
    significance: isLunar ? lunarSig : solarSig,
    source_links: isLunar
      ? ['https://eclipse.gsfc.nasa.gov/eclipse.html', 'https://www.jaikhyapaparampara.com/articles/bloodmoon-sadhana-maa-adya-kali-U_9s_OJ_RWk/']
      : ['https://eclipse.gsfc.nasa.gov/eclipse.html']
  });
});

// ============================
// Sort all events by date
// ============================
events.sort((a, b) => a.date.localeCompare(b.date));

// Write output
const outputPath = path.join(__dirname, 'events.json');
fs.writeFileSync(outputPath, JSON.stringify(events, null, 2), 'utf8');
console.log(`Generated ${events.length} events → events.json`);
