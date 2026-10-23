import { writeFileSync, mkdirSync } from 'node:fs';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file. Real environment variables (for example on Vercel) are used.
}

const vercelEnv = process.env.VERCEL_ENV; // 'production', 'preview', 'development' or undefined
const isProduction = vercelEnv === 'production';

// Safe fallbacks for deployment platforms (like Vercel) where env vars may not yet be added in project settings
const defaults = {
  VITE_OWNER_NAME: 'CampusPlus',
  VITE_CONTACT_EMAIL: 'contact@campusplus.in',
  VITE_GOVERNING_CITY: 'New Delhi',
  VITE_GOVERNING_STATE: 'Delhi',
};

for (const [key, fallback] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = fallback;
    console.warn(`[INFO] ${key} not set in environment. Using default: ${fallback}`);
  }
}

// Auto-detect production URL from Vercel system variables if VITE_SITE_URL was not set
if (!process.env.VITE_SITE_URL) {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    process.env.VITE_SITE_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (process.env.VERCEL_URL) {
    process.env.VITE_SITE_URL = `https://${process.env.VERCEL_URL}`;
  } else {
    process.env.VITE_SITE_URL = isProduction ? 'https://campusplus.vercel.app' : 'http://localhost:5173';
  }
  console.warn(`[INFO] VITE_SITE_URL not set. Using: ${process.env.VITE_SITE_URL}`);
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
  siteUrl = siteUrl.replace(/^http:/, 'https:');
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

mkdirSync('public', { recursive: true });
writeFileSync('public/robots.txt', robots);
writeFileSync('public/sitemap.xml', sitemap);
console.log(`Wrote robots.txt and sitemap.xml for ${siteUrl}${blockAll ? ' (preview: indexing blocked)' : ''}`);
