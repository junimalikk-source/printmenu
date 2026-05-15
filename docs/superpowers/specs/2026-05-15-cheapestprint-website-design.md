# Cheapestprint.co.uk — Website Design Spec

**Date:** 2026-05-15
**Status:** Draft (awaiting user review)
**Project:** Single-page lead-generation website for Cheapestprint.co.uk, a UK menu printing business based in Bradford.

---

## 1. Goal

Build a simple, beautiful, single-page lead-capture website that:

- Communicates the brand promise: cheap, fast, full-service menu printing for UK takeaways.
- Displays a clear, transparent pricing matrix.
- Drives visitors to one of three actions: phone call, WhatsApp message, or fill out the quote form.

**Out of scope:** online ordering, online payment, customer accounts, artwork uploads, multi-product catalogue, blog, CMS.

---

## 2. Business context

- **Business name:** Cheapestprint.co.uk
- **Domain:** cheapestprint.co.uk (already owned)
- **Location:** Bradford, UK — delivers nationwide
- **Product:** A5 / A4 / A4+ Extended / A3 takeaway menus
- **Years in business:** 20
- **Turnaround:** 3–5 working days after artwork sign-off
- **Print spec:** 130gsm, full colour both sides
- **Bundled services:** Free design, free UK delivery

**Contact channels:**
- Phone: `01274 305555`
- WhatsApp: `+44 7572 574582` (placeholder — to be updated)
- Quote form (web)

---

## 3. Visual direction

**Selected direction:** Bold Value (Direction B from brainstorm).

- **Mood:** Confident, no-nonsense, value-led. Leans into the "Cheapest" name without going tacky/rainbow.
- **Primary palette:**
  - Black `#111111` — backgrounds, primary text
  - Yellow `#FFD60A` — accent, CTAs, highlights, "popular" tier
  - White `#FFFFFF` — section backgrounds
  - Off-white `#FAFAFA` — alternating section backgrounds, input fields
  - Mid grey `#E5E5E5` — borders, dividers
- **Typography:**
  - Headlines: bold sans-serif, tight letter-spacing (recommend **Inter** or **Manrope** weight 800–900 via Google Fonts)
  - Body: same family, weight 400–500
  - System font fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Shape language:** rounded corners (8–12px on cards, 999px / pill on buttons), generous whitespace, large pricing tiles.
- **No rainbow / gradient backgrounds** (explicit user instruction).

---

## 4. Page structure (single-page scroll)

Order top to bottom:

### 4.1 Sticky top nav
- Left: "Cheapestprint.co.uk" wordmark.
- Centre/right (desktop): anchor links — `Pricing`, `How it works`, `Reviews`, `Contact`.
- Far right: `Call 01274 305555` pill button (yellow on black).
- Mobile: hamburger menu opens a full-screen overlay with the same links.

### 4.2 Hero
- Eyebrow line: "UK's cheapest menu printer · 20 years"
- Headline: "10,000 A4 menus. **£425.** Delivered free." (price in yellow)
- Subhead: "Full-colour, 130gsm, designed and delivered to your door anywhere in the UK in 3–5 days."
- Two CTAs side-by-side: `Get my quote →` (yellow, scrolls to form) and `WhatsApp us` (outline, opens WhatsApp link).
- Background: solid black.

### 4.3 USP strip
- Four equal cards on a white band:
  - **3–5 days** — Turnaround after artwork
  - **Free design** — We design for you
  - **Free UK delivery** — To your door
  - **130gsm full colour** — Both sides, premium feel
- Each card has a small icon (inline SVG) above the bold stat.

### 4.4 Pricing table
- Heading: "Transparent pricing. No hidden fees."
- Subhead: "Prices include free design and free UK delivery."
- Matrix table — rows are sizes, columns are quantities:

| Size | 10K | 20K | 40K | 100K |
|---|---|---|---|---|
| A5 (148×210mm) | £200 | ~~£350~~ **£250** | **£400** (Best Value) | **£900** (Bulk Savings) |
| A4 (Most Popular) | ~~£525~~ **£425** | ~~£700~~ **£550** | ~~£1100~~ **£900** | ~~£2000~~ **£1600** |
| A4+ Extended | ~~£650~~ **£475** | ~~£950~~ **£750** | ~~£1400~~ **£1250** | ~~£2650~~ **£2300** |
| A3 (420×297mm) | ~~£700~~ **£525** | ~~£1100~~ **£795** | ~~£1750~~ **£1450** | ~~£3850~~ **£2800** |

- "Was" prices shown with strikethrough; "now" prices shown bold.
- A4 row gets a "Most Popular" badge and a subtle yellow row tint.
- 40K column gets a "Best Value" badge and a yellow column highlight (the visual hero of the table).
- 100K column gets a "Bulk Savings" badge.
- Each cell is a clickable `Get this quote →` link that scrolls to the form and pre-fills the dropdowns.
- On mobile, the table reflows to a vertical stacked card layout — one card per size, with the four quantity options inside.

### 4.5 How it works
- Heading: "From quote to your doorstep in days."
- Three numbered steps in a row:
  1. **Get a quote** — Phone, WhatsApp or form. We confirm price in minutes.
  2. **We design it free** — Send us your dishes — we design the menu, you approve.
  3. **Printed & delivered** — 3–5 working days, free delivery anywhere in the UK.
- Each step has the number in a yellow circle.

### 4.6 Sample menus gallery
- Heading: "Recent menus we've printed"
- Grid of 4–6 image tiles (3:4 portrait aspect ratio).
- For v1: placeholder images served from `assets/menus/menu-placeholder-N.jpg` with a clearly-named structure for swap-in.
- Lightbox: clicking any image opens a simple lightbox modal (vanilla JS, no library).
- Lazy-load images via `loading="lazy"`.

### 4.7 Why us (20-year credibility)
- Heading: "20 years printing menus for British takeaways"
- Two-column layout (stacks on mobile):
  - Left: short story paragraph (3–4 lines). Bradford-based, serving takeaways since 2005, family-run, thousands printed.
  - Right: two large stat badges — `20 yrs` and `1000s of takeaways served`.

### 4.8 Customer reviews
- Heading: "What our customers say"
- Three testimonial cards in a row (stack to single column on mobile):
  - 5-star rating in yellow
  - Quote text
  - Customer name + city
- Placeholder quotes for v1, to be replaced with real ones.

### 4.9 Quote form (primary CTA)
- Heading: "Get your quote in minutes"
- Subhead: "Or call **01274 305555** — we usually answer within a minute."
- Fields:
  - `Your name` (text, required)
  - `Phone number` (tel, required, UK format validation)
  - `Email` (email, optional)
  - `Menu size` (select: A5 / A4 / A4+ Extended / A3, required)
  - `Quantity` (select: 10K / 20K / 40K / 100K / Other, required)
  - `Notes` (textarea, optional — "Tell us about your menu, dishes, design needs")
  - Hidden honeypot field for spam
- Submit button: yellow, full-width on mobile.
- Below the form, a black "phone/WhatsApp" card with both numbers as tap-to-action links.
- On successful submit: form replaced with a green-tick success message — "Thanks, we'll be in touch within 1 working hour. For urgent quotes call 01274 305555."

### 4.10 Footer
- Three columns (stack on mobile):
  - Logo + "Based in Bradford, UK · Printing nationwide" tagline
  - Contact: phone, WhatsApp, email
  - Legal: Privacy Policy, Terms (placeholder pages — separate `privacy.html` / `terms.html` to be filled later)
- Bottom strip: `© 2026 Cheapestprint.co.uk · All rights reserved`

---

## 5. Technical architecture

### 5.1 Stack
- **Static HTML / CSS / JavaScript.** No frameworks, no build step, no backend.
- Single `index.html` plus separate `styles.css` and `script.js`.
- Google Fonts (Inter or Manrope) loaded via `<link>` with `preconnect`.
- Quote form submitted to **Formspree** (free tier, ~50 submissions/month). Form action points to a Formspree endpoint; submissions land in the configured business email. Falls back to a `mailto:` link if the endpoint is missing.

### 5.2 File structure

```
/
├── index.html                  # Single page, all sections
├── styles.css                  # All styling
├── script.js                   # Mobile nav, smooth scroll, form, lightbox, cell→form prefill
├── privacy.html                # Stub page
├── terms.html                  # Stub page
├── favicon.ico
├── favicon.svg
└── assets/
    ├── logo.svg                # Wordmark logo (text-only SVG for now)
    ├── menus/
    │   ├── menu-placeholder-1.jpg
    │   ├── menu-placeholder-2.jpg
    │   └── …                   # 6 placeholder images, 600×800 each
    └── icons/
        ├── truck.svg           # Free delivery
        ├── clock.svg           # Turnaround
        ├── brush.svg           # Free design
        └── star.svg            # Quality
```

### 5.3 JavaScript responsibilities (`script.js`)
1. **Mobile nav toggle** — hamburger button shows/hides the full-screen menu overlay.
2. **Smooth scroll** — anchor links scroll to sections with header offset.
3. **Pricing-cell → form prefill** — clicking a price cell scrolls to the form and pre-selects the size + quantity dropdowns.
4. **Form submission** — POSTs to Formspree, shows the success state on response, handles error state.
5. **Honeypot check** — bot-filled honeypot fields silently rejected client-side as a first line of defence (server-side is still Formspree's job).
6. **Lightbox** — click a gallery image to open a centred modal with the larger image; close on ESC or backdrop click.
7. **Sticky-nav shadow** — adds a subtle shadow once the user scrolls past the hero.

No external JS dependencies. Vanilla only.

### 5.4 Responsive behaviour
- **Mobile-first.** Base styles target ≤640px width.
- **Breakpoints:** `640px` (small tablet), `960px` (desktop).
- Pricing table reflows to vertical cards on `<640px`.
- USP strip stacks to 2×2 grid on tablet, single column on phone.
- Reviews and how-it-works stack to single column on phone.
- Nav collapses to hamburger on `<960px`.

### 5.5 Performance
- Inline critical CSS for above-the-fold (hero) to avoid render blocking — *optional, only if measured page-load benefit*.
- All images: `loading="lazy"` except hero (if hero has an image).
- Use SVG for icons and logo (vector, scales infinitely, no extra requests if inlined).
- Target Lighthouse Performance ≥ 90 on mobile.
- No third-party tracking on v1 (no Google Analytics) — can be added later.

### 5.6 SEO basics
- `<title>`: "Cheap Takeaway Menu Printing UK · Free Design + Delivery · Cheapestprint.co.uk"
- `<meta name="description">`: "10,000 full-colour takeaway menus from £425. Free design, free UK delivery, 3–5 day turnaround. 20 years' experience. Get a quote."
- Open Graph tags for share preview (`og:title`, `og:description`, `og:image`).
- `application/ld+json` schema markup: **LocalBusiness** with name, address (Bradford), telephone, area served (United Kingdom), price range, opening hours (placeholder).
- Semantic HTML — `<header>`, `<main>`, `<section>`, `<footer>`, `<h1>`–`<h3>` in correct order.
- All images have `alt` text.

### 5.7 Accessibility
- Colour contrast ≥ WCAG AA (yellow text on black background only at large sizes; body text always white-on-black or black-on-white).
- All interactive elements keyboard-reachable, visible focus ring (yellow outline).
- Form fields have associated `<label>` elements.
- Phone and WhatsApp links use `tel:` and `https://wa.me/` schemes for native handoff.
- Skip-to-content link for screen readers.

### 5.8 Deployment
- Static site — deploy to **Netlify** (free tier) connected to the cheapestprint.co.uk domain, or any static host the user prefers.
- Manual deploy via drag-and-drop or `git push` if a repo is set up later.

---

## 6. Content placeholders to be replaced

Marked clearly in code with `<!-- REPLACE: -->` comments:

| Placeholder | What's needed from the user |
|---|---|
| Menu gallery images | 6 photos of real printed menus, JPG, ~600×800px |
| Testimonial quotes | 3 real customer quotes with name + city |
| WhatsApp number | Current `+44 7572 574582` is a placeholder per user instruction |
| Formspree endpoint | Sign up for Formspree, paste form action URL |
| Email address | Business email for form submissions and the footer |
| Hero image (optional) | If desired, a hero photo of a printed menu — otherwise type-only hero |
| About text fine-tuning | User can refine the "20 years" paragraph wording |

---

## 7. Success criteria

- Page loads in < 2 seconds on a mid-range mobile on 4G.
- All 10 sections render correctly on iPhone SE width (375px) through desktop (1440px+).
- Quote form submits successfully via Formspree and the user receives the email.
- All three contact paths (phone call, WhatsApp, form) work from a real phone.
- Lighthouse mobile scores: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- Visual matches the Bold Value direction approved during brainstorming.

---

## 8. Open questions / decisions deferred to implementation

- Final wording of the hero copy — start with the proposed line, iterate after build.
- Whether the hero needs a background image of a printed menu, or stays pure type-on-black.
- Exact Google Font choice (Inter vs Manrope) — pick during build, both fit the brief.
- Whether to include a small FAQ section above the footer (e.g., "What file types do you accept?", "Do you laminate?") — *not in v1 scope unless requested.*

---

## 9. Out of scope (explicit)

- Online ordering, payment, account system.
- Artwork upload portal.
- CMS / admin panel (copy and prices edited directly in `index.html`).
- Blog, news, multi-product catalogue.
- Multi-language support.
- A/B testing infrastructure.
- Email marketing integrations.

These can be considered in a v2.
