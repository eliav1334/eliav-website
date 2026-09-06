#!/usr/bin/env node

/**
 * Add /projects link to navigation and footer in all HTML files
 */

const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build', '.cursor', 'scripts', 'docs'].includes(file)) {
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

let updated = 0;

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  let changes = [];
  
  // Pattern 1: Desktop nav - add Projects before About or Blog if it doesn't exist
  if (!content.includes('href="/projects"') && content.includes('class="nav-link"')) {
    // Find the position of "אודות" link in nav
    const aboutPattern = /(<a href="\/about" class="nav-link"[^>]*>אודות<\/a>)/;
    if (aboutPattern.test(content)) {
      content = content.replace(
        aboutPattern,
        '<a href="/projects" class="nav-link">פרויקטים</a>\n          $1'
      );
      changes.push('desktop-nav');
    }
  }
  
  // Pattern 2: Mobile nav - add Projects before About if it doesn't exist
  if (!content.includes('href="/projects"') && content.includes('mobile-nav-link')) {
    const mobileAboutPattern = /(<a href="\/about" class="mobile-nav-link"[^>]*>אודות<\/a>)/;
    if (mobileAboutPattern.test(content)) {
      content = content.replace(
        mobileAboutPattern,
        '<a href="/projects" class="mobile-nav-link" onclick="closeMobileMenu()">פרויקטים</a>\n        $1'
      );
      changes.push('mobile-nav');
    }
  }
  
  // Pattern 3: Footer "ניווט מהיר" - add Projects after הצהרת נגישות or before contact
  if (!content.includes('href="/projects"') && content.includes('ניווט מהיר')) {
    // Find footer quick nav section and add projects
    const footerNavPattern = /(<li><a href="\/contact">צור קשר<\/a><\/li>)/;
    if (footerNavPattern.test(content)) {
      content = content.replace(
        footerNavPattern,
        '<li><a href="/projects">פרויקטים</a></li>\n              $1'
      );
      changes.push('footer');
    }
  }
  
  // Write back if there were changes
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    const relativePath = path.relative(process.cwd(), file);
    console.log(`✓ ${relativePath}: ${changes.join(', ')}`);
    updated++;
  }
});

console.log(`\n✅ Total: ${updated} files updated`);
