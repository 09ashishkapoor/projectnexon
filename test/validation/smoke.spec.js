const { test, expect } = require('@playwright/test');
const { gotoCalendar, openFirstBhairavaEvent } = require('./helpers');

test.describe('calendar smoke flows', () => {
  test('renders the calendar shell with upcoming events and yearly sections', async ({ page }) => {
    await gotoCalendar(page);

    await expect(page.locator('.filter-btn')).toHaveCount(5);
    await expect(page.locator('.year-section')).toHaveCount(5);
    await expect(page.locator('#export-btn')).toContainText('Export Calendar');
  });

  test('filters the calendar down to eclipse events only', async ({ page }) => {
    await gotoCalendar(page);
    await page.locator('.filter-btn[data-filter="eclipse"]').click();

    const categories = await page.locator('.event-card').evaluateAll((cards) =>
      cards.map((card) => card.getAttribute('data-cat'))
    );

    expect(categories.length).toBeGreaterThan(0);
    expect(new Set(categories)).toEqual(new Set(['lunar_eclipse', 'solar_eclipse']));
  });

  test('opens a representative event and exports both calendar download flows', async ({ page }) => {
    await gotoCalendar(page);

    const fullExport = page.waitForEvent('download');
    await page.locator('#export-btn').click();
    const download = await fullExport;

    expect(download.suggestedFilename()).toBe('upasana-calendar.ics');
  });

  test('exports the selected Bhairava event from the detail modal', async ({ page }) => {
    await gotoCalendar(page);
    await openFirstBhairavaEvent(page);

    await expect(page.locator('#modal-links a')).toHaveCount(3);

    const singleEventDownload = page.waitForEvent('download');
    await page.locator('#modal-ics-btn').click();
    const download = await singleEventDownload;

    expect(download.suggestedFilename()).toBe('kala_bhairava_ashtami.ics');
  });
});
