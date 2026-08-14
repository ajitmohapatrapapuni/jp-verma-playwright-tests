#!/usr/bin/env node
/**
 * generateReport.js
 * Reads test-results/results.json and prints a colour-coded summary
 * in under 30 seconds every morning.
 *
 * Usage:  node scripts/generateReport.js
 */
import fs   from 'fs';
import path from 'path';

const RESULTS_FILE = 'test-results/results.json';
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m';
const B = '\x1b[34m', W = '\x1b[37m', X = '\x1b[0m', BOLD = '\x1b[1m';

if (!fs.existsSync(RESULTS_FILE)) {
  console.log(`${R}No results found. Run: npm test${X}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
let total=0, passed=0, failed=0, skipped=0, flaky=0;
const failures=[], moduleMap={};

for (const suite of raw.suites ?? []) {
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      total++;
      const status = t.results?.[0]?.status ?? 'unknown';
      const retry  = t.results?.length > 1;
      if (status==='passed' && !retry) passed++;
      else if (status==='passed' && retry) { passed++; flaky++; }
      else if (status==='skipped') skipped++;
      else {
        failed++;
        failures.push({
          title: spec.title,
          file:  suite.title,
          error: t.results?.[0]?.error?.message ?? 'Unknown error',
          shots: (t.results?.[0]?.attachments ?? []).filter(a=>a.contentType==='image/png').map(a=>a.path),
        });
      }
      const mod = path.basename(suite.title ?? 'unknown','.spec.js');
      moduleMap[mod] = moduleMap[mod] ?? {p:0,f:0,s:0};
      if (status==='passed') moduleMap[mod].p++;
      else if (status==='skipped') moduleMap[mod].s++;
      else moduleMap[mod].f++;
    }
  }
}

const passRate = total>0 ? ((passed/total)*100).toFixed(1) : 0;
const runTime  = raw.stats?.duration ? `${(raw.stats.duration/1000).toFixed(1)}s` : 'unknown';

console.log(`\n${BOLD}════════════════════════════════════════════════`);
console.log(`  JP Verma Fee Collection — Test Report`);
console.log(`════════════════════════════════════════════════${X}`);
console.log(`  ${W}Date     :${X} ${new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}`);
console.log(`  ${W}Duration :${X} ${runTime}`);
console.log(`  ${W}Total    :${X} ${BOLD}${total}${X} tests`);
console.log(`  ${G}Passed   :${X} ${BOLD}${passed}${X}  (${G}${passRate}%${X})`);
console.log(`  ${R}Failed   :${X} ${BOLD}${failed}${X}`);
console.log(`  ${Y}Skipped  :${X} ${BOLD}${skipped}${X}`);
if(flaky) console.log(`  ${Y}Flaky    :${X} ${BOLD}${flaky}${X}  (passed on retry — investigate)`);

console.log(`\n${BOLD}── By Module ────────────────────────────────────${X}`);
for (const [mod,{p,f,s}] of Object.entries(moduleMap)) {
  const icon = f>0 ? `${R}✗${X}` : `${G}✓${X}`;
  const fl   = f>0 ? `${R}${f} fail${X}` : `${f} fail`;
  console.log(`  ${icon} ${mod.padEnd(30)} ${G}${p} pass${X}  ${fl}  ${s} skip`);
}

if (failures.length>0) {
  console.log(`\n${BOLD}${R}── Failures (fix these today) ───────────────────${X}`);
  failures.forEach((f,i)=>{
    console.log(`\n  ${BOLD}${i+1}. ${f.title}${X}`);
    console.log(`     File  : ${f.file}`);
    console.log(`     Error : ${R}${f.error.split('\n')[0].substring(0,120)}${X}`);
    if(f.shots.length){
      console.log(`     Screenshots:`);
      f.shots.forEach(s=>console.log(`        📸 ${s}`));
    }
  });
  console.log(`\n  ${B}Full report:${X}  npm run report`);
} else {
  console.log(`\n  ${G}${BOLD}✅  All tests passed! Nothing to fix today.${X}`);
}
console.log('');
