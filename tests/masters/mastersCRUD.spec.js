/**
 * MASTERS CRUD — Enhanced with screenshots on every key step
 * Factory pattern: one loop generates tests for all 10 masters
 */
import { test, expect } from '@playwright/test';
import {
  goToMaster, addMasterRecord, deleteMasterRecord,
  searchMaster, getRecordsCount, screenshotStep,
} from '../../utils/helpers.js';
import { ROUTES, UNIQUE, XSS_PAYLOAD, WHITESPACE_INPUT, LONG_STRING } from '../../utils/constants.js';

const MASTERS = [
  { name: 'Course Type',      route: ROUTES.courseTypes      },
  { name: 'Branch',           route: ROUTES.branches         },
  { name: 'Course',           route: ROUTES.courses          },
  { name: 'Fee Head',         route: ROUTES.feeHeads         },
  { name: 'Sub Fee Head',     route: ROUTES.subFeeHeads      },
  { name: 'Academic Year',    route: ROUTES.academicYears    },
  { name: 'Batch',            route: ROUTES.batches          },
  { name: 'Elective Subject', route: ROUTES.electiveSubjects },
  { name: 'Caste',            route: ROUTES.castes           },
  { name: 'Gender',           route: ROUTES.genders          },
];

function masterSuite({ name, route }) {
  test.describe(`Masters CRUD – ${name}`, () => {

    test.beforeEach(async ({ page }) => {
      await goToMaster(page, route);
    });

    // ── TC-M-001: Add valid record ───────────────────────────────────────────
    test(`TC-M-001 | add ${name} → appears in list`, async ({ page }, testInfo) => {
      const recordName = `Auto_${name.replace(/ /g,'_')}${UNIQUE()}`;
      const before = await getRecordsCount(page);

      await screenshotStep(page, testInfo, 'Before adding record');
      await addMasterRecord(page, recordName);
      await screenshotStep(page, testInfo, 'After adding record');

      await expect(page.getByText(recordName)).toBeVisible();
      expect(await getRecordsCount(page)).toBe(before + 1); // TC-M-004

      await deleteMasterRecord(page, recordName); // cleanup
    });

    // ── TC-M-018: Empty name ─────────────────────────────────────────────────
    test(`TC-M-018 | empty name → validation error`, async ({ page }, testInfo) => {
      const before = await getRecordsCount(page);
      await page.getByRole('button', { name: /create/i }).click();
      await screenshotStep(page, testInfo, 'After clicking Create with empty name');

      await expect(
        page.locator('[class*="error"], [aria-invalid="true"], :invalid').first()
      ).toBeVisible();
      expect(await getRecordsCount(page)).toBe(before);
    });

    // ── TC-M-019: Duplicate name ─────────────────────────────────────────────
    test(`TC-M-019 | duplicate ${name} → rejected`, async ({ page }, testInfo) => {
      const recordName = `Dup_${name.replace(/ /g,'_')}${UNIQUE()}`;
      await addMasterRecord(page, recordName);
      const before = await getRecordsCount(page);

      // Try same name again
      const input = page.getByPlaceholder(/e\.g\./i).or(page.getByLabel(/type name|name/i)).first();
      await input.fill(recordName);
      await page.getByRole('button', { name: /create/i }).click();
      await screenshotStep(page, testInfo, 'Duplicate submission attempt');

      await expect(
        page.locator('[class*="error"], [role="alert"]').first()
      ).toBeVisible();
      expect(await getRecordsCount(page)).toBe(before);

      await deleteMasterRecord(page, recordName);
    });

    // ── TC-M-021: Whitespace only ────────────────────────────────────────────
    test(`TC-M-021 | whitespace-only name → validation error`, async ({ page }, testInfo) => {
      const input = page.getByPlaceholder(/e\.g\./i).or(page.getByLabel(/type name|name/i)).first();
      await input.fill(WHITESPACE_INPUT);
      await page.getByRole('button', { name: /create/i }).click();
      await screenshotStep(page, testInfo, 'Whitespace submission');

      await expect(
        page.locator('[class*="error"], [aria-invalid="true"]').first()
      ).toBeVisible();
    });

    // ── TC-M-020: Long name ──────────────────────────────────────────────────
    test(`TC-M-020 | 300-char name → rejected or truncated`, async ({ page }, testInfo) => {
      const input = page.getByPlaceholder(/e\.g\./i).or(page.getByLabel(/type name|name/i)).first();
      await input.fill(LONG_STRING);
      await page.getByRole('button', { name: /create/i }).click();
      await screenshotStep(page, testInfo, 'Long string submission');

      const errorVisible = await page
        .locator('[class*="error"], [aria-invalid="true"]').first()
        .isVisible().catch(() => false);
      if (!errorVisible) {
        await expect(page.getByText(LONG_STRING)).toBeHidden();
      }
    });

    // ── TC-M-008: Delete record ──────────────────────────────────────────────
    test(`TC-M-008 | delete ${name} → removed, count decrements`, async ({ page }, testInfo) => {
      const recordName = `Del_${name.replace(/ /g,'_')}${UNIQUE()}`;
      await addMasterRecord(page, recordName);
      const before = await getRecordsCount(page);
      await screenshotStep(page, testInfo, 'Before delete');

      await deleteMasterRecord(page, recordName);
      await screenshotStep(page, testInfo, 'After delete');

      await expect(page.getByText(recordName)).toBeHidden();
      expect(await getRecordsCount(page)).toBe(before - 1);
    });

    // ── TC-M-009: Confirm prompt before delete ───────────────────────────────
    test(`TC-M-009 | delete ${name} shows confirm prompt`, async ({ page }, testInfo) => {
      const recordName = `ConfDel_${name.replace(/ /g,'_')}${UNIQUE()}`;
      await addMasterRecord(page, recordName);

      const row = page.locator('tr, li, [class*="row"]').filter({ hasText: recordName }).first();
      await row.locator('[aria-label*="delete"], button').last().click();
      await screenshotStep(page, testInfo, 'After clicking delete icon');

      const confirmed =
        await page.getByRole('dialog').isVisible().catch(() => false) ||
        await page.getByRole('button', { name: /confirm|yes|ok/i }).isVisible().catch(() => false);
      expect(confirmed).toBe(true);

      const cancel = page.getByRole('button', { name: /cancel|no/i });
      if (await cancel.isVisible().catch(() => false)) await cancel.click();
      else await page.keyboard.press('Escape');

      await expect(page.getByText(recordName)).toBeVisible();
      await deleteMasterRecord(page, recordName);
    });

    // ── TC-M-012: Exact search ───────────────────────────────────────────────
    test(`TC-M-012 | search exact name → only that record shown`, async ({ page }, testInfo) => {
      const recordName = `Search_${name.replace(/ /g,'_')}${UNIQUE()}`;
      await addMasterRecord(page, recordName);

      const results = await searchMaster(page, recordName);
      await screenshotStep(page, testInfo, 'Search results');

      await expect(results.first()).toBeVisible();
      expect(await results.count()).toBe(1);

      await deleteMasterRecord(page, recordName);
    });

    // ── TC-M-015: Clear search restores list ─────────────────────────────────
    test(`TC-M-015 | clear search → full list restored`, async ({ page }, testInfo) => {
      const search = page.getByPlaceholder(/search/i);
      await search.fill('zzz_no_match_xyz');
      await page.waitForTimeout(400);
      await screenshotStep(page, testInfo, 'Filtered to no results');

      await search.clear();
      await page.waitForTimeout(400);
      await screenshotStep(page, testInfo, 'After clearing search');

      expect(await getRecordsCount(page)).toBeGreaterThan(0);
    });

    // ── TC-M-024: Layout desktop ─────────────────────────────────────────────
    test(`TC-M-024 | layout correct on desktop`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 1366, height: 768 });
      await goToMaster(page, route);
      await screenshotStep(page, testInfo, 'Desktop layout');

      await expect(page.getByRole('button', { name: /create/i })).toBeVisible();
      await expect(page.getByText(/existing/i)).toBeVisible();
    });

    // ── TC-M-025: Responsive mobile ──────────────────────────────────────────
    test(`TC-M-025 | responsive on mobile (375px)`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await goToMaster(page, route);
      await screenshotStep(page, testInfo, 'Mobile layout');

      const bodyWidth  = await page.evaluate(() => document.body.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(innerWidth + 10);
      await expect(page.getByRole('button', { name: /create/i })).toBeVisible();
    });

    // ── TC-M-029: Double-click protection ────────────────────────────────────
    test(`TC-M-029 | double-click create → only one record`, async ({ page }, testInfo) => {
      const recordName = `DblClick_${name.replace(/ /g,'_')}${UNIQUE()}`;
      const before = await getRecordsCount(page);

      const input = page.getByPlaceholder(/e\.g\./i).or(page.getByLabel(/type name|name/i)).first();
      await input.fill(recordName);
      await page.getByRole('button', { name: /create/i }).dblclick();
      await page.waitForTimeout(1500);
      await screenshotStep(page, testInfo, 'After double-click');

      expect(await getRecordsCount(page)).toBe(before + 1); // not before+2
      await deleteMasterRecord(page, recordName);
    });

    // ── TC-M-030: XSS injection ──────────────────────────────────────────────
    test(`TC-M-030 | XSS in name field → not executed`, async ({ page }, testInfo) => {
      let alertFired = false;
      page.on('dialog', async d => { alertFired = true; await d.dismiss(); });

      const input = page.getByPlaceholder(/e\.g\./i).or(page.getByLabel(/type name|name/i)).first();
      await input.fill(XSS_PAYLOAD);
      await page.getByRole('button', { name: /create/i }).click();
      await page.waitForTimeout(1000);
      await screenshotStep(page, testInfo, 'After XSS submission');

      expect(alertFired).toBe(false);
      const html = await page.evaluate(() => document.body.innerHTML);
      expect(html).not.toContain('<script>alert');
    });

    // ── TC-M-032: Protected route ─────────────────────────────────────────────
    test(`TC-M-032 | ${name} URL blocked when logged out`, async ({ browser }) => {
      const ctx  = await browser.newContext(); // fresh, no auth
      const page = await ctx.newPage();
      await page.goto(route);
      await page.waitForURL(/login/, { timeout: 8_000 });
      expect(page.url()).toContain('login');
      await ctx.close();
    });

  });
}

for (const master of MASTERS) {
  masterSuite(master);
}
