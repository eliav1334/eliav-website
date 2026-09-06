#!/usr/bin/env node

/**
 * Fix HTML links: rewrite href="*.html" to clean URLs
 */

const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (!['node_modules', '.git', 'dist', 'build', '.cursor'].includes(file)) {
        findHtmlFiles(filePath, fileList);
      }
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const htmlFiles = findHtmlFiles(process.cwd());
console.log(`Found ${htmlFiles.length} HTML files to process\n`);

let totalReplacements = 0;

const rootPages = [
  'contact', 'thanks', 'about', 'projects', 'accessibility-statement',
  'bentonite-drilling', 'earthworks', 'equipment-rental', 'drainage-pits',
  'drainage-pit-home', 'drainage-calculator', 'business-card', 'review',
  'review-qr', 'privacy', 'blog', 'demolition', '404'
];

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  let fileReplacements = 0;
  
  // Pattern 1: href="index.html" → href="/"
  const indexCount = (content.match(/href="index\.html"/g) || []).length;
  content = content.replace(/href="index\.html"/g, 'href="/"');
  fileReplacements += indexCount;
  
  // Pattern 2: href="../index.html" → href="/"
  const indexUpCount = (content.match(/href="\.\.\/index\.html"/g) || []).length;
  content = content.replace(/href="\.\.\/index\.html"/g, 'href="/"');
  fileReplacements += indexUpCount;
  
  // Pattern 3: href="contact.html" → href="/contact" (root-level pages)
  rootPages.forEach(page => {
    const pattern = new RegExp(`href="${page}\\.html"`, 'g');
    const count = (content.match(pattern) || []).length;
    content = content.replace(pattern, `href="/${page}"`);
    fileReplacements += count;
  });
  
  // Pattern 4: href="../contact.html" → href="/contact" (from subdirectories)
  rootPages.forEach(page => {
    const pattern = new RegExp(`href="\\.\\.\/${page}\\.html"`, 'g');
    const count = (content.match(pattern) || []).length;
    content = content.replace(pattern, `href="/${page}"`);
    fileReplacements += count;
  });
  
  // Pattern 5: href="blog/article.html" → href="/blog/article"
  const blogPattern = /href="blog\/([^"]+)\.html"/g;
  const blogMatches = content.match(blogPattern) || [];
  content = content.replace(blogPattern, 'href="/blog/$1"');
  fileReplacements += blogMatches.length;
  
  // Pattern 6: href="../blog/article.html" → href="/blog/article" (from subdirectories)  
  const blogUpPattern = /href="\.\.\/blog\/([^"]+)\.html"/g;
  const blogUpMatches = content.match(blogUpPattern) || [];
  content = content.replace(blogUpPattern, 'href="/blog/$1"');
  fileReplacements += blogUpMatches.length;
  
  // Pattern 7: href="./contact.html" → href="/contact"
  rootPages.forEach(page => {
    const pattern = new RegExp(`href="\\.\/${page}\\.html"`, 'g');
    const count = (content.match(pattern) || []).length;
    content = content.replace(pattern, `href="/${page}"`);
    fileReplacements += count;
  });
  
  // Write back if there were changes
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    const relativePath = path.relative(process.cwd(), file);
    console.log(`✓ ${relativePath}: ${fileReplacements} replacements`);
    totalReplacements += fileReplacements;
  }
});

console.log(`\n✅ Total: ${totalReplacements} links updated across ${htmlFiles.length} files`);
console.log('\n⚠️  Manual review needed for:');
console.log('   - iframe src="drainage-calculator.html" in drainage-pits.html');
