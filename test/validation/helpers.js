const { expect } = require('@playwright/test');

async function freezeCalendarNow(page) {
  await page.addInitScript(({ fixedNow }) => {
    const OriginalDate = Date;

    class FixedDate extends OriginalDate {
      constructor(...args) {
        super(...(args.length ? args : [fixedNow]));
      }

      static now() {
        return fixedNow;
      }
    }

    FixedDate.parse = OriginalDate.parse;
    FixedDate.UTC = OriginalDate.UTC;
    globalThis.Date = FixedDate;
  }, { fixedNow: new Date('2026-04-13T00:00:00Z').valueOf() });
}

async function gotoCalendar(page) {
  await freezeCalendarNow(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Bhairava Baba and Ma Adya Mahakali/i })).toBeVisible();
  await expect(page.locator('#upcoming-list .event-card')).toHaveCount(8);
  await expect(page.locator('.year-section-title').first()).toHaveText('2026');
}

async function openFirstBhairavaEvent(page) {
  await page.locator('.filter-btn[data-filter="bhairava_ashtami"]').click();
  await expect(page.locator('#upcoming-list .event-card').first()).toHaveAttribute('data-cat', 'bhairava_ashtami');
  await page.locator('#upcoming-list .event-card').first().click();
  await expect(page.locator('#event-modal')).toBeVisible();
  await expect(page.locator('#modal-title')).toHaveText('Kala Bhairava Ashtami');
}

module.exports = {
  freezeCalendarNow,
  gotoCalendar,
  openFirstBhairavaEvent,
};
