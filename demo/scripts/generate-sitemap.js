#!/usr/bin/env node

/**
 * Generate sitemap.xml for the StoryScroller demo
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const baseUrl = 'https://storyscroller-demo.vercel.app';

// Define the pages/routes in the demo
const pages = [
  {
    url: '/',
    lastmod: new Date().toISOString(),
    changefreq: 'weekly',
    priority: '1.0'
  }
];

// Generate sitemap XML
const generateSitemap = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
};

// Write sitemap to public directory
const sitemapContent = generateSitemap();
const sitemapPath = join(publicDir, 'sitemap.xml');

try {
  writeFileSync(sitemapPath, sitemapContent, 'utf8');
  console.log('✅ Sitemap generated successfully:', sitemapPath);
  console.log(`📍 Sitemap URL: ${baseUrl}/sitemap.xml`);
} catch (error) {
  console.error('❌ Failed to generate sitemap:', error.message);
  process.exit(1);
}