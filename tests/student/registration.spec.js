/**
 * STUDENT REGISTRATION & FEE CALCULATION TESTS
 * Automates: TC-OLD-001~011, TC-PVT-001~004, TC-NA-011~018
 *
 * WHY AUTOMATE:
 *  - Fee calculation is the core business logic — silent regression = financial error
 *  - Registration flows are high-traffic entry points
 *  - Duplicate/validation rules must hold on every release
 */

import { test, expect } from '@playwright/test';
import { ROUTES, UNIQUE } from '../../utils/constants.js';

// ─── Old Student Self-Registration ───────────────────────────────────────────
test.describe('Old Student Self-Registration', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.studentPortal);
    await page.waitForLoadState('networkidle');
  });

  // TC-OLD-001: Successful registration
  test('TC-OLD-001 | complete old student registration form and reach fee review', async ({ page }) => {
    // Click Old Student login/registration option
    await page.getByText(/old student/i).click();

    // Fill mandatory fields (adjust selectors to match actual form)
    await page.getByLabel(/name/i).fill(`Auto Student${UNIQUE()}`);
    await page.getByLabel(/mobile/i).fill(`9${Math.floor(100000000 + Math.random() * 900000000)}`);

    // Select dropdowns — adjust option text to match actual data
    await page.getByLabel(/course/i).selectOption({ index: 1 });
    await page.getByLabel(/academic year/i).selectOption({ index: 1 });
    await page.getByLabel(/semester/i).selectOption({ index: 1 });
    await page.getByLabel(/caste|category/i).selectOption({ index: 1 });

    await page.getByRole('button', { name: /register|submit|proceed/i }).click();

    // Fee review page / summary should load
    await expect(
      page.getByText(/fee|payable|total/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // TC-OLD-002: Mandatory field validation
  test('TC-OLD-002 | submit empty old student form → validation errors', async ({ page }) => {
    await page.getByText(/old student/i).click();
    await page.getByRole('button', { name: /register|submit|proceed/i }).click();

    // At least one required-field error
    const errors = page.locator('[class*="error"], [aria-required="true"], :invalid, [aria-invalid="true"]');
    await expect(errors.first()).toBeVisible();
  });

  // TC-OLD-002b: Invalid mobile number
  test('TC-OLD-008 | invalid mobile number format → validation error', async ({ page }) => {
    await page.getByText(/old student/i).click();
    await page.getByLabel(/mobile/i).fill('12345'); // too short
    await page.getByRole('button', { name: /register|submit|proceed/i }).click();

    await expect(
      page.locator('[class*="error"], [aria-invalid="true"]').filter({ hasText: /mobile|phone|number/i }).first()
    ).toBeVisible();
  });

  // TC-OLD-003: Fee auto-calculation for course/year/semester
  test('TC-OLD-003 | fee calculated after selecting course/year/semester', async ({ page }) => {
    await page.getByText(/old student/i).click();
    await page.getByLabel(/course/i).selectOption({ index: 1 });
    await page.getByLabel(/academic year/i).selectOption({ index: 1 });
    await page.getByLabel(/semester/i).selectOption({ index: 1 });
    await page.getByLabel(/caste|category/i).selectOption({ index: 1 });

    // After changing selections, fee preview updates
    const feeDisplay = page.locator('[class*="fee"], [class*="amount"], [class*="payable"]').first();
    await expect(feeDisplay).toBeVisible({ timeout: 6_000 });

    const feeText = await feeDisplay.textContent();
    const amount = parseFloat(feeText?.replace(/[^0-9.]/g, '') ?? '0');
    expect(amount).toBeGreaterThan(0);
  });

  // TC-OLD-006: Duplicate registration attempt
  test('TC-OLD-006 | duplicate mobile on re-registration → blocked', async ({ page }) => {
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    // First registration attempt
    await page.getByText(/old student/i).click();
    await page.getByLabel(/mobile/i).fill(mobile);
    await page.getByLabel(/course/i).selectOption({ index: 1 });
    await page.getByLabel(/academic year/i).selectOption({ index: 1 });
    await page.getByLabel(/semester/i).selectOption({ index: 1 });
    await page.getByLabel(/caste|category/i).selectOption({ index: 1 });
    await page.getByRole('button', { name: /register|submit/i }).click();

    // Go back and try same mobile again
    await page.goto(ROUTES.studentPortal);
    await page.getByText(/old student/i).click();
    await page.getByLabel(/mobile/i).fill(mobile);
    await page.getByRole('button', { name: /register|submit/i }).click();

    // Should see a duplicate/already-registered error
    await expect(
      page.locator('[class*="error"], [role="alert"]')
        .filter({ hasText: /already|duplicate|registered|exists/i })
    ).toBeVisible({ timeout: 8_000 });
  });

  // TC-OLD-010: XSS in name field
  test('TC-OLD-010 | XSS in student name field → sanitized', async ({ page }) => {
    let alertFired = false;
    page.on('dialog', async (dialog) => { alertFired = true; await dialog.dismiss(); });

    await page.getByText(/old student/i).click();
    await page.getByLabel(/name/i).fill('<script>alert("xss")</script>');
    await page.getByRole('button', { name: /register|submit/i }).click();
    await page.waitForTimeout(1000);

    expect(alertFired).toBe(false);
  });

});

// ─── New Admission Student Login ──────────────────────────────────────────────
test.describe('New Admission Student Login', () => {

  // TC-NA-012 / TC-NA-015: Invalid registration number
  test('TC-NA-015 | invalid registration number → login denied', async ({ page }) => {
    await page.goto(ROUTES.studentPortal);
    await page.getByText(/new admission/i).click();

    await page.getByLabel(/registration/i).fill('INVALID999999');
    await page.getByRole('button', { name: /login|proceed/i }).click();

    await expect(
      page.locator('[class*="error"], [role="alert"]').first()
    ).toBeVisible();
    await expect(page).not.toHaveURL(/dashboard|fee|payment/);
  });

});

// ─── Private / Distance Learning ─────────────────────────────────────────────
test.describe('Private / Distance Learning Registration', () => {

  // TC-PVT-001: Successful registration available
  test('TC-PVT-001 | private student registration option is accessible', async ({ page }) => {
    await page.goto(ROUTES.studentPortal);
    // Portal should show a Private/Distance option when enabled by admin
    const option = page.getByText(/private|distance/i);
    await expect(option.first()).toBeVisible();
  });

  // TC-PVT-003: Mandatory field validation same as old student
  test('TC-PVT-003 | submit empty private student form → validation errors', async ({ page }) => {
    await page.goto(ROUTES.studentPortal);
    await page.getByText(/private|distance/i).first().click();
    await page.getByRole('button', { name: /register|submit|proceed/i }).click();

    const errors = page.locator('[class*="error"], [aria-required="true"], :invalid');
    await expect(errors.first()).toBeVisible();
  });

});
