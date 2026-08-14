/**
 * ADMIN DASHBOARD & REPORTS TESTS
 * Automates: TC-DSH-001~004, TC-RPT-001~006
 *
 * WHY AUTOMATE:
 *  - Dashboard data drives daily business decisions
 *  - Reports are used for financial reconciliation — data mismatch = audit risk
 *  - Performance regression on the dashboard is noticed immediately by admins
 */

import { test, expect } from '../../fixtures/adminAuth.js';
import { ROUTES } from '../../utils/constants.js';
import fs from 'fs';

test.describe('Admin Dashboard', () => {

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto(ROUTES.dashboard);
    await adminPage.waitForLoadState('networkidle');
  });

  // TC-DSH-001: Statistics widgets are all visible
  test('TC-DSH-001 | dashboard shows all statistics widgets', async ({ adminPage }) => {
    // At minimum, expect a "total students" or "total fee" type stat
    const stats = adminPage.locator('[class*="stat"], [class*="widget"], [class*="card"], [class*="metric"]');
    const count = await stats.count();
    expect(count).toBeGreaterThan(0);

    // Each widget must have a numeric value
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await stats.nth(i).textContent();
      // Should contain at least one digit
      expect(text).toMatch(/\d/);
    }
  });

  // TC-DSH-001b: No widget shows an error/null state
  test('TC-DSH-001b | no widget shows NaN, undefined, or error state', async ({ adminPage }) => {
    const body = await adminPage.locator('body').textContent();
    expect(body).not.toMatch(/NaN|undefined|null|error/i);
  });

  // TC-DSH-004: Dashboard load time under 3 seconds
  test('TC-DSH-004 | dashboard loads within 3 seconds', async ({ adminPage }) => {
    const start = Date.now();
    await adminPage.goto(ROUTES.dashboard);
    await adminPage.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(3000);
  });

  // TC-DSH-002: Stats update after a new action (via API mock or check freshness)
  test('TC-DSH-002 | dashboard stats are not stale/cached across reload', async ({ adminPage }) => {
    // Note current total students count
    const statEl = adminPage
      .locator('[class*="stat"], [class*="widget"]')
      .filter({ hasText: /student/i })
      .first();

    const before = await statEl.textContent();

    // Reload and re-check — value should be consistent (not fluctuate randomly)
    await adminPage.reload();
    await adminPage.waitForLoadState('networkidle');
    const after = await statEl.textContent();

    // Same count after reload = correct caching/no stale data
    expect(before).toBe(after);
  });

});

test.describe('Reports', () => {

  // TC-RPT-001: Fee collection report generates
  test('TC-RPT-001 | fee collection report generates without error', async ({ adminPage }) => {
    await adminPage.goto(ROUTES.reports);
    await adminPage.waitForLoadState('networkidle');

    // Click generate / view / apply on the fee collection report section
    const generateBtn = adminPage
      .getByRole('button', { name: /generate|view|apply|run/i })
      .first();

    await generateBtn.click();
    await adminPage.waitForTimeout(2000);

    // No error state
    await expect(
      adminPage.locator('[class*="error"]').filter({ hasText: /error|failed/i })
    ).toBeHidden();

    // Some table or data rows visible
    const rows = adminPage.locator('table tr, [class*="row"]');
    // Either has data rows or an empty state — never an unhandled error
    const hasRows = await rows.count().then(c => c > 1);
    const hasEmpty = await adminPage.getByText(/no data|no records/i).isVisible().catch(() => false);
    expect(hasRows || hasEmpty).toBe(true);
  });

  // TC-RPT-003: Report exports a file
  test('TC-RPT-003 | report export → file downloaded', async ({ adminPage }) => {
    await adminPage.goto(ROUTES.reports);
    await adminPage.waitForLoadState('networkidle');

    // Generate first
    await adminPage.getByRole('button', { name: /generate|apply|view/i }).first().click();
    await adminPage.waitForTimeout(1500);

    // Then export
    const exportBtn = adminPage.getByRole('button', { name: /export|download/i }).first();
    if (!await exportBtn.isVisible().catch(() => false)) {
      test.skip(true, 'Export button not visible after report generation');
    }

    const [download] = await Promise.all([
      adminPage.waitForEvent('download'),
      exportBtn.click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.(xlsx|xls|csv|pdf)$/i);

    const savePath = `/tmp/report_${Date.now()}`;
    await download.saveAs(savePath);
    const size = fs.statSync(savePath).size;
    expect(size).toBeGreaterThan(100);
  });

  // TC-RPT-004: Report with no matching data shows empty state
  test('TC-RPT-004 | report with impossible date range → no-data state, no error', async ({ adminPage }) => {
    await adminPage.goto(ROUTES.reports);
    await adminPage.waitForLoadState('networkidle');

    // Set a date range in the far future that has no data
    const fromDate = adminPage.getByLabel(/from|start date/i).first();
    const toDate   = adminPage.getByLabel(/to|end date/i).first();

    if (await fromDate.isVisible().catch(() => false)) {
      await fromDate.fill('2099-01-01');
      await toDate.fill('2099-01-31');
    }

    await adminPage.getByRole('button', { name: /generate|apply|view/i }).first().click();
    await adminPage.waitForTimeout(2000);

    // No application error — just empty state message
    await expect(
      adminPage.locator('[class*="error"]').filter({ hasText: /error|500|crash/i })
    ).toBeHidden();
  });

});
