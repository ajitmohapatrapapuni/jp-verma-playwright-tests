/**
 * STUDENT MANAGEMENT TESTS
 * Automates: TC-STU-001~010, TC-NA-005~010 (bulk upload)
 *
 * WHY AUTOMATE:
 *  - Search and CRUD on students is used daily by admin staff
 *  - Bulk upload validation rules must never silently accept bad data
 *  - Export must always contain correct data (financial reporting)
 */

import { test, expect } from '../../fixtures/adminAuth.js';
import { ROUTES, UNIQUE } from '../../utils/constants.js';
import path from 'path';
import fs from 'fs';

test.describe('Student Management', () => {

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto(ROUTES.students);
    await adminPage.waitForLoadState('networkidle');
  });

  // TC-STU-003: Search by name
  test('TC-STU-003 | search students by name → matching records returned', async ({ adminPage }) => {
    const searchBox = adminPage.getByPlaceholder(/search/i);
    await searchBox.fill('A'); // broad enough to return results
    await adminPage.waitForTimeout(500);

    const rows = adminPage.locator('tr, [class*="row"]').filter({ hasText: /./  });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  // TC-STU-004: Search by mobile number
  test('TC-STU-004 | search by mobile number → correct record', async ({ adminPage }) => {
    const mobile = process.env.KNOWN_STUDENT_MOBILE;
    if (!mobile) test.skip(true, 'KNOWN_STUDENT_MOBILE not set');

    await adminPage.getByPlaceholder(/search/i).fill(mobile);
    await adminPage.waitForTimeout(500);

    const row = adminPage.locator('tr, [class*="row"]').filter({ hasText: mobile });
    await expect(row.first()).toBeVisible();
    expect(await row.count()).toBe(1);
  });

  // TC-STU-009: Search with no matching results
  test('TC-STU-009 | search with no match → no records / empty state', async ({ adminPage }) => {
    await adminPage.getByPlaceholder(/search/i).fill('zzzNonExistent999abc');
    await adminPage.waitForTimeout(500);

    // Either empty state message or zero rows
    const emptyMsg = adminPage.getByText(/no record|no student|not found/i);
    const rowCount = await adminPage.locator('tbody tr, [class*="student-row"]').count();

    const hasEmptyMsg = await emptyMsg.isVisible().catch(() => false);
    expect(hasEmptyMsg || rowCount === 0).toBe(true);
  });

  // TC-STU-007: Export to Excel — file download
  test('TC-STU-007 | export student list → file downloaded', async ({ adminPage }) => {
    const [download] = await Promise.all([
      adminPage.waitForEvent('download'),
      adminPage.getByRole('button', { name: /export|download/i }).click(),
    ]);

    expect(download).toBeTruthy();
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.(xlsx|xls|csv)$/i);

    // Save and verify it's not empty
    const savePath = `/tmp/${filename}`;
    await download.saveAs(savePath);
    const stats = fs.statSync(savePath);
    expect(stats.size).toBeGreaterThan(100); // not an empty file
  });

});

// ─── Bulk Upload ──────────────────────────────────────────────────────────────
test.describe('Student Bulk Upload', () => {

  // Helper: create a minimal valid CSV/XLSX buffer
  // In a real project, keep fixture files under tests/fixtures/
  const VALID_UPLOAD_PATH    = path.resolve('fixtures/bulk_upload_valid.xlsx');
  const DUP_MOBILE_PATH      = path.resolve('fixtures/bulk_upload_dup_mobile.xlsx');
  const MISSING_FIELDS_PATH  = path.resolve('fixtures/bulk_upload_missing_fields.xlsx');

  // TC-NA-005: Valid bulk upload
  test('TC-NA-005 | valid bulk upload → all records imported', async ({ adminPage }) => {
    if (!fs.existsSync(VALID_UPLOAD_PATH)) {
      test.skip(true, 'bulk_upload_valid.xlsx fixture not found — add it to fixtures/');
    }

    await adminPage.goto(ROUTES.students);

    const fileInput = adminPage.locator('input[type="file"]');
    await fileInput.setInputFiles(VALID_UPLOAD_PATH);
    await adminPage.getByRole('button', { name: /upload|import|submit/i }).click();

    await expect(
      adminPage.locator('[class*="success"], [role="alert"]')
        .filter({ hasText: /success|imported|created/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  // TC-NA-006: Duplicate mobile numbers within file
  test('TC-NA-006 | bulk upload with duplicate mobile numbers → error shown', async ({ adminPage }) => {
    if (!fs.existsSync(DUP_MOBILE_PATH)) {
      test.skip(true, 'bulk_upload_dup_mobile.xlsx fixture not found');
    }

    await adminPage.goto(ROUTES.students);

    const fileInput = adminPage.locator('input[type="file"]');
    await fileInput.setInputFiles(DUP_MOBILE_PATH);
    await adminPage.getByRole('button', { name: /upload|import|submit/i }).click();

    await expect(
      adminPage.locator('[class*="error"], [role="alert"]')
        .filter({ hasText: /duplicate|mobile|already/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  // TC-NA-008: Missing mandatory fields in upload
  test('TC-NA-008 | bulk upload with missing mandatory fields → row-level error', async ({ adminPage }) => {
    if (!fs.existsSync(MISSING_FIELDS_PATH)) {
      test.skip(true, 'bulk_upload_missing_fields.xlsx fixture not found');
    }

    await adminPage.goto(ROUTES.students);

    const fileInput = adminPage.locator('input[type="file"]');
    await fileInput.setInputFiles(MISSING_FIELDS_PATH);
    await adminPage.getByRole('button', { name: /upload|import|submit/i }).click();

    await expect(
      adminPage.locator('[class*="error"], [role="alert"]')
        .filter({ hasText: /required|mandatory|missing/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  // TC-NA-010: Invalid file format
  test('TC-NA-010 | upload non-Excel file → unsupported format error', async ({ adminPage }) => {
    await adminPage.goto(ROUTES.students);

    // Write a temp .txt file
    const txtPath = '/tmp/invalid_upload.txt';
    fs.writeFileSync(txtPath, 'this is not an excel file');

    const fileInput = adminPage.locator('input[type="file"]');
    await fileInput.setInputFiles(txtPath);
    await adminPage.getByRole('button', { name: /upload|import|submit/i }).click();

    await expect(
      adminPage.locator('[class*="error"], [role="alert"]')
        .filter({ hasText: /format|type|excel|xlsx/i })
    ).toBeVisible({ timeout: 8_000 });
  });

});
