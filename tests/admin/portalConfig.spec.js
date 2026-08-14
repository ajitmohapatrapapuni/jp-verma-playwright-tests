/**
 * PORTAL LOGIN CONFIGURATION TESTS
 * Automates: TC-PLC-001 to TC-PLC-004
 *
 * WHY AUTOMATE:
 *  - Toggle logic directly controls which login types students see
 *  - Easy to accidentally regress a toggle state during deployments
 *  - Cross-portal verification (admin change → student portal effect) is repetitive manually
 */

import { test, expect } from '../../fixtures/adminAuth.js';
import { ROUTES } from '../../utils/constants.js';

test.describe('Portal Login Configuration', () => {

  const LOGIN_TYPES = ['New Admission', 'Old Student', 'Private'];

  for (const loginType of LOGIN_TYPES) {

    test(`TC-PLC-002 | disable "${loginType}" → hidden on student portal`, async ({ adminPage, browser }) => {
      await adminPage.goto(ROUTES.portalConfig);
      await adminPage.waitForLoadState('networkidle');

      // Find the toggle/checkbox for this login type
      const toggle = adminPage.locator('[class*="toggle"], input[type="checkbox"], button[role="switch"]')
        .filter({ hasText: new RegExp(loginType, 'i') })
        .or(adminPage.locator(`text="${loginType}"`).locator('..').locator('input, button[role="switch"]'))
        .first();

      // Read current state — ensure it's enabled before we disable
      const isEnabled = await toggle.isChecked().catch(() => null);
      if (isEnabled === false) {
        await toggle.click(); // turn on first
        await adminPage.waitForTimeout(500);
      }

      // Disable it
      await toggle.click();
      await adminPage.getByRole('button', { name: /save|apply|update/i }).click().catch(() => {}); // some UIs auto-save
      await adminPage.waitForTimeout(800);

      // Verify on student portal (separate context)
      const ctx  = await browser.newContext();
      const studentPage = await ctx.newPage();
      await studentPage.goto(ROUTES.studentPortal);
      await studentPage.waitForLoadState('networkidle');

      await expect(
        studentPage.getByText(new RegExp(loginType, 'i'))
      ).toBeHidden();

      await ctx.close();

      // Restore: re-enable the login type so other tests aren't broken
      await toggle.click();
      await adminPage.getByRole('button', { name: /save|apply|update/i }).click().catch(() => {});
    });

    test(`TC-PLC-001 | enable "${loginType}" → visible on student portal`, async ({ adminPage, browser }) => {
      await adminPage.goto(ROUTES.portalConfig);
      await adminPage.waitForLoadState('networkidle');

      const toggle = adminPage.locator('[class*="toggle"], input[type="checkbox"], button[role="switch"]')
        .filter({ hasText: new RegExp(loginType, 'i') })
        .or(adminPage.locator(`text="${loginType}"`).locator('..').locator('input, button[role="switch"]'))
        .first();

      // Ensure disabled first
      const isEnabled = await toggle.isChecked().catch(() => null);
      if (isEnabled !== false) {
        await toggle.click();
        await adminPage.waitForTimeout(500);
      }

      // Enable it
      await toggle.click();
      await adminPage.getByRole('button', { name: /save|apply|update/i }).click().catch(() => {});
      await adminPage.waitForTimeout(800);

      // Student portal should show the option
      const ctx  = await browser.newContext();
      const studentPage = await ctx.newPage();
      await studentPage.goto(ROUTES.studentPortal);
      await studentPage.waitForLoadState('networkidle');

      await expect(
        studentPage.getByText(new RegExp(loginType, 'i')).first()
      ).toBeVisible();

      await ctx.close();
    });

  }

  // TC-PLC-004: Change reflects without redeployment (immediate)
  test('TC-PLC-004 | config change reflects immediately without redeploy', async ({ adminPage, browser }) => {
    await adminPage.goto(ROUTES.portalConfig);
    await adminPage.waitForLoadState('networkidle');

    // Disable Old Student
    const toggle = adminPage.locator('[class*="toggle"], input[type="checkbox"], button[role="switch"]')
      .filter({ hasText: /old student/i })
      .or(adminPage.locator('text="Old Student"').locator('..').locator('input, button[role="switch"]'))
      .first();

    await toggle.click();
    await adminPage.getByRole('button', { name: /save|apply/i }).click().catch(() => {});

    // Immediately check student portal — no sleep/redeploy
    const ctx = await browser.newContext();
    const p   = await ctx.newPage();
    await p.goto(ROUTES.studentPortal);
    // Old Student should be hidden NOW
    await expect(p.getByText(/old student/i)).toBeHidden({ timeout: 5_000 });
    await ctx.close();

    // Restore
    await toggle.click();
    await adminPage.getByRole('button', { name: /save|apply/i }).click().catch(() => {});
  });

});
