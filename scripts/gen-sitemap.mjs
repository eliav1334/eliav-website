#!/usr/bin/env node

/**
 * Generate sitemap.xml with lastmod dates from git history
 */

import fs from 'fs';
import { execSync } from 'child_process';

// Get last modified date from git for a file
function getLastModifiedDate(file) {
  try {
    const date = execSync(`git log -1 --format=%cs -- "${file}"`, { encoding: 'utf8' }).trim();
    return date || new Date().toISOString().split('T')[0];
  } catch (error) {
    console.warn(`⚠️  Could not get git date for ${file}, using current date`);
    return new Date().toISOString().split('T')[0];
  }
}

// Define all pages with their URLs (clean URLs without .html)
const pages = [
  { url: '', file: 'index.html', priority: '1.0', changefreq: 'weekly' },
  { url: '/bentonite-drilling', file: 'bentonite-drilling.html', priority: '0.9', changefreq: 'weekly' },
  { url: '/earthworks', file: 'earthworks.html', priority: '0.9', changefreq: 'weekly' },
  { url: '/drainage-pits', file: 'drainage-pits.html', priority: '0.9', changefreq: 'weekly' },
  { url: '/equipment-rental', file: 'equipment-rental.html', priority: '0.9', changefreq: 'weekly' },
  { url: '/projects', file: 'projects.html', priority: '0.8', changefreq: 'monthly' },
  { url: '/about', file: 'about.html', priority: '0.7', changefreq: 'monthly' },
  { url: '/contact', file: 'contact.html', priority: '0.8', changefreq: 'monthly' },
  { url: '/blog', file: 'blog.html', priority: '0.8', changefreq: 'weekly' },
  { url: '/drainage-calculator', file: 'drainage-calculator.html', priority: '0.7', changefreq: 'monthly' },
  { url: '/drainage-pit-home', file: 'drainage-pit-home.html', priority: '0.7', changefreq: 'monthly' },
  { url: '/accessibility-statement', file: 'accessibility-statement.html', priority: '0.5', changefreq: 'yearly' },
  { url: '/privacy', file: 'privacy.html', priority: '0.5', changefreq: 'yearly' },
  
  // Blog articles
  { url: '/blog/bentonite-guide', file: 'blog/bentonite-guide.html', priority: '0.7', changefreq: 'monthly' },
  { url: '/blog/drainage-pits-guide', file: 'blog/drainage-pits-guide.html', priority: '0.7', changefreq: 'monthly' },
  { url: '/blog/drilling-netanya', file: 'blog/drilling-netanya.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/drilling-hadera', file: 'blog/drilling-hadera.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/earthworks-tips', file: 'blog/earthworks-tips.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/choose-drilling-contractor', file: 'blog/choose-drilling-contractor.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/bentonite-vs-polymer', file: 'blog/bentonite-vs-polymer.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/drilling-hod-hasharon', file: 'blog/drilling-hod-hasharon.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/equipment-rental-guide', file: 'blog/equipment-rental-guide.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/contractor-license-guide', file: 'blog/contractor-license-guide.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/site-development-guide', file: 'blog/site-development-guide.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/drainage-pits-pricing', file: 'blog/drainage-pits-pricing.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/waste-removal-guide', file: 'blog/waste-removal-guide.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/foundation-piles-guide', file: 'blog/foundation-piles-guide.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/bentonite-drilling-cost', file: 'blog/bentonite-drilling-cost.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/earthworks-cost', file: 'blog/earthworks-cost.html', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/equipment-rental-cost', file: 'blog/equipment-rental-cost.html', priority: '0.6', changefreq: 'monthly' },
];

console.log('🔍 Generating sitemap with git-based lastmod dates...\n');

// Generate XML
let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

pages.forEach(page => {
  const lastmod = getLastModifiedDate(page.file);
  const url = `https://eliavafar.co.il${page.url}`;
  
  xml += `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  
  console.log(`✓ ${page.url || '/'}: ${lastmod}`);
});

xml += `</urlset>
`;

// Write sitemap.xml
fs.writeFileSync('sitemap.xml', xml, 'utf8');

console.log(`\n✅ Generated sitemap.xml with ${pages.length} URLs`);
console.log('📍 File: sitemap.xml');
