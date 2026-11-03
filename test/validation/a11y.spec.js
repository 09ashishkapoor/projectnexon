const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { gotoCalendar, openFirstBhairavaEvent } = require('./helpers');

function summarizeViolations(violations) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.length,
  }));
}

test('critical calendar flow stays free of axe violations', async ({ page }) => {
  await gotoCalendar(page);

  const pageResults = await new AxeBuilder({ page }).analyze();
  expect(summarizeViolations(pageResults.violations)).toEqual([]);

  await openFirstBhairavaEvent(page);

  const modalResults = await new AxeBuilder({ page })
    .include('#event-modal .modal-box')
    .analyze();

  expect(summarizeViolations(modalResults.violations)).toEqual([]);
});
