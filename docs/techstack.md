# CampusPlus tech stack and build plan

Read together with `design.md` (visual and copy rules) and `architecture.md` (data, scoring, security, deployment).

## 1. How the work is split

You plan to build the frontend with Gemini 3.8 Flash and the backend with Claude Opus 4.6, both inside Antigravity. These files refer to the two roles as the frontend agent and the backend agent, so they still work if a model name in Antigravity differs from what you expect. Check the exact model names shown in your Antigravity model picker before you start.

Both agents work in one Git repository. To prevent overwrites, each agent owns specific folders and must not edit the other's files. Anything shared goes through the contract in `architecture.md` section 5.

| Area | Owner | Paths |
| --- | --- | --- |
| Scaffold, config, scripts | Backend agent (Phase 0) | `package.json`, `vite.config.js`, `vercel.json`, `scripts/`, `.env.example`, `.gitignore` |
| Interface | Frontend agent | `src/components/`, `src/pages/`, `src/index.css`, `src/App.jsx`, `src/main.jsx`, `index.html`, `public/` (icons, 404.html, manifest) |
| Page meta hook | Frontend agent | `src/hooks/usePageMeta.js` (code is in `architecture.md`) |
| Scoring engine | Backend agent | `src/utils/scoring.js`, `src/utils/tags.js`, `src/data/aliases.js`, `src/data/regions.js` |
| Dates, validation, URL safety | Backend agent | `src/utils/dates.js`, `src/utils/validate.js`, `src/utils/url.js` |
| Data layer | Backend agent | `src/services/`, `src/data/demoOpportunities.js`, `src/data/defaultSteps.js` |
| Database security | Backend agent | `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `scripts/seed.mjs` |
| Tests | Backend agent for logic and rules, frontend agent for component tests if any | `tests/` |
| Site config and legal text | Frontend agent renders, backend agent supplies `src/config/site.js` | `src/config/site.js`, `src/pages/Terms.jsx`, `src/pages/Privacy.jsx` |

Working rules for both agents:

1. Commit after every stage on a green build. Never leave `main` broken. Suggested branches: `backend` and `frontend`, merged into `main` at the end of each phase.
2. Do not install a package that is not listed in section 2 without writing the reason and the gzip size cost in the commit message.
3. Do not invent data, links, event names that look real, distances or verification status.
4. After each change, run `npm run lint`, `npm run test` and `npm run build`. Report real output, not assumptions.
5. If a library API differs from what you remember, read the installed package's documentation or type definitions before using it.

## 2. Stack

| Layer | Choice | Reason and bundle note |
| --- | --- | --- |
| Runtime | Node.js current LTS (22 or newer) | Needed by current Vite and by `process.loadEnvFile` in the scripts |
| UI | React 19 with JavaScript and JSDoc type comments | Matches the blueprint. No TypeScript to keep the build fast |
| Build | Vite (latest stable) | Fast dev server, automatic code splitting with dynamic `import()` |
| Styling | Tailwind CSS v4 with `@tailwindcss/vite` | Utility CSS, no config file, tokens in `@theme` (see `design.md`) |
| Routing | `react-router-dom` (install the latest stable and pin it through the lockfile) | Use only one router package and one import path across the project |
| Icons | `lucide-react`, named imports only | Tree shaken. Never `import *` |
| Fonts | `@fontsource/ibm-plex-sans` | Self-hosted, no third party requests |
| Database | Firebase Cloud Firestore | Modular SDK, loaded only in Firebase mode through dynamic import |
| Auth | Firebase Authentication, Google provider, optional | Loaded only in Firebase mode |
| Hosting | Vercel | Static hosting with rewrites and headers |
| Tests | Vitest, `@firebase/rules-unit-testing` | Scoring, dates, validation and Firestore rules |
| Dev only | `eslint`, `rollup-plugin-visualizer`, `firebase-tools`, `firebase-admin` | `firebase-admin` is used only by `scripts/seed.mjs` and never imported from `src` |

Do not install: `framer-motion` or any animation library, `moment`, `lodash`, `axios`, `zod`, UI kits (MUI, Chakra, Ant, shadcn bundles), chart libraries, map SDKs, Redux, any AI SDK, any analytics SDK, any cookie banner library. The MVP does not need them.

The matching engine is plain JavaScript. There is no AI model and no external AI API at runtime.

### Bundle budget

- Initial JavaScript (entry plus modulepreload chunks listed in `dist/index.html`): target under 120 KB gzip, build fails above 150 KB gzip (enforced by `scripts/check-bundle.mjs`).
- Each route chunk: target under 30 KB gzip.
- Firebase chunks: loaded only when the app runs in Firebase mode. They must never appear in the initial JavaScript list in demo mode.
- Techniques the frontend agent must apply:
  - `React.lazy` and `Suspense` for every page except Discover.
  - `import()` for the Firebase adapter inside `src/services/index.js`.
  - Named icon imports only.
  - Only the font weights listed in `design.md`.
  - No images in the UI.
  - Do not hand-tune `manualChunks`. If `rollup-plugin-visualizer` shows a problem, check the documentation of the installed Vite version first.
- Analyze with: `ANALYZE=true npm run build` (the visualizer plugin is enabled only when that variable is set, see section 4).

## 3. Project setup commands (Phase 0, backend agent)

```bash
npm create vite@latest campusplus -- --template react
cd campusplus
npm install
npm install react-router-dom lucide-react @fontsource/ibm-plex-sans firebase
npm install -D tailwindcss @tailwindcss/vite vitest eslint rollup-plugin-visualizer firebase-tools firebase-admin @firebase/rules-unit-testing
```

If the Vite template asks about frameworks or variants, choose React with JavaScript. If the generated template is not React 19, upgrade `react` and `react-dom` to 19 before continuing. After scaffolding:

1. Delete `src/App.css`, `src/assets/react.svg`, `public/vite.svg` and the default content of `App.jsx`.
2. Replace the `<title>` and remove the default favicon link in `index.html`.
3. Add the files in sections 4 to 7 of this document.
4. Run `npm run dev` and `npm run build` once to prove the scaffold works before any feature is added.

## 4. Configuration files

### `package.json` scripts

```json
{
  "scripts": {
    "dev": "vite",
    "prebuild": "node scripts/generate-seo.mjs",
    "build": "vite build",
    "postbuild": "node scripts/check-bundle.mjs",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "seed": "node scripts/seed.mjs",
    "emulators": "firebase emulators:start --only firestore,auth"
  }
}
```

Add `"type": "module"` to `package.json` (the Vite template already does). Add a lint rule or a `grep` step that fails on `rounded-full` and `rounded-3xl` (see `design.md` section 6).

### `vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    process.env.ANALYZE === 'true' && visualizer({ filename: 'stats.html', gzipSize: true }),
  ].filter(Boolean),
});
```

Use the React plugin that the generated Vite template already installed (`@vitejs/plugin-react` or `@vitejs/plugin-react-swc`) and keep its import line consistent with `package.json`. Add `stats.html` to `.gitignore`.

### `vercel.json`

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/nearby", "destination": "/index.html" },
    { "source": "/my-opportunities", "destination": "/index.html" },
    { "source": "/profile", "destination": "/index.html" },
    { "source": "/submit", "destination": "/index.html" },
    { "source": "/terms", "destination": "/index.html" },
    { "source": "/privacy", "destination": "/index.html" },
    { "source": "/opportunity/:id", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

There is intentionally no catch-all rewrite. A catch-all would make every unknown URL return the app with HTTP 200 (a soft 404). With explicit rewrites, unknown paths fall through to `public/404.html` and return a real 404. Whenever a route is added to the app, add its rewrite here in the same commit. A Content-Security-Policy header is a post-MVP task because Firebase sign in needs several Google origins and a wrong policy breaks sign in.

### `.env.example`

```bash
# Public site settings (required for production builds)
VITE_SITE_URL=http://localhost:5173
VITE_OWNER_NAME=
VITE_CONTACT_EMAIL=
VITE_GOVERNING_CITY=
VITE_GOVERNING_STATE=

# Firebase web config (leave all four empty to run in demo mode)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=

# Set to true to force demo data even when Firebase is configured (local testing only)
VITE_FORCE_DEMO=false
```

Notes:

- Firebase web config values are identifiers, not secrets. Access control comes from Firestore Security Rules, not from hiding these values.
- Never commit `.env`, service account JSON files or anything under `secrets/`. `.gitignore` must contain: `node_modules`, `dist`, `.env`, `.env.*` (except `.env.example`), `secrets/`, `*-service-account*.json`, `stats.html`, `public/robots.txt`, `public/sitemap.xml`, `.firebase/`, `firebase-debug.log`.
- Vite exposes only variables that start with `VITE_`. Anything else stays server side or script side.

### `scripts/generate-seo.mjs` (runs before every build)

```js
import { writeFileSync } from 'node:fs';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file. Real environment variables (for example on Vercel) are used.
}

const vercelEnv = process.env.VERCEL_ENV; // 'production', 'preview', 'development' or undefined
const isProduction = vercelEnv === 'production';

const required = [
  'VITE_SITE_URL',
  'VITE_OWNER_NAME',
  'VITE_CONTACT_EMAIL',
  'VITE_GOVERNING_CITY',
  'VITE_GOVERNING_STATE',
];

if (isProduction) {
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

const rawSite = process.env.VITE_SITE_URL || 'http://localhost:5173';
let siteUrl;
try {
  const parsed = new URL(rawSite);
  siteUrl = `${parsed.protocol}//${parsed.host}`;
} catch {
  console.error(`VITE_SITE_URL is not a valid URL: ${rawSite}`);
  process.exit(1);
}

if (isProduction && !siteUrl.startsWith('https://')) {
  console.error('VITE_SITE_URL must start with https:// in production.');
  process.exit(1);
}

const blockAll = vercelEnv === 'preview';
const robots = blockAll
  ? 'User-agent: *\nDisallow: /\n'
  : `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;

const today = new Date().toISOString().slice(0, 10);
const paths = ['/', '/nearby', '/terms', '/privacy'];
const entries = paths
  .map((p) => `  <url>\n    <loc>${siteUrl}${p}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;

writeFileSync('public/robots.txt', robots);
writeFileSync('public/sitemap.xml', sitemap);
console.log(`Wrote robots.txt and sitemap.xml for ${siteUrl}${blockAll ? ' (preview: indexing blocked)' : ''}`);
```

The sitemap lists only pages that are always indexable. Listing detail pages are added later, only for real, verified listings.

### `scripts/check-bundle.mjs` (runs after every build)

```js
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const LIMIT_KB = 150;
const dist = 'dist';
const html = readFileSync(join(dist, 'index.html'), 'utf8');

const files = [
  ...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1])),
];

if (files.length === 0) {
  console.error('No entry scripts found in dist/index.html');
  process.exit(1);
}

let total = 0;
for (const file of files) {
  const size = gzipSync(readFileSync(join(dist, file))).length;
  total += size;
  console.log(`${file}  ${(size / 1024).toFixed(1)} KB gzip`);
}

const totalKb = total / 1024;
console.log(`Initial JavaScript: ${totalKb.toFixed(1)} KB gzip (limit ${LIMIT_KB} KB)`);

if (totalKb > LIMIT_KB) {
  console.error('Initial JavaScript budget exceeded.');
  process.exit(1);
}
```

## 5. Prompts for Antigravity

Paste each prompt into a fresh agent session. Both prompts assume the three markdown files are in the repository root under `docs/` (`docs/design.md`, `docs/techstack.md`, `docs/architecture.md`).

### 5.1 Backend agent, Phase 0 and Phase 1 (run first)

```
You are the backend agent for CampusPlus. Read docs/techstack.md, docs/architecture.md and docs/design.md fully before writing code.

Phase 0: scaffold the project exactly as described in techstack.md section 3 and add the configuration files in section 4. Run npm run dev and npm run build and report the real output.

Phase 1: implement, in this order, with tests for each:
1. src/utils/dates.js, src/utils/url.js, src/utils/validate.js, src/utils/tags.js
2. src/data/aliases.js, src/data/regions.js, src/data/defaultSteps.js
3. src/utils/scoring.js exactly as specified in architecture.md section 6, exporting rankOpportunities
4. src/data/demoOpportunities.js (at least 16 clearly labeled sample listings, isSample true, dates generated relative to today, no real organizations, no real URLs, verificationStatus unverified, lastCheckedAt null, registrationUrl empty string for most and a few with https://example.com/register-demo-N)
5. src/services/ with the contract from architecture.md section 5, local adapter first
6. src/config/site.js

Rules: no em dashes or en dashes anywhere, no emoji, no new dependencies outside techstack.md section 2, no AI API calls. Do not edit src/components, src/pages, src/index.css or index.html. When done, run npm run test and npm run build and report real results, then list any place where you had to deviate from the spec and why.
```

### 5.2 Frontend agent (starts once Phase 1 is committed, or earlier using the contract shapes)

```
You are the frontend agent for CampusPlus. Read docs/design.md, docs/architecture.md and docs/techstack.md fully before writing code.

Build the interface only. Use the services and scoring functions that already exist under src/services and src/utils, through the contract in architecture.md section 5. Do not change their behavior. If something is missing, write the request in docs/requests.md and continue with the rest.

Build in this order, running npm run build after each step:
1. index.html (title, description, favicon links, Open Graph tags, no generator tag), src/index.css with the tokens from design.md, fonts, skip link
2. App shell: Navbar, Footer, routes with React.lazy for every page except Discover, usePageMeta on every page, NotFound route, public/404.html, favicon and manifest files
3. Discover page with search, filters, sorting, cards, hidden listings toggle, empty and error states
4. Opportunity detail page
5. Profile page with validation
6. My Opportunities page with status select, checklist, notes
7. Nearby page
8. Terms and Privacy pages using the text in design.md section 15 and src/config/site.js
9. Submit page only if the core pages are complete

Rules: use only the strings in design.md section 10. No gradients, purple, emoji, pill shapes, scroll animation, cursor effects, images, fake reviews, fake metrics, em dashes or en dashes. No "made with" or AI credit text anywhere. Every visible button must work. Run the design QA checklist in design.md section 16 and report the real results.
```

### 5.3 Backend agent, Phase 2 (Firebase)

```
Continue as the backend agent for CampusPlus. Implement Phase 2 from architecture.md: the Firebase adapter, optional Google sign in, firestore.rules, firebase.json, firestore.indexes.json, scripts/seed.mjs and the rules tests. Keep demo mode working with all Firebase variables empty, and confirm the Firebase SDK is not in the initial JavaScript in demo mode (run npm run build and read the output of the bundle check). Test rules with the Firestore emulator and report real results. Do not edit src/components, src/pages or src/index.css.
```

### 5.4 Either agent, Phase 3 (verification and deploy)

```
Run the full checklist in architecture.md section 13 and design.md section 16. For every failure, fix it in the owner's area or report it. Do not state that deployment succeeded unless you have opened the published URL and checked the items in architecture.md section 12.5.
```

## 6. Timeline (aligned with the one hour blueprint)

These are targets, not guarantees. If Firebase setup runs long, ship demo mode first.

| Minutes | Backend agent | Frontend agent |
| --- | --- | --- |
| 0 to 8 | Phase 0 scaffold and config | Waits, or prepares `index.html`, tokens and favicon files |
| 8 to 20 | Utilities, scoring engine, demo data, local adapter | Shell, routes, Discover with cards and filters (mock the contract shapes until services land) |
| 20 to 32 | Tests green, config, contract frozen | Detail page, Profile page, Terms and Privacy |
| 32 to 42 | Firebase adapter, rules, seed script | My Opportunities with Opportunity Passport, Nearby |
| 42 to 52 | Emulator tests, bundle check | Design QA, responsive and keyboard checks |
| 52 to 60 | Deploy to Vercel, set environment variables, verify live URL | Fix visual defects found on the live site |

A real custom domain adds DNS wait time that is outside this timeline (see `architecture.md` section 12).
