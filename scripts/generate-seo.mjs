import { writeFileSync, mkdirSync } from 'node:fs';

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

mkdirSync('public', { recursive: true });
writeFileSync('public/robots.txt', robots);
writeFileSync('public/sitemap.xml', sitemap);
console.log(`Wrote robots.txt and sitemap.xml for ${siteUrl}${blockAll ? ' (preview: indexing blocked)' : ''}`);
