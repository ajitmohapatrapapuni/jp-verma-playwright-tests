#!/usr/bin/env node
/**
 * smokeTest.js
 * Runs only the 5 most critical checks in under 60 seconds.
 * Run this: before every deployment, after every code merge.
 *
 * Usage: node scripts/smokeTest.js
 */
import { execSync } from 'child_process';

console.log('\n🔥  Running Smoke Tests (critical paths only)...\n');

try {
  execSync(
    'npx playwright test ' +
    '--grep "TC-ADM-001|TC-M-001|TC-OLD-001|TC-DSH-001|TC-NF-003" ' +
    '--project=chromium ' +
    '--reporter=list',
    { stdio: 'inherit' }
  );
  console.log('\n✅  Smoke tests passed — safe to proceed.\n');
} catch {
  console.log('\n❌  Smoke tests FAILED — do NOT deploy. Run: npm run report\n');
  process.exit(1);
}
