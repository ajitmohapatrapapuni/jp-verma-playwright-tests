// helpers.js — Reusable functions (ye mat badlo jab tak zarurat na ho)
import { expect } from '@playwright/test';
import { ADMIN_CREDS, ROUTES } from './constants.js';

// ─── Admin Login ──────────────────────────────────────────────────────────────
// Agar login fail ho to yahan selectors fix karo
export async function adminLogin(page) {
  await page.goto(ROUTES.adminLogin);
  await page.waitForLoadState('networkidle');

  // ── EMAIL FIELD ──────────────────────────────────────────────────────────
  // Browser mein: login page → right-click on email box → Inspect
  // type="email" wala input dhundho
  const emailField = page.locator('input[type="email"]')
    .or(page.getByLabel(/email/i))
    .or(page.getByPlaceholder(/email/i))
    .first();

  // ── PASSWORD FIELD ───────────────────────────────────────────────────────
  const passwordField = page.locator('input[type="password"]')
    .or(page.getByLabel(/password/i))
    .first();

  // ── SUBMIT BUTTON ────────────────────────────────────────────────────────
  // Agar button ka text "Login" nahi hai to yahan change karo
  const loginBtn = page.getByRole('button', { name: /login|sign in|submit/i })
    .or(page.locator('button[type="submit"]'))
    .first();

  await emailField.fill(ADMIN_CREDS.email);
  await passwordField.fill(ADMIN_CREDS.password);
  await loginBtn.click();

  // Login ke baad kahan jaata hai? Dashboard URL yahan check hoga
  // Agar URL /dashboard nahi hai, browser mein dekho aur ROUTES.dashboard update karo
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
}

// ─── Master Page Navigation ───────────────────────────────────────────────────
export async function goToMaster(page, route) {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
}

// ─── Add Master Record ────────────────────────────────────────────────────────
// Screenshot mein dikh raha tha: input field has placeholder "e.g. UG, PG, Diploma, Certificate"
// Aur button text hai "+ CREATE COURSE TYPE"
export async function addMasterRecord(page, name) {
  // INPUT FIELD — screenshot se confirm: placeholder "e.g. UG, PG, Diploma..."
  const input = page
    .getByPlaceholder(/e\.g\./i)          // ← ye screenshot se match karta hai ✅
    .or(page.getByLabel(/type name/i))     // fallback
    .first();

  await input.clear();
  await input.fill(name);

  // BUTTON — screenshot mein dikh raha tha "+ CREATE COURSE TYPE"
  const createBtn = page
    .getByRole('button', { name: /create/i }) // ← ye match karega ✅
    .first();

  await createBtn.click();

  // Record list mein aana chahiye
  await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 });
  return name;
}

// ─── Delete Master Record ─────────────────────────────────────────────────────
// Screenshot mein: trash icon hai Actions column mein
export async function deleteMasterRecord(page, name) {
  // Us row ko dhundho jisme name ho
  const row = page.locator('tr, li, [class*="row"]')
    .filter({ hasText: name })
    .first();

  // TRASH ICON — screenshot mein SVG trash icon dikh raha tha
  // Agar ye fail ho, browser mein: row pe right-click → Inspect → icon ka selector dekho
  const deleteBtn = row.locator('button').last()  // usually last button in row is delete
    .or(row.locator('[aria-label*="delete" i]'))
    .or(row.locator('button:has(svg)').last());

  await deleteBtn.click();

  // Confirm dialog aata hai? (screenshot se confirm nahi hua)
  const confirmBtn = page.getByRole('button', { name: /confirm|yes|ok|delete/i });
  if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await confirmBtn.click();
  }

  // Record gayab ho jaana chahiye
  await expect(page.getByText(name)).toBeHidden({ timeout: 8_000 });
}

// ─── Records Count Badge ──────────────────────────────────────────────────────
// Screenshot mein: "4 RECORDS" badge dikh raha tha (orange color)
export async function getRecordsCount(page) {
  const badge = page.getByText(/\d+\s+records/i); // ← "4 RECORDS" match karega ✅
  const text  = await badge.textContent().catch(() => '0');
  return parseInt(text?.match(/\d+/)?.[0] ?? '0', 10);
}

// ─── Search ───────────────────────────────────────────────────────────────────
// Screenshot mein: "Search course types..." placeholder dikh raha tha
export async function searchMaster(page, term) {
  const search = page.getByPlaceholder(/search/i); // ← match karega ✅
  await search.clear();
  await search.fill(term);
  await page.waitForTimeout(500); // debounce ke liye wait
  return page.locator('tr, li, [class*="row"]').filter({ hasText: term });
}

// ─── Screenshot Helper ────────────────────────────────────────────────────────
// Ye har important step pe screenshot lega (report mein dikhega)
export async function screenshotStep(page, testInfo, label) {
  try {
    const shot = await page.screenshot({ fullPage: true });
    await testInfo.attach(`📸 ${label}`, { body: shot, contentType: 'image/png' });
  } catch {
    // screenshot fail hone pe test fail nahi hona chahiye
  }
}

// ─── Protected Route Check ────────────────────────────────────────────────────
export async function verifyProtectedRoute(page, route) {
  await page.goto(route);
  await page.waitForURL(/login/, { timeout: 8_000 });
  expect(page.url()).toContain('login');
}
