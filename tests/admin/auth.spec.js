/**
 * ADMIN AUTHENTICATION — Enhanced with step screenshots
 */
import { test, expect } from '@playwright/test';
import { adminLogin, verifyProtectedRoute, screenshotStep } from '../../utils/helpers.js';
import { ADMIN_CREDS, ROUTES } from '../../utils/constants.js';

test.describe('Admin Authentication', () => {

  test('TC-ADM-001 | valid credentials → dashboard', async ({ page }, testInfo) => {
    await page.goto(ROUTES.adminLogin);
    await screenshotStep(page, testInfo, 'Login page loaded');
    await adminLogin(page);
    await screenshotStep(page, testInfo, 'After login');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('TC-ADM-002 | wrong password → error shown', async ({ page }, testInfo) => {
    await page.goto(ROUTES.adminLogin);
    await page.getByLabel(/email/i).fill(ADMIN_CREDS.email);
    await page.getByLabel(/password/i).fill('WrongPass9999!');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await screenshotStep(page, testInfo, 'After wrong password attempt');

    await expect(page).not.toHaveURL(/dashboard/);
    await expect(page.locator('[class*="error"], [role="alert"]').first()).toBeVisible();
  });

  test('TC-ADM-003 | non-existent email → generic error', async ({ page }, testInfo) => {
    await page.goto(ROUTES.adminLogin);
    await page.getByLabel(/email/i).fill('nobody@nowhere.com');
    await page.getByLabel(/password/i).fill('anypass');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await screenshotStep(page, testInfo, 'Non-existent user attempt');

    await expect(page).not.toHaveURL(/dashboard/);
    const errText = await page.locator('[class*="error"], [role="alert"]').first().textContent();
    expect(errText).not.toMatch(/email not found|no account|user does not exist/i);
  });

  test('TC-ADM-004 | empty fields → validation', async ({ page }, testInfo) => {
    await page.goto(ROUTES.adminLogin);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await screenshotStep(page, testInfo, 'Submitted empty login form');
    await expect(page.locator('[class*="error"], [aria-invalid="true"], :invalid').first()).toBeVisible();
  });

  test('TC-ADM-006 | logout → session ends', async ({ page }, testInfo) => {
    await adminLogin(page);
    await page.getByRole('button', { name: /logout|sign out/i })
      .or(page.getByText(/logout/i)).first().click();
    await screenshotStep(page, testInfo, 'After logout');
    await expect(page).toHaveURL(/login/);
    await page.goBack();
    await expect(page).toHaveURL(/login/);
  });

  test('TC-ADM-007 | dashboard blocked when logged out', async ({ page }, testInfo) => {
    await verifyProtectedRoute(page, ROUTES.dashboard);
    await screenshotStep(page, testInfo, 'Redirected to login');
  });

  test('TC-NF-003 | site uses HTTPS', async ({ page }) => {
    await page.goto(ROUTES.adminLogin);
    expect(page.url()).toMatch(/^https:\/\//);
  });

  test('TC-NF-005 | all admin routes protected when logged out', async ({ page }, testInfo) => {
    for (const route of [ROUTES.courseTypes, ROUTES.students, ROUTES.reports]) {
      await page.goto(route);
      await page.waitForURL(/login/, { timeout: 8_000 });
      await screenshotStep(page, testInfo, `Protected: ${route}`);
      expect(page.url()).toContain('login');
    }
  });

});
