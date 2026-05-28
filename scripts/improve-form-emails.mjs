// One-off codemod: improve FormSubmit.co email subject + template across all forms.
// Reason: original subjects were too generic ("פנייה חדשה מ-...") so leads looked like spam
// in the inbox. New format: "🔔 ליד חדש מהאתר — [origin]" — unmistakable.
// Template changed from "table" to "box" for cleaner visual layout.
// Usage: node scripts/improve-form-emails.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Map: old subject substring → new subject (origin-aware so we know which page the lead came from)
const SUBJECT_MAP = [
  ['פנייה חדשה מדף צור קשר',                            '🔔 ליד חדש מהאתר — דף צור קשר'],
  ['פנייה חדשה - בורות חלחול והחדרה',                   '🔔 ליד חדש מהאתר — בורות חלחול'],
  ['פנייה חדשה - השכרת ציוד',                           '🔔 ליד חדש מהאתר — השכרת ציוד'],
  ['פנייה חדשה מאתר א.א. עבודות קידוחים ופיתוח',          '🔔 ליד חדש מהאתר — דף הבית'],
  ['פנייה חדשה - עבודות עפר, פיתוח ותשתיות',             '🔔 ליד חדש מהאתר — עבודות עפר'],
  ['פנייה חדשה - דף אודות',                             '🔔 ליד חדש מהאתר — דף אודות'],
  ['פנייה חדשה - דף פרויקטים',                          '🔔 ליד חדש מהאתר — דף פרויקטים'],
  ['פנייה חדשה - קידוחי בנטונייט',                       '🔔 ליד חדש מהאתר — קידוחי בנטונייט'],
  ['פנייה חדשה - בור חלחול (מאמר בלוג)',                 '🔔 ליד חדש מהאתר — מאמר בור חלחול'],
  ['פנייה חדשה - קידוחים בהוד השרון, כפר סבא ורעננה',     '🔔 ליד חדש מהאתר — מאמר הוד השרון'],
  ['פנייה חדשה - קידוחים בנתניה והשרון',                 '🔔 ליד חדש מהאתר — מאמר נתניה'],
  ['פנייה חדשה מפופאפ - הצעת מחיר',                      '🔔 ליד חדש מהאתר — פופאפ הצעת מחיר'],
];

// Always replace _template=table with _template=box for cleaner visual
const TEMPLATE_OLD = '<input type="hidden" name="_template" value="table">';
const TEMPLATE_NEW = '<input type="hidden" name="_template" value="box">';

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'scripts') continue;
      yield* htmlFiles(full);
    } else if (entry.endsWith('.html')) {
      yield full;
    }
  }
}

const root = process.cwd();
let changed = 0;
let subjectsReplaced = 0;
let templatesReplaced = 0;

for (const file of htmlFiles(root)) {
  let content = readFileSync(file, 'utf8');
  let touched = false;

  for (const [oldS, newS] of SUBJECT_MAP) {
    if (content.includes(oldS)) {
      content = content.replaceAll(oldS, newS);
      subjectsReplaced++;
      touched = true;
    }
  }

  if (content.includes(TEMPLATE_OLD)) {
    content = content.replaceAll(TEMPLATE_OLD, TEMPLATE_NEW);
    templatesReplaced++;
    touched = true;
  }

  if (touched) {
    writeFileSync(file, content, 'utf8');
    console.log('✓ ' + file.replace(root, '.'));
    changed++;
  }
}

console.log(`\nDone: ${changed} files changed | ${subjectsReplaced} subjects | ${templatesReplaced} templates`);
