const { test, expect } = require('@playwright/test');
const { freezeCalendarNow } = require('./helpers');

function byName(resources, name) {
  return resources.find((resource) => resource.name === name);
}

test('homepage app shell stays within repo-specific performance budgets', async ({ page }) => {
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com/, (route) => route.abort());
  await freezeCalendarNow(page);
  await page.goto('/', { waitUntil: 'networkidle' });

  await expect(page.locator('#upcoming-list .event-card')).toHaveCount(8);

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const firstPartyResources = performance.getEntriesByType('resource')
      .filter((entry) => entry.name.startsWith(window.location.origin))
      .map((entry) => ({
        name: entry.name.replace(window.location.origin + '/', ''),
        decodedBodySize: entry.decodedBodySize,
        transferSize: entry.transferSize,
        duration: entry.duration,
      }));
    const paintEntries = Object.fromEntries(
      performance.getEntriesByType('paint').map((entry) => [entry.name, entry.startTime])
    );

    return {
      domContentLoaded: navigation.domContentLoadedEventEnd,
      loadEventEnd: navigation.loadEventEnd,
      firstContentfulPaint: paintEntries['first-contentful-paint'] || 0,
      totalDecodedBytes: firstPartyResources.reduce((total, resource) => total + resource.decodedBodySize, 0),
      resources: firstPartyResources,
    };
  });

  const appScript = byName(metrics.resources, 'app.js');
  const eventData = byName(metrics.resources, 'events.json');
  const heroImage = byName(metrics.resources, 'uywjs16z45454.webp');

  expect(appScript).toBeTruthy();
  expect(eventData).toBeTruthy();
  expect(heroImage).toBeTruthy();

  expect(metrics.firstContentfulPaint).toBeLessThan(400);
  expect(metrics.domContentLoaded).toBeLessThan(350);
  expect(metrics.loadEventEnd).toBeLessThan(450);
  expect(metrics.totalDecodedBytes).toBeLessThan(275_000);
  expect(appScript.decodedBodySize).toBeLessThan(16_000);
  expect(eventData.decodedBodySize).toBeLessThan(140_000);
  expect(heroImage.decodedBodySize).toBeLessThan(85_000);
});
