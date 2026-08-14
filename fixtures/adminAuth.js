/**
 * fixtures/adminAuth.js
 *
 * Extends Playwright's base test with an `adminPage` fixture that is
 * already logged in. Authentication state is stored once and reused
 * across the entire test run — no repeated login round-trips.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/adminAuth.js';
 *   test('some admin test', async ({ adminPage }) => { ... });
 */

import { test as base, expect } from '@playwright/test';
import { adminLogin } from '../utils/helpers.js';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.resolve('fixtures/.auth/admin.json');

export { expect };

export const test = base.extend({
  // storageState is set globally from the saved auth file (when it exists)
  storageState: async ({}, use) => {
    if (fs.existsSync(AUTH_FILE)) {
      await use(AUTH_FILE);
    } else {
      await use(undefined);
    }
  },

  /**
   * `adminPage` — a Page that is already authenticated.
   * On the very first run it logs in fresh and saves the session.
   * Subsequent tests reuse the stored cookies/localStorage.
   */
  adminPage: async ({ browser }, use) => {
    if (!fs.existsSync(AUTH_FILE)) {
      // First run: log in and save state
      fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
      const ctx  = await browser.newContext();
      const page = await ctx.newPage();
      await adminLogin(page);
      await ctx.storageState({ path: AUTH_FILE });
      await use(page);
      await ctx.close();
    } else {
      // Subsequent runs: restore saved session
      const ctx  = await browser.newContext({ storageState: AUTH_FILE });
      const page = await ctx.newPage();
      await use(page);
      await ctx.close();
    }
  },
});
