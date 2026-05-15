# Cheapestprint.co.uk Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page static lead-generation website for Cheapestprint.co.uk — a UK takeaway menu printing business — matching the design spec at `docs/superpowers/specs/2026-05-15-cheapestprint-website-design.md`.

**Architecture:** Static HTML + CSS + vanilla ES-module JavaScript. No build step. Quote form posts to Formspree. ES modules let us export pure functions for unit testing. Playwright drives the page for end-to-end behaviour tests; Vitest covers pure helpers. Deployment target is Netlify (or any static host).

**Tech Stack:**
- HTML5, CSS3 (custom properties, grid, flexbox), JavaScript (ES2020 modules)
- Google Fonts (Inter)
- Vitest (jsdom env) for unit tests
- @playwright/test for E2E tests
- http-server for local dev
- Formspree for form submission

---

## File Structure (locked in here)

```
/
├── index.html                  # Single page with all 10 sections
├── privacy.html                # Stub legal page
├── terms.html                  # Stub legal page
├── styles.css                  # All styling (organised by section, design tokens at top)
├── script.js                   # ES module: all JS, organised in clearly-labelled sections
├── package.json                # Dev tooling
├── playwright.config.js        # E2E test config + dev server
├── vitest.config.js            # Unit test config
├── netlify.toml                # Static deploy config
├── favicon.svg
├── README.md
├── assets/
│   ├── logo.svg
│   ├── menus/                  # menu-placeholder-1.jpg … menu-placeholder-6.jpg
│   └── icons/                  # truck.svg, clock.svg, brush.svg, star.svg
├── tests/
│   ├── unit/
│   │   ├── prefill.test.js     # Pricing-cell → form prefill mapping
│   │   └── validation.test.js  # Phone number validation
│   └── e2e/
│       ├── smoke.spec.js       # Page loads, title, all sections present
│       ├── nav.spec.js         # Mobile hamburger, smooth scroll, sticky shadow
│       ├── pricing.spec.js     # Table renders + cell prefill behaviour
│       ├── form.spec.js        # Form validation, submission, success state
│       ├── lightbox.spec.js    # Gallery lightbox open/close
│       └── a11y.spec.js        # Keyboard nav, focus visibility, alt text
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

**Why these boundaries:**
- `styles.css` and `script.js` stay single-file per spec; both organised internally by clearly-marked section comments.
- Tests are split between Vitest (pure logic) and Playwright (rendered behaviour) so each runs in the right environment without overlap.
- Static legal pages are their own HTML files (no JS), reachable from the footer.

---

## Task 1: Initialize project scaffold

**Files:**
- Create: `.gitignore`, `index.html`, `styles.css`, `script.js`, `README.md`
- Create directories: `assets/menus/`, `assets/icons/`, `tests/unit/`, `tests/e2e/`

- [ ] **Step 1: Initialize git repo**

Run from `/Users/junaidmalik/Desktop/Website for Takeaways`:
```bash
git init -b main
```

- [ ] **Step 2: Create `.gitignore`**

`.gitignore`:
```
node_modules/
.superpowers/
.DS_Store
dist/
.env
playwright-report/
test-results/
.vitest-cache/
```

- [ ] **Step 3: Create starter `index.html`**

`index.html`:
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cheap Takeaway Menu Printing UK · Free Design + Delivery · Cheapestprint.co.uk</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main>
    <h1>Cheapestprint.co.uk</h1>
  </main>
  <script type="module" src="script.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create starter `styles.css` and `script.js`**

`styles.css`:
```css
/* Cheapestprint.co.uk — styles. Sections added in later tasks. */
```

`script.js`:
```js
// Cheapestprint.co.uk — script. ES module. Sections added in later tasks.
```

- [ ] **Step 5: Create `README.md`**

`README.md`:
```markdown
# Cheapestprint.co.uk

Single-page lead-generation website. Static HTML / CSS / vanilla JS — no build step.

See [docs/superpowers/specs/2026-05-15-cheapestprint-website-design.md](docs/superpowers/specs/2026-05-15-cheapestprint-website-design.md) for the design spec.

## Local development

```bash
npm install
npm run dev        # serves on http://localhost:8080
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright E2E tests
```

## Deployment

Static site — deploys to Netlify. See `netlify.toml`. No build step required.
```

- [ ] **Step 6: Create empty directories**

```bash
mkdir -p assets/menus assets/icons tests/unit tests/e2e
touch assets/menus/.gitkeep assets/icons/.gitkeep tests/unit/.gitkeep tests/e2e/.gitkeep
```

- [ ] **Step 7: Initial commit**

```bash
git add .
git commit -m "chore: scaffold project files and directories"
```

---

## Task 2: Set up tooling (npm, Vitest, Playwright, http-server)

**Files:**
- Create: `package.json`, `vitest.config.js`, `playwright.config.js`
- Create: `tests/unit/sanity.test.js`, `tests/e2e/sanity.spec.js`

- [ ] **Step 1: Initialize npm**

```bash
npm init -y
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install --save-dev vitest jsdom @playwright/test http-server
npx playwright install chromium
```

- [ ] **Step 3: Replace `package.json` scripts and metadata**

Edit `package.json` so the `"name"`, `"version"`, `"description"`, `"type"`, and `"scripts"` fields look like this (leave `devDependencies` as installed):

```json
{
  "name": "cheapestprint-co-uk",
  "version": "0.1.0",
  "description": "Lead-generation website for Cheapestprint.co.uk",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "http-server -p 8080 -c-1 -o .",
    "serve": "http-server -p 8080 -c-1 .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

- [ ] **Step 4: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
  },
});
```

- [ ] **Step 5: Create `playwright.config.js`**

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile',  use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npx http-server -p 8080 -c-1 .',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 15000,
  },
});
```

- [ ] **Step 6: Write a sanity unit test**

`tests/unit/sanity.test.js`:
```js
import { describe, it, expect } from 'vitest';

describe('tooling', () => {
  it('runs vitest in jsdom', () => {
    const el = document.createElement('div');
    el.textContent = 'hello';
    expect(el.textContent).toBe('hello');
  });
});
```

- [ ] **Step 7: Run unit tests to verify Vitest works**

```bash
npm run test
```
Expected: 1 test passes.

- [ ] **Step 8: Write a sanity E2E test**

`tests/e2e/sanity.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('home page loads with correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Cheapestprint\.co\.uk/);
});
```

- [ ] **Step 9: Run E2E tests to verify Playwright + http-server works**

```bash
npm run test:e2e
```
Expected: 2 tests pass (one per project — desktop + mobile).

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "chore: set up vitest, playwright, and http-server tooling"
```

---

## Task 3: HTML skeleton, design tokens, and base styles

Establish all 10 section stubs, the design tokens (CSS custom properties), and base/reset styles. After this task the page renders empty but structured, and the design system is wired up.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `tests/e2e/smoke.spec.js`

- [ ] **Step 1: Write the failing smoke test for all 10 sections present**

Delete `tests/e2e/sanity.spec.js` and create `tests/e2e/smoke.spec.js`:
```js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('all top-level sections render', async ({ page }) => {
  const ids = [
    'top-nav',
    'hero',
    'usps',
    'pricing',
    'how-it-works',
    'gallery',
    'why-us',
    'reviews',
    'quote',
    'site-footer',
  ];
  for (const id of ids) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test('Google Font Inter is loaded', async ({ page }) => {
  const fontFamily = await page.evaluate(() =>
    getComputedStyle(document.body).fontFamily
  );
  expect(fontFamily.toLowerCase()).toContain('inter');
});

test('design tokens are defined on :root', async ({ page }) => {
  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      black: s.getPropertyValue('--c-black').trim(),
      yellow: s.getPropertyValue('--c-yellow').trim(),
      offWhite: s.getPropertyValue('--c-off-white').trim(),
    };
  });
  expect(tokens.black).toBe('#111111');
  expect(tokens.yellow).toBe('#FFD60A');
  expect(tokens.offWhite).toBe('#FAFAFA');
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npm run test:e2e -- smoke.spec.js
```
Expected: FAIL — sections do not exist, font not loaded, tokens not defined.

- [ ] **Step 3: Replace `index.html` with the full skeleton**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cheap Takeaway Menu Printing UK · Free Design + Delivery · Cheapestprint.co.uk</title>
  <meta name="description" content="10,000 full-colour takeaway menus from £425. Free design, free UK delivery, 3–5 day turnaround. 20 years' experience. Get a quote.">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap">

  <link rel="stylesheet" href="styles.css">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
</head>
<body>
  <a class="skip-link" href="#hero">Skip to content</a>

  <header id="top-nav" class="top-nav">
    <!-- Task 4 -->
  </header>

  <main>
    <section id="hero" class="hero">
      <!-- Task 6 -->
    </section>

    <section id="usps" class="usps">
      <!-- Task 7 -->
    </section>

    <section id="pricing" class="pricing">
      <!-- Tasks 8–10 -->
    </section>

    <section id="how-it-works" class="how-it-works">
      <!-- Task 11 -->
    </section>

    <section id="gallery" class="gallery">
      <!-- Task 12 -->
    </section>

    <section id="why-us" class="why-us">
      <!-- Task 14 -->
    </section>

    <section id="reviews" class="reviews">
      <!-- Task 15 -->
    </section>

    <section id="quote" class="quote">
      <!-- Tasks 16–17 -->
    </section>
  </main>

  <footer id="site-footer" class="site-footer">
    <!-- Task 18 -->
  </footer>

  <script type="module" src="script.js"></script>
</body>
</html>
```

- [ ] **Step 4: Replace `styles.css` with design tokens and base styles**

```css
/* =========================================================
   Cheapestprint.co.uk — global stylesheet
   Sections (top-to-bottom):
     1. Design tokens
     2. Resets & base typography
     3. Layout primitives (container, section)
     4. Buttons
     5. Section: top-nav      (Task 4)
     6. Section: hero          (Task 6)
     7. Section: usps          (Task 7)
     8. Section: pricing       (Tasks 8–10)
     9. Section: how-it-works  (Task 11)
    10. Section: gallery       (Task 12)
    11. Section: lightbox      (Task 13)
    12. Section: why-us        (Task 14)
    13. Section: reviews       (Task 15)
    14. Section: quote form    (Tasks 16–17)
    15. Section: footer        (Task 18)
   ========================================================= */

/* 1. Design tokens
   ------------------------------------------------------------ */
:root {
  --c-black: #111111;
  --c-yellow: #FFD60A;
  --c-yellow-soft: #FFF7C0;
  --c-white: #FFFFFF;
  --c-off-white: #FAFAFA;
  --c-grey: #E5E5E5;
  --c-text-muted: #555555;

  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-pill: 999px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-8: 48px;
  --space-10: 64px;
  --space-12: 80px;

  --shadow-sm: 0 1px 3px rgba(0,0,0,.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,.08);

  --nav-height: 64px;
  --maxw: 1120px;
}

/* 2. Resets & base typography
   ------------------------------------------------------------ */
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: var(--nav-height); }
body {
  margin: 0;
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: 16px;
  line-height: 1.55;
  color: var(--c-black);
  background: var(--c-white);
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4 { font-weight: 800; letter-spacing: -0.01em; line-height: 1.15; margin: 0 0 var(--space-3); }
h1 { font-size: clamp(34px, 6vw, 56px); font-weight: 900; letter-spacing: -0.02em; }
h2 { font-size: clamp(26px, 4vw, 38px); }
h3 { font-size: clamp(18px, 2.4vw, 22px); }
p { margin: 0 0 var(--space-3); }
a { color: inherit; }
img { max-width: 100%; display: block; }
button { font: inherit; cursor: pointer; }

.skip-link {
  position: absolute; left: -9999px; top: 0;
  background: var(--c-yellow); color: var(--c-black);
  padding: var(--space-2) var(--space-4); border-radius: 0 0 var(--radius-md) 0;
  font-weight: 800; z-index: 1000;
}
.skip-link:focus { left: 0; }

/* 3. Layout primitives
   ------------------------------------------------------------ */
.container { max-width: var(--maxw); margin: 0 auto; padding: 0 var(--space-5); }
section { padding: var(--space-12) 0; }
.section-header { text-align: center; margin-bottom: var(--space-8); }
.section-header p { color: var(--c-text-muted); max-width: 56ch; margin: 0 auto; }

/* 4. Buttons
   ------------------------------------------------------------ */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: 14px 22px; border-radius: var(--radius-pill); font-weight: 800; text-decoration: none; border: 0; transition: transform .12s ease, background .12s ease; }
.btn:hover { transform: translateY(-1px); }
.btn-primary { background: var(--c-yellow); color: var(--c-black); }
.btn-ghost   { background: transparent; color: var(--c-white); border: 1.5px solid var(--c-white); }
.btn-dark    { background: var(--c-black); color: var(--c-white); }
.btn:focus-visible { outline: 3px solid var(--c-yellow); outline-offset: 2px; }
```

- [ ] **Step 5: Run the smoke test — expect PASS**

```bash
npm run test:e2e -- smoke.spec.js
```
Expected: 6 tests pass (3 tests × 2 projects).

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add html skeleton, design tokens, and base styles"
```

---

## Task 4: Top nav (HTML + sticky CSS, static)

Static markup and sticky desktop styling for the top navigation. Mobile hamburger behaviour is added in Task 5.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `tests/e2e/nav.spec.js`

- [ ] **Step 1: Write the failing test**

`tests/e2e/nav.spec.js`:
```js
import { test, expect } from '@playwright/test';

test.describe('top nav', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('shows logo and the call-us button', async ({ page }) => {
    await expect(page.locator('.nav-logo')).toContainText(/cheapestprint/i);
    await expect(page.locator('a.nav-call')).toContainText('01274 305555');
  });

  test('desktop links include all anchors', async ({ page, viewport }) => {
    test.skip(viewport.width < 960, 'desktop-only links');
    const hrefs = await page.locator('.nav-links a').evaluateAll(
      els => els.map(e => e.getAttribute('href'))
    );
    expect(hrefs).toEqual(['#pricing', '#how-it-works', '#reviews', '#quote']);
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
npm run test:e2e -- nav.spec.js
```
Expected: FAIL (`.nav-logo` / `.nav-call` / `.nav-links` don't exist).

- [ ] **Step 3: Add the nav markup to `index.html`**

Replace the `<header id="top-nav">…</header>` block with:

```html
<header id="top-nav" class="top-nav">
  <div class="container nav-row">
    <a href="#hero" class="nav-logo" aria-label="Cheapestprint.co.uk home">
      Cheapest<span>print</span>.co.uk
    </a>

    <nav class="nav-links" aria-label="Primary">
      <a href="#pricing">Pricing</a>
      <a href="#how-it-works">How it works</a>
      <a href="#reviews">Reviews</a>
      <a href="#quote">Contact</a>
    </nav>

    <a href="tel:01274305555" class="btn btn-primary nav-call">Call 01274 305555</a>

    <button class="nav-hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="nav-overlay">
      <span></span><span></span><span></span>
    </button>
  </div>

  <div id="nav-overlay" class="nav-overlay" hidden>
    <a href="#pricing">Pricing</a>
    <a href="#how-it-works">How it works</a>
    <a href="#reviews">Reviews</a>
    <a href="#quote">Contact</a>
    <a href="tel:01274305555" class="btn btn-primary">Call 01274 305555</a>
  </div>
</header>
```

- [ ] **Step 4: Append nav styles to `styles.css`**

```css
/* 5. Section: top-nav
   ------------------------------------------------------------ */
.top-nav { position: sticky; top: 0; z-index: 100; background: var(--c-white); border-bottom: 1px solid transparent; transition: box-shadow .2s ease, border-color .2s ease; }
.top-nav.is-scrolled { box-shadow: var(--shadow-md); border-bottom-color: var(--c-grey); }
.nav-row { display: flex; align-items: center; gap: var(--space-5); height: var(--nav-height); }
.nav-logo { font-weight: 900; font-size: 18px; text-decoration: none; color: var(--c-black); letter-spacing: -0.01em; }
.nav-logo span { color: var(--c-yellow); background: var(--c-black); padding: 2px 6px; border-radius: var(--radius-sm); }
.nav-links { display: flex; gap: var(--space-5); margin-left: auto; }
.nav-links a { text-decoration: none; font-weight: 500; color: var(--c-black); }
.nav-links a:hover { color: var(--c-text-muted); }
.nav-call { padding: 10px 16px; font-size: 14px; }
.nav-hamburger { display: none; width: 40px; height: 40px; padding: 0; border: 0; background: transparent; flex-direction: column; gap: 5px; align-items: center; justify-content: center; margin-left: auto; }
.nav-hamburger span { width: 22px; height: 2px; background: var(--c-black); transition: transform .2s ease, opacity .2s ease; }
.nav-overlay { position: fixed; inset: var(--nav-height) 0 0 0; background: var(--c-black); color: var(--c-white); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-5); font-size: 22px; font-weight: 800; z-index: 99; }
.nav-overlay a { text-decoration: none; color: var(--c-white); }

@media (max-width: 960px) {
  .nav-links, .nav-call { display: none; }
  .nav-hamburger { display: flex; }
}
```

- [ ] **Step 5: Run the test — expect PASS**

```bash
npm run test:e2e -- nav.spec.js
```
Expected: 4 tests pass (2 × 2 projects, the desktop-only test skips on mobile).

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add top nav markup and sticky desktop styling"
```

---

## Task 5: Nav behaviour (mobile hamburger, sticky shadow, smooth scroll)

Wire up the JavaScript that powers the nav: hamburger toggles the overlay, the nav adds a shadow once the page is scrolled past the hero, anchor links smooth-scroll (already covered by `scroll-behavior: smooth` and `scroll-padding-top`, but we verify it works with the nav offset).

**Files:**
- Modify: `script.js`
- Modify: `tests/e2e/nav.spec.js`

- [ ] **Step 1: Add the failing tests**

Append to `tests/e2e/nav.spec.js`:
```js
test.describe('nav behaviour', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('hamburger opens and closes overlay on mobile', async ({ page, viewport }) => {
    test.skip(viewport.width >= 960, 'mobile-only');
    const overlay = page.locator('#nav-overlay');
    await expect(overlay).toBeHidden();
    await page.locator('.nav-hamburger').click();
    await expect(overlay).toBeVisible();
    await expect(page.locator('.nav-hamburger')).toHaveAttribute('aria-expanded', 'true');
    await overlay.locator('a[href="#pricing"]').click();
    await expect(overlay).toBeHidden();
  });

  test('nav gains is-scrolled class once page scrolls past hero', async ({ page }) => {
    const nav = page.locator('#top-nav');
    await expect(nav).not.toHaveClass(/is-scrolled/);
    await page.evaluate(() => window.scrollTo(0, 800));
    await expect(nav).toHaveClass(/is-scrolled/);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm run test:e2e -- nav.spec.js
```
Expected: new tests fail (no JS bound).

- [ ] **Step 3: Implement nav JS in `script.js`**

Replace the placeholder content of `script.js` with:

```js
// =========================================================
// Cheapestprint.co.uk — script.js
// Sections:
//   1. nav        (Task 5)
//   2. pricing    (Task 10)
//   3. lightbox   (Task 13)
//   4. form       (Task 17)
//   5. boot
// =========================================================

// 1. nav -------------------------------------------------
function initNav() {
  const nav = document.getElementById('top-nav');
  const burger = nav?.querySelector('.nav-hamburger');
  const overlay = document.getElementById('nav-overlay');
  if (!nav || !burger || !overlay) return;

  const setOpen = (open) => {
    overlay.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger.addEventListener('click', () => setOpen(overlay.hidden));
  overlay.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') setOpen(false);
  });

  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// 5. boot ------------------------------------------------
function boot() {
  initNav();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npm run test:e2e -- nav.spec.js
```
Expected: all nav tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: hook up mobile nav toggle and sticky-nav scroll shadow"
```

---

## Task 6: Hero section

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `tests/e2e/hero.spec.js`

- [ ] **Step 1: Failing test**

`tests/e2e/hero.spec.js`:
```js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('hero shows headline, subhead, and two CTAs', async ({ page }) => {
  const hero = page.locator('#hero');
  await expect(hero).toContainText("UK's cheapest menu printer");
  await expect(hero.locator('h1')).toContainText('10,000 A4 menus');
  await expect(hero.locator('h1')).toContainText('£425');
  await expect(hero.locator('a[href="#quote"]')).toContainText(/get my quote/i);
  const waLink = hero.locator('a[href^="https://wa.me/"]');
  await expect(waLink).toContainText(/whatsapp/i);
});

test('whatsapp link uses the configured number', async ({ page }) => {
  const href = await page.locator('#hero a[href^="https://wa.me/"]').first().getAttribute('href');
  expect(href).toBe('https://wa.me/447572574582');
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm run test:e2e -- hero.spec.js
```

- [ ] **Step 3: Add hero markup to `index.html`**

Replace the `<section id="hero">…</section>` block with:

```html
<section id="hero" class="hero">
  <div class="container hero-inner">
    <p class="hero-eyebrow">UK's cheapest menu printer · 20 years</p>
    <h1>10,000 A4 menus.<br><span class="accent">£425.</span> Delivered free.</h1>
    <p class="hero-sub">Full-colour, 130gsm, designed and delivered to your door anywhere in the UK in 3–5 days.</p>
    <div class="hero-cta">
      <a href="#quote" class="btn btn-primary">Get my quote →</a>
      <a href="https://wa.me/447572574582" class="btn btn-ghost" target="_blank" rel="noopener">
        <span aria-hidden="true">💬</span> WhatsApp us
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Append hero styles**

```css
/* 6. Section: hero
   ------------------------------------------------------------ */
.hero { background: var(--c-black); color: var(--c-white); padding: clamp(64px, 10vw, 120px) 0; }
.hero-inner { text-align: center; max-width: 820px; }
.hero-eyebrow { color: var(--c-yellow); font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: var(--space-4); }
.hero h1 { color: var(--c-white); margin-bottom: var(--space-4); }
.hero h1 .accent { color: var(--c-yellow); }
.hero-sub { color: #cccccc; font-size: clamp(15px, 1.6vw, 18px); max-width: 540px; margin: 0 auto var(--space-6); }
.hero-cta { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }
```

- [ ] **Step 5: Run — expect PASS**

```bash
npm run test:e2e -- hero.spec.js
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add hero section with headline, subhead, and CTAs"
```

---

## Task 7: USP strip

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `assets/icons/clock.svg`, `assets/icons/brush.svg`, `assets/icons/truck.svg`, `assets/icons/star.svg`
- Create: `tests/e2e/usps.spec.js`

- [ ] **Step 1: Failing test**

`tests/e2e/usps.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('USP strip shows four cards with the spec content', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#usps .usp');
  await expect(cards).toHaveCount(4);
  await expect(cards.nth(0)).toContainText(/3.5 days/i);
  await expect(cards.nth(1)).toContainText(/free design/i);
  await expect(cards.nth(2)).toContainText(/free uk delivery/i);
  await expect(cards.nth(3)).toContainText(/130gsm/i);
  await expect(cards.first().locator('img,svg')).toBeVisible();
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Create the four icon SVGs**

`assets/icons/clock.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
```

`assets/icons/brush.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21c2 0 4-1 4-4 0-2-1-3-3-3-1.5 0-2.5 1-2.5 2.5C1.5 18 2 21 3 21z"/><path d="M14.5 5.5l4 4L9 19l-4-4z"/><path d="M14.5 5.5l3-3a2 2 0 0 1 3 3l-3 3"/></svg>
```

`assets/icons/truck.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="6" width="13" height="11" rx="1"/><path d="M14 9h5l3 4v4h-8"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
```

`assets/icons/star.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2"/></svg>
```

- [ ] **Step 4: Add USP markup**

Replace `<section id="usps">…</section>` with:

```html
<section id="usps" class="usps">
  <div class="container usps-grid">
    <div class="usp">
      <img src="assets/icons/clock.svg" alt="" class="usp-icon">
      <strong>3–5 days</strong>
      <p>Turnaround after artwork</p>
    </div>
    <div class="usp">
      <img src="assets/icons/brush.svg" alt="" class="usp-icon">
      <strong>Free design</strong>
      <p>We design for you</p>
    </div>
    <div class="usp">
      <img src="assets/icons/truck.svg" alt="" class="usp-icon">
      <strong>Free UK delivery</strong>
      <p>To your door</p>
    </div>
    <div class="usp">
      <img src="assets/icons/star.svg" alt="" class="usp-icon">
      <strong>130gsm full colour</strong>
      <p>Both sides, premium feel</p>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Append USP styles**

```css
/* 7. Section: usps
   ------------------------------------------------------------ */
.usps { background: var(--c-white); padding: var(--space-10) 0; }
.usps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
.usp { background: var(--c-off-white); border-radius: var(--radius-md); padding: var(--space-5); text-align: center; }
.usp-icon { width: 32px; height: 32px; margin: 0 auto var(--space-3); color: var(--c-black); }
.usp strong { display: block; font-size: 18px; font-weight: 800; margin-bottom: var(--space-1); }
.usp p { color: var(--c-text-muted); font-size: 14px; margin: 0; }

@media (max-width: 720px) {
  .usps-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 420px) {
  .usps-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 6: Run — expect PASS**

```bash
npm run test:e2e -- usps.spec.js
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add USP strip with 4 cards and SVG icons"
```

---

## Task 8: Pricing table (desktop)

Desktop matrix layout: 4 size rows × 4 quantity columns with was/now prices, "Most Popular" tint on the A4 row, "Best Value" yellow highlight on the 40K column, and "Bulk Savings" badge on 100K.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `tests/e2e/pricing.spec.js`

- [ ] **Step 1: Failing test**

`tests/e2e/pricing.spec.js`:
```js
import { test, expect } from '@playwright/test';

test.describe('pricing table', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('renders 4 size rows and 4 quantity columns', async ({ page }) => {
    await expect(page.locator('#pricing .pt-row')).toHaveCount(4);
    await expect(page.locator('#pricing .pt-head .pt-col')).toHaveCount(4);
  });

  test('A4 row is marked Most Popular', async ({ page }) => {
    const a4row = page.locator('#pricing .pt-row[data-size="A4"]');
    await expect(a4row).toContainText(/most popular/i);
  });

  test('40K column has Best Value badge', async ({ page }) => {
    await expect(page.locator('#pricing .pt-head .pt-col[data-qty="40K"]')).toContainText(/best value/i);
  });

  test('100K column has Bulk Savings badge', async ({ page }) => {
    await expect(page.locator('#pricing .pt-head .pt-col[data-qty="100K"]')).toContainText(/bulk savings/i);
  });

  test('A4 / 10K cell shows was £525 and now £425', async ({ page }) => {
    const cell = page.locator('#pricing .pt-cell[data-size="A4"][data-qty="10K"]');
    await expect(cell.locator('.pt-was')).toContainText('£525');
    await expect(cell.locator('.pt-now')).toContainText('£425');
  });

  test('A3 / 100K cell shows was £3850 and now £2800', async ({ page }) => {
    const cell = page.locator('#pricing .pt-cell[data-size="A3"][data-qty="100K"]');
    await expect(cell.locator('.pt-was')).toContainText('£3850');
    await expect(cell.locator('.pt-now')).toContainText('£2800');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm run test:e2e -- pricing.spec.js
```

- [ ] **Step 3: Add the pricing markup**

Replace `<section id="pricing">…</section>` with:

```html
<section id="pricing" class="pricing">
  <div class="container">
    <div class="section-header">
      <h2>Transparent pricing. No hidden fees.</h2>
      <p>Prices include free design and free UK delivery. Was-prices shown for reference — these are our everyday discounted prices.</p>
    </div>

    <div class="pt-wrap" role="region" aria-label="Pricing matrix">
      <div class="pt-head">
        <div class="pt-col pt-col-blank" aria-hidden="true"></div>
        <div class="pt-col" data-qty="10K"><span class="pt-qty">10K</span></div>
        <div class="pt-col" data-qty="20K"><span class="pt-qty">20K</span></div>
        <div class="pt-col pt-best" data-qty="40K"><span class="pt-qty">40K</span><span class="pt-badge">Best Value</span></div>
        <div class="pt-col" data-qty="100K"><span class="pt-qty">100K</span><span class="pt-badge pt-badge-alt">Bulk Savings</span></div>
      </div>

      <div class="pt-row" data-size="A5">
        <div class="pt-size"><strong>A5</strong><small>148 × 210 mm</small></div>
        <div class="pt-cell" data-size="A5" data-qty="10K" data-price="200"><span class="pt-now">£200</span></div>
        <div class="pt-cell" data-size="A5" data-qty="20K" data-price="250"><span class="pt-was">£350</span><span class="pt-now">£250</span></div>
        <div class="pt-cell pt-best" data-size="A5" data-qty="40K" data-price="400"><span class="pt-now">£400</span></div>
        <div class="pt-cell" data-size="A5" data-qty="100K" data-price="900"><span class="pt-now">£900</span></div>
      </div>

      <div class="pt-row pt-popular" data-size="A4">
        <div class="pt-size"><strong>A4</strong><span class="pt-tag">Most Popular</span></div>
        <div class="pt-cell" data-size="A4" data-qty="10K" data-price="425"><span class="pt-was">£525</span><span class="pt-now">£425</span></div>
        <div class="pt-cell" data-size="A4" data-qty="20K" data-price="550"><span class="pt-was">£700</span><span class="pt-now">£550</span></div>
        <div class="pt-cell pt-best" data-size="A4" data-qty="40K" data-price="900"><span class="pt-was">£1100</span><span class="pt-now">£900</span></div>
        <div class="pt-cell" data-size="A4" data-qty="100K" data-price="1600"><span class="pt-was">£2000</span><span class="pt-now">£1600</span></div>
      </div>

      <div class="pt-row" data-size="A4+">
        <div class="pt-size"><strong>A4+</strong><small>Extended</small></div>
        <div class="pt-cell" data-size="A4+" data-qty="10K" data-price="475"><span class="pt-was">£650</span><span class="pt-now">£475</span></div>
        <div class="pt-cell" data-size="A4+" data-qty="20K" data-price="750"><span class="pt-was">£950</span><span class="pt-now">£750</span></div>
        <div class="pt-cell pt-best" data-size="A4+" data-qty="40K" data-price="1250"><span class="pt-was">£1400</span><span class="pt-now">£1250</span></div>
        <div class="pt-cell" data-size="A4+" data-qty="100K" data-price="2300"><span class="pt-was">£2650</span><span class="pt-now">£2300</span></div>
      </div>

      <div class="pt-row" data-size="A3">
        <div class="pt-size"><strong>A3</strong><small>420 × 297 mm</small></div>
        <div class="pt-cell" data-size="A3" data-qty="10K" data-price="525"><span class="pt-was">£700</span><span class="pt-now">£525</span></div>
        <div class="pt-cell" data-size="A3" data-qty="20K" data-price="795"><span class="pt-was">£1100</span><span class="pt-now">£795</span></div>
        <div class="pt-cell pt-best" data-size="A3" data-qty="40K" data-price="1450"><span class="pt-was">£1750</span><span class="pt-now">£1450</span></div>
        <div class="pt-cell" data-size="A3" data-qty="100K" data-price="2800"><span class="pt-was">£3850</span><span class="pt-now">£2800</span></div>
      </div>
    </div>

    <p class="pt-fineprint">Click any price to get a quote for that quantity and size.</p>
  </div>
</section>
```

- [ ] **Step 4: Append pricing styles**

```css
/* 8. Section: pricing (desktop)
   ------------------------------------------------------------ */
.pricing { background: var(--c-off-white); }
.pt-wrap { background: var(--c-white); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
.pt-head, .pt-row { display: grid; grid-template-columns: 1.4fr repeat(4, 1fr); }
.pt-head { background: var(--c-black); color: var(--c-white); }
.pt-col { padding: var(--space-4); text-align: center; position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.pt-qty { font-size: 20px; font-weight: 900; }
.pt-badge { font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; background: var(--c-yellow); color: var(--c-black); padding: 2px 8px; border-radius: var(--radius-pill); }
.pt-badge-alt { background: var(--c-white); color: var(--c-black); }
.pt-col.pt-best { background: var(--c-yellow); color: var(--c-black); }
.pt-col.pt-best .pt-badge { background: var(--c-black); color: var(--c-yellow); }
.pt-col-blank { background: transparent; }

.pt-row { border-top: 1px solid var(--c-grey); align-items: stretch; }
.pt-row.pt-popular { background: var(--c-yellow-soft); }
.pt-size { padding: var(--space-4); background: var(--c-black); color: var(--c-white); display: flex; flex-direction: column; justify-content: center; align-items: flex-start; }
.pt-size strong { font-size: 20px; font-weight: 900; }
.pt-size small { font-size: 11px; opacity: .7; }
.pt-tag { font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: var(--c-yellow); margin-top: 4px; }

.pt-cell { padding: var(--space-4); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; background: var(--c-white); transition: background .12s ease; }
.pt-row.pt-popular .pt-cell { background: var(--c-yellow-soft); }
.pt-cell.pt-best { background: #FFF1B3; }
.pt-cell:hover { background: var(--c-grey); }
.pt-cell:focus-visible { outline: 3px solid var(--c-yellow); outline-offset: -3px; }
.pt-was { font-size: 12px; color: var(--c-text-muted); text-decoration: line-through; }
.pt-now { font-size: 22px; font-weight: 900; color: var(--c-black); }

.pt-fineprint { text-align: center; color: var(--c-text-muted); font-size: 13px; margin-top: var(--space-5); }
```

- [ ] **Step 5: Run — expect PASS**

```bash
npm run test:e2e -- pricing.spec.js
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add pricing matrix table for desktop"
```

---

## Task 9: Pricing table responsive (mobile stacked cards)

On screens ≤ 720px the grid layout becomes unusable. Stack each size as a card, with the 4 quantity options as a 2×2 grid inside.

**Files:**
- Modify: `styles.css`
- Modify: `tests/e2e/pricing.spec.js`

- [ ] **Step 1: Add the failing mobile test**

Append to `tests/e2e/pricing.spec.js`:
```js
test('on mobile the table reflows to stacked cards', async ({ page, viewport }) => {
  test.skip(viewport.width >= 720, 'mobile-only');
  await page.goto('/');
  const a4row = page.locator('#pricing .pt-row[data-size="A4"]');
  await expect(a4row).toBeVisible();

  // In the stacked layout, the row should display as block, not a 5-column grid.
  const display = await a4row.evaluate(el => getComputedStyle(el).display);
  expect(display).toBe('block');
});
```

- [ ] **Step 2: Run — expect FAIL on mobile project**

```bash
npm run test:e2e -- pricing.spec.js
```

- [ ] **Step 3: Append responsive overrides to `styles.css`**

```css
/* 8b. pricing — mobile (≤ 720px) ----------------------------- */
@media (max-width: 720px) {
  .pt-head { display: none; }
  .pt-row { display: block; border-top: 0; margin-bottom: var(--space-4); background: var(--c-white); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm); }
  .pt-row.pt-popular { box-shadow: 0 0 0 2px var(--c-yellow); }
  .pt-size { background: var(--c-black); color: var(--c-white); padding: var(--space-4); flex-direction: row; align-items: center; justify-content: space-between; }
  .pt-size strong { font-size: 22px; }
  .pt-size small, .pt-tag { font-size: 12px; }
  .pt-row .pt-cell { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-top: 1px solid var(--c-grey); background: var(--c-white) !important; }
  .pt-row.pt-popular .pt-cell { background: var(--c-yellow-soft) !important; }
  .pt-cell.pt-best { background: #FFF1B3 !important; }
  .pt-cell::before { content: attr(data-qty); font-weight: 800; font-size: 16px; min-width: 56px; }
  .pt-cell .pt-was { grid-column: 2; text-align: right; }
  .pt-cell .pt-now { grid-column: 3; font-size: 20px; }
  .pt-cell:not(:has(.pt-was)) .pt-now { grid-column: 2 / span 2; text-align: right; }
}
```

- [ ] **Step 4: Run — expect PASS on both projects**

```bash
npm run test:e2e -- pricing.spec.js
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: reflow pricing matrix to stacked cards on mobile"
```

---

## Task 10: Pricing-cell → form prefill (pure helper + DOM glue)

Clicking a pricing cell scrolls to the quote form and pre-selects the size + quantity dropdowns. The mapping is a pure function — unit-test it in isolation, then wire it to the DOM.

**Files:**
- Modify: `script.js`
- Create: `tests/unit/prefill.test.js`
- Modify: `tests/e2e/pricing.spec.js`

- [ ] **Step 1: Write the failing unit test**

`tests/unit/prefill.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { selectionsFromCell } from '../../script.js';

describe('selectionsFromCell', () => {
  it('extracts size and qty from a valid cell', () => {
    const el = document.createElement('div');
    el.dataset.size = 'A4';
    el.dataset.qty = '20K';
    expect(selectionsFromCell(el)).toEqual({ size: 'A4', qty: '20K' });
  });

  it('returns null when size or qty is missing', () => {
    const el = document.createElement('div');
    el.dataset.size = 'A4';
    expect(selectionsFromCell(el)).toBeNull();
  });

  it('returns null for non-elements', () => {
    expect(selectionsFromCell(null)).toBeNull();
    expect(selectionsFromCell(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm run test
```
Expected: import fails (`selectionsFromCell` not exported).

- [ ] **Step 3: Add the helper and DOM glue to `script.js`**

Append section 2 below section 1 (nav) and before the boot block:

```js
// 2. pricing -------------------------------------------------
export function selectionsFromCell(el) {
  if (!el || !el.dataset) return null;
  const { size, qty } = el.dataset;
  if (!size || !qty) return null;
  return { size, qty };
}

function applyPrefill({ size, qty }) {
  const sizeSel = document.querySelector('#quote select[name="size"]');
  const qtySel  = document.querySelector('#quote select[name="quantity"]');
  if (sizeSel) sizeSel.value = size;
  if (qtySel) qtySel.value = qty;
}

function initPricing() {
  const cells = document.querySelectorAll('#pricing .pt-cell');
  cells.forEach((cell) => {
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label',
      `Get a quote for ${cell.dataset.qty} ${cell.dataset.size} menus`);
    const handler = () => {
      const sel = selectionsFromCell(cell);
      if (!sel) return;
      applyPrefill(sel);
      document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' });
    };
    cell.addEventListener('click', handler);
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });
}
```

Update the `boot` function:
```js
function boot() {
  initNav();
  initPricing();
}
```

- [ ] **Step 4: Run unit test — expect PASS**

```bash
npm run test
```

- [ ] **Step 5: Append the failing E2E test**

Append to `tests/e2e/pricing.spec.js`:
```js
test('clicking a price cell scrolls to form and pre-fills selects', async ({ page }) => {
  await page.goto('/');
  // The form's selects don't exist yet (they're added in Task 16).
  // Until then, this test only asserts the cell is clickable + scrolls.
  await page.locator('#pricing .pt-cell[data-size="A4"][data-qty="20K"]').click();
  // Allow smooth scroll to complete
  await page.waitForTimeout(800);
  const inView = await page.locator('#quote').isInViewport();
  expect(inView).toBe(true);
});
```

- [ ] **Step 6: Run E2E — expect PASS for the scroll assertion**

```bash
npm run test:e2e -- pricing.spec.js
```

(The select pre-fill is fully tested in Task 17 after the form selects exist. Note added in code.)

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: clicking a price cell scrolls to quote form (prefill ready)"
```

---

## Task 11: How it works section

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `tests/e2e/how-it-works.spec.js`

- [ ] **Step 1: Failing test**

`tests/e2e/how-it-works.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('how-it-works shows three numbered steps', async ({ page }) => {
  await page.goto('/');
  const steps = page.locator('#how-it-works .hiw-step');
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toContainText(/get a quote/i);
  await expect(steps.nth(1)).toContainText(/we design it free/i);
  await expect(steps.nth(2)).toContainText(/printed.+delivered/i);
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add markup**

Replace `<section id="how-it-works">…</section>` with:

```html
<section id="how-it-works" class="how-it-works">
  <div class="container">
    <div class="section-header">
      <h2>From quote to your doorstep in days.</h2>
      <p>Three steps. No surprises.</p>
    </div>
    <div class="hiw-grid">
      <div class="hiw-step">
        <div class="hiw-num">1</div>
        <h3>Get a quote</h3>
        <p>Phone, WhatsApp or fill in the form. We confirm price in minutes.</p>
      </div>
      <div class="hiw-step">
        <div class="hiw-num">2</div>
        <h3>We design it free</h3>
        <p>Send us your dishes — we design the menu, you approve.</p>
      </div>
      <div class="hiw-step">
        <div class="hiw-num">3</div>
        <h3>Printed &amp; delivered</h3>
        <p>3–5 working days, free delivery anywhere in the UK.</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Append styles**

```css
/* 9. Section: how-it-works
   ------------------------------------------------------------ */
.how-it-works { background: var(--c-white); }
.hiw-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
.hiw-step { background: var(--c-off-white); border-radius: var(--radius-md); padding: var(--space-6); }
.hiw-num { background: var(--c-yellow); color: var(--c-black); width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; margin-bottom: var(--space-4); }
.hiw-step h3 { margin-bottom: var(--space-2); }
.hiw-step p { color: var(--c-text-muted); margin: 0; }

@media (max-width: 720px) {
  .hiw-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 5: Run — expect PASS**

```bash
npm run test:e2e -- how-it-works.spec.js
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add how-it-works section with three numbered steps"
```

---

## Task 12: Sample menus gallery (placeholders)

Six placeholder portrait images in a responsive grid. Real images swap in later by replacing the files.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `assets/menus/menu-placeholder-1.svg` … `menu-placeholder-6.svg`
- Create: `tests/e2e/gallery.spec.js`

- [ ] **Step 1: Failing test**

`tests/e2e/gallery.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('gallery shows 6 images with descriptive alt text and lazy loading', async ({ page }) => {
  await page.goto('/');
  const imgs = page.locator('#gallery .gallery-item img');
  await expect(imgs).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    const alt = await imgs.nth(i).getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt.length).toBeGreaterThan(3);
    expect(await imgs.nth(i).getAttribute('loading')).toBe('lazy');
  }
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Create 6 placeholder SVGs (3:4 portrait, alternating black/yellow blocks)**

For `i` from 1 to 6, create `assets/menus/menu-placeholder-{i}.svg` with the following content (vary the hue parameter `${i*60}` to make each distinct):

`assets/menus/menu-placeholder-1.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" role="img" aria-label="Placeholder menu 1">
  <rect width="300" height="400" fill="#111111"/>
  <rect x="20" y="20" width="260" height="40" fill="#FFD60A"/>
  <rect x="20" y="80" width="200" height="14" fill="#FAFAFA"/>
  <rect x="20" y="100" width="260" height="10" fill="#555555"/>
  <rect x="20" y="120" width="260" height="10" fill="#555555"/>
  <rect x="20" y="150" width="200" height="14" fill="#FAFAFA"/>
  <rect x="20" y="170" width="260" height="10" fill="#555555"/>
  <rect x="20" y="190" width="260" height="10" fill="#555555"/>
  <rect x="20" y="220" width="200" height="14" fill="#FAFAFA"/>
  <rect x="20" y="240" width="260" height="10" fill="#555555"/>
  <rect x="20" y="260" width="260" height="10" fill="#555555"/>
  <rect x="20" y="350" width="260" height="30" fill="#FFD60A"/>
</svg>
```

Duplicate this file 5 more times as `menu-placeholder-2.svg` through `menu-placeholder-6.svg`, changing only the top-rect colour (`#FFD60A`) to:
- 2: `#FAFAFA`
- 3: `#FFD60A`
- 4: `#E5E5E5`
- 5: `#FFD60A`
- 6: `#FAFAFA`

(These are intentional placeholders — the user will swap them for real menu photos. SVG keeps git small.)

- [ ] **Step 4: Add gallery markup**

Replace `<section id="gallery">…</section>` with:

```html
<section id="gallery" class="gallery">
  <div class="container">
    <div class="section-header">
      <h2>Recent menus we've printed</h2>
      <p>A few examples from our last batches. Yours next.</p>
    </div>
    <div class="gallery-grid">
      <button class="gallery-item" data-src="assets/menus/menu-placeholder-1.svg" data-caption="Indian takeaway · A4 trifold">
        <img src="assets/menus/menu-placeholder-1.svg" alt="A4 takeaway menu printed for an Indian restaurant" loading="lazy" width="300" height="400">
      </button>
      <button class="gallery-item" data-src="assets/menus/menu-placeholder-2.svg" data-caption="Pizza shop · A5 leaflet">
        <img src="assets/menus/menu-placeholder-2.svg" alt="A5 takeaway menu for a pizza shop" loading="lazy" width="300" height="400">
      </button>
      <button class="gallery-item" data-src="assets/menus/menu-placeholder-3.svg" data-caption="Chinese takeaway · A3 wallchart">
        <img src="assets/menus/menu-placeholder-3.svg" alt="A3 menu wall chart for a Chinese takeaway" loading="lazy" width="300" height="400">
      </button>
      <button class="gallery-item" data-src="assets/menus/menu-placeholder-4.svg" data-caption="Kebab house · A4+ extended">
        <img src="assets/menus/menu-placeholder-4.svg" alt="A4+ extended menu printed for a kebab house" loading="lazy" width="300" height="400">
      </button>
      <button class="gallery-item" data-src="assets/menus/menu-placeholder-5.svg" data-caption="Fish & chips · A4 single">
        <img src="assets/menus/menu-placeholder-5.svg" alt="A4 menu for a fish and chips takeaway" loading="lazy" width="300" height="400">
      </button>
      <button class="gallery-item" data-src="assets/menus/menu-placeholder-6.svg" data-caption="Burger bar · A5 double-sided">
        <img src="assets/menus/menu-placeholder-6.svg" alt="A5 double-sided menu for a burger bar" loading="lazy" width="300" height="400">
      </button>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Append gallery styles**

```css
/* 10. Section: gallery
   ------------------------------------------------------------ */
.gallery { background: var(--c-off-white); }
.gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
.gallery-item { padding: 0; border: 0; background: transparent; border-radius: var(--radius-md); overflow: hidden; cursor: zoom-in; transition: transform .15s ease, box-shadow .15s ease; }
.gallery-item:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.gallery-item img { width: 100%; height: auto; aspect-ratio: 3/4; object-fit: cover; }
.gallery-item:focus-visible { outline: 3px solid var(--c-yellow); outline-offset: 3px; }

@media (max-width: 720px) {
  .gallery-grid { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 6: Run — expect PASS**

```bash
npm run test:e2e -- gallery.spec.js
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add menu gallery with placeholder images and lazy loading"
```

---

## Task 13: Lightbox (JS) — click to enlarge, ESC / backdrop / button to close

**Files:**
- Modify: `index.html` (lightbox modal markup at end of `<main>`)
- Modify: `styles.css`
- Modify: `script.js`
- Create: `tests/e2e/lightbox.spec.js`

- [ ] **Step 1: Failing test**

`tests/e2e/lightbox.spec.js`:
```js
import { test, expect } from '@playwright/test';

test.describe('lightbox', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('clicking a gallery item opens the lightbox', async ({ page }) => {
    const lb = page.locator('#lightbox');
    await expect(lb).toBeHidden();
    await page.locator('#gallery .gallery-item').first().click();
    await expect(lb).toBeVisible();
    await expect(lb.locator('img')).toHaveAttribute('src', /menu-placeholder-1/);
  });

  test('Escape closes the lightbox', async ({ page }) => {
    await page.locator('#gallery .gallery-item').first().click();
    await expect(page.locator('#lightbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).toBeHidden();
  });

  test('clicking the backdrop closes the lightbox', async ({ page }) => {
    await page.locator('#gallery .gallery-item').first().click();
    await page.locator('#lightbox').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#lightbox')).toBeHidden();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add lightbox markup at the end of `<main>` in `index.html`**

Add immediately before the closing `</main>` tag:

```html
<div id="lightbox" class="lightbox" hidden role="dialog" aria-modal="true" aria-label="Menu image" tabindex="-1">
  <button class="lightbox-close" type="button" aria-label="Close">×</button>
  <figure class="lightbox-figure">
    <img alt="">
    <figcaption></figcaption>
  </figure>
</div>
```

- [ ] **Step 4: Append lightbox styles**

```css
/* 11. Lightbox
   ------------------------------------------------------------ */
.lightbox { position: fixed; inset: 0; background: rgba(17,17,17,.92); display: flex; align-items: center; justify-content: center; z-index: 200; padding: var(--space-5); }
.lightbox[hidden] { display: none; }
.lightbox-figure { margin: 0; max-width: min(640px, 100%); max-height: 90vh; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
.lightbox-figure img { max-width: 100%; max-height: 80vh; border-radius: var(--radius-md); background: var(--c-white); }
.lightbox-figure figcaption { color: var(--c-white); font-weight: 500; font-size: 14px; text-align: center; }
.lightbox-close { position: absolute; top: var(--space-4); right: var(--space-4); width: 44px; height: 44px; border-radius: 50%; border: 0; background: var(--c-yellow); color: var(--c-black); font-size: 24px; font-weight: 900; line-height: 1; cursor: pointer; }
.lightbox-close:focus-visible { outline: 3px solid var(--c-white); outline-offset: 2px; }
```

- [ ] **Step 5: Add lightbox JS to `script.js`**

Insert after section 2 (pricing) and before the boot block:

```js
// 3. lightbox ------------------------------------------------
function initLightbox() {
  const lb = document.getElementById('lightbox');
  const img = lb?.querySelector('img');
  const cap = lb?.querySelector('figcaption');
  const closeBtn = lb?.querySelector('.lightbox-close');
  if (!lb || !img || !cap || !closeBtn) return;

  let lastFocus = null;

  const open = (src, caption) => {
    lastFocus = document.activeElement;
    img.src = src;
    img.alt = caption || 'Menu image';
    cap.textContent = caption || '';
    lb.hidden = false;
    lb.focus();
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    lb.hidden = true;
    img.src = '';
    document.body.style.overflow = '';
    lastFocus?.focus?.();
  };

  document.querySelectorAll('#gallery .gallery-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      open(btn.dataset.src, btn.dataset.caption);
    });
  });

  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.hidden && e.key === 'Escape') close();
  });
}
```

Update `boot`:
```js
function boot() {
  initNav();
  initPricing();
  initLightbox();
}
```

- [ ] **Step 6: Run — expect PASS**

```bash
npm run test:e2e -- lightbox.spec.js
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add image lightbox for gallery with keyboard + backdrop close"
```

---

## Task 14: Why us (20-year credibility)

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `tests/e2e/why-us.spec.js`

- [ ] **Step 1: Failing test**

`tests/e2e/why-us.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('why-us shows two stat badges with the right numbers', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#why-us');
  await expect(section).toContainText('20 years');
  await expect(section.locator('.stat-num').nth(0)).toContainText('20');
  await expect(section.locator('.stat-num').nth(1)).toContainText(/1,?000/);
  await expect(section).toContainText(/bradford/i);
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add markup**

Replace `<section id="why-us">…</section>` with:

```html
<section id="why-us" class="why-us">
  <div class="container why-us-grid">
    <div class="why-us-copy">
      <h2>20 years printing menus for British takeaways.</h2>
      <p>We've been based in Bradford since 2005 and we've printed menus for thousands of takeaways across the UK — from a single corner-shop kebab house to nationwide chains. We're family-run, we know the trade, and we keep prices low because we run lean.</p>
      <p>If you've never ordered printed menus before, we'll walk you through it. If you have, you'll already know we're the cheapest.</p>
    </div>
    <div class="why-us-stats">
      <div class="stat">
        <span class="stat-num">20</span>
        <span class="stat-label">years in business</span>
      </div>
      <div class="stat stat-dark">
        <span class="stat-num">1,000s</span>
        <span class="stat-label">of takeaways served</span>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Append styles**

```css
/* 12. Section: why-us
   ------------------------------------------------------------ */
.why-us { background: var(--c-white); }
.why-us-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: var(--space-8); align-items: center; }
.why-us-copy p { color: var(--c-text-muted); }
.why-us-stats { display: grid; grid-template-columns: 1fr; gap: var(--space-4); }
.stat { background: var(--c-yellow); color: var(--c-black); padding: var(--space-6); border-radius: var(--radius-md); text-align: center; }
.stat-dark { background: var(--c-black); color: var(--c-yellow); }
.stat-num { display: block; font-size: clamp(40px, 6vw, 64px); font-weight: 900; line-height: 1; letter-spacing: -0.02em; }
.stat-label { display: block; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-top: var(--space-2); }

@media (max-width: 720px) {
  .why-us-grid { grid-template-columns: 1fr; gap: var(--space-6); }
  .why-us-stats { grid-template-columns: 1fr 1fr; }
}
```

- [ ] **Step 5: Run — expect PASS**

```bash
npm run test:e2e -- why-us.spec.js
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add why-us section with 20-year credibility and stat badges"
```

---

## Task 15: Reviews section

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `tests/e2e/reviews.spec.js`

- [ ] **Step 1: Failing test**

`tests/e2e/reviews.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('reviews section shows three star-rated quotes', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#reviews .review');
  await expect(cards).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await expect(cards.nth(i).locator('.stars')).toContainText('★★★★★');
    await expect(cards.nth(i).locator('cite')).not.toBeEmpty();
  }
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add markup**

Replace `<section id="reviews">…</section>` with:

```html
<section id="reviews" class="reviews">
  <div class="container">
    <div class="section-header">
      <h2>What our customers say</h2>
      <p>Real takeaway owners. Real menus printed. <!-- REPLACE: swap in real testimonials --></p>
    </div>
    <div class="reviews-grid">
      <figure class="review">
        <div class="stars" aria-label="Five out of five stars">★★★★★</div>
        <blockquote>"Fast, cheap, looks great. Will order again."</blockquote>
        <cite>Mo, Manchester</cite>
      </figure>
      <figure class="review">
        <div class="stars" aria-label="Five out of five stars">★★★★★</div>
        <blockquote>"They designed it for me and it was perfect — saved me hundreds."</blockquote>
        <cite>Aysha, Birmingham</cite>
      </figure>
      <figure class="review">
        <div class="stars" aria-label="Five out of five stars">★★★★★</div>
        <blockquote>"5,000 menus arrived in 4 days. Quality top notch."</blockquote>
        <cite>Tony, London</cite>
      </figure>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Append styles**

```css
/* 13. Section: reviews
   ------------------------------------------------------------ */
.reviews { background: var(--c-off-white); }
.reviews-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
.review { background: var(--c-white); border-radius: var(--radius-md); padding: var(--space-5); margin: 0; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: var(--space-3); }
.review .stars { color: var(--c-yellow); font-size: 18px; letter-spacing: 2px; }
.review blockquote { margin: 0; font-size: 16px; line-height: 1.5; }
.review cite { font-style: normal; font-weight: 700; color: var(--c-text-muted); font-size: 14px; }

@media (max-width: 720px) {
  .reviews-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 5: Run — expect PASS**

```bash
npm run test:e2e -- reviews.spec.js
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add reviews section with three testimonial cards"
```

---

## Task 16: Quote form markup + native validation

Form fields with proper labels, required attributes, and a honeypot input. JS submission is added in Task 17.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `tests/unit/validation.test.js`
- Create: `tests/e2e/form.spec.js`

- [ ] **Step 1: Failing unit test for phone validation**

`tests/unit/validation.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { isUKPhone } from '../../script.js';

describe('isUKPhone', () => {
  it('accepts common UK formats', () => {
    expect(isUKPhone('07572 574582')).toBe(true);
    expect(isUKPhone('07572574582')).toBe(true);
    expect(isUKPhone('+44 7572 574582')).toBe(true);
    expect(isUKPhone('01274 305555')).toBe(true);
    expect(isUKPhone('0044 1274 305555')).toBe(true);
  });
  it('rejects too short / non-numeric', () => {
    expect(isUKPhone('12345')).toBe(false);
    expect(isUKPhone('hello there')).toBe(false);
    expect(isUKPhone('')).toBe(false);
  });
});
```

- [ ] **Step 2: Failing E2E test for form structure**

`tests/e2e/form.spec.js`:
```js
import { test, expect } from '@playwright/test';

test.describe('quote form', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('has all required fields with labels', async ({ page }) => {
    const form = page.locator('#quote-form');
    await expect(form.locator('label[for="qf-name"]')).toBeVisible();
    await expect(form.locator('#qf-name')).toHaveAttribute('required', '');
    await expect(form.locator('#qf-phone')).toHaveAttribute('required', '');
    await expect(form.locator('select[name="size"]')).toBeVisible();
    await expect(form.locator('select[name="quantity"]')).toBeVisible();
    await expect(form.locator('textarea[name="notes"]')).toBeVisible();
  });

  test('honeypot field exists and is visually hidden', async ({ page }) => {
    const honey = page.locator('#quote-form [name="company_website"]');
    await expect(honey).toHaveCount(1);
    const visible = await honey.evaluate(el => getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
    expect(visible).toBe(false);
  });

  test('phone/whatsapp fallback links are present', async ({ page }) => {
    await expect(page.locator('#quote a[href="tel:01274305555"]')).toBeVisible();
    await expect(page.locator('#quote a[href^="https://wa.me/"]')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run — expect FAIL on both**

```bash
npm run test
npm run test:e2e -- form.spec.js
```

- [ ] **Step 4: Add `isUKPhone` to `script.js`**

Insert after section 3 (lightbox) and before section 4 (form, added next task):

```js
// 4. form ----------------------------------------------------
export function isUKPhone(input) {
  if (typeof input !== 'string') return false;
  const digits = input.replace(/[^\d]/g, '');
  // Accept: 10 digits starting 0 (UK national), 11 digits starting 0,
  // 11 digits starting 44 (international), 12 digits starting 0044.
  if (/^0\d{9,10}$/.test(digits)) return true;
  if (/^44\d{9,10}$/.test(digits)) return true;
  if (/^0044\d{9,10}$/.test(digits)) return true;
  return false;
}
```

- [ ] **Step 5: Add quote-form markup**

Replace `<section id="quote">…</section>` with:

```html
<section id="quote" class="quote">
  <div class="container quote-grid">
    <div class="quote-copy">
      <h2>Get your quote in minutes</h2>
      <p>Fill in the form and we'll come back to you within one working hour. Or call <a href="tel:01274305555"><strong>01274 305555</strong></a> — we usually answer within a minute.</p>
    </div>

    <form id="quote-form" class="quote-form" action="https://formspree.io/f/REPLACE_ME" method="POST" novalidate>
      <div class="qf-row">
        <div class="qf-field">
          <label for="qf-name">Your name</label>
          <input id="qf-name" name="name" type="text" autocomplete="name" required>
        </div>
        <div class="qf-field">
          <label for="qf-phone">Phone</label>
          <input id="qf-phone" name="phone" type="tel" autocomplete="tel" required>
        </div>
      </div>

      <div class="qf-row">
        <div class="qf-field">
          <label for="qf-email">Email <span class="qf-optional">(optional)</span></label>
          <input id="qf-email" name="email" type="email" autocomplete="email">
        </div>
        <div class="qf-field">
          <label for="qf-size">Menu size</label>
          <select id="qf-size" name="size" required>
            <option value="">Choose…</option>
            <option value="A5">A5</option>
            <option value="A4">A4</option>
            <option value="A4+">A4+ Extended</option>
            <option value="A3">A3</option>
          </select>
        </div>
      </div>

      <div class="qf-row">
        <div class="qf-field">
          <label for="qf-qty">Quantity</label>
          <select id="qf-qty" name="quantity" required>
            <option value="">Choose…</option>
            <option value="10K">10,000</option>
            <option value="20K">20,000</option>
            <option value="40K">40,000</option>
            <option value="100K">100,000</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="qf-field"></div>
      </div>

      <div class="qf-field">
        <label for="qf-notes">Notes <span class="qf-optional">(optional)</span></label>
        <textarea id="qf-notes" name="notes" rows="4" placeholder="Tell us about your menu, dishes, or design needs."></textarea>
      </div>

      <!-- Honeypot: hidden from humans, picked up by bots -->
      <div class="qf-honey" aria-hidden="true">
        <label>Website (leave blank)<input type="text" name="company_website" tabindex="-1" autocomplete="off"></label>
      </div>

      <button type="submit" class="btn btn-primary qf-submit">Request my quote</button>
      <p class="qf-status" role="status" aria-live="polite" hidden></p>
    </form>

    <aside class="quote-fallback">
      Prefer to talk? <a href="tel:01274305555" class="btn btn-primary">Call 01274 305555</a>
      <a href="https://wa.me/447572574582" class="btn btn-ghost btn-dark" target="_blank" rel="noopener">💬 WhatsApp</a>
    </aside>
  </div>
</section>
```

- [ ] **Step 6: Append quote-form styles**

```css
/* 14. Section: quote form
   ------------------------------------------------------------ */
.quote { background: var(--c-white); }
.quote-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-6); max-width: 720px; }
.quote-copy p { color: var(--c-text-muted); }
.quote-form { display: flex; flex-direction: column; gap: var(--space-4); }
.qf-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.qf-field { display: flex; flex-direction: column; gap: var(--space-1); }
.qf-field label { font-weight: 700; font-size: 14px; }
.qf-field .qf-optional { font-weight: 400; color: var(--c-text-muted); }
.qf-field input, .qf-field select, .qf-field textarea {
  font: inherit; padding: 12px 14px; border: 1px solid var(--c-grey); border-radius: var(--radius-sm); background: var(--c-off-white);
}
.qf-field input:focus, .qf-field select:focus, .qf-field textarea:focus { outline: 2px solid var(--c-yellow); outline-offset: 1px; }
.qf-field input:invalid:not(:placeholder-shown) { border-color: #B22234; }
.qf-honey { position: absolute; left: -9999px; height: 0; overflow: hidden; }
.qf-submit { align-self: flex-start; padding: 14px 26px; font-size: 16px; }
.qf-status { font-weight: 700; }
.qf-status.is-success { color: #0b6b3a; }
.qf-status.is-error { color: #B22234; }

.quote-fallback { background: var(--c-black); color: var(--c-white); padding: var(--space-5); border-radius: var(--radius-md); display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); font-weight: 700; }
.quote-fallback .btn-ghost { border-color: var(--c-yellow); color: var(--c-yellow); }

@media (max-width: 600px) {
  .qf-row { grid-template-columns: 1fr; }
  .qf-submit { width: 100%; }
}
```

- [ ] **Step 7: Run — expect PASS on unit + new E2E**

```bash
npm run test
npm run test:e2e -- form.spec.js
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: add quote form markup, phone validator, and styles"
```

---

## Task 17: Form submission (Formspree fetch + success/error/honeypot handling)

**Files:**
- Modify: `script.js`
- Modify: `tests/e2e/form.spec.js`
- Modify: `tests/e2e/pricing.spec.js` (now we can test pre-fill end-to-end)

- [ ] **Step 1: Failing tests**

Append to `tests/e2e/form.spec.js`:
```js
test('blocks submission when phone is invalid', async ({ page }) => {
  await page.goto('/');
  await page.locator('#qf-name').fill('Mo');
  await page.locator('#qf-phone').fill('abc123');
  await page.locator('#qf-size').selectOption('A4');
  await page.locator('#qf-qty').selectOption('10K');
  await page.locator('#quote-form button[type=submit]').click();
  const status = page.locator('#quote-form .qf-status');
  await expect(status).toBeVisible();
  await expect(status).toHaveClass(/is-error/);
  await expect(status).toContainText(/phone/i);
});

test('shows success state on valid submit (mocked Formspree response)', async ({ page }) => {
  await page.route('https://formspree.io/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
  );
  await page.goto('/');
  await page.locator('#qf-name').fill('Mo');
  await page.locator('#qf-phone').fill('07572 574582');
  await page.locator('#qf-size').selectOption('A4');
  await page.locator('#qf-qty').selectOption('20K');
  await page.locator('#quote-form button[type=submit]').click();
  await expect(page.locator('#quote-form .qf-status')).toHaveClass(/is-success/);
  await expect(page.locator('#quote-form .qf-status')).toContainText(/within 1 working hour/i);
});

test('silently rejects honeypot-filled submissions', async ({ page }) => {
  let networkCalled = false;
  await page.route('https://formspree.io/**', route => { networkCalled = true; route.fulfill({ status: 200, body: '{}' }); });
  await page.goto('/');
  await page.locator('#qf-name').fill('Bot');
  await page.locator('#qf-phone').fill('07572574582');
  await page.locator('#qf-size').selectOption('A4');
  await page.locator('#qf-qty').selectOption('10K');
  await page.locator('#quote-form [name="company_website"]').evaluate(el => el.value = 'spam');
  await page.locator('#quote-form button[type=submit]').click();
  // Honeypot path shows "success" UX but does NOT call Formspree
  await page.waitForTimeout(200);
  expect(networkCalled).toBe(false);
});
```

Append to `tests/e2e/pricing.spec.js`:
```js
test('clicking A4/20K cell pre-selects the form dropdowns', async ({ page }) => {
  await page.goto('/');
  await page.locator('#pricing .pt-cell[data-size="A4"][data-qty="20K"]').click();
  await expect(page.locator('#quote select[name="size"]')).toHaveValue('A4');
  await expect(page.locator('#quote select[name="quantity"]')).toHaveValue('20K');
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add form submission logic to `script.js`**

Add `initForm` after `isUKPhone`:

```js
function initForm() {
  const form = document.getElementById('quote-form');
  if (!form) return;
  const status = form.querySelector('.qf-status');
  const phoneInput = form.querySelector('#qf-phone');
  const honey = form.querySelector('[name="company_website"]');

  const setStatus = (text, kind) => {
    status.textContent = text;
    status.hidden = false;
    status.classList.remove('is-success', 'is-error');
    if (kind) status.classList.add(`is-${kind}`);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot: pretend success, send nothing.
    if (honey && honey.value.trim() !== '') {
      setStatus("Thanks, we'll be in touch within 1 working hour.", 'success');
      form.reset();
      return;
    }

    // Native validation first
    if (!form.checkValidity()) {
      setStatus('Please fill in your name, phone, size and quantity.', 'error');
      form.reportValidity();
      return;
    }

    if (!isUKPhone(phoneInput.value)) {
      setStatus('Please enter a valid UK phone number.', 'error');
      phoneInput.focus();
      return;
    }

    setStatus('Sending…', null);

    try {
      const action = form.getAttribute('action') || '';
      const res = await fetch(action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("Thanks, we'll be in touch within 1 working hour. For urgent quotes call 01274 305555.", 'success');
      form.reset();
    } catch (err) {
      setStatus('Something went wrong. Please call us on 01274 305555 — sorry about that.', 'error');
    }
  });
}
```

Update `boot`:
```js
function boot() {
  initNav();
  initPricing();
  initLightbox();
  initForm();
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npm run test:e2e -- form.spec.js pricing.spec.js
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: wire up quote form submission, validation, and honeypot"
```

---

## Task 18: Footer + stub Privacy / Terms pages

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `privacy.html`, `terms.html`
- Create: `tests/e2e/footer.spec.js`

- [ ] **Step 1: Failing test**

`tests/e2e/footer.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('footer shows contact details and legal links', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('#site-footer');
  await expect(footer).toContainText('Based in Bradford');
  await expect(footer.locator('a[href="tel:01274305555"]')).toBeVisible();
  await expect(footer.locator('a[href^="https://wa.me/"]')).toBeVisible();
  await expect(footer.locator('a[href="privacy.html"]')).toBeVisible();
  await expect(footer.locator('a[href="terms.html"]')).toBeVisible();
});

test('privacy and terms pages load', async ({ page }) => {
  await page.goto('/privacy.html');
  await expect(page.locator('h1')).toContainText(/privacy/i);
  await page.goto('/terms.html');
  await expect(page.locator('h1')).toContainText(/terms/i);
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add footer markup**

Replace `<footer id="site-footer">…</footer>` with:

```html
<footer id="site-footer" class="site-footer">
  <div class="container site-footer-grid">
    <div>
      <div class="footer-logo">Cheapest<span>print</span>.co.uk</div>
      <p class="footer-tag">Based in Bradford, UK · Printing nationwide</p>
    </div>
    <div>
      <h4>Contact</h4>
      <ul>
        <li><a href="tel:01274305555">01274 305555</a></li>
        <li><a href="https://wa.me/447572574582" target="_blank" rel="noopener">WhatsApp us</a></li>
        <li><a href="mailto:hello@cheapestprint.co.uk">hello@cheapestprint.co.uk</a></li>
      </ul>
    </div>
    <div>
      <h4>Legal</h4>
      <ul>
        <li><a href="privacy.html">Privacy Policy</a></li>
        <li><a href="terms.html">Terms &amp; Conditions</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container">© 2026 Cheapestprint.co.uk · All rights reserved</div>
  </div>
</footer>
```

- [ ] **Step 4: Append footer styles**

```css
/* 15. Section: footer
   ------------------------------------------------------------ */
.site-footer { background: var(--c-black); color: var(--c-white); padding: var(--space-10) 0 0; }
.site-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: var(--space-6); padding-bottom: var(--space-8); }
.footer-logo { font-weight: 900; font-size: 22px; letter-spacing: -0.01em; }
.footer-logo span { background: var(--c-yellow); color: var(--c-black); padding: 2px 6px; border-radius: var(--radius-sm); }
.footer-tag { color: #cccccc; margin-top: var(--space-2); }
.site-footer h4 { font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: var(--c-yellow); margin-bottom: var(--space-3); }
.site-footer ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-2); }
.site-footer a { color: var(--c-white); text-decoration: none; }
.site-footer a:hover { color: var(--c-yellow); }
.footer-bottom { border-top: 1px solid rgba(255,255,255,.1); padding: var(--space-4) 0; font-size: 13px; color: #999999; }

@media (max-width: 720px) {
  .site-footer-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 5: Create stub legal pages**

`privacy.html`:
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Privacy Policy · Cheapestprint.co.uk</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="container" style="padding: 64px 24px; max-width: 720px;">
    <p><a href="index.html">← Back to home</a></p>
    <h1>Privacy Policy</h1>
    <p><em>Last updated: 2026-05-15</em></p>
    <p>Cheapestprint.co.uk (we, us, our) is based in Bradford, United Kingdom. This page explains what personal data we collect when you use this website.</p>
    <h2>What we collect</h2>
    <p>When you submit our quote form we collect: your name, phone number, optional email, the size and quantity of menus you're interested in, and any notes you add. We use this only to send you a quote and follow up.</p>
    <h2>How long we keep it</h2>
    <p>We retain quote enquiries for up to 24 months. You can ask us to delete your data at any time by emailing <a href="mailto:hello@cheapestprint.co.uk">hello@cheapestprint.co.uk</a>.</p>
    <h2>Cookies</h2>
    <p>This website does not set tracking cookies.</p>
    <h2>Contact</h2>
    <p>If you have questions about this policy, email <a href="mailto:hello@cheapestprint.co.uk">hello@cheapestprint.co.uk</a> or call <a href="tel:01274305555">01274 305555</a>.</p>
  </main>
</body>
</html>
```

`terms.html`:
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Terms &amp; Conditions · Cheapestprint.co.uk</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="container" style="padding: 64px 24px; max-width: 720px;">
    <p><a href="index.html">← Back to home</a></p>
    <h1>Terms &amp; Conditions</h1>
    <p><em>Last updated: 2026-05-15</em></p>
    <p>These are placeholder terms. We'll replace them with the final wording before launch. By using this website you agree to be contacted using the details you provide on our quote form.</p>
    <h2>Quotes &amp; orders</h2>
    <p>Quotes are valid for 14 days from the date we send them. Orders are confirmed once payment is received and artwork is approved by you.</p>
    <h2>Turnaround</h2>
    <p>We aim to print and dispatch within 3–5 working days of you approving artwork. Free UK delivery applies to mainland addresses; remote/Highlands addresses may take 1–2 extra days.</p>
    <h2>Contact</h2>
    <p>Cheapestprint.co.uk · Bradford, UK · <a href="tel:01274305555">01274 305555</a> · <a href="mailto:hello@cheapestprint.co.uk">hello@cheapestprint.co.uk</a></p>
  </main>
</body>
</html>
```

- [ ] **Step 6: Run — expect PASS**

```bash
npm run test:e2e -- footer.spec.js
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add footer with contact + legal, plus privacy/terms stub pages"
```

---

## Task 19: SEO — meta tags, Open Graph, LocalBusiness JSON-LD

**Files:**
- Modify: `index.html`
- Create: `tests/e2e/seo.spec.js`

- [ ] **Step 1: Failing test**

`tests/e2e/seo.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('SEO meta tags and structured data are present', async ({ page }) => {
  await page.goto('/');
  // Open Graph
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Cheapestprint/);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /menus/i);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  // JSON-LD LocalBusiness
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(ld);
  expect(data['@type']).toBe('LocalBusiness');
  expect(data.name).toBe('Cheapestprint.co.uk');
  expect(data.telephone).toBe('+441274305555');
  expect(data.address.addressLocality).toBe('Bradford');
  expect(data.areaServed).toBe('United Kingdom');
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add the meta + JSON-LD tags**

Inside `<head>` in `index.html`, immediately after the existing `<meta name="description">` tag, add:

```html
<meta property="og:title" content="Cheap Takeaway Menu Printing UK · Cheapestprint.co.uk">
<meta property="og:description" content="10,000 full-colour takeaway menus from £425. Free design, free UK delivery, 3–5 day turnaround.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://cheapestprint.co.uk/">
<meta property="og:image" content="https://cheapestprint.co.uk/assets/og-image.svg">
<meta name="twitter:card" content="summary_large_image">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Cheapestprint.co.uk",
  "url": "https://cheapestprint.co.uk/",
  "telephone": "+441274305555",
  "priceRange": "££",
  "areaServed": "United Kingdom",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Bradford",
    "addressCountry": "GB"
  },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "09:00",
    "closes": "17:30"
  }]
}
</script>
```

- [ ] **Step 4: Create a simple OG image**

`assets/og-image.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#111111"/>
  <text x="60" y="320" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="80" fill="#FFFFFF">10,000 A4 menus.</text>
  <text x="60" y="420" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="80" fill="#FFD60A">£425. Delivered free.</text>
  <text x="60" y="500" font-family="Inter, system-ui, sans-serif" font-weight="500" font-size="32" fill="#cccccc">Cheapestprint.co.uk · 20 years printing for UK takeaways</text>
</svg>
```

- [ ] **Step 5: Run — expect PASS**

```bash
npm run test:e2e -- seo.spec.js
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add SEO meta tags, Open Graph, and LocalBusiness JSON-LD"
```

---

## Task 20: Accessibility pass

Audit and lock in keyboard navigation, focus visibility, alt text, contrast, and the skip link.

**Files:**
- Create: `tests/e2e/a11y.spec.js`
- Modify: `styles.css` (only if fixes are needed)
- Modify: `index.html` (only if fixes are needed)

- [ ] **Step 1: Install axe-playwright for automated checks**

```bash
npm install --save-dev @axe-core/playwright
```

- [ ] **Step 2: Write the accessibility test**

`tests/e2e/a11y.spec.js`:
```js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('axe-core finds no serious or critical violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  if (serious.length) {
    console.error('A11y violations:', JSON.stringify(serious, null, 2));
  }
  expect(serious).toEqual([]);
});

test('skip link is reachable on first Tab', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.className);
  expect(focused).toContain('skip-link');
});

test('all gallery images have non-empty alt text', async ({ page }) => {
  await page.goto('/');
  const alts = await page.locator('#gallery img').evaluateAll(els => els.map(e => e.alt));
  for (const a of alts) expect(a.length).toBeGreaterThan(3);
});

test('every form field has an associated label', async ({ page }) => {
  await page.goto('/');
  const orphans = await page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll('#quote-form input, #quote-form select, #quote-form textarea'));
    return fields.filter(f => f.type !== 'hidden')
      .filter(f => !f.closest('label') && !document.querySelector(`label[for="${f.id}"]`))
      .map(f => f.name || f.id);
  });
  expect(orphans).toEqual([]);
});
```

- [ ] **Step 3: Run — fix anything that fails**

```bash
npm run test:e2e -- a11y.spec.js
```

If axe reports a contrast or label issue:
- For contrast: bump the colour in `styles.css` (e.g., darken `--c-text-muted` from `#555555` to `#444444`).
- For missing labels: add the appropriate `<label for>` association.
- For empty buttons: add `aria-label`.

Iterate until the test passes. The test purposely runs both `desktop` and `mobile` viewports — accessibility is checked at both sizes.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "test: lock in accessibility checks (axe + keyboard + labels)"
```

---

## Task 21: Final polish — README, Lighthouse, Netlify config

**Files:**
- Modify: `README.md`
- Create: `netlify.toml`
- Modify: `favicon.svg`

- [ ] **Step 1: Create a favicon**

`favicon.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#111111"/>
  <text x="32" y="44" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="42" fill="#FFD60A">£</text>
</svg>
```

- [ ] **Step 2: Create `netlify.toml`**

```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

- [ ] **Step 3: Run Lighthouse**

```bash
# Start the dev server in one terminal:
npm run dev

# In another:
npx --yes lighthouse http://localhost:8080 \
  --only-categories=performance,accessibility,best-practices,seo \
  --form-factor=mobile \
  --view
```

Targets: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.

If any score falls below, fix and re-run. Common fixes:
- Performance: ensure all `<img>` have `width`/`height` to avoid CLS (already done in gallery).
- SEO: ensure `<meta name="description">` is present (done in Task 19).
- Best Practices: avoid console errors — add a `console.log` cleanup pass if any are present.

Stop the dev server when done.

- [ ] **Step 4: Replace `README.md` with the full version**

```markdown
# Cheapestprint.co.uk

Single-page lead-generation website for [cheapestprint.co.uk](https://cheapestprint.co.uk) — a UK takeaway menu printer based in Bradford.

Static HTML / CSS / vanilla JS. No build step.

## Local development

```bash
npm install
npm run dev          # serves on http://localhost:8080
```

## Tests

```bash
npm test             # Vitest unit tests (pure helpers)
npm run test:e2e     # Playwright E2E tests (rendered behaviour, A11y)
npm run test:e2e:ui  # interactive Playwright UI
```

## Updating content

- **Copy / prices:** edit `index.html` directly. Section comments mark each block.
- **Pricing matrix:** the cells live in `<section id="pricing">`. To change a price, edit the `<span class="pt-now">` and `<span class="pt-was">` within the relevant `.pt-cell`.
- **Menu gallery images:** replace files in `assets/menus/` (keep the same filenames or update the `<img src>` references in `index.html`).
- **Testimonials:** edit the `<figure class="review">` blocks in the reviews section.
- **WhatsApp number:** search for `447572574582` in `index.html` and replace with the real number (international format, no leading +).
- **Formspree endpoint:** sign up at [formspree.io](https://formspree.io), copy your form endpoint, and replace the `action="https://formspree.io/f/REPLACE_ME"` in the quote form.
- **Email address:** the footer and policy pages use `hello@cheapestprint.co.uk` — update if different.

## Deployment

This is a static site. The repo is preconfigured for [Netlify](https://netlify.com):

1. Push the repo to GitHub.
2. Create a new Netlify site from the repo.
3. Netlify will read `netlify.toml` — no build command, publish directory `.`.
4. Point the `cheapestprint.co.uk` domain at the Netlify site in Netlify → Site settings → Domain management.

Or drag-and-drop the entire folder onto Netlify's deploy page.

## File tour

| Path | What it is |
|---|---|
| `index.html` | The single landing page. All 10 sections are here. |
| `styles.css` | All styles. Design tokens at top. Sections labelled. |
| `script.js` | All JS (ES module). Sections: nav, pricing, lightbox, form. |
| `privacy.html`, `terms.html` | Legal stub pages. |
| `assets/` | Logos, icons, menu placeholder images, OG image. |
| `tests/unit/` | Vitest pure-function tests. |
| `tests/e2e/` | Playwright E2E tests. |
| `docs/superpowers/specs/` | Design spec. |
| `docs/superpowers/plans/` | This implementation plan. |
```

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: add favicon, netlify config, and final README"
```

---

## Self-review notes (run after writing the plan)

Quick check against the spec:

**Spec coverage:**
- ✅ 4.1 Sticky top nav → Tasks 4, 5
- ✅ 4.2 Hero → Task 6
- ✅ 4.3 USP strip → Task 7
- ✅ 4.4 Pricing table (desktop) → Task 8
- ✅ 4.4 Pricing table (mobile reflow) → Task 9
- ✅ 4.4 Pricing-cell → form prefill → Task 10 + Task 17
- ✅ 4.5 How it works → Task 11
- ✅ 4.6 Gallery (placeholders, lazy, lightbox) → Tasks 12, 13
- ✅ 4.7 Why us (20-year credibility, stat badges) → Task 14
- ✅ 4.8 Reviews → Task 15
- ✅ 4.9 Quote form (fields, validation, honeypot, Formspree, success/error) → Tasks 16, 17
- ✅ 4.10 Footer + legal pages → Task 18
- ✅ 5.6 SEO meta + LocalBusiness JSON-LD → Task 19
- ✅ 5.7 Accessibility (WCAG AA, skip link, focus styles) → Task 20
- ✅ 5.5 Performance / Lighthouse → Task 21
- ✅ 5.8 Deployment (Netlify) → Task 21

**Type / name consistency:** `selectionsFromCell`, `isUKPhone`, `initNav`, `initPricing`, `initLightbox`, `initForm`, `boot` — used consistently across tasks 5, 10, 13, 17.

**No placeholders left in plan steps.** Every code block contains the actual content.

**Open question (from spec section 8):** Hero copy is concrete; final Google Font is locked to Inter; FAQ is explicitly out of scope. No deferred decisions blocking implementation.
