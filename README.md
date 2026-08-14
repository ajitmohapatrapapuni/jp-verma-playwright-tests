# JP Verma Fee Collection — Playwright Test Suite

**URL:** https://jp-verma-fee-collection.klaimify.workers.dev  
**Framework:** Playwright + JavaScript (ESM)

---


## 📁 Project Structure

```
pw-tests/
├── playwright.config.js          # Browsers, baseURL, timeouts, reporters
├── package.json                  # npm scripts
├── fixtures/
│   ├── adminAuth.js              # Saved login session fixture (no re-login per test)
│   ├── .auth/admin.json          # Auto-generated on first run (gitignored)
│   ├── bulk_upload_valid.xlsx    # Add your own Excel fixture
│   ├── bulk_upload_dup_mobile.xlsx
│   └── bulk_upload_missing_fields.xlsx
├── utils/
│   ├── constants.js              # URLs, credentials, test data
│   └── helpers.js                # adminLogin, addMasterRecord, deleteMasterRecord, etc.
└── tests/
    ├── admin/
    │   ├── auth.spec.js          # TC-ADM-001~007, TC-NF-003/005
    │   ├── dashboard.spec.js     # TC-DSH-001~004, TC-RPT-001~006
    │   ├── portalConfig.spec.js  # TC-PLC-001~004
    │   ├── admissionBuffer.spec.js # TC-BUF-001~007
    │   └── studentManagement.spec.js # TC-STU-003~010, TC-NA-005~010
    ├── masters/
    │   └── mastersCRUD.spec.js   # TC-M-001~032 × all 10 masters (factory pattern)
    └── student/
        └── registration.spec.js  # TC-OLD-001~011, TC-PVT-001~004, TC-NA-015
```

---

## 🚀 Setup

```bash
# 1. Install dependencies
npm install

# 2. Install browsers
npx playwright install --with-deps chromium firefox

# 3. Create a .env file with your credentials
cp .env.example .env
# Then edit .env
```

### .env file
```env
ADMIN_EMAIL=admin@jpverma.ac.in
ADMIN_PASSWORD=your_admin_password
KNOWN_STUDENT_MOBILE=9876543210        # a student mobile that exists in staging DB
BUFFER_TEST_REG_NO=REG2024001          # a student who paid within buffer
BUFFER_TEST_EXPIRED_REG_NO=REG2024002  # a student whose buffer has expired
```

---

## 🧪 Running Tests

```bash
# Run everything
npm test

# Run by module
npm run test:auth
npm run test:masters
npm run test:students
npm run test:dashboard
npm run test:buffer
npm run test:portal

# Run with browser visible (debug mode)
npm run test:headed

# View HTML report after run
npm run report
```

---

## 💡 Key Design Decisions

**Session reuse via `adminAuth.js` fixture**  
The first test logs in and saves the browser session to `fixtures/.auth/admin.json`.
All subsequent tests restore that session instantly. This cuts ~2s per test.

**Factory pattern for Masters**  
`mastersCRUD.spec.js` loops over all 10 masters and generates identical test suites.
Adding a new master = adding one object to the `MASTERS` array.

**UNIQUE() suffix for test data**  
Every record created during tests uses `_test_${Date.now()}` in its name to avoid
conflicts with real data or parallel test runs.

**Auto-cleanup**  
Every test that creates a master record deletes it at the end. No test pollution between runs.

**`test.skip()` for env-dependent tests**  
Tests that need real student records (buffer, bulk upload) skip gracefully when
the required environment variables aren't set.
