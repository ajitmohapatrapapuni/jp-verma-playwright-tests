# 🧪 Beginner's Guide — JP Verma Playwright Test Suite
**For: QA Engineers new to automation**

---

## 🤔 What is this and why does it exist?

This is an automated test suite. Instead of YOU clicking through the website
every day to check it still works, the computer does it for you.

You write instructions once ("click Login, check the dashboard appears").
The computer follows those instructions on every run — in seconds.

**You run it. It reports what broke. You fix the code or raise a bug.**

---

## 💻 One-time Setup (do this only once)

### Step 1 — Install Node.js
Download from https://nodejs.org → install the LTS version → restart your computer.

Verify it worked:
```
node --version    → should show v18 or higher
npm --version     → should show a version number
```

### Step 2 — Open a terminal in the project folder
- Windows: Right-click inside the `pw-tests` folder → "Open in Terminal"
- Mac: Right-click → "New Terminal at Folder"

### Step 3 — Install everything
```bash
npm install
npx playwright install --with-deps chromium firefox
```
This installs Playwright and real browsers. Takes 3-5 minutes once.

### Step 4 — Create your credentials file
Create a file called `.env` in the `pw-tests` folder with this content:
```
ADMIN_EMAIL=admin@jpverma.ac.in
ADMIN_PASSWORD=your_actual_password
KNOWN_STUDENT_MOBILE=9876543210
```
⚠️ Never share or commit this file. It contains your password.

---

## 🚀 How to Run Tests

Open the terminal inside `pw-tests` and type:

| Command | What it does | When to run |
|---------|-------------|-------------|
| `npm test` | Runs ALL tests (takes ~10 min) | End of day, before/after deployment |
| `npm run test:smoke` | Runs 5 critical checks only (~60 sec) | Every morning, after any fix |
| `npm run test:auth` | Only login/logout tests | When login page changed |
| `npm run test:masters` | All 10 masters (Course Type, Branch, etc.) | When any master module changed |
| `npm run test:students` | Student upload/search tests | When student management changed |
| `npm run test:dashboard` | Dashboard & reports | When dashboard/reports changed |
| `npm run test:headed` | Runs with browser visible | When debugging a failing test |
| `npm run report` | Opens beautiful HTML report | After any test run |
| `npm run summary` | Quick coloured summary in terminal | Quick check |

---

## 📅 When Should You Run Tests?

### Every morning (takes 60 seconds):
```bash
npm run test:smoke
```
Checks: Login works ✓ | A master can be added ✓ | Dashboard loads ✓

If smoke passes → proceed with manual testing for the day.
If smoke fails → something broke overnight. Raise a bug immediately.

### After every code deployment / bug fix:
```bash
npm test
```
Full run. Check the report for any regressions.

### Before handing over a build to the client:
```bash
npm test
npm run report
```
Share the HTML report as evidence of testing.

### When the developer says "I changed the fee structure module":
```bash
npm run test:masters
npm run test:students
```
Run only the affected modules — faster than the full suite.

---

## 📊 Reading the Report

After running tests, run:
```bash
npm run report
```
A browser window opens showing the test report. Here's what to look at:

```
✅ Green = PASSED   (everything worked)
❌ Red   = FAILED   (something broke — needs investigation)
⚠️ Yellow = FLAKY   (passed on retry — watch this test)
```

### When a test FAILS, click on it in the report. You will see:

1. **Error message** — what went wrong (e.g. "Expected element to be visible")
2. **Screenshot** — exact screenshot of the screen at the moment of failure
3. **Video** — full video replay of the test from start to failure
4. **Trace** — step-by-step timeline (click "Trace" tab)

**Use the screenshot first** — it usually tells you immediately what failed.

---

## 🖼️ Screenshot Guide — What to Look For

Screenshots are automatically saved when a test fails.
They are in: `test-results/` folder and inside the HTML report.

| What you see in screenshot | What it means |
|---------------------------|---------------|
| Login page instead of dashboard | Session expired or login broke |
| Empty list when record should exist | Add/create API failed |
| Error toast / red message on screen | Validation or server error |
| Blank/white page | Page crashed or slow load |
| Wrong page URL | Redirect broken |

---

## ❌ When a Test Fails — Step-by-Step Action

```
1. Open the HTML report:    npm run report
2. Click the failed test
3. Look at the screenshot → understand WHAT was on screen
4. Look at the error message → understand WHAT check failed
5. Try manually on the website:
      - Can you reproduce the failure manually?
      - YES → It's a real bug → raise a defect in your tracker
      - NO  → It might be a test selector issue → tell the dev
6. Write the defect with: TC ID, screenshot, steps, expected vs actual
```

---

## 💡 Tips for Beginners

**Q: The test ran fine yesterday but fails today. Why?**
A: Something changed in the app. Run manually to check. If it fails manually too → raise a bug.

**Q: Many tests fail at once. What happened?**
A: Usually means login broke OR the server is down. Run `npm run test:auth` first.
If login fails → everything fails. Fix login first.

**Q: The test says "Element not found". What does that mean?**
A: The test was looking for a button/text/input that wasn't on the page.
Either the page didn't load, or a developer renamed/moved that UI element.
Open headed mode to watch: `npm run test:headed`

**Q: Test passes sometimes and fails sometimes (flaky).**
A: Check the video. Usually means the page was slow to load.
Note it as "flaky" and tell the dev — it might indicate a performance issue.

**Q: How do I skip a test that I know is broken?**
A: Add `test.skip()` at the top of the test temporarily while it's being fixed.

---

## 📋 Daily QA Checklist (5 minutes each morning)

```
□ 1. Run smoke tests:       npm run test:smoke
□ 2. All 5 pass? ✅ Good. Start manual testing.
□ 3. Any failure? ❌ Open report, check screenshot, raise bug.
□ 4. Check yesterday's full report (if run): npm run report
□ 5. Any FLAKY tests? Note them — tell the dev.
```

---

## 🔧 Full Weekly Schedule

| Day | Action | Command |
|-----|--------|---------|
| Monday | Full regression run | `npm test` |
| Tuesday–Thursday | Smoke every morning | `npm run test:smoke` |
| Friday | Full run before weekend | `npm test` then `npm run report` |
| Before any release | Full run + HTML report | `npm test && npm run report` |
| After developer pushes fix | Run affected module | e.g. `npm run test:masters` |

---

## 📁 Important Files

```
pw-tests/
├── .env                        ← Your credentials (never share this)
├── test-results/               ← Screenshots & videos from failures
│   └── *.png                   ← Failure screenshots live here
├── playwright-report/          ← HTML report (open with npm run report)
├── tests/
│   ├── admin/auth.spec.js      ← Login tests
│   ├── masters/mastersCRUD.spec.js  ← All 10 masters
│   ├── admin/dashboard.spec.js ← Dashboard & reports
│   ├── admin/admissionBuffer.spec.js ← Buffer management
│   └── student/registration.spec.js  ← Student flows
├── utils/helpers.js            ← Shared functions (don't touch unless needed)
└── utils/constants.js          ← URLs and test data
```

---

## 🆘 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `Cannot find module` | Run `npm install` again |
| `browserType.launch: Executable doesn't exist` | Run `npx playwright install chromium` |
| `AUTH_FILE not found` | Delete `fixtures/.auth/` and re-run; setup will log in fresh |
| `Timeout waiting for URL /dashboard` | Check admin password in `.env` |
| `Connection refused` | Check if the site https://jp-verma-fee-collection.klaimify.workers.dev is up |
| All tests fail on first run | Delete `fixtures/.auth/admin.json` and run `npm test` again |

