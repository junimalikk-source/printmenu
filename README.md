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
