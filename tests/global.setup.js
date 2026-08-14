/**
 * global.setup.js
 * Runs ONCE before all tests.
 * Logs in as Admin and saves the session to fixtures/.auth/admin.json
 * Every test project then restores this session — no repeated logins.
 */
import { chromium } from '@playwright/test';
import { ADMIN_CREDS, ROUTES } from '../utils/constants.js';
import fs   from 'fs';
import path from 'path';

const AUTH_FILE = 'fixtures/.auth/admin.json';

export default async function globalSetup() {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page    = await context.newPage();

  console.log('\n🔐  Global setup: logging in as admin...');
  await page.goto(`https://jp-verma-fee-collection.klaimify.workers.dev${ROUTES.adminLogin}`);

  await page.getByLabel(/email/i).fill(ADMIN_CREDS.email);
  await page.getByLabel(/password/i).fill(ADMIN_CREDS.password);
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 15_000 });

  await context.storageState({ path: AUTH_FILE });
  console.log('✅  Session saved to', AUTH_FILE);

  await browser.close();
}
