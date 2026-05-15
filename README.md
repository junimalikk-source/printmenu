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
