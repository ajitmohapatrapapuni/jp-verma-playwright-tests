import { test as setup } from '@playwright/test';
import { ADMIN_CREDS, ROUTES } from '../utils/constants.js';
import fs   from 'fs';
import path from 'path';

const AUTH_FILE = 'fixtures/.auth/admin.json';

setup('admin login and save session', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto(
    `https://jp-verma-fee-collection.klaimify.workers.dev${ROUTES.adminLogin}`
  );

  await page.getByPlaceholder('ADM-XXXX').fill(ADMIN_CREDS.email);
  await page.locator('input[type="password"]').fill(ADMIN_CREDS.password);
  await page.getByRole('button', { name: /authenticate/i }).click();

  await page.waitForURL(/dashboard/, { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
  console.log('✅ Session saved!');
});