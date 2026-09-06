#!/usr/bin/env node

/**
 * Fix FAQ accessibility: convert divs to buttons, add ARIA attributes
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
let globalAnswerId = 1;

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // Check if file has FAQ sections
  if (!content.includes('faq-question')) {
    return;
  }
  
  // Step 1: Convert all div.faq-question to button.faq-question
  const divPattern = /<div class="faq-question" onclick="toggleFaq\(this\)">/g;
  const divMatches = (content.match(divPattern) || []).length;
  
  if (divMatches > 0) {
    // Replace div with button and add ARIA attributes
    let faqIndex = 0;
    content = content.replace(
      /<div class="faq-question" onclick="toggleFaq\(this\)">([^]*?)<\/div>/g,
      (match, inner) => {
        const answerId = `faq-answer-${globalAnswerId + faqIndex}`;
        faqIndex++;
        return `<button class="faq-question" onclick="toggleFaq(this)" aria-expanded="false" aria-controls="${answerId}">${inner}</button>`;
      }
    );
    
    // Step 2: Add IDs to faq-answer divs
    let answerIndex = 0;
    content = content.replace(
      /<div class="faq-answer">/g,
      () => {
        const answerId = `faq-answer-${globalAnswerId + answerIndex}`;
        answerIndex++;
        return `<div class="faq-answer" id="${answerId}">`;
      }
    );
    
    globalAnswerId += faqIndex;
    
    fs.writeFileSync(file, content, 'utf8');
    const relativePath = path.relative(process.cwd(), file);
    console.log(`✓ ${relativePath}: ${faqIndex} FAQ items updated`);
    updated++;
  }
});

console.log(`\n✅ Total: ${updated} files updated`);
console.log('🎯 FAQs now keyboard accessible with proper ARIA attributes');
