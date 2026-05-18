#!/usr/bin/env node
/**
 * Tier 2 SEO: Adds
 *   1. BreadcrumbList JSON-LD to every inner page (except legal pages).
 *   2. `author` field to the existing Article schema on blog/guide pages.
 *
 * Idempotent: skips pages that already have BreadcrumbList or author.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const SITE = 'https://printmenu.co.uk';

// Category mappings ----------------------------------------------------------
const CITIES = {
  'barnsley.html': 'Barnsley',
  'birmingham.html': 'Birmingham',
  'bradford.html': 'Bradford',
  'bristol.html': 'Bristol',
  'burnley.html': 'Burnley',
  'cardiff.html': 'Cardiff',
  'coventry.html': 'Coventry',
  'doncaster.html': 'Doncaster',
  'edinburgh.html': 'Edinburgh',
  'glasgow.html': 'Glasgow',
  'halifax.html': 'Halifax',
  'huddersfield.html': 'Huddersfield',
  'hull.html': 'Hull',
  'leeds.html': 'Leeds',
  'leicester.html': 'Leicester',
  'liverpool.html': 'Liverpool',
  'london.html': 'London',
  'manchester.html': 'Manchester',
  'middlesbrough.html': 'Middlesbrough',
  'newcastle.html': 'Newcastle',
  'nottingham.html': 'Nottingham',
  'rotherham.html': 'Rotherham',
  'sheffield.html': 'Sheffield',
  'stockport.html': 'Stockport',
  'sunderland.html': 'Sunderland',
  'wigan.html': 'Wigan',
  'york.html': 'York',
};

const CUISINES = {
  'indian-takeaway-menu-printing.html': 'Indian takeaway menu printing',
  'chinese-takeaway-menu-printing.html': 'Chinese takeaway menu printing',
  'pizza-takeaway-menu-printing.html': 'Pizza takeaway menu printing',
  'kebab-menu-printing.html': 'Kebab menu printing',
};

const GUIDES = {
  'how-much-do-10000-menus-cost.html': 'How much do 10,000 menus cost?',
  'a4-vs-a5-takeaway-menu.html': 'A4 vs A5 takeaway menu',
  'menu-paper-weight.html': 'Menu paper weight',
  'how-many-menus-should-i-order.html': 'How many menus should I order?',
  'door-drop-marketing-takeaways.html': 'Door-drop marketing for takeaways',
};

// Helpers --------------------------------------------------------------------
function buildBreadcrumb(file) {
  const items = [{ position: 1, name: 'Home', item: `${SITE}/` }];

  if (file in CITIES) {
    items.push({ position: 2, name: 'Service areas', item: `${SITE}/service-areas.html` });
    items.push({ position: 3, name: CITIES[file], item: `${SITE}/${file}` });
  } else if (file in CUISINES) {
    items.push({ position: 2, name: CUISINES[file], item: `${SITE}/${file}` });
  } else if (file in GUIDES) {
    items.push({ position: 2, name: 'Guides', item: `${SITE}/#guides` });
    items.push({ position: 3, name: GUIDES[file], item: `${SITE}/${file}` });
  } else if (file === 'service-areas.html') {
    items.push({ position: 2, name: 'Service areas', item: `${SITE}/service-areas.html` });
  } else {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((i) => ({ '@type': 'ListItem', ...i })),
  };
}

function jsonLdBlock(obj) {
  return `\n  <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)
    .split('\n')
    .map((l) => '  ' + l)
    .join('\n')}\n  </script>`;
}

// Main -----------------------------------------------------------------------
const allFiles = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
let bcAdded = 0;
let authorAdded = 0;
let bcSkipped = 0;

for (const file of allFiles) {
  const fp = path.join(root, file);
  let html = fs.readFileSync(fp, 'utf8');
  let modified = false;

  // (1) BreadcrumbList
  const breadcrumb = buildBreadcrumb(file);
  if (breadcrumb) {
    if (html.includes('"@type": "BreadcrumbList"') || html.includes('"@type":"BreadcrumbList"')) {
      bcSkipped++;
    } else {
      // Insert breadcrumb after the canonical link's NEXT closing block;
      // safest anchor: just before the first `<link rel="preconnect"` (every page has this).
      const anchor = '<link rel="preconnect" href="https://fonts.googleapis.com">';
      if (html.includes(anchor)) {
        html = html.replace(anchor, `${jsonLdBlock(breadcrumb).trim()}\n\n  ${anchor}`);
        bcAdded++;
        modified = true;
        console.log(`BC   ${file}`);
      } else {
        console.warn(`SKIP ${file} — no preconnect anchor`);
      }
    }
  }

  // (2) Article author for blog/guide pages
  if (file in GUIDES) {
    if (html.includes('"@type": "Article"') && !html.includes('"author"')) {
      // Insert `author` right after `"@type": "Article",`
      html = html.replace(
        /("@type":\s*"Article",\s*\n)/,
        `$1    "author": {\n      "@type": "Organization",\n      "name": "PrintMenu.co.uk",\n      "url": "${SITE}/"\n    },\n`
      );
      authorAdded++;
      modified = true;
      console.log(`AUTH ${file}`);
    }
  }

  if (modified) fs.writeFileSync(fp, html);
}

console.log(`\nDone. Breadcrumb added: ${bcAdded}, skipped: ${bcSkipped}. Author added: ${authorAdded}`);
