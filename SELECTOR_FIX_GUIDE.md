# Selector Fix Guide — Beginner ke liye
## Jab test fail ho "Element not found" error se

---

## Step 1: Browser mein actual selector dhundho

### Method: Right-click → Inspect
1. Chrome mein admin portal kholkar login karo
2. Jo element fail hua, uske upar right-click karo
3. "Inspect" ya "Inspect Element" click karo
4. Blue highlight hoga HTML mein — wohi element hai

### Method: Playwright Codegen (BEST METHOD)
Terminal mein type karo:
```
npx playwright codegen https://jp-verma-fee-collection.klaimify.workers.dev/admin/login
```
Browser khulega. Tum jo bhi click karoge, automatically selector code generate hoga!
Copy karo aur paste karo apni test file mein.

---

## Step 2: Common selectors — kaise identify karo

### INPUT FIELD dhundhne ka tarika:
HTML mein kuch aisa dikhega:
```html
<input type="email" placeholder="Enter email" />
<input id="username" name="email" />
<label>Email Address <input /></label>
```

Playwright selector:
```js
page.locator('input[type="email"]')           // type se dhundho
page.getByPlaceholder('Enter email')           // placeholder se
page.getByLabel('Email Address')               // label se
page.locator('#username')                      // id se
page.locator('[name="email"]')                 // name attribute se
```

### BUTTON dhundhne ka tarika:
HTML mein:
```html
<button>+ CREATE COURSE TYPE</button>
<button type="submit">Login</button>
<button class="btn-primary">Save</button>
```

Playwright:
```js
page.getByRole('button', { name: /create/i })  // text se (case insensitive)
page.locator('button[type="submit"]')           // type se
page.locator('.btn-primary')                    // class se
```

### DELETE ICON dhundhne ka tarika:
Screenshot mein trash icon dikh raha tha. Usually:
```html
<button aria-label="Delete">🗑️</button>
<button class="delete-btn"><svg>...</svg></button>
```

Playwright:
```js
row.locator('[aria-label="Delete"]')
row.locator('button').last()   // row ka last button mostly delete hota hai
row.locator('.delete-btn')
```

---

## Step 3: Is file mein kya kya fix karna hai

### A. constants.js — ROUTES confirm karo
```
1. Browser mein admin login karo
2. Har page pe jaao (Course Types, Students, etc.)
3. URL bar se path copy karo
4. constants.js mein update karo
```

Har route ka URL check karo:
- Course Types: /admin/masters/course-types ← screenshot se confirm ✅
- Login page: browser mein dekho
- Dashboard: login ke baad URL copy karo
- Students, Reports etc: menu se click karke URL dekho

### B. helpers.js — Login selectors
Login page kholke Inspect karo:
- Email input ka `type`, `id`, `name`, ya `placeholder` dekho
- Password input dhundho
- Login button ka exact text dekho

### C. Delete button selector (most likely to break)
Course Types page pe:
1. Existing record ke paas trash icon pe hover karo
2. Right-click → Inspect
3. HTML copy karo
4. helpers.js mein `deleteMasterRecord` function update karo

---

## Step 4: Test chalao — ek ek karke

```bash
# PEHLE sirf login test:
npm run test:auth -- --headed --project=chromium

# Browser mein dekhna hai kya ho raha hai ↑ (--headed flag)

# PHIR sirf ek master:
npx playwright test tests/masters/mastersCRUD.spec.js --headed --grep "Course Type" --project=chromium

# Sab theek hai to full masters:
npm run test:masters
```

---

## Step 5: Selector debug karne ka tarika

Agar test fail ho, terminal mein ye command chalaao:
```bash
npx playwright test tests/admin/auth.spec.js --debug
```
"Debug mode" mein step by step chalega. Har step pe ruko aur dekho.

---

## Common Failures aur unka fix

| Error | Matlab | Fix |
|-------|--------|-----|
| `Timeout waiting for URL /dashboard` | Login nahi hua | ADMIN_EMAIL/PASSWORD .env mein check karo |
| `locator('input[type="email"]') → 0 elements` | Email field ka type alag hai | Inspect karo, actual attribute dekho |
| `Expected element to be visible` | Element nahi mila | Codegen se selector dhundho |
| `Timeout waiting for URL /login` | Route wrong hai | Browser mein URL check karo |
| `net::ERR_CONNECTION_REFUSED` | Server down hai | Site manually kholke check karo |

---

## Fastest way to fix ANY selector

```bash
npx playwright codegen https://jp-verma-fee-collection.klaimify.workers.dev/admin
```

1. Login karo
2. Jo element test karna hai use click/type karo
3. Right side mein selector auto-generate hoga
4. Copy karo → test file mein paste karo
