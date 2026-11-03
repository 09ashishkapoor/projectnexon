const { test, expect } = require('@playwright/test');
const { gotoCalendar, openFirstBhairavaEvent } = require('./helpers');

test.describe('calendar smoke flows', () => {
  test('renders the calendar shell with upcoming events and yearly sections', async ({ page }) => {
    await gotoCalendar(page);

    await expect(page.locator('.filter-btn')).toHaveCount(5);
    await expect(page.locator('.year-section')).toHaveCount(5);
    await expect(page.locator('#export-btn')).toContainText('Export Calendar');
    await expect(page.locator('#filter-result')).toHaveText('Showing all 162 dates');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://calendar.jaikhyapaparampara.com/'
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      'https://calendar.jaikhyapaparampara.com/og-image.png'
    );
  });

  test('filters expose state and scope the export label', async ({ page }) => {
    await gotoCalendar(page);

    const eclipseFilter = page.locator('.filter-btn[data-filter="eclipse"]');
    await eclipseFilter.click();

    await expect(eclipseFilter).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.filter-btn[data-filter="all"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#filter-result')).toHaveText('Showing 24 dates for eclipse');
    await expect(page.locator('#export-btn')).toContainText('Export filtered (24)');
  });

  test('modal traps focus, restores it to the card, and makes the background inert', async ({ page }) => {
    await gotoCalendar(page);
    await page.locator('.filter-btn[data-filter="bhairava_ashtami"]').click();

    const card = page.locator('#upcoming-list .event-card').first();
    await card.click();

    const modal = page.locator('#event-modal');
    const closeBtn = page.locator('#modal-close');
    const icsBtn = page.locator('#modal-ics-btn');
    await expect(modal).toBeVisible();
    await expect(page.locator('.filter-bar')).toHaveJSProperty('inert', true);

    await icsBtn.focus();
    await page.keyboard.press('Tab');
    await expect(closeBtn).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(icsBtn).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(card).toBeFocused();
    await expect(page.locator('.filter-bar')).toHaveJSProperty('inert', false);
  });

  test('eclipse detail shows IST and UTC greatest-eclipse times', async ({ page }) => {
    await gotoCalendar(page);
    await page.locator('.filter-btn[data-filter="eclipse"]').click();
    await page.locator('#upcoming-list .event-card').first().click();

    await expect(page.locator('#modal-desc')).toContainText(/IST/);
    await expect(page.locator('#modal-desc')).toContainText(/UTC/);
  });

  test('serves real SEO, icon, privacy, and crawler files', async ({ page }) => {
    await gotoCalendar(page);

    for (const [path, expectedType] of [
      ['/robots.txt', 'text/plain'],
      ['/sitemap.xml', 'xml'],
      ['/favicon.ico', 'image/'],
      ['/manifest.json', 'application/json'],
      ['/og-image.png', 'image/png'],
      ['/privacy.html', 'text/html'],
    ]) {
      const response = await page.request.get(path);
      expect(response.ok(), path).toBeTruthy();
      expect(response.headers()['content-type'], path).toContain(expectedType);
    }

    await page.goto('/privacy.html');
    await expect(page.getByRole('heading', { name: /privacy/i })).toBeVisible();
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
