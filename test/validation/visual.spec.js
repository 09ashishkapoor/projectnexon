const { test, expect } = require('@playwright/test');
const { gotoCalendar, openFirstBhairavaEvent } = require('./helpers');

test.describe('stable visual surfaces', () => {
  test('header shell stays visually consistent', async ({ page }) => {
    await gotoCalendar(page);

    await expect(page.locator('header.site-header')).toHaveScreenshot('header-shell.png', {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    });
  });

  test('upcoming section stays visually consistent', async ({ page }) => {
    await gotoCalendar(page);

    await expect(page.locator('#upcoming-section')).toHaveScreenshot('upcoming-section.png', {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    });
  });

  test('event detail modal stays visually consistent', async ({ page }) => {
    await gotoCalendar(page);
    await openFirstBhairavaEvent(page);

    await expect(page.locator('.modal-box')).toHaveScreenshot('bhairava-modal.png', {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    });
  });
});
